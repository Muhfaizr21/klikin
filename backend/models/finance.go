package models

import "time"

// ExpenseCategory defines categories for infrastructure and operational expenses
type ExpenseCategory string

const (
	ExpenseCategoryServerVPS     ExpenseCategory = "server_vps"
	ExpenseCategoryDatabase      ExpenseCategory = "database"
	ExpenseCategoryDomainDNS     ExpenseCategory = "domain_dns"
	ExpenseCategoryPaymentFee    ExpenseCategory = "payment_fee"
	ExpenseCategoryEmailSMTP     ExpenseCategory = "email_smtp"
	ExpenseCategorySecuritySSL   ExpenseCategory = "security_ssl"
	ExpenseCategoryThirdPartyAPI ExpenseCategory = "third_party_api"
	ExpenseCategoryOther         ExpenseCategory = "other"
)

// InfrastructureCost stores monthly or recurring infrastructure and operational expenses
type InfrastructureCost struct {
	ID           string          `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Category     ExpenseCategory `gorm:"type:varchar(32);index;not null" json:"category"`
	Title        string          `gorm:"type:varchar(128);not null" json:"title"`
	Vendor       string          `gorm:"type:varchar(64);not null" json:"vendor"`
	Amount       int64           `gorm:"not null" json:"amount"` // in IDR
	BillingCycle string          `gorm:"type:varchar(16);default:'monthly'" json:"billing_cycle"` // "monthly", "yearly", "one_off"
	MonthPeriod  string          `gorm:"type:varchar(10);index;not null" json:"month_period"` // format YYYY-MM, e.g. "2026-10"
	IncurredDate time.Time       `gorm:"not null" json:"incurred_date"`
	ReceiptURL   string          `gorm:"type:varchar(255)" json:"receipt_url,omitempty"`
	Notes        string          `gorm:"type:text" json:"notes,omitempty"`
	CreatedBy    string          `gorm:"type:varchar(64)" json:"created_by"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

// FinancialAuditLog records audit trail for financial events and administrative updates
type FinancialAuditLog struct {
	ID        string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	AdminID   string    `gorm:"type:varchar(64);not null" json:"admin_id"`
	AdminName string    `gorm:"type:varchar(128)" json:"admin_name"`
	Action    string    `gorm:"type:varchar(64);not null" json:"action"` // "CREATE_EXPENSE", "UPDATE_EXPENSE", "DELETE_EXPENSE", "MANUAL_INVOICE", "REFUND_PROCESSED"
	Target    string    `gorm:"type:varchar(128)" json:"target"`
	Amount    int64     `json:"amount"`
	Details   string    `gorm:"type:text" json:"details"`
	IPAddress string    `gorm:"type:varchar(45)" json:"ip_address"`
	CreatedAt time.Time `json:"created_at"`
}
