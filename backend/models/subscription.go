package models

import "time"

// SubscriptionStatus represents the lifecycle of a subscription
type SubscriptionStatus string

const (
	SubscriptionStatusActive   SubscriptionStatus = "active"
	SubscriptionStatusTrial    SubscriptionStatus = "trial"
	SubscriptionStatusPastDue  SubscriptionStatus = "past_due"
	SubscriptionStatusCanceled SubscriptionStatus = "canceled"
)

// PlanType represents the tier
type PlanType string

const (
	PlanFree PlanType = "free"
	PlanPro  PlanType = "pro"
)

// Subscription stores the user's active billing relationship
type Subscription struct {
	ID                   string             `gorm:"primaryKey;type:varchar(64)" json:"id"`
	UserID               string             `gorm:"uniqueIndex;type:varchar(64);not null" json:"user_id"`
	Plan                 PlanType           `gorm:"type:varchar(32);default:'free'" json:"plan"`
	BillingCycle         string             `gorm:"type:varchar(16);default:'monthly'" json:"billing_cycle"` // "monthly" | "yearly"
	Status               SubscriptionStatus `gorm:"type:varchar(32);default:'active'" json:"status"`        // "active", "trial", "past_due", "canceled"
	Price                int64              `gorm:"default:0" json:"price"`                                 // in IDR
	Currency             string             `gorm:"type:varchar(8);default:'IDR'" json:"currency"`
	TrialStartAt         *time.Time         `json:"trial_start_at,omitempty"`
	TrialEndAt           *time.Time         `json:"trial_end_at,omitempty"`
	CurrentPeriodStart   time.Time          `json:"current_period_start"`
	CurrentPeriodEnd     time.Time          `json:"current_period_end"`
	CancelAtPeriodEnd    bool               `gorm:"default:false" json:"cancel_at_period_end"`
	CanceledAt           *time.Time         `json:"canceled_at,omitempty"`
	CancellationReason   string             `gorm:"type:text" json:"cancellation_reason,omitempty"`
	PaymentMethodBrand   string             `gorm:"type:varchar(32);default:'mastercard'" json:"payment_method_brand"`
	PaymentMethodLast4   string             `gorm:"type:varchar(8);default:'4242'" json:"payment_method_last4"`
	PaymentMethodExp     string             `gorm:"type:varchar(16);default:'12/28'" json:"payment_method_exp"`
	StripeCustomerID     string             `gorm:"type:varchar(128)" json:"stripe_customer_id,omitempty"`
	StripeSubscriptionID string             `gorm:"type:varchar(128)" json:"stripe_subscription_id,omitempty"`
	AppliedPromoCode     string             `gorm:"type:varchar(64)" json:"applied_promo_code,omitempty"`
	DiscountPercent      int                `gorm:"default:0" json:"discount_percent"`
	CreatedAt            time.Time          `json:"created_at"`
	UpdatedAt            time.Time          `json:"updated_at"`
}

// Invoice represents billing receipts
type Invoice struct {
	ID             string     `gorm:"primaryKey;type:varchar(64)" json:"id"`
	InvoiceNumber  string     `gorm:"uniqueIndex;type:varchar(64);not null" json:"invoice_number"`
	UserID         string     `gorm:"index;type:varchar(64);not null" json:"user_id"`
	SubscriptionID string     `gorm:"index;type:varchar(64)" json:"subscription_id"`
	PlanName       string     `gorm:"type:varchar(64)" json:"plan_name"`
	BillingCycle   string     `gorm:"type:varchar(16)" json:"billing_cycle"`
	Amount         int64      `json:"amount"` // Subtotal
	Tax            int64      `json:"tax"`    // PPN 11%
	Total          int64      `json:"total"`  // Total with tax and discount
	Status         string     `gorm:"type:varchar(32);default:'paid'" json:"status"` // "paid" | "pending" | "failed"
	BillingReason  string     `gorm:"type:varchar(64)" json:"billing_reason"`       // "subscription_cycle", "upgrade", "new"
	PaidAt         *time.Time `json:"paid_at,omitempty"`
	PDFURL         string     `json:"pdf_url,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

// PromoCode stores discount vouchers
type PromoCode struct {
	ID              string     `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Code            string     `gorm:"uniqueIndex;type:varchar(64);not null" json:"code"`
	DiscountPercent int        `gorm:"not null" json:"discount_percent"`
	Description     string     `gorm:"type:varchar(255)" json:"description"`
	MaxUses         int        `gorm:"default:100" json:"max_uses"`
	UsedCount       int        `gorm:"default:0" json:"used_count"`
	IsActive        bool       `gorm:"default:true" json:"is_active"`
	ExpiresAt       *time.Time `json:"expires_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}
