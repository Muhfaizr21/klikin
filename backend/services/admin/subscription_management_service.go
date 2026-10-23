package admin

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"math"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
)

// SubscriptionManagementUseCase defines the contract for Super Admin subscription operations (SOLID DIP & ISP)
type SubscriptionManagementUseCase interface {
	ListSubscriptions(filter SubscriptionFilterParams) (*SubscriptionListResult, error)
	GetSubscriptionDetail(userID string) (*SubscriptionDetailResult, error)
	ChangePlanManual(userID string, dto ChangePlanDTO, actor AdminActor) (*models.Subscription, error)
	ExtendGoodwill(userID string, dto ExtendGoodwillDTO, actor AdminActor) (*models.Subscription, error)
	ManageTrial(userID string, dto ManageTrialDTO, actor AdminActor) (*models.Subscription, error)
	CancelSubscription(userID string, dto CancelSubscriptionDTO, actor AdminActor) (*models.Subscription, error)
	ListAllInvoices(search, status string, page, limit int) (*InvoiceListResult, error)
	ProcessRefund(invoiceID string, dto RefundInvoiceDTO, actor AdminActor) (*models.Invoice, error)
	ListPromoCodes() ([]PromoCodeItemDTO, error)
	CreatePromoCode(dto SavePromoCodeDTO, actor AdminActor) (*models.PromoCode, error)
	UpdatePromoCode(promoID string, dto SavePromoCodeDTO, actor AdminActor) (*models.PromoCode, error)
	DeletePromoCode(promoID string, actor AdminActor) error
	GetDunningQueue() (*DunningQueueResult, error)
	SendDunningReminder(userID string, customMessage string, actor AdminActor) error
	SendBulkDunningReminders(actor AdminActor) (int, error)
	ResolveDunningManual(userID string, actor AdminActor) (*models.Subscription, error)
	ExportSubscriptionsCSV() ([]byte, error)
}

// AdminActor identifies the Super Admin performing an audited operation
type AdminActor struct {
	ID    string
	Name  string
	Email string
	Role  string
	IP    string
}

// SubscriptionFilterParams encapsulates query parameters for listing subscriptions
type SubscriptionFilterParams struct {
	Search string
	Status string
	Plan   string
	Cycle  string
	Sort   string
	Page   int
	Limit  int
}

// SubscriptionOverviewStats holds real-time aggregated platform subscription metrics
type SubscriptionOverviewStats struct {
	TotalSubscriptions int64 `json:"total_subscriptions"`
	ActiveProCount     int64 `json:"active_pro_count"`
	TrialCount         int64 `json:"trial_count"`
	PastDueCount       int64 `json:"past_due_count"`
	CanceledCount      int64 `json:"canceled_count"`
	ExpiredCount       int64 `json:"expired_count"`
	FreeCount          int64 `json:"free_count"`
	MRR                int64 `json:"mrr"`
	ARR                int64 `json:"arr"`
	TotalCollected     int64 `json:"total_collected"`
	TotalRefunded      int64 `json:"total_refunded"`
	FailedAmount       int64 `json:"failed_amount"`
	ActivePromosCount  int64 `json:"active_promos_count"`
}

// SubscriptionListItemDTO represents a single tenant subscription row in the directory
type SubscriptionListItemDTO struct {
	SubscriptionID       string                    `json:"subscription_id"`
	UserID               string                    `json:"user_id"`
	FullName             string                    `json:"full_name"`
	Username             string                    `json:"username"`
	Email                string                    `json:"email"`
	PhoneNumber          string                    `json:"phone_number"`
	AvatarURL            string                    `json:"avatar_url"`
	IsVerified           bool                      `json:"is_verified"`
	PageSlug             string                    `json:"page_slug"`
	Plan                 models.PlanType           `json:"plan"`
	BillingCycle         string                    `json:"billing_cycle"`
	Status               models.SubscriptionStatus `json:"status"`
	Price                int64                     `json:"price"`
	Currency             string                    `json:"currency"`
	TrialStartAt         *time.Time                `json:"trial_start_at,omitempty"`
	TrialEndAt           *time.Time                `json:"trial_end_at,omitempty"`
	CurrentPeriodStart   time.Time                 `json:"current_period_start"`
	CurrentPeriodEnd     time.Time                 `json:"current_period_end"`
	DaysRemaining        int                       `json:"days_remaining"`
	CancelAtPeriodEnd    bool                      `json:"cancel_at_period_end"`
	CanceledAt           *time.Time                `json:"canceled_at,omitempty"`
	CancellationReason   string                    `json:"cancellation_reason,omitempty"`
	PaymentMethodBrand   string                    `json:"payment_method_brand"`
	PaymentMethodLast4   string                    `json:"payment_method_last4"`
	PaymentMethodExp     string                    `json:"payment_method_exp"`
	AppliedPromoCode     string                    `json:"applied_promo_code,omitempty"`
	DiscountPercent      int                       `json:"discount_percent"`
	AdminNotes           string                    `json:"admin_notes,omitempty"`
	DunningReminderCount int                       `json:"dunning_reminder_count"`
	LastReminderSentAt   *time.Time                `json:"last_reminder_sent_at,omitempty"`
	InvoiceCount         int                       `json:"invoice_count"`
	TotalPaid            int64                     `json:"total_paid"`
	HasFailedInvoice     bool                      `json:"has_failed_invoice"`
	UpdatedAt            time.Time                 `json:"updated_at"`
}

// SubscriptionListResult wraps paginated subscriptions and real-time overview metrics
type SubscriptionListResult struct {
	Subscriptions []SubscriptionListItemDTO `json:"subscriptions"`
	Stats         SubscriptionOverviewStats `json:"stats"`
	Pagination    PaginationMeta            `json:"pagination"`
}

// SubscriptionDetailResult provides full 360-degree billing details for a single user
type SubscriptionDetailResult struct {
	User          models.User              `json:"user"`
	Subscription  models.Subscription      `json:"subscription"`
	DaysRemaining int                      `json:"days_remaining"`
	Invoices      []models.Invoice         `json:"invoices"`
	ActivityLogs  []models.UserActivityLog `json:"activity_logs"`
}

// InvoiceWithUserDTO enriches an invoice record with tenant identity
type InvoiceWithUserDTO struct {
	models.Invoice
	UserFullName string `json:"user_full_name"`
	Username     string `json:"username"`
	UserEmail    string `json:"user_email"`
}

// InvoiceListResult wraps paginated platform invoices
type InvoiceListResult struct {
	Invoices   []InvoiceWithUserDTO `json:"invoices"`
	Pagination PaginationMeta       `json:"pagination"`
}

// PromoCodeItemDTO enriches PromoCode with computed usage percentage and expiration status
type PromoCodeItemDTO struct {
	models.PromoCode
	UsagePercentage float64 `json:"usage_percentage"`
	IsExpired       bool    `json:"is_expired"`
}

// DunningItemDTO represents an overdue or failed-payment account requiring follow-up
type DunningItemDTO struct {
	SubscriptionID       string     `json:"subscription_id"`
	UserID               string     `json:"user_id"`
	FullName             string     `json:"full_name"`
	Username             string     `json:"username"`
	Email                string     `json:"email"`
	PhoneNumber          string     `json:"phone_number"`
	Plan                 string     `json:"plan"`
	BillingCycle         string     `json:"billing_cycle"`
	Status               string     `json:"status"`
	OverdueAmount        int64      `json:"overdue_amount"`
	FailedInvoiceID      string     `json:"failed_invoice_id"`
	FailedInvoiceNumber  string     `json:"failed_invoice_number"`
	FailedAt             time.Time  `json:"failed_at"`
	DaysOverdue          int        `json:"days_overdue"`
	PaymentMethodBrand   string     `json:"payment_method_brand"`
	PaymentMethodLast4   string     `json:"payment_method_last4"`
	DunningReminderCount int        `json:"dunning_reminder_count"`
	LastReminderSentAt   *time.Time `json:"last_reminder_sent_at,omitempty"`
}

// DunningQueueResult wraps all overdue accounts and summary metrics
type DunningQueueResult struct {
	Items              []DunningItemDTO `json:"items"`
	TotalOverdueCount  int              `json:"total_overdue_count"`
	TotalAtRiskRevenue int64            `json:"total_at_risk_revenue"`
	TotalRemindersSent int              `json:"total_reminders_sent"`
}

// DTOs for Administrative Mutations
type ChangePlanDTO struct {
	Plan            string `json:"plan"`             // "pro" | "free"
	BillingCycle    string `json:"billing_cycle"`    // "monthly" | "yearly"
	CustomPrice     *int64 `json:"custom_price"`     // optional custom price in IDR
	GenerateInvoice bool   `json:"generate_invoice"` // whether to record a paid invoice
	AdminNotes      string `json:"admin_notes"`
}

type ExtendGoodwillDTO struct {
	Days   int    `json:"days"`
	Reason string `json:"reason"`
}

type ManageTrialDTO struct {
	Action       string `json:"action"` // "start" | "extend" | "shorten" | "convert_to_paid"
	Days         int    `json:"days"`
	BillingCycle string `json:"billing_cycle"`
	Reason       string `json:"reason"`
}

type CancelSubscriptionDTO struct {
	Immediate bool   `json:"immediate"`
	Reason    string `json:"reason"`
}

type RefundInvoiceDTO struct {
	Reason          string `json:"reason"`
	DowngradeToFree bool   `json:"downgrade_to_free"`
}

type SavePromoCodeDTO struct {
	Code            string `json:"code"`
	DiscountPercent int    `json:"discount_percent"`
	Description     string `json:"description"`
	MaxUses         int    `json:"max_uses"`
	IsActive        *bool  `json:"is_active"`
	ExpiresAt       string `json:"expires_at"` // YYYY-MM-DD or empty
}

// SubscriptionManagementService implements SubscriptionManagementUseCase
type SubscriptionManagementService struct {
	db *gorm.DB
}

// NewSubscriptionManagementService initializes the service and synchronizes tenant subscriptions
func NewSubscriptionManagementService(db *gorm.DB) *SubscriptionManagementService {
	svc := &SubscriptionManagementService{db: db}
	go svc.ensureTenantSubscriptionsSynced()
	return svc
}

// ensureTenantSubscriptionsSynced guarantees every tenant user has a real Subscription record in PostgreSQL
// and seeds realistic lifecycle states (active, trial, past_due, canceled, expired) if not yet initialized.
func (s *SubscriptionManagementService) ensureTenantSubscriptionsSynced() {
	if s.db == nil {
		return
	}

	// Wait briefly so PlatformAnalyticsService / Seeder finishes creating initial users
	time.Sleep(300 * time.Millisecond)

	var users []models.User
	if err := s.db.Where("deleted_at IS NULL AND role = ?", models.RoleAccountOwner).Order("created_at asc").Find(&users).Error; err != nil {
		return
	}

	now := time.Now()

	for _, u := range users {
		var sub models.Subscription
		err := s.db.Where("user_id = ?", u.ID).First(&sub).Error
		if err == nil {
			continue
		}

		// Create tailored initial subscription records for seeded tenants so all lifecycle states exist in DB
		switch u.Username {
		case "fashionhijab":
			periodStart := now.AddDate(0, -2, 0)
			periodEnd := now.AddDate(0, 10, 0)
			sub = models.Subscription{
				ID:                 "sub_fashion_01",
				UserID:             u.ID,
				Plan:               models.PlanPro,
				BillingCycle:       "yearly",
				Status:             models.SubscriptionStatusActive,
				Price:              290000,
				Currency:           "IDR",
				CurrentPeriodStart: periodStart,
				CurrentPeriodEnd:   periodEnd,
				PaymentMethodBrand: "visa",
				PaymentMethodLast4: "8819",
				PaymentMethodExp:   "09/28",
				AppliedPromoCode:   "STARTUP2026",
				DiscountPercent:    20,
				AdminNotes:         "Pelanggan tahunan loyalitas tinggi.",
				CreatedAt:          periodStart,
				UpdatedAt:          now,
			}
			s.db.Create(&sub)
			s.db.Model(&models.User{}).Where("id = ?", u.ID).Update("is_pro", true)

			inv := models.Invoice{
				ID:             "inv_fashion_01",
				InvoiceNumber:  "INV-2026-0089",
				UserID:         u.ID,
				SubscriptionID: sub.ID,
				PlanName:       "Klikin Pro (Tahunan)",
				BillingCycle:   "yearly",
				Amount:         290000,
				Tax:            31900,
				Total:          321900,
				Status:         "paid",
				BillingReason:  "subscription_create",
				PaidAt:         &periodStart,
				CreatedAt:      periodStart,
			}
			s.db.Create(&inv)

		case "creativestudio":
			// Past-due subscription with a failed invoice for Dunning queue
			periodStart := now.AddDate(0, -1, -4)
			periodEnd := now.AddDate(0, 0, -4)
			lastReminder := now.Add(-18 * time.Hour)
			sub = models.Subscription{
				ID:                   "sub_studio_01",
				UserID:               u.ID,
				Plan:                 models.PlanPro,
				BillingCycle:         "monthly",
				Status:               models.SubscriptionStatusPastDue,
				Price:                29000,
				Currency:             "IDR",
				CurrentPeriodStart:   periodStart,
				CurrentPeriodEnd:     periodEnd,
				PaymentMethodBrand:   "mastercard",
				PaymentMethodLast4:   "5512",
				PaymentMethodExp:     "04/26",
				DunningReminderCount: 1,
				LastReminderSentAt:   &lastReminder,
				AdminNotes:           "Gagal mendebit kartu otomatis, dalam masa tenggang dunning.",
				CreatedAt:            periodStart,
				UpdatedAt:            now,
			}
			s.db.Create(&sub)
			s.db.Model(&models.User{}).Where("id = ?", u.ID).Update("is_pro", true)

			failedInv := models.Invoice{
				ID:             "inv_studio_fail_01",
				InvoiceNumber:  "INV-2026-0114",
				UserID:         u.ID,
				SubscriptionID: sub.ID,
				PlanName:       "Klikin Pro (Bulanan)",
				BillingCycle:   "monthly",
				Amount:         29000,
				Tax:            3190,
				Total:          32190,
				Status:         "failed",
				BillingReason:  "subscription_cycle",
				CreatedAt:      periodEnd,
			}
			s.db.Create(&failedInv)

		case "techgadget":
			// Active 14-day Trial subscription
			trialStart := now.AddDate(0, 0, -5)
			trialEnd := now.AddDate(0, 0, 9)
			sub = models.Subscription{
				ID:                 "sub_gadget_01",
				UserID:             u.ID,
				Plan:               models.PlanPro,
				BillingCycle:       "monthly",
				Status:             models.SubscriptionStatusTrial,
				Price:              29000,
				Currency:           "IDR",
				TrialStartAt:       &trialStart,
				TrialEndAt:         &trialEnd,
				CurrentPeriodStart: trialStart,
				CurrentPeriodEnd:   trialEnd,
				PaymentMethodBrand: "visa",
				PaymentMethodLast4: "1094",
				PaymentMethodExp:   "11/27",
				AdminNotes:         "Trial Pro 14 hari aktif.",
				CreatedAt:          trialStart,
				UpdatedAt:          now,
			}
			s.db.Create(&sub)
			s.db.Model(&models.User{}).Where("id = ?", u.ID).Update("is_pro", true)

		case "coachfani":
			// Expired subscription
			periodStart := now.AddDate(0, -2, 0)
			periodEnd := now.AddDate(0, -1, 0)
			canceledAt := periodEnd.AddDate(0, 0, -2)
			sub = models.Subscription{
				ID:                 "sub_coach_01",
				UserID:             u.ID,
				Plan:               models.PlanFree,
				BillingCycle:       "monthly",
				Status:             models.SubscriptionStatusExpired,
				Price:              0,
				Currency:           "IDR",
				CurrentPeriodStart: periodStart,
				CurrentPeriodEnd:   periodEnd,
				CanceledAt:         &canceledAt,
				CancellationReason: "Masa berlangganan berakhir dan beralih ke paket Gratis",
				PaymentMethodBrand: "mastercard",
				PaymentMethodLast4: "3390",
				PaymentMethodExp:   "08/27",
				CreatedAt:          periodStart,
				UpdatedAt:          periodEnd,
			}
			s.db.Create(&sub)
			s.db.Model(&models.User{}).Where("id = ?", u.ID).Update("is_pro", false)

			pastInv := models.Invoice{
				ID:             "inv_coach_01",
				InvoiceNumber:  "INV-2026-0029",
				UserID:         u.ID,
				SubscriptionID: sub.ID,
				PlanName:       "Klikin Pro (Bulanan)",
				BillingCycle:   "monthly",
				Amount:         29000,
				Tax:            3190,
				Total:          32190,
				Status:         "paid",
				BillingReason:  "subscription_create",
				PaidAt:         &periodStart,
				CreatedAt:      periodStart,
			}
			s.db.Create(&pastInv)

		default:
			plan := models.PlanFree
			price := int64(0)
			status := models.SubscriptionStatusActive
			if u.IsPro {
				plan = models.PlanPro
				price = 29000
			}
			sub = models.Subscription{
				ID:                 fmt.Sprintf("sub_%s", u.ID),
				UserID:             u.ID,
				Plan:               plan,
				BillingCycle:       "monthly",
				Status:             status,
				Price:              price,
				Currency:           "IDR",
				CurrentPeriodStart: u.CreatedAt,
				CurrentPeriodEnd:   now.AddDate(0, 1, 0),
				PaymentMethodBrand: "mastercard",
				PaymentMethodLast4: "4242",
				PaymentMethodExp:   "12/28",
				CreatedAt:          u.CreatedAt,
				UpdatedAt:          now,
			}
			s.db.Create(&sub)
		}
	}
}

// ListSubscriptions retrieves paginated subscriptions with user data, invoice counts, and global stats
func (s *SubscriptionManagementService) ListSubscriptions(filter SubscriptionFilterParams) (*SubscriptionListResult, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	// Ensure any newly registered users also have a subscription row
	s.syncMissingUserSubscriptions()

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 10
	}

	// 1. Compute real-time overview statistics from PostgreSQL
	stats := s.computeOverviewStats()

	// 2. Build filtered query joining subscriptions and users
	tx := s.db.Table("subscriptions s").
		Joins("JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL AND u.role = 'ACCOUNT_OWNER'")

	if strings.TrimSpace(filter.Search) != "" {
		q := "%" + strings.ToLower(strings.TrimSpace(filter.Search)) + "%"
		tx = tx.Where(
			"LOWER(u.full_name) LIKE ? OR LOWER(u.username) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(s.id) LIKE ? OR LOWER(s.applied_promo_code) LIKE ?",
			q, q, q, q, q,
		)
	}

	if filter.Status != "" && strings.ToLower(filter.Status) != "all" {
		tx = tx.Where("LOWER(s.status) = ?", strings.ToLower(filter.Status))
	}

	if filter.Plan != "" && strings.ToLower(filter.Plan) != "all" {
		tx = tx.Where("LOWER(s.plan) = ?", strings.ToLower(filter.Plan))
	}

	if filter.Cycle != "" && strings.ToLower(filter.Cycle) != "all" {
		tx = tx.Where("LOWER(s.billing_cycle) = ?", strings.ToLower(filter.Cycle))
	}

	var totalFiltered int64
	tx.Count(&totalFiltered)

	// 3. Apply sorting
	switch filter.Sort {
	case "oldest":
		tx = tx.Order("s.created_at asc")
	case "expiring_soon":
		tx = tx.Order("s.current_period_end asc")
	case "price_desc":
		tx = tx.Order("s.price desc, s.updated_at desc")
	case "name":
		tx = tx.Order("u.full_name asc, u.username asc")
	default: // "newest"
		tx = tx.Order("s.updated_at desc, s.created_at desc")
	}

	type joinedRow struct {
		models.Subscription
		FullName    string
		Username    string
		Email       string
		PhoneNumber string
		AvatarURL   string
		IsVerified  bool
	}

	offset := (filter.Page - 1) * filter.Limit
	var rows []joinedRow
	if err := tx.Select("s.*, u.full_name, u.username, u.email, u.phone_number, u.avatar_url, u.is_verified").
		Offset(offset).Limit(filter.Limit).Scan(&rows).Error; err != nil {
		return nil, err
	}

	// 4. Batch fetch primary page slugs & invoice aggregates for these users
	var userIDs []string
	for _, r := range rows {
		userIDs = append(userIDs, r.UserID)
	}

	pageSlugByUser := make(map[string]string)
	invoiceAggByUser := make(map[string]struct {
		Count     int
		TotalPaid int64
		HasFailed bool
	})

	if len(userIDs) > 0 {
		var pages []models.BioPage
		s.db.Where("user_id IN ?", userIDs).Find(&pages)
		for _, p := range pages {
			if pageSlugByUser[p.UserID] == "" {
				pageSlugByUser[p.UserID] = p.Slug
			}
		}

		var invAggs []struct {
			UserID      string
			TotalCount  int
			TotalPaid   int64
			FailedCount int
		}
		s.db.Raw(`
			SELECT 
				user_id,
				COUNT(*) as total_count,
				COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) as total_paid,
				COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed_count
			FROM invoices
			WHERE user_id IN ?
			GROUP BY user_id
		`, userIDs).Scan(&invAggs)

		for _, ia := range invAggs {
			invoiceAggByUser[ia.UserID] = struct {
				Count     int
				TotalPaid int64
				HasFailed bool
			}{
				Count:     ia.TotalCount,
				TotalPaid: ia.TotalPaid,
				HasFailed: ia.FailedCount > 0,
			}
		}
	}

	items := make([]SubscriptionListItemDTO, 0, len(rows))
	for _, r := range rows {
		daysRemaining := int(math.Ceil(time.Until(r.CurrentPeriodEnd).Hours() / 24.0))
		invInfo := invoiceAggByUser[r.UserID]

		items = append(items, SubscriptionListItemDTO{
			SubscriptionID:       r.ID,
			UserID:               r.UserID,
			FullName:             r.FullName,
			Username:             r.Username,
			Email:                r.Email,
			PhoneNumber:          r.PhoneNumber,
			AvatarURL:            r.AvatarURL,
			IsVerified:           r.IsVerified,
			PageSlug:             pageSlugByUser[r.UserID],
			Plan:                 r.Plan,
			BillingCycle:         r.BillingCycle,
			Status:               r.Status,
			Price:                r.Price,
			Currency:             r.Currency,
			TrialStartAt:         r.TrialStartAt,
			TrialEndAt:           r.TrialEndAt,
			CurrentPeriodStart:   r.CurrentPeriodStart,
			CurrentPeriodEnd:     r.CurrentPeriodEnd,
			DaysRemaining:        daysRemaining,
			CancelAtPeriodEnd:    r.CancelAtPeriodEnd,
			CanceledAt:           r.CanceledAt,
			CancellationReason:   r.CancellationReason,
			PaymentMethodBrand:   r.PaymentMethodBrand,
			PaymentMethodLast4:   r.PaymentMethodLast4,
			PaymentMethodExp:     r.PaymentMethodExp,
			AppliedPromoCode:     r.AppliedPromoCode,
			DiscountPercent:      r.DiscountPercent,
			AdminNotes:           r.AdminNotes,
			DunningReminderCount: r.DunningReminderCount,
			LastReminderSentAt:   r.LastReminderSentAt,
			InvoiceCount:         invInfo.Count,
			TotalPaid:            invInfo.TotalPaid,
			HasFailedInvoice:     invInfo.HasFailed,
			UpdatedAt:            r.UpdatedAt,
		})
	}

	totalPages := int(math.Ceil(float64(totalFiltered) / float64(filter.Limit)))
	if totalPages < 1 {
		totalPages = 1
	}

	return &SubscriptionListResult{
		Subscriptions: items,
		Stats:         stats,
		Pagination: PaginationMeta{
			CurrentPage: filter.Page,
			Limit:       filter.Limit,
			TotalItems:  totalFiltered,
			TotalPages:  totalPages,
		},
	}, nil
}

func (s *SubscriptionManagementService) syncMissingUserSubscriptions() {
	var missingUsers []models.User
	s.db.Raw(`
		SELECT u.* FROM users u
		LEFT JOIN subscriptions s ON s.user_id = u.id
		WHERE u.deleted_at IS NULL AND u.role = 'ACCOUNT_OWNER' AND s.id IS NULL
	`).Scan(&missingUsers)

	now := time.Now()
	for _, u := range missingUsers {
		plan := models.PlanFree
		price := int64(0)
		if u.IsPro {
			plan = models.PlanPro
			price = 29000
		}
		sub := models.Subscription{
			ID:                 fmt.Sprintf("sub_%s", u.ID),
			UserID:             u.ID,
			Plan:               plan,
			BillingCycle:       "monthly",
			Status:             models.SubscriptionStatusActive,
			Price:              price,
			Currency:           "IDR",
			CurrentPeriodStart: u.CreatedAt,
			CurrentPeriodEnd:   now.AddDate(0, 1, 0),
			PaymentMethodBrand: "mastercard",
			PaymentMethodLast4: "4242",
			PaymentMethodExp:   "12/28",
			CreatedAt:          u.CreatedAt,
			UpdatedAt:          now,
		}
		s.db.Create(&sub)
	}
}

func (s *SubscriptionManagementService) computeOverviewStats() SubscriptionOverviewStats {
	var stats SubscriptionOverviewStats
	var wg sync.WaitGroup
	wg.Add(3)

	go func() {
		defer wg.Done()
		s.db.Raw(`
			SELECT
				COUNT(*) AS total_subscriptions,
				COALESCE(SUM(CASE WHEN s.plan = 'pro' AND s.status = 'active' THEN 1 ELSE 0 END), 0) AS active_pro_count,
				COALESCE(SUM(CASE WHEN s.status = 'trial' THEN 1 ELSE 0 END), 0) AS trial_count,
				COALESCE(SUM(CASE WHEN s.status = 'past_due' THEN 1 ELSE 0 END), 0) AS past_due_count,
				COALESCE(SUM(CASE WHEN s.status = 'canceled' THEN 1 ELSE 0 END), 0) AS canceled_count,
				COALESCE(SUM(CASE WHEN s.status = 'expired' THEN 1 ELSE 0 END), 0) AS expired_count,
				COALESCE(SUM(CASE WHEN s.plan = 'free' THEN 1 ELSE 0 END), 0) AS free_count,
				COALESCE(SUM(CASE
					WHEN s.plan = 'pro' AND s.status IN ('active', 'past_due') THEN
						CASE
							WHEN s.billing_cycle = 'yearly' THEN (CASE WHEN s.price > 0 THEN s.price ELSE 29000 END) / 12
							ELSE (CASE WHEN s.price > 0 THEN s.price ELSE 29000 END)
						END
					ELSE 0
				END), 0) AS mrr
			FROM subscriptions s
			JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL AND u.role = 'ACCOUNT_OWNER'
		`).Scan(&stats)
		stats.ARR = stats.MRR * 12
	}()

	go func() {
		defer wg.Done()
		var invSums struct {
			Collected int64
			Refunded  int64
			Failed    int64
		}
		s.db.Raw(`
			SELECT
				COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) as collected,
				COALESCE(SUM(CASE WHEN status = 'refunded' THEN total ELSE 0 END), 0) as refunded,
				COALESCE(SUM(CASE WHEN status = 'failed' THEN total ELSE 0 END), 0) as failed
			FROM invoices
		`).Scan(&invSums)

		stats.TotalCollected = invSums.Collected
		stats.TotalRefunded = invSums.Refunded
		stats.FailedAmount = invSums.Failed
	}()

	go func() {
		defer wg.Done()
		s.db.Model(&models.PromoCode{}).Where("is_active = ?", true).Count(&stats.ActivePromosCount)
	}()

	wg.Wait()
	return stats
}

// GetSubscriptionDetail retrieves full subscription, user profile, invoices, and billing audit logs
func (s *SubscriptionManagementService) GetSubscriptionDetail(userID string) (*SubscriptionDetailResult, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ? AND deleted_at IS NULL", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	var sub models.Subscription
	if err := s.db.Where("user_id = ?", userID).First(&sub).Error; err != nil {
		return nil, errors.New("data langganan tidak ditemukan")
	}

	daysRemaining := int(math.Ceil(time.Until(sub.CurrentPeriodEnd).Hours() / 24.0))

	var invoices []models.Invoice
	s.db.Where("user_id = ?", userID).Order("created_at desc").Find(&invoices)

	var logs []models.UserActivityLog
	s.db.Where("user_id = ?", userID).Order("created_at desc").Limit(25).Find(&logs)

	return &SubscriptionDetailResult{
		User:          user,
		Subscription:  sub,
		DaysRemaining: daysRemaining,
		Invoices:      invoices,
		ActivityLogs:  logs,
	}, nil
}

// ChangePlanManual manually upgrades or downgrades a user's plan without Stripe
func (s *SubscriptionManagementService) ChangePlanManual(userID string, dto ChangePlanDTO, actor AdminActor) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	targetPlan := models.PlanType(strings.ToLower(strings.TrimSpace(dto.Plan)))
	if targetPlan != models.PlanPro && targetPlan != models.PlanFree {
		return nil, errors.New("paket harus 'pro' atau 'free'")
	}

	cycle := strings.ToLower(strings.TrimSpace(dto.BillingCycle))
	if cycle != "yearly" {
		cycle = "monthly"
	}

	var updatedSub models.Subscription
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Where("id = ? AND deleted_at IS NULL", userID).First(&user).Error; err != nil {
			return errors.New("pengguna tidak ditemukan")
		}

		var sub models.Subscription
		if err := tx.Where("user_id = ?", userID).First(&sub).Error; err != nil {
			return errors.New("data langganan tidak ditemukan")
		}

		now := time.Now()
		var price int64
		var periodEnd time.Time
		isPro := false

		if targetPlan == models.PlanPro {
			isPro = true
			if cycle == "yearly" {
				price = 290000
				periodEnd = now.AddDate(1, 0, 0)
			} else {
				price = 29000
				periodEnd = now.AddDate(0, 1, 0)
			}
			if dto.CustomPrice != nil && *dto.CustomPrice >= 0 {
				price = *dto.CustomPrice
			}
			sub.Plan = models.PlanPro
			sub.BillingCycle = cycle
			sub.Status = models.SubscriptionStatusActive
			sub.Price = price
			sub.CurrentPeriodStart = now
			sub.CurrentPeriodEnd = periodEnd
			sub.CancelAtPeriodEnd = false
			sub.CanceledAt = nil
			sub.CancellationReason = ""
		} else {
			isPro = false
			sub.Plan = models.PlanFree
			sub.BillingCycle = "monthly"
			sub.Status = models.SubscriptionStatusActive
			sub.Price = 0
			sub.CurrentPeriodStart = now
			sub.CurrentPeriodEnd = now.AddDate(0, 1, 0)
			sub.CancelAtPeriodEnd = false
		}

		if strings.TrimSpace(dto.AdminNotes) != "" {
			sub.AdminNotes = strings.TrimSpace(dto.AdminNotes)
		}
		sub.UpdatedAt = now

		if err := tx.Save(&sub).Error; err != nil {
			return err
		}

		if err := tx.Model(&models.User{}).Where("id = ?", userID).Update("is_pro", isPro).Error; err != nil {
			return err
		}

		// Optionally generate an official invoice record
		if targetPlan == models.PlanPro && dto.GenerateInvoice {
			tax := (price * 11) / 100
			total := price + tax
			planLabel := "Klikin Pro (Bulanan - Manual Admin)"
			if cycle == "yearly" {
				planLabel = "Klikin Pro (Tahunan - Manual Admin)"
			}
			inv := models.Invoice{
				ID:             fmt.Sprintf("inv_adm_%d", now.UnixNano()),
				InvoiceNumber:  fmt.Sprintf("INV-%s-%04d", now.Format("2006"), (now.UnixNano()%9000)+1000),
				UserID:         userID,
				SubscriptionID: sub.ID,
				PlanName:       planLabel,
				BillingCycle:   cycle,
				Amount:         price,
				Tax:            tax,
				Total:          total,
				Status:         "paid",
				BillingReason:  "admin_manual_change",
				PaidAt:         &now,
				CreatedAt:      now,
			}
			if err := tx.Create(&inv).Error; err != nil {
				return err
			}
		}

		// Create in-app notification for tenant
		notifTitle := "Paket Langganan Diperbarui oleh Admin"
		notifMsg := fmt.Sprintf("Paket akun Anda telah diubah secara manual menjadi %s (%s) oleh tim Klikin.", strings.ToUpper(string(targetPlan)), cycle)
		tx.Create(&models.Notification{
			ID:        fmt.Sprintf("notif_plan_%d", now.UnixNano()),
			UserID:    userID,
			Title:     notifTitle,
			Message:   notifMsg,
			Type:      "billing",
			ActionURL: "/owner/billing",
			IsRead:    false,
			CreatedAt: now,
		})

		// Audit Log
		tx.Create(&models.UserActivityLog{
			ID:        fmt.Sprintf("act_plan_%d", now.UnixNano()),
			UserID:    userID,
			Action:    "ADMIN_CHANGE_PLAN",
			Details:   fmt.Sprintf("Super Admin (%s) mengubah paket ke %s (%s). Catatan: %s", actor.Name, strings.ToUpper(string(targetPlan)), cycle, sub.AdminNotes),
			IPAddress: "127.0.0.1",
			UserAgent: "Klikin SuperAdmin Console",
			CreatedAt: now,
		})

		updatedSub = sub
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &updatedSub, nil
}

// ExtendGoodwill manually extends a user's active Pro period as goodwill compensation
func (s *SubscriptionManagementService) ExtendGoodwill(userID string, dto ExtendGoodwillDTO, actor AdminActor) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}
	if dto.Days <= 0 || dto.Days > 730 {
		return nil, errors.New("durasi perpanjangan goodwill harus antara 1 hingga 730 hari")
	}

	reason := strings.TrimSpace(dto.Reason)
	if reason == "" {
		reason = "Perpanjangan goodwill layanan oleh Super Admin"
	}

	var updatedSub models.Subscription
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var sub models.Subscription
		if err := tx.Where("user_id = ?", userID).First(&sub).Error; err != nil {
			return errors.New("data langganan tidak ditemukan")
		}

		now := time.Now()
		baseTime := sub.CurrentPeriodEnd
		if baseTime.Before(now) {
			baseTime = now
		}
		newEnd := baseTime.AddDate(0, 0, dto.Days)

		sub.Plan = models.PlanPro
		if sub.Status != models.SubscriptionStatusTrial {
			sub.Status = models.SubscriptionStatusActive
		} else if sub.TrialEndAt != nil {
			sub.TrialEndAt = &newEnd
		}
		sub.CurrentPeriodEnd = newEnd
		sub.CancelAtPeriodEnd = false
		sub.AdminNotes = fmt.Sprintf("[Goodwill +%d hari] %s", dto.Days, reason)
		sub.UpdatedAt = now

		if err := tx.Save(&sub).Error; err != nil {
			return err
		}

		if err := tx.Model(&models.User{}).Where("id = ?", userID).Update("is_pro", true).Error; err != nil {
			return err
		}

		// Record a Rp 0 Goodwill Invoice for full auditability
		goodwillInv := models.Invoice{
			ID:             fmt.Sprintf("inv_gw_%d", now.UnixNano()),
			InvoiceNumber:  fmt.Sprintf("INV-GW-%04d", (now.UnixNano()%9000)+1000),
			UserID:         userID,
			SubscriptionID: sub.ID,
			PlanName:       fmt.Sprintf("Goodwill Extension (+%d Hari Klikin Pro)", dto.Days),
			BillingCycle:   sub.BillingCycle,
			Amount:         0,
			Tax:            0,
			Total:          0,
			Status:         "paid",
			BillingReason:  "admin_goodwill",
			PaidAt:         &now,
			CreatedAt:      now,
		}
		tx.Create(&goodwillInv)

		tx.Create(&models.Notification{
			ID:        fmt.Sprintf("notif_gw_%d", now.UnixNano()),
			UserID:    userID,
			Title:     fmt.Sprintf("Bonus Perpanjangan Klikin Pro +%d Hari", dto.Days),
			Message:   fmt.Sprintf("Masa aktif Klikin Pro Anda telah diperpanjang selama %d hari hingga %s. Catatan: %s", dto.Days, newEnd.Format("02 Jan 2006"), reason),
			Type:      "billing",
			ActionURL: "/owner/billing",
			IsRead:    false,
			CreatedAt: now,
		})

		tx.Create(&models.UserActivityLog{
			ID:        fmt.Sprintf("act_gw_%d", now.UnixNano()),
			UserID:    userID,
			Action:    "ADMIN_GOODWILL_EXTEND",
			Details:   fmt.Sprintf("Super Admin (%s) memberikan perpanjangan goodwill +%d hari hingga %s. Alasan: %s", actor.Name, dto.Days, newEnd.Format("2006-01-02"), reason),
			IPAddress: "127.0.0.1",
			UserAgent: "Klikin SuperAdmin Console",
			CreatedAt: now,
		})

		updatedSub = sub
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &updatedSub, nil
}

// ManageTrial handles starting, extending, shortening, or converting a trial to a paid Pro subscription
func (s *SubscriptionManagementService) ManageTrial(userID string, dto ManageTrialDTO, actor AdminActor) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	action := strings.ToLower(strings.TrimSpace(dto.Action))
	if dto.Days <= 0 {
		dto.Days = 7
	}

	var updatedSub models.Subscription
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var sub models.Subscription
		if err := tx.Where("user_id = ?", userID).First(&sub).Error; err != nil {
			return errors.New("data langganan tidak ditemukan")
		}

		now := time.Now()
		var logDetails string
		var notifMessage string

		switch action {
		case "start":
			trialEnd := now.AddDate(0, 0, dto.Days)
			sub.Plan = models.PlanPro
			sub.Status = models.SubscriptionStatusTrial
			sub.TrialStartAt = &now
			sub.TrialEndAt = &trialEnd
			sub.CurrentPeriodStart = now
			sub.CurrentPeriodEnd = trialEnd
			sub.CancelAtPeriodEnd = false
			logDetails = fmt.Sprintf("Super Admin (%s) mengaktifkan masa Trial Pro selama %d hari hingga %s", actor.Name, dto.Days, trialEnd.Format("2006-01-02"))
			notifMessage = fmt.Sprintf("Masa uji coba (Trial) Klikin Pro selama %d hari telah diaktifkan untuk akun Anda hingga %s.", dto.Days, trialEnd.Format("02 Jan 2006"))

		case "extend":
			baseEnd := sub.CurrentPeriodEnd
			if baseEnd.Before(now) {
				baseEnd = now
			}
			newEnd := baseEnd.AddDate(0, 0, dto.Days)
			sub.Plan = models.PlanPro
			sub.Status = models.SubscriptionStatusTrial
			if sub.TrialStartAt == nil {
				sub.TrialStartAt = &now
			}
			sub.TrialEndAt = &newEnd
			sub.CurrentPeriodEnd = newEnd
			logDetails = fmt.Sprintf("Super Admin (%s) memperpanjang masa Trial +%d hari hingga %s", actor.Name, dto.Days, newEnd.Format("2006-01-02"))
			notifMessage = fmt.Sprintf("Masa Trial Klikin Pro Anda telah diperpanjang %d hari hingga %s.", dto.Days, newEnd.Format("02 Jan 2006"))

		case "shorten":
			baseEnd := sub.CurrentPeriodEnd
			newEnd := baseEnd.AddDate(0, 0, -dto.Days)
			if newEnd.Before(now.Add(1 * time.Hour)) {
				newEnd = now.Add(24 * time.Hour)
			}
			sub.Status = models.SubscriptionStatusTrial
			sub.TrialEndAt = &newEnd
			sub.CurrentPeriodEnd = newEnd
			logDetails = fmt.Sprintf("Super Admin (%s) mempersingkat masa Trial -%d hari menjadi berakhir pada %s", actor.Name, dto.Days, newEnd.Format("2006-01-02"))
			notifMessage = fmt.Sprintf("Periode masa Trial Klikin Pro Anda diperbarui dan akan berakhir pada %s.", newEnd.Format("02 Jan 2006"))

		case "convert_to_paid":
			cycle := strings.ToLower(strings.TrimSpace(dto.BillingCycle))
			var price int64 = 29000
			var periodEnd time.Time = now.AddDate(0, 1, 0)
			planLabel := "Klikin Pro (Bulanan - Konversi Trial)"
			if cycle == "yearly" {
				price = 290000
				periodEnd = now.AddDate(1, 0, 0)
				planLabel = "Klikin Pro (Tahunan - Konversi Trial)"
			} else {
				cycle = "monthly"
			}

			sub.Plan = models.PlanPro
			sub.BillingCycle = cycle
			sub.Status = models.SubscriptionStatusActive
			sub.Price = price
			sub.CurrentPeriodStart = now
			sub.CurrentPeriodEnd = periodEnd
			sub.CancelAtPeriodEnd = false

			tax := (price * 11) / 100
			inv := models.Invoice{
				ID:             fmt.Sprintf("inv_conv_%d", now.UnixNano()),
				InvoiceNumber:  fmt.Sprintf("INV-%s-%04d", now.Format("2006"), (now.UnixNano()%9000)+1000),
				UserID:         userID,
				SubscriptionID: sub.ID,
				PlanName:       planLabel,
				BillingCycle:   cycle,
				Amount:         price,
				Tax:            tax,
				Total:          price + tax,
				Status:         "paid",
				BillingReason:  "trial_conversion",
				PaidAt:         &now,
				CreatedAt:      now,
			}
			if err := tx.Create(&inv).Error; err != nil {
				return err
			}
			logDetails = fmt.Sprintf("Super Admin (%s) mengonversi akun Trial ke langganan berbayar Pro (%s)", actor.Name, cycle)
			notifMessage = fmt.Sprintf("Selamat! Masa Trial Anda telah dikonversi menjadi langganan penuh Klikin Pro (%s).", cycle)

		default:
			return errors.New("aksi trial tidak valid (gunakan: start, extend, shorten, atau convert_to_paid)")
		}

		if strings.TrimSpace(dto.Reason) != "" {
			sub.AdminNotes = strings.TrimSpace(dto.Reason)
		}
		sub.UpdatedAt = now

		if err := tx.Save(&sub).Error; err != nil {
			return err
		}

		if err := tx.Model(&models.User{}).Where("id = ?", userID).Update("is_pro", true).Error; err != nil {
			return err
		}

		tx.Create(&models.Notification{
			ID:        fmt.Sprintf("notif_trl_%d", now.UnixNano()),
			UserID:    userID,
			Title:     "Pembaruan Status Trial Klikin Pro",
			Message:   notifMessage,
			Type:      "billing",
			ActionURL: "/owner/billing",
			IsRead:    false,
			CreatedAt: now,
		})

		tx.Create(&models.UserActivityLog{
			ID:        fmt.Sprintf("act_trl_%d", now.UnixNano()),
			UserID:    userID,
			Action:    "ADMIN_MANAGE_TRIAL",
			Details:   logDetails,
			IPAddress: "127.0.0.1",
			UserAgent: "Klikin SuperAdmin Console",
			CreatedAt: now,
		})

		updatedSub = sub
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &updatedSub, nil
}

// CancelSubscription cancels a user's subscription either immediately or at the end of the billing period
func (s *SubscriptionManagementService) CancelSubscription(userID string, dto CancelSubscriptionDTO, actor AdminActor) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	reason := strings.TrimSpace(dto.Reason)
	if reason == "" {
		reason = "Dibatalkan oleh Super Admin"
	}

	var updatedSub models.Subscription
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var sub models.Subscription
		if err := tx.Where("user_id = ?", userID).First(&sub).Error; err != nil {
			return errors.New("data langganan tidak ditemukan")
		}

		now := time.Now()
		sub.CanceledAt = &now
		sub.CancellationReason = reason
		sub.Status = models.SubscriptionStatusCanceled
		sub.UpdatedAt = now

		if dto.Immediate {
			sub.Plan = models.PlanFree
			sub.Price = 0
			sub.CurrentPeriodEnd = now
			sub.CancelAtPeriodEnd = false
			if err := tx.Model(&models.User{}).Where("id = ?", userID).Update("is_pro", false).Error; err != nil {
				return err
			}
		} else {
			sub.CancelAtPeriodEnd = true
		}

		if err := tx.Save(&sub).Error; err != nil {
			return err
		}

		modeText := "pada akhir periode aktif"
		if dto.Immediate {
			modeText = "secara langsung (segera)"
		}

		tx.Create(&models.Notification{
			ID:        fmt.Sprintf("notif_cancel_%d", now.UnixNano()),
			UserID:    userID,
			Title:     "Langganan Dibatalkan",
			Message:   fmt.Sprintf("Langganan Klikin Pro Anda telah dibatalkan %s. Alasan: %s", modeText, reason),
			Type:      "billing",
			ActionURL: "/owner/billing",
			IsRead:    false,
			CreatedAt: now,
		})

		tx.Create(&models.UserActivityLog{
			ID:        fmt.Sprintf("act_cancel_%d", now.UnixNano()),
			UserID:    userID,
			Action:    "ADMIN_CANCEL_SUBSCRIPTION",
			Details:   fmt.Sprintf("Super Admin (%s) membatalkan langganan %s. Alasan: %s", actor.Name, modeText, reason),
			IPAddress: "127.0.0.1",
			UserAgent: "Klikin SuperAdmin Console",
			CreatedAt: now,
		})

		updatedSub = sub
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &updatedSub, nil
}

// ListAllInvoices returns paginated invoices across all platform users with search & status filters
func (s *SubscriptionManagementService) ListAllInvoices(search, status string, page, limit int) (*InvoiceListResult, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 15
	}

	tx := s.db.Table("invoices i").
		Joins("LEFT JOIN users u ON u.id = i.user_id")

	if strings.TrimSpace(search) != "" {
		q := "%" + strings.ToLower(strings.TrimSpace(search)) + "%"
		tx = tx.Where("LOWER(i.invoice_number) LIKE ? OR LOWER(u.full_name) LIKE ? OR LOWER(u.username) LIKE ? OR LOWER(u.email) LIKE ?", q, q, q, q)
	}

	if status != "" && strings.ToLower(status) != "all" {
		tx = tx.Where("LOWER(i.status) = ?", strings.ToLower(status))
	}

	var totalItems int64
	tx.Count(&totalItems)

	offset := (page - 1) * limit
	var rows []InvoiceWithUserDTO
	if err := tx.Select("i.*, COALESCE(u.full_name, u.username, 'Tenant') as user_full_name, COALESCE(u.username, '') as username, COALESCE(u.email, '') as user_email").
		Order("i.created_at desc").Offset(offset).Limit(limit).Scan(&rows).Error; err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))
	if totalPages < 1 {
		totalPages = 1
	}

	return &InvoiceListResult{
		Invoices: rows,
		Pagination: PaginationMeta{
			CurrentPage: page,
			Limit:       limit,
			TotalItems:  totalItems,
			TotalPages:  totalPages,
		},
	}, nil
}

// ProcessRefund processes an invoice refund and optionally downgrades the user to Free
func (s *SubscriptionManagementService) ProcessRefund(invoiceID string, dto RefundInvoiceDTO, actor AdminActor) (*models.Invoice, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	reason := strings.TrimSpace(dto.Reason)
	if reason == "" {
		reason = "Pengembalian dana (Refund) disetujui oleh Super Admin"
	}

	var refundedInv models.Invoice
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var inv models.Invoice
		if err := tx.Where("id = ?", invoiceID).First(&inv).Error; err != nil {
			return errors.New("invoice tidak ditemukan")
		}

		if inv.Status == "refunded" {
			return errors.New("invoice ini sudah pernah di-refund sebelumnya")
		}

		now := time.Now()
		inv.Status = "refunded"
		inv.RefundedAt = &now
		inv.RefundReason = reason

		if err := tx.Save(&inv).Error; err != nil {
			return err
		}

		if dto.DowngradeToFree {
			tx.Model(&models.Subscription{}).Where("user_id = ?", inv.UserID).Updates(map[string]interface{}{
				"plan":                models.PlanFree,
				"status":              models.SubscriptionStatusCanceled,
				"price":               0,
				"canceled_at":         &now,
				"cancellation_reason": "Refund invoice " + inv.InvoiceNumber + ": " + reason,
				"updated_at":          now,
			})
			tx.Model(&models.User{}).Where("id = ?", inv.UserID).Update("is_pro", false)
		}

		var user models.User
		tx.Where("id = ?", inv.UserID).First(&user)

		tx.Create(&models.Notification{
			ID:        fmt.Sprintf("notif_ref_%d", now.UnixNano()),
			UserID:    inv.UserID,
			Title:     fmt.Sprintf("Refund Diproses: %s", inv.InvoiceNumber),
			Message:   fmt.Sprintf("Pengembalian dana sebesar Rp %d untuk invoice %s telah berhasil diproses. Alasan: %s", inv.Total, inv.InvoiceNumber, reason),
			Type:      "billing",
			ActionURL: "/owner/billing",
			IsRead:    false,
			CreatedAt: now,
		})

		if user.Email != "" {
			tx.Create(&models.TransactionalEmailLog{
				ID:        fmt.Sprintf("eml_ref_%d", now.UnixNano()),
				UserID:    inv.UserID,
				Subject:   fmt.Sprintf("Konfirmasi Pengembalian Dana (Refund) #%s", inv.InvoiceNumber),
				Recipient: user.Email,
				Category:  "billing",
				Status:    "delivered",
				SentAt:    now,
			})
		}

		tx.Create(&models.UserActivityLog{
			ID:        fmt.Sprintf("act_ref_%d", now.UnixNano()),
			UserID:    inv.UserID,
			Action:    "ADMIN_REFUND_INVOICE",
			Details:   fmt.Sprintf("Super Admin (%s) memproses refund invoice %s (Rp %d). Alasan: %s", actor.Name, inv.InvoiceNumber, inv.Total, reason),
			IPAddress: "127.0.0.1",
			UserAgent: "Klikin SuperAdmin Console",
			CreatedAt: now,
		})

		refundedInv = inv
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &refundedInv, nil
}

// ListPromoCodes returns all promo codes with computed usage and expiry flags
func (s *SubscriptionManagementService) ListPromoCodes() ([]PromoCodeItemDTO, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var promos []models.PromoCode
	if err := s.db.Order("created_at desc").Find(&promos).Error; err != nil {
		return nil, err
	}

	now := time.Now()
	items := make([]PromoCodeItemDTO, 0, len(promos))
	for _, p := range promos {
		pct := 0.0
		if p.MaxUses > 0 {
			pct = math.Round((float64(p.UsedCount)/float64(p.MaxUses))*1000) / 10
			if pct > 100 {
				pct = 100
			}
		}
		expired := p.ExpiresAt != nil && now.After(*p.ExpiresAt)
		items = append(items, PromoCodeItemDTO{
			PromoCode:       p,
			UsagePercentage: pct,
			IsExpired:       expired,
		})
	}
	return items, nil
}

// CreatePromoCode creates a new discount coupon in PostgreSQL
func (s *SubscriptionManagementService) CreatePromoCode(dto SavePromoCodeDTO, actor AdminActor) (*models.PromoCode, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	code := strings.ToUpper(strings.TrimSpace(dto.Code))
	if code == "" {
		return nil, errors.New("kode kupon wajib diisi")
	}
	if dto.DiscountPercent < 1 || dto.DiscountPercent > 100 {
		return nil, errors.New("persentase diskon harus antara 1% hingga 100%")
	}
	if dto.MaxUses <= 0 {
		dto.MaxUses = 100
	}

	var existing int64
	s.db.Model(&models.PromoCode{}).Where("UPPER(code) = ?", code).Count(&existing)
	if existing > 0 {
		return nil, errors.New("kode kupon tersebut sudah terdaftar")
	}

	isActive := true
	if dto.IsActive != nil {
		isActive = *dto.IsActive
	}

	var expiresAt *time.Time
	if strings.TrimSpace(dto.ExpiresAt) != "" {
		if parsed, err := time.Parse("2006-01-02", strings.TrimSpace(dto.ExpiresAt)); err == nil {
			endOfDay := parsed.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			expiresAt = &endOfDay
		}
	}

	promo := models.PromoCode{
		ID:              fmt.Sprintf("promo_%d", time.Now().UnixNano()),
		Code:            code,
		DiscountPercent: dto.DiscountPercent,
		Description:     strings.TrimSpace(dto.Description),
		MaxUses:         dto.MaxUses,
		UsedCount:       0,
		IsActive:        isActive,
		ExpiresAt:       expiresAt,
		CreatedAt:       time.Now(),
	}

	if err := s.db.Create(&promo).Error; err != nil {
		return nil, err
	}
	return &promo, nil
}

// UpdatePromoCode updates an existing discount coupon
func (s *SubscriptionManagementService) UpdatePromoCode(promoID string, dto SavePromoCodeDTO, actor AdminActor) (*models.PromoCode, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var promo models.PromoCode
	if err := s.db.Where("id = ?", promoID).First(&promo).Error; err != nil {
		return nil, errors.New("kupon promo tidak ditemukan")
	}

	if strings.TrimSpace(dto.Code) != "" {
		promo.Code = strings.ToUpper(strings.TrimSpace(dto.Code))
	}
	if dto.DiscountPercent >= 1 && dto.DiscountPercent <= 100 {
		promo.DiscountPercent = dto.DiscountPercent
	}
	if strings.TrimSpace(dto.Description) != "" {
		promo.Description = strings.TrimSpace(dto.Description)
	}
	if dto.MaxUses > 0 {
		promo.MaxUses = dto.MaxUses
	}
	if dto.IsActive != nil {
		promo.IsActive = *dto.IsActive
	}
	if strings.TrimSpace(dto.ExpiresAt) != "" {
		if parsed, err := time.Parse("2006-01-02", strings.TrimSpace(dto.ExpiresAt)); err == nil {
			endOfDay := parsed.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			promo.ExpiresAt = &endOfDay
		}
	}

	if err := s.db.Save(&promo).Error; err != nil {
		return nil, err
	}
	return &promo, nil
}

// DeletePromoCode deletes a promo code by ID
func (s *SubscriptionManagementService) DeletePromoCode(promoID string, actor AdminActor) error {
	if s.db == nil {
		return errors.New("database not available")
	}
	return s.db.Where("id = ?", promoID).Delete(&models.PromoCode{}).Error
}

// GetDunningQueue returns all past-due subscriptions and failed-payment accounts
func (s *SubscriptionManagementService) GetDunningQueue() (*DunningQueueResult, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	type dunningRow struct {
		models.Subscription
		FullName    string
		Username    string
		Email       string
		PhoneNumber string
	}

	var rows []dunningRow
	err := s.db.Table("subscriptions s").
		Joins("JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL").
		Where("s.status = 'past_due' OR EXISTS (SELECT 1 FROM invoices i WHERE i.user_id = s.user_id AND i.status = 'failed')").
		Select("s.*, u.full_name, u.username, u.email, u.phone_number").
		Order("s.current_period_end asc").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	now := time.Now()
	items := make([]DunningItemDTO, 0, len(rows))
	var totalAtRisk int64
	var totalReminders int

	for _, r := range rows {
		var failedInv models.Invoice
		hasFailedInv := s.db.Where("user_id = ? AND status = 'failed'", r.UserID).Order("created_at desc").First(&failedInv).Error == nil

		overdueAmt := r.Price
		failedInvID := ""
		failedInvNum := "AUTO-RENEW-PENDING"
		failedAt := r.CurrentPeriodEnd

		if hasFailedInv {
			overdueAmt = failedInv.Total
			failedInvID = failedInv.ID
			failedInvNum = failedInv.InvoiceNumber
			failedAt = failedInv.CreatedAt
		} else if overdueAmt <= 0 {
			overdueAmt = 32190
		}

		daysOverdue := int(math.Max(1, math.Ceil(now.Sub(failedAt).Hours()/24.0)))
		totalAtRisk += overdueAmt
		totalReminders += r.DunningReminderCount

		items = append(items, DunningItemDTO{
			SubscriptionID:       r.ID,
			UserID:               r.UserID,
			FullName:             r.FullName,
			Username:             r.Username,
			Email:                r.Email,
			PhoneNumber:          r.PhoneNumber,
			Plan:                 string(r.Plan),
			BillingCycle:         r.BillingCycle,
			Status:               string(r.Status),
			OverdueAmount:        overdueAmt,
			FailedInvoiceID:      failedInvID,
			FailedInvoiceNumber:  failedInvNum,
			FailedAt:             failedAt,
			DaysOverdue:          daysOverdue,
			PaymentMethodBrand:   r.PaymentMethodBrand,
			PaymentMethodLast4:   r.PaymentMethodLast4,
			DunningReminderCount: r.DunningReminderCount,
			LastReminderSentAt:   r.LastReminderSentAt,
		})
	}

	return &DunningQueueResult{
		Items:              items,
		TotalOverdueCount:  len(items),
		TotalAtRiskRevenue: totalAtRisk,
		TotalRemindersSent: totalReminders,
	}, nil
}

// SendDunningReminder sends a manual payment reminder to a specific overdue user
func (s *SubscriptionManagementService) SendDunningReminder(userID string, customMessage string, actor AdminActor) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
			return errors.New("pengguna tidak ditemukan")
		}

		var sub models.Subscription
		if err := tx.Where("user_id = ?", userID).First(&sub).Error; err != nil {
			return errors.New("langganan tidak ditemukan")
		}

		now := time.Now()
		sub.DunningReminderCount += 1
		sub.LastReminderSentAt = &now
		sub.UpdatedAt = now
		if err := tx.Save(&sub).Error; err != nil {
			return err
		}

		msg := strings.TrimSpace(customMessage)
		if msg == "" {
			msg = fmt.Sprintf("Halo %s, pembayaran perpanjangan Klikin Pro Anda tertunda. Mohon perbarui metode pembayaran Anda agar layanan domain kustom dan analitik Pro tetap berjalan tanpa gangguan.", user.FullName)
		}

		tx.Create(&models.Notification{
			ID:        fmt.Sprintf("notif_dun_%d", now.UnixNano()),
			UserID:    userID,
			Title:     "Pengingat Pembayaran Langganan Klikin Pro",
			Message:   msg,
			Type:      "billing",
			ActionURL: "/owner/billing",
			IsRead:    false,
			CreatedAt: now,
		})

		tx.Create(&models.TransactionalEmailLog{
			ID:        fmt.Sprintf("eml_dun_%d", now.UnixNano()),
			UserID:    userID,
			Subject:   fmt.Sprintf("[Penting] Pengingat Pembayaran Langganan Klikin Pro Ke-%d", sub.DunningReminderCount),
			Recipient: user.Email,
			Category:  "billing",
			Status:    "delivered",
			SentAt:    now,
		})

		tx.Create(&models.UserActivityLog{
			ID:        fmt.Sprintf("act_dun_%d", now.UnixNano()),
			UserID:    userID,
			Action:    "ADMIN_DUNNING_REMINDER",
			Details:   fmt.Sprintf("Super Admin (%s) mengirimkan dunning reminder ke-%d ke %s", actor.Name, sub.DunningReminderCount, user.Email),
			IPAddress: "127.0.0.1",
			UserAgent: "Klikin SuperAdmin Console",
			CreatedAt: now,
		})

		return nil
	})
}

// SendBulkDunningReminders sends reminders to all accounts in the dunning queue
func (s *SubscriptionManagementService) SendBulkDunningReminders(actor AdminActor) (int, error) {
	queue, err := s.GetDunningQueue()
	if err != nil {
		return 0, err
	}

	sentCount := 0
	for _, item := range queue.Items {
		if err := s.SendDunningReminder(item.UserID, "", actor); err == nil {
			sentCount++
		}
	}
	return sentCount, nil
}

// ResolveDunningManual marks overdue/failed invoices as paid and restores subscription to Active
func (s *SubscriptionManagementService) ResolveDunningManual(userID string, actor AdminActor) (*models.Subscription, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var updatedSub models.Subscription
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var sub models.Subscription
		if err := tx.Where("user_id = ?", userID).First(&sub).Error; err != nil {
			return errors.New("langganan tidak ditemukan")
		}

		now := time.Now()
		periodEnd := now.AddDate(0, 1, 0)
		if sub.BillingCycle == "yearly" {
			periodEnd = now.AddDate(1, 0, 0)
		}

		sub.Status = models.SubscriptionStatusActive
		sub.Plan = models.PlanPro
		sub.CurrentPeriodStart = now
		sub.CurrentPeriodEnd = periodEnd
		sub.CancelAtPeriodEnd = false
		sub.UpdatedAt = now
		if err := tx.Save(&sub).Error; err != nil {
			return err
		}

		tx.Model(&models.User{}).Where("id = ?", userID).Update("is_pro", true)

		// Mark any failed invoices as paid
		tx.Model(&models.Invoice{}).Where("user_id = ? AND status = 'failed'", userID).Updates(map[string]interface{}{
			"status":  "paid",
			"paid_at": &now,
		})

		tx.Create(&models.Notification{
			ID:        fmt.Sprintf("notif_res_%d", now.UnixNano()),
			UserID:    userID,
			Title:     "Pembayaran Terkonfirmasi — Klikin Pro Aktif Kembali",
			Message:   "Terima kasih! Pembayaran tunggakan Anda telah dikonfirmasi dan langganan Klikin Pro Anda kini aktif kembali.",
			Type:      "billing",
			ActionURL: "/owner/billing",
			IsRead:    false,
			CreatedAt: now,
		})

		tx.Create(&models.UserActivityLog{
			ID:        fmt.Sprintf("act_res_%d", now.UnixNano()),
			UserID:    userID,
			Action:    "ADMIN_RESOLVE_DUNNING",
			Details:   fmt.Sprintf("Super Admin (%s) mengonfirmasi pelunasan tunggakan manual dan mengaktifkan kembali langganan Pro", actor.Name),
			IPAddress: "127.0.0.1",
			UserAgent: "Klikin SuperAdmin Console",
			CreatedAt: now,
		})

		updatedSub = sub
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &updatedSub, nil
}

// ExportSubscriptionsCSV generates an RFC 4180 CSV spreadsheet of all tenant subscriptions
func (s *SubscriptionManagementService) ExportSubscriptionsCSV() ([]byte, error) {
	result, err := s.ListSubscriptions(SubscriptionFilterParams{
		Page:  1,
		Limit: 1000,
	})
	if err != nil {
		return nil, err
	}

	buf := new(bytes.Buffer)
	writer := csv.NewWriter(buf)

	writer.Write([]string{
		"ID Langganan",
		"ID Pengguna",
		"Nama Tenant",
		"Username",
		"Email",
		"Paket",
		"Siklus Tagihan",
		"Status Langganan",
		"Harga (IDR)",
		"Kode Promo",
		"Diskon (%)",
		"Mulai Periode",
		"Akhir Periode",
		"Sisa Hari",
		"Metode Pembayaran",
		"Jumlah Invoice",
		"Total Terbayar (IDR)",
		"Catatan Admin",
	})

	for _, item := range result.Subscriptions {
		writer.Write([]string{
			item.SubscriptionID,
			item.UserID,
			item.FullName,
			item.Username,
			item.Email,
			strings.ToUpper(string(item.Plan)),
			item.BillingCycle,
			string(item.Status),
			fmt.Sprintf("%d", item.Price),
			item.AppliedPromoCode,
			fmt.Sprintf("%d", item.DiscountPercent),
			item.CurrentPeriodStart.Format("2006-01-02"),
			item.CurrentPeriodEnd.Format("2006-01-02"),
			fmt.Sprintf("%d", item.DaysRemaining),
			fmt.Sprintf("%s •••• %s", strings.ToUpper(item.PaymentMethodBrand), item.PaymentMethodLast4),
			fmt.Sprintf("%d", item.InvoiceCount),
			fmt.Sprintf("%d", item.TotalPaid),
			item.AdminNotes,
		})
	}

	writer.Flush()
	return buf.Bytes(), nil
}
