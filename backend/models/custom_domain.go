package models

import "time"

type DomainStatus string

const (
	DomainStatusPending   DomainStatus = "pending"
	DomainStatusVerifying DomainStatus = "verifying"
	DomainStatusActive    DomainStatus = "active"
	DomainStatusError     DomainStatus = "error"
)

type SSLStatus string

const (
	SSLStatusProvisioning SSLStatus = "provisioning"
	SSLStatusActive       SSLStatus = "active"
	SSLStatusFailed       SSLStatus = "failed"
)

type CustomDomain struct {
	ID                string       `gorm:"primaryKey;type:varchar(64)" json:"id"`
	PageID            string       `gorm:"index;type:varchar(64);not null" json:"page_id"`
	UserID            string       `gorm:"index;type:varchar(64);not null" json:"user_id"`
	Domain            string       `gorm:"uniqueIndex;type:varchar(255);not null" json:"domain"`
	Status            DomainStatus `gorm:"type:varchar(32);default:'pending'" json:"status"`
	SSLStatus         SSLStatus    `gorm:"type:varchar(32);default:'provisioning'" json:"ssl_status"`
	VerificationToken string       `gorm:"type:varchar(64);not null" json:"verification_token"`
	CNAMETarget       string       `gorm:"type:varchar(255);default:'cname.klikin.id'" json:"cname_target"`
	TXTRecordName     string       `gorm:"type:varchar(255);not null" json:"txt_record_name"`
	RedirectWWW       bool         `gorm:"default:true" json:"redirect_www"`
	FallbackSubdomain bool         `gorm:"default:true" json:"fallback_subdomain"`
	LastCheckedAt     *time.Time   `json:"last_checked_at,omitempty"`
	ErrorMessage      string       `gorm:"type:text" json:"error_message,omitempty"`
	CreatedAt         time.Time    `json:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at"`
}
