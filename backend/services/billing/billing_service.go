package billing

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
)

type BillingService struct {
	db       *gorm.DB
	midtrans *MidtransService
}

func NewBillingService(db *gorm.DB, midtrans *MidtransService) *BillingService {
	return &BillingService{db: db, midtrans: midtrans}
}

type PlanPricing struct {
	PlanType        models.PlanType `json:"plan_type"`
	Name            string          `json:"name"`
	MonthlyPrice    int64           `json:"monthly_price"`
	YearlyPrice     int64           `json:"yearly_price"`
	YearlyDiscount  string          `json:"yearly_discount"`
	Description     string          `json:"description"`
	Features        []string        `json:"features"`
	IsPopular       bool            `json:"is_popular"`
}

type BillingOverviewResponse struct {
	Subscription        *models.Subscription `json:"subscription"`
	Invoices            []models.Invoice     `json:"invoices"`
	DaysRemaining       int                  `json:"days_remaining"`
	PricingTiers        []PlanPricing        `json:"pricing_tiers"`
	StripePortalURL     string               `json:"stripe_portal_url"`
	NextRenewalDate     string               `json:"next_renewal_date"`
	AvailablePromos     []models.PromoCode   `json:"available_promos"`
	MidtransClientKey   string               `json:"midtrans_client_key"`
	MidtransSnapURL     string               `json:"midtrans_snap_url"`
	MidtransIsProduction bool                 `json:"midtrans_is_production"`
}

var DefaultPricingTiers = []PlanPricing{
	{
		PlanType:       models.PlanFree,
		Name:           "Gratis (Free)",
		MonthlyPrice:   0,
		YearlyPrice:    0,
		YearlyDiscount: "Selamanya",
		Description:    "Pondasi esensial untuk personal branding dan pemula.",
		Features: []string{
			"Tautan bio tanpa batas",
			"Analitik dasar 7 hari",
			"5 tema tampilan standar",
			"Subdomain gratis (klikin.id/nama)",
			"Watermark Klikin di footer",
		},
		IsPopular: false,
	},
	{
		PlanType:       models.PlanPro,
		Name:           "Klikin Pro",
		MonthlyPrice:   29000,
		YearlyPrice:    290000,
		YearlyDiscount: "Hemat 17% (2 Bulan Gratis)",
		Description:    "Untuk kreator, pebisnis, dan profesional yang ingin konversi maksimal.",
		Features: []string{
			"Semua fitur paket Gratis",
			"Domain kustom pribadi (link.brand.com)",
			"Sertifikat SSL otomatis Let's Encrypt",
			"Analitik mendalam 30-90 hari (Geo, Kota, Device, Browser)",
			"Koleksi Email Leads & Ekspor CSV",
			"Integrasi Mailchimp & ConvertKit",
			"Hapus watermark Klikin dari halaman",
			"Dukungan prioritas WhatsApp & Email 24/7",
		},
		IsPopular: true,
	},
}

// GetDynamicPricingTiers returns pricing tiers dynamically synchronized with PlatformSetting
func (s *BillingService) GetDynamicPricingTiers() []PlanPricing {
	tiers := make([]PlanPricing, len(DefaultPricingTiers))
	copy(tiers, DefaultPricingTiers)

	var setting models.PlatformSetting
	if s.db != nil && s.db.First(&setting).Error == nil {
		for i := range tiers {
			if tiers[i].PlanType == models.PlanPro {
				if setting.ProMonthlyPrice > 0 {
					tiers[i].MonthlyPrice = setting.ProMonthlyPrice
				}
				if setting.ProYearlyPrice > 0 {
					tiers[i].YearlyPrice = setting.ProYearlyPrice
				}
			}
		}
	}

	return tiers
}

// GetSubscriptionDetails retrieves user subscription status and invoices
func (s *BillingService) GetSubscriptionDetails(userID string) (*BillingOverviewResponse, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	var setting models.PlatformSetting
	var proMonthlyPrice int64 = 29000
	var proYearlyPrice int64 = 290000
	if err := s.db.First(&setting).Error; err == nil {
		if setting.ProMonthlyPrice > 0 {
			proMonthlyPrice = setting.ProMonthlyPrice
		}
		if setting.ProYearlyPrice > 0 {
			proYearlyPrice = setting.ProYearlyPrice
		}
	}

	var sub models.Subscription
	err := s.db.Where("user_id = ?", userID).First(&sub).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Initialize subscription based on user status
		now := time.Now()
		end := now.AddDate(0, 1, 0)
		plan := models.PlanFree
		price := int64(0)
		status := models.SubscriptionStatusActive

		if user.IsPro {
			plan = models.PlanPro
			price = proMonthlyPrice
		}

		sub = models.Subscription{
			ID:                 fmt.Sprintf("sub_%d", now.UnixNano()),
			UserID:             user.ID,
			Plan:               plan,
			BillingCycle:       "monthly",
			Status:             status,
			Price:              price,
			Currency:           "IDR",
			CurrentPeriodStart: now,
			CurrentPeriodEnd:   end,
			PaymentMethodBrand: "midtrans",
			PaymentMethodLast4: "snap",
			PaymentMethodExp:   "active",
			CreatedAt:          now,
			UpdatedAt:          now,
		}
		s.db.Create(&sub)
	} else if sub.Plan == models.PlanPro {
		// Sync existing pro subscription price with current platform settings
		expectedPrice := proMonthlyPrice
		if sub.BillingCycle == "yearly" {
			expectedPrice = proYearlyPrice
		}
		if sub.Price != expectedPrice && expectedPrice > 0 {
			sub.Price = expectedPrice
			s.db.Model(&models.Subscription{}).Where("id = ?", sub.ID).Update("price", expectedPrice)
		}
	}

	// Sync subscription lifecycle (auto-downgrade expired Pro, check grace period, notify)
	subPtr, errSync := s.SyncSubscriptionLifecycle(userID)
	if errSync == nil && subPtr != nil {
		sub = *subPtr
	}

	// Calculate remaining days
	daysRemaining := int(time.Until(sub.CurrentPeriodEnd).Hours() / 24)
	if daysRemaining < 0 {
		daysRemaining = 0
	}

	// Auto-cancel expired or canceled pending invoices from Midtrans
	s.SyncAndCancelPendingInvoices(userID)

	// Fetch user invoices
	var invoices []models.Invoice
	s.db.Where("user_id = ?", userID).Order("created_at desc").Find(&invoices)

	// Fetch active promos
	var promos []models.PromoCode
	s.db.Where("is_active = ?", true).Find(&promos)

	return &BillingOverviewResponse{
		Subscription:         &sub,
		Invoices:             invoices,
		DaysRemaining:        daysRemaining,
		PricingTiers:         s.GetDynamicPricingTiers(),
		StripePortalURL:      "",
		NextRenewalDate:      sub.CurrentPeriodEnd.Format("02 January 2006"),
		AvailablePromos:      promos,
		MidtransClientKey:    s.midtrans.GetClientKey(),
		MidtransSnapURL:      s.midtrans.GetSnapJSURL(),
		MidtransIsProduction: s.midtrans.IsProduction(),
	}, nil
}

// StartTrial activates a free trial of Klikin Pro using dynamic duration from PlatformSetting
func (s *BillingService) StartTrial(userID string, days int) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	if days <= 0 {
		var setting models.PlatformSetting
		if s.db.Select("trial_duration_days").First(&setting).Error == nil && setting.TrialDurationDays > 0 {
			days = setting.TrialDurationDays
		} else {
			days = 14
		}
	}

	var sub models.Subscription
	if err := s.db.Where("user_id = ?", userID).First(&sub).Error; err != nil {
		return nil, errors.New("data langganan tidak ditemukan")
	}

	if sub.TrialStartAt != nil {
		return nil, errors.New("Anda sudah pernah menggunakan masa uji coba gratis (Trial) sebelumnya")
	}

	now := time.Now()
	trialEnd := now.AddDate(0, 0, days)

	sub.Plan = models.PlanPro
	sub.Status = models.SubscriptionStatusTrial
	sub.TrialStartAt = &now
	sub.TrialEndAt = &trialEnd
	sub.CurrentPeriodStart = now
	sub.CurrentPeriodEnd = trialEnd
	sub.CancelAtPeriodEnd = false
	sub.UpdatedAt = now

	if err := s.db.Save(&sub).Error; err != nil {
		return nil, err
	}

	// Update user is_pro
	s.db.Model(&models.User{}).Where("id = ?", userID).Update("is_pro", true)

	return &sub, nil
}

// ValidatePromoCode checks voucher validity and returns discount percent
func (s *BillingService) ValidatePromoCode(code string) (*models.PromoCode, error) {
	cleanCode := strings.ToUpper(strings.TrimSpace(code))
	if cleanCode == "" {
		return nil, errors.New("kode promo tidak boleh kosong")
	}

	var promo models.PromoCode
	err := s.db.Where("code = ? AND is_active = ?", cleanCode, true).First(&promo).Error
	if err != nil {
		return nil, errors.New("kode promo tidak valid atau sudah kedaluwarsa")
	}

	if promo.ExpiresAt != nil && time.Now().After(*promo.ExpiresAt) {
		return nil, errors.New("kode promo telah melewati masa berlaku")
	}

	if promo.MaxUses > 0 && promo.UsedCount >= promo.MaxUses {
		return nil, errors.New("kuota penggunaan kode promo ini sudah habis")
	}

	return &promo, nil
}

type UpgradeResponse struct {
	Subscription    *models.Subscription `json:"subscription"`
	Invoice         *models.Invoice      `json:"invoice"`
	OrderID         string               `json:"order_id"`
	SnapToken       string               `json:"snap_token"`
	SnapRedirectURL string               `json:"snap_redirect_url"`
	ClientKey       string               `json:"client_key"`
	IsProduction    bool                 `json:"is_production"`
	SnapURL         string               `json:"snap_url"`
}

// UpgradePlan creates a pending invoice and requests a Midtrans Snap transaction token
func (s *BillingService) UpgradePlan(userID string, targetPlan models.PlanType, billingCycle string, promoCode string, clientOrigin string) (*UpgradeResponse, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var sub models.Subscription
	if err := s.db.Where("user_id = ?", userID).First(&sub).Error; err != nil {
		return nil, errors.New("data langganan tidak ditemukan")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	targetPlan = models.PlanPro
	planName := "Klikin Pro"

	// Fetch base price from platform settings if available
	var basePrice int64 = 29000
	if billingCycle == "yearly" {
		basePrice = 290000
	}
	var setting models.PlatformSetting
	if err := s.db.First(&setting).Error; err == nil {
		if billingCycle == "yearly" && setting.ProYearlyPrice > 0 {
			basePrice = setting.ProYearlyPrice
		} else if setting.ProMonthlyPrice > 0 {
			basePrice = setting.ProMonthlyPrice
		}
	}

	discountPercent := 0
	if promoCode != "" {
		if promo, err := s.ValidatePromoCode(promoCode); err == nil {
			discountPercent = promo.DiscountPercent
			s.db.Model(&promo).Update("used_count", promo.UsedCount+1)
		}
	}

	// Calculate final amounts with discount and 11% PPN tax
	discountAmount := (basePrice * int64(discountPercent)) / 100
	subtotal := basePrice - discountAmount
	tax := (subtotal * 11) / 100
	total := subtotal + tax

	now := time.Now()
	invoiceNumber := fmt.Sprintf("INV-%s-%04d", now.Format("2006"), (now.UnixNano()%9000)+1000)

	// Call Midtrans Snap API
	userName := user.FullName
	if userName == "" {
		userName = user.Username
	}
	if userName == "" {
		userName = "Pelanggan Klikin"
	}
	userEmail := user.Email
	if userEmail == "" {
		userEmail = "user@klikin.id"
	}

	snapToken, snapRedirectURL, snapErr := s.midtrans.CreateSnapTransaction(
		invoiceNumber,
		total,
		userName,
		userEmail,
		fmt.Sprintf("%s (%s)", planName, billingCycle),
		clientOrigin,
	)
	if snapErr != nil {
		fmt.Printf("⚠️ Snap token creation error: %v\n", snapErr)
		return nil, fmt.Errorf("gagal membuat sesi pembayaran Midtrans: %w", snapErr)
	}

	// Create new pending invoice
	invoice := models.Invoice{
		ID:              fmt.Sprintf("inv_%d", now.UnixNano()),
		InvoiceNumber:   invoiceNumber,
		UserID:          userID,
		SubscriptionID:  sub.ID,
		PlanName:        planName,
		BillingCycle:    billingCycle,
		Amount:          subtotal,
		Tax:             tax,
		Total:           total,
		Status:          "pending",
		PaymentChannel:  "midtrans",
		BillingReason:   "subscription_upgrade",
		SnapToken:       snapToken,
		SnapRedirectURL: snapRedirectURL,
		Notes:           "Menunggu pembayaran via Midtrans Snap",
		CreatedAt:       now,
	}
	s.db.Create(&invoice)

	return &UpgradeResponse{
		Subscription:    &sub,
		Invoice:         &invoice,
		OrderID:         invoiceNumber,
		SnapToken:       snapToken,
		SnapRedirectURL: snapRedirectURL,
		ClientKey:       s.midtrans.GetClientKey(),
		IsProduction:    s.midtrans.IsProduction(),
		SnapURL:         s.midtrans.GetSnapJSURL(),
	}, nil
}

// VerifyMidtransPayment checks with Midtrans API and verifies payment status
func (s *BillingService) VerifyMidtransPayment(userID, orderID string) (*models.Invoice, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var invoice models.Invoice
	query := s.db.Where("invoice_number = ? OR id = ?", orderID, orderID)
	if strings.TrimSpace(userID) != "" {
		query = query.Where("user_id = ?", strings.TrimSpace(userID))
	}
	if err := query.First(&invoice).Error; err != nil {
		return nil, errors.New("invoice tidak ditemukan atau bukan milik akun Anda")
	}

	if invoice.Status == "paid" {
		return &invoice, nil
	}

	// Query Midtrans API directly (never allow auto-paid mock logic bypass)
	status, err := s.midtrans.CheckStatus(invoice.InvoiceNumber)
	if err != nil {
		return &invoice, fmt.Errorf("status transaksi belum terkonfirmasi oleh payment gateway: %w", err)
	}

	now := time.Now()
	if (status == "settlement" || status == "capture") || status == "success" {
		invoice.Status = "paid"
		invoice.PaidAt = &now
		invoice.Notes = "Pembayaran dikonfirmasi via Midtrans Core API Check"
		s.db.Save(&invoice)

		// Activate Pro Subscription & synchronize Price and BillingCycle
		var sub models.Subscription
		if err := s.db.Where("id = ? OR user_id = ?", invoice.SubscriptionID, invoice.UserID).First(&sub).Error; err == nil {
			sub.Plan = models.PlanPro
			sub.Status = models.SubscriptionStatusActive
			if invoice.BillingCycle != "" {
				sub.BillingCycle = invoice.BillingCycle
			}
			if invoice.Amount > 0 {
				sub.Price = invoice.Amount
			}
			sub.CurrentPeriodStart = now
			if invoice.BillingCycle == "yearly" {
				sub.CurrentPeriodEnd = now.AddDate(1, 0, 0)
			} else {
				sub.CurrentPeriodEnd = now.AddDate(0, 1, 0)
			}
			sub.CancelAtPeriodEnd = false
			sub.UpdatedAt = now
			s.db.Save(&sub)
		}

		s.db.Model(&models.User{}).Where("id = ?", invoice.UserID).Update("is_pro", true)

		finLog := models.FinancialAuditLog{
			ID:        fmt.Sprintf("fin_%d", now.UnixNano()),
			AdminID:   "midtrans_core_api",
			AdminName: "Midtrans Payment Verification",
			Action:    "PAYMENT_SETTLED",
			Target:    invoice.InvoiceNumber,
			Amount:    invoice.Total,
			Details:   fmt.Sprintf("Invoice %s diverifikasi lunas via Midtrans Core API", invoice.InvoiceNumber),
			IPAddress: "midtrans-api",
			CreatedAt: now,
		}
		_ = s.db.Create(&finLog)
	}

	return &invoice, nil
}

// DowngradePlan schedules cancellation to free tier at the end of billing period
func (s *BillingService) DowngradePlan(userID string) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var sub models.Subscription
	if err := s.db.Where("user_id = ?", userID).First(&sub).Error; err != nil {
		return nil, errors.New("data langganan tidak ditemukan")
	}

	now := time.Now()
	sub.CancelAtPeriodEnd = true
	sub.CanceledAt = &now
	sub.CancellationReason = "Downgrade ke paket Gratis"
	sub.UpdatedAt = now

	if err := s.db.Save(&sub).Error; err != nil {
		return nil, err
	}

	return &sub, nil
}

// CancelSubscription marks subscription as canceled with reason feedback
func (s *BillingService) CancelSubscription(userID string, reason string) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var sub models.Subscription
	if err := s.db.Where("user_id = ?", userID).First(&sub).Error; err != nil {
		return nil, errors.New("data langganan tidak ditemukan")
	}

	now := time.Now()
	sub.Status = models.SubscriptionStatusCanceled
	sub.CancelAtPeriodEnd = true
	sub.CanceledAt = &now
	sub.CancellationReason = strings.TrimSpace(reason)
	sub.UpdatedAt = now

	if err := s.db.Save(&sub).Error; err != nil {
		return nil, err
	}

	return &sub, nil
}

// ReactivateSubscription restores canceled subscription before expiry date
func (s *BillingService) ReactivateSubscription(userID string) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var sub models.Subscription
	if err := s.db.Where("user_id = ?", userID).First(&sub).Error; err != nil {
		return nil, errors.New("data langganan tidak ditemukan")
	}

	now := time.Now()
	sub.Status = models.SubscriptionStatusActive
	sub.CancelAtPeriodEnd = false
	sub.CanceledAt = nil
	sub.CancellationReason = ""
	sub.UpdatedAt = now

	if err := s.db.Save(&sub).Error; err != nil {
		return nil, err
	}

	// Restore user is_pro
	s.db.Model(&models.User{}).Where("id = ?", userID).Update("is_pro", true)

	return &sub, nil
}

// UpdatePaymentMethod updates stored card info
func (s *BillingService) UpdatePaymentMethod(userID string, brand string, last4 string, exp string) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var sub models.Subscription
	if err := s.db.Where("user_id = ?", userID).First(&sub).Error; err != nil {
		return nil, errors.New("data langganan tidak ditemukan")
	}

	sub.PaymentMethodBrand = strings.ToLower(strings.TrimSpace(brand))
	if sub.PaymentMethodBrand == "" {
		sub.PaymentMethodBrand = "mastercard"
	}
	sub.PaymentMethodLast4 = strings.TrimSpace(last4)
	if sub.PaymentMethodLast4 == "" {
		sub.PaymentMethodLast4 = "4242"
	}
	sub.PaymentMethodExp = strings.TrimSpace(exp)
	if sub.PaymentMethodExp == "" {
		sub.PaymentMethodExp = "12/28"
	}
	sub.UpdatedAt = time.Now()

	if err := s.db.Save(&sub).Error; err != nil {
		return nil, err
	}

	return &sub, nil
}

// GetInvoices retrieves billing history
func (s *BillingService) GetInvoices(userID string) ([]models.Invoice, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}
	s.SyncAndCancelPendingInvoices(userID)
	var invoices []models.Invoice
	err := s.db.Where("user_id = ?", userID).Order("created_at desc").Find(&invoices).Error
	return invoices, err
}

// GetInvoiceReceipt returns a single invoice details
func (s *BillingService) GetInvoiceReceipt(userID string, invoiceID string) (*models.Invoice, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}
	var inv models.Invoice
	err := s.db.Where("id = ? AND user_id = ?", invoiceID, userID).First(&inv).Error
	if err != nil {
		return nil, errors.New("invoice tidak ditemukan")
	}
	return &inv, nil
}

// SyncSubscriptionLifecycle checks whether the current billing period or trial has ended,
// transitioning expired Pro accounts to Free gracefully, updating PostgreSQL, and emitting notifications.
func (s *BillingService) SyncSubscriptionLifecycle(userID string) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var sub models.Subscription
	if err := s.db.Where("user_id = ?", userID).First(&sub).Error; err != nil {
		return nil, err
	}

	now := time.Now()
	// Only evaluate Pro subscriptions
	if sub.Plan == models.PlanPro && now.After(sub.CurrentPeriodEnd) {
		// Scenario A: Trial expired or user canceled during active period (cancel_at_period_end)
		if sub.CancelAtPeriodEnd || sub.Status == models.SubscriptionStatusCanceled || sub.Status == models.SubscriptionStatusTrial {
			sub.Plan = models.PlanFree
			sub.Status = models.SubscriptionStatusCanceled
			sub.Price = 0
			sub.CancelAtPeriodEnd = false
			sub.UpdatedAt = now
			s.db.Save(&sub)

			// Update User table
			s.db.Model(&models.User{}).Where("id = ?", userID).Update("is_pro", false)

			// Graceful feature shutdown: Suspend custom domain & disable page password
			s.db.Model(&models.BioPage{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
				"is_password_protected": false,
				"updated_at":             now,
			})
			s.db.Model(&models.CustomDomain{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
				"status":        models.DomainStatusError,
				"error_message": "Domain kustom dinonaktifkan sementara karena masa aktif paket Pro telah berakhir.",
				"updated_at":    now,
			})

			// Send in-app notification
			notif := models.Notification{
				ID:        fmt.Sprintf("notif_exp_%d", now.UnixNano()),
				UserID:    userID,
				Title:     "Masa Aktif Paket Berakhir",
				Message:   "Masa aktif paket Klikin Pro Anda telah berakhir. Akun Anda telah beralih ke paket Free. Data leads dan pengaturan Anda tetap aman tersimpan.",
				Type:      "billing",
				IsRead:    false,
				CreatedAt: now,
			}
			s.db.Create(&notif)
		} else if sub.Status == models.SubscriptionStatusActive {
			// Scenario B: Recurring paid subscription renewal due -> Grace period (3 days)
			gracePeriodDeadline := sub.CurrentPeriodEnd.Add(3 * 24 * time.Hour)
			if now.After(gracePeriodDeadline) {
				// Past grace period -> Downgrade to Free
				sub.Plan = models.PlanFree
				sub.Status = models.SubscriptionStatusCanceled
				sub.Price = 0
				sub.CancelAtPeriodEnd = false
				sub.UpdatedAt = now
				s.db.Save(&sub)

				s.db.Model(&models.User{}).Where("id = ?", userID).Update("is_pro", false)

				s.db.Model(&models.BioPage{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
					"is_password_protected": false,
					"updated_at":             now,
				})
				s.db.Model(&models.CustomDomain{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
					"status":        models.DomainStatusError,
					"error_message": "Domain kustom dinonaktifkan sementara karena masa tenggang pembayaran telah berakhir.",
					"updated_at":    now,
				})

				notif := models.Notification{
					ID:        fmt.Sprintf("notif_fail_%d", now.UnixNano()),
					UserID:    userID,
					Title:     "Langganan Berakhir (Masa Tenggang Habis)",
					Message:   "Perpanjangan otomatis paket Klikin Pro tidak berhasil dan masa tenggang 3 hari telah berakhir. Akun telah beralih ke paket Free.",
					Type:      "billing",
					IsRead:    false,
					CreatedAt: now,
				}
				s.db.Create(&notif)
			} else {
				// Within 3-day grace period
				if sub.Status != models.SubscriptionStatusPastDue {
					sub.Status = models.SubscriptionStatusPastDue
					sub.UpdatedAt = now
					s.db.Save(&sub)

					notif := models.Notification{
						ID:        fmt.Sprintf("notif_grace_%d", now.UnixNano()),
						UserID:    userID,
						Title:     "Perhatian: Pembayaran Perpanjangan Tertunda",
						Message:   "Perpanjangan paket Pro Anda sedang dalam masa tenggang (3 hari). Silakan perbarui metode pembayaran Anda di menu Billing.",
						Type:      "billing",
						IsRead:    false,
						CreatedAt: now,
					}
					s.db.Create(&notif)
				}
			}
		}
	}

	return &sub, nil
}

// SyncAndCancelPendingInvoices checks pending invoices and auto-cancels those that have expired or been cancelled in Midtrans
func (s *BillingService) SyncAndCancelPendingInvoices(userID string) {
	if s.db == nil {
		return
	}

	var pendingInvoices []models.Invoice
	query := s.db.Where("status = ?", "pending")
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if err := query.Find(&pendingInvoices).Error; err != nil {
		return
	}

	log.Printf("[BillingSweeper] Syncing %d pending invoice(s)...", len(pendingInvoices))

	now := time.Now()
	for _, inv := range pendingInvoices {
		shouldCancel := false
		cancelReason := ""
		age := now.Sub(inv.CreatedAt)

		log.Printf("[BillingSweeper] Checking invoice %s: CreatedAt=%s, Age=%s, HasToken=%v",
			inv.InvoiceNumber, inv.CreatedAt.Format(time.RFC3339), age.Round(time.Second), inv.SnapToken != "")

		// 1. Time-based auto cancellation: Invoices older than 24 hours
		if age > 24*time.Hour {
			shouldCancel = true
			cancelReason = "Otomatis dibatalkan sistem: telah melewati batas pending 24 jam"
		} else if inv.SnapToken == "" && age > 5*time.Minute {
			// 2. Token issue: Incomplete invoice older than 5 minutes
			shouldCancel = true
			cancelReason = "Otomatis dibatalkan sistem: token pembayaran tidak valid"
		} else if inv.InvoiceNumber != "" && s.midtrans != nil {
			// 3. Query Midtrans API directly for live transaction status
			mStatus, err := s.midtrans.CheckStatus(inv.InvoiceNumber)
			log.Printf("[BillingSweeper] Midtrans status for %s: %s (err=%v)", inv.InvoiceNumber, mStatus, err)
			if err == nil {
				switch mStatus {
				case "expire":
					shouldCancel = true
					cancelReason = "Otomatis dibatalkan: batas waktu transaksi telah kedaluwarsa di Midtrans"
				case "cancel":
					shouldCancel = true
					cancelReason = "Otomatis dibatalkan: pesanan dibatalkan via Midtrans"
				case "deny":
					shouldCancel = true
					cancelReason = "Otomatis dibatalkan: pembayaran ditolak oleh sistem perbankan/Midtrans"
				case "settlement", "capture":
					// Midtrans confirms it was paid, activate Pro!
					inv.Status = "paid"
					inv.PaidAt = &now
					inv.Notes = "Pembayaran dikonfirmasi via sinkronisasi status Midtrans"
					_ = s.db.Model(&models.Invoice{}).Where("id = ?", inv.ID).Updates(map[string]interface{}{
						"status":  "paid",
						"paid_at": now,
						"notes":   inv.Notes,
					})
					s.activateProSubscription(inv.UserID, inv.SubscriptionID, inv.BillingCycle, inv.Amount)
					continue
				case "not_found", "unknown":
					// If older than 10 minutes and does not exist in Midtrans (or unknown status)
					if age > 10*time.Minute {
						shouldCancel = true
						cancelReason = "Otomatis dibatalkan: transaksi tidak diselesaikan di Midtrans"
					}
				}
			}
		}

		if shouldCancel {
			inv.Status = "cancelled"
			inv.Notes = cancelReason
			_ = s.db.Model(&models.Invoice{}).Where("id = ?", inv.ID).Updates(map[string]interface{}{
				"status": "cancelled",
				"notes":  cancelReason,
			})
			log.Printf("[BillingSweeper] Invoice %s status pending otomatis dibatalkan: %s", inv.InvoiceNumber, cancelReason)
		}
	}
}

// activateProSubscription helper enables Pro tier for user
func (s *BillingService) activateProSubscription(userID string, subscriptionID string, billingCycle string, amount int64) {
	now := time.Now()
	var sub models.Subscription
	if err := s.db.Where("id = ? OR user_id = ?", subscriptionID, userID).First(&sub).Error; err == nil {
		sub.Plan = models.PlanPro
		sub.Status = models.SubscriptionStatusActive
		if billingCycle != "" {
			sub.BillingCycle = billingCycle
		}
		if amount > 0 {
			sub.Price = amount
		}
		sub.CurrentPeriodStart = now
		if billingCycle == "yearly" {
			sub.CurrentPeriodEnd = now.AddDate(1, 0, 0)
		} else {
			sub.CurrentPeriodEnd = now.AddDate(0, 1, 0)
		}
		sub.CancelAtPeriodEnd = false
		sub.UpdatedAt = now
		_ = s.db.Save(&sub)
	}
	_ = s.db.Model(&models.User{}).Where("id = ?", userID).Update("is_pro", true)
}

// CancelInvoice allows an owner to manually cancel their pending invoice
func (s *BillingService) CancelInvoice(userID string, invoiceID string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	var invoice models.Invoice
	if err := s.db.Where("(id = ? OR invoice_number = ?) AND user_id = ?", invoiceID, invoiceID, userID).First(&invoice).Error; err != nil {
		return errors.New("invoice tidak ditemukan")
	}

	if invoice.Status != "pending" {
		return errors.New("hanya invoice berstatus pending yang dapat dibatalkan")
	}

	invoice.Status = "cancelled"
	invoice.Notes = "Dibatalkan secara manual oleh pengguna"
	if err := s.db.Model(&models.Invoice{}).Where("id = ?", invoice.ID).Updates(map[string]interface{}{
		"status": "cancelled",
		"notes":  invoice.Notes,
	}).Error; err != nil {
		return err
	}

	// Inform Midtrans to cancel transaction if it exists
	if s.midtrans != nil && invoice.InvoiceNumber != "" {
		_ = s.midtrans.CancelTransaction(invoice.InvoiceNumber)
	}

	return nil
}

// StartInvoiceExpirationSweeper launches a background periodic cleaner for pending invoices
func (s *BillingService) StartInvoiceExpirationSweeper() {
	go func() {
		// Run once immediately on server startup
		s.SyncAndCancelPendingInvoices("")
		ticker := time.NewTicker(3 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			s.SyncAndCancelPendingInvoices("")
		}
	}()
}

