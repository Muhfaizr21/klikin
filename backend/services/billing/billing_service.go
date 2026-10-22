package billing

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
)

type BillingService struct {
	db *gorm.DB
}

func NewBillingService(db *gorm.DB) *BillingService {
	return &BillingService{db: db}
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
	Subscription       *models.Subscription `json:"subscription"`
	Invoices           []models.Invoice     `json:"invoices"`
	DaysRemaining      int                  `json:"days_remaining"`
	PricingTiers       []PlanPricing        `json:"pricing_tiers"`
	StripePortalURL    string               `json:"stripe_portal_url"`
	NextRenewalDate    string               `json:"next_renewal_date"`
	AvailablePromos    []models.PromoCode   `json:"available_promos"`
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
		MonthlyPrice:   49000,
		YearlyPrice:    490000,
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

// GetSubscriptionDetails retrieves user subscription status and invoices
func (s *BillingService) GetSubscriptionDetails(userID string) (*BillingOverviewResponse, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
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
			price = 49000
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
			PaymentMethodBrand: "mastercard",
			PaymentMethodLast4: "4242",
			PaymentMethodExp:   "12/28",
			CreatedAt:          now,
			UpdatedAt:          now,
		}
		s.db.Create(&sub)
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

	// Fetch user invoices
	var invoices []models.Invoice
	s.db.Where("user_id = ?", userID).Order("created_at desc").Find(&invoices)

	// Fetch active promos
	var promos []models.PromoCode
	s.db.Where("is_active = ?", true).Find(&promos)

	return &BillingOverviewResponse{
		Subscription:    &sub,
		Invoices:        invoices,
		DaysRemaining:   daysRemaining,
		PricingTiers:    DefaultPricingTiers,
		StripePortalURL: "https://billing.stripe.com/p/session/test_simulated_portal",
		NextRenewalDate: sub.CurrentPeriodEnd.Format("02 January 2006"),
		AvailablePromos: promos,
	}, nil
}

// StartTrial activates a 14-day free trial of Klikin Pro
func (s *BillingService) StartTrial(userID string, days int) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	if days <= 0 {
		days = 14
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

// UpgradePlan upgrades subscription to Pro or Agency with invoice creation
func (s *BillingService) UpgradePlan(userID string, targetPlan models.PlanType, billingCycle string, promoCode string) (*models.Subscription, *models.Invoice, error) {
	if s.db == nil {
		return nil, nil, errors.New("database not available")
	}

	var sub models.Subscription
	if err := s.db.Where("user_id = ?", userID).First(&sub).Error; err != nil {
		return nil, nil, errors.New("data langganan tidak ditemukan")
	}

	targetPlan = models.PlanPro
	planName := "Klikin Pro"
	var basePrice int64
	if billingCycle == "yearly" {
		basePrice = 490000
	} else {
		basePrice = 49000
	}

	discountPercent := 0
	if promoCode != "" {
		if promo, err := s.ValidatePromoCode(promoCode); err == nil {
			discountPercent = promo.DiscountPercent
			// Increment promo usage
			s.db.Model(&promo).Update("used_count", promo.UsedCount+1)
		}
	}

	// Calculate final amounts with discount and 11% PPN tax
	discountAmount := (basePrice * int64(discountPercent)) / 100
	subtotal := basePrice - discountAmount
	tax := (subtotal * 11) / 100
	total := subtotal + tax

	now := time.Now()
	var periodEnd time.Time
	if billingCycle == "yearly" {
		periodEnd = now.AddDate(1, 0, 0)
	} else {
		periodEnd = now.AddDate(0, 1, 0)
	}

	// Update subscription
	sub.Plan = targetPlan
	sub.BillingCycle = billingCycle
	sub.Status = models.SubscriptionStatusActive
	sub.Price = basePrice
	sub.DiscountPercent = discountPercent
	sub.AppliedPromoCode = promoCode
	sub.CurrentPeriodStart = now
	sub.CurrentPeriodEnd = periodEnd
	sub.CancelAtPeriodEnd = false
	sub.CanceledAt = nil
	sub.CancellationReason = ""
	sub.UpdatedAt = now

	if err := s.db.Save(&sub).Error; err != nil {
		return nil, nil, err
	}

	// Create new paid invoice
	invoice := models.Invoice{
		ID:             fmt.Sprintf("inv_%d", now.UnixNano()),
		InvoiceNumber:  fmt.Sprintf("INV-%s-%04d", now.Format("2006"), (now.UnixNano()%9000)+1000),
		UserID:         userID,
		SubscriptionID: sub.ID,
		PlanName:       planName,
		BillingCycle:   billingCycle,
		Amount:         subtotal,
		Tax:            tax,
		Total:          total,
		Status:         "paid",
		BillingReason:  "subscription_upgrade",
		PaidAt:         &now,
		CreatedAt:      now,
	}
	s.db.Create(&invoice)

	// Ensure user has is_pro = true
	s.db.Model(&models.User{}).Where("id = ?", userID).Update("is_pro", true)

	return &sub, &invoice, nil
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
