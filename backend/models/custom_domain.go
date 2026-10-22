package models

import "time"

type DomainStatus string

const (
	DomainStatusPending   DomainStatus = "pending"
	DomainStatusVerifying DomainStatus = "verifying"
	DomainStatusActive    DomainStatus = "active"
	DomainStatusError     DomainStatus = "error"
	DomainStatusExpired   DomainStatus = "expired"
)

type SSLStatus string

const (
	SSLStatusProvisioning SSLStatus = "provisioning"
	SSLStatusActive       SSLStatus = "active"
	SSLStatusFailed       SSLStatus = "failed"
	SSLStatusExpired      SSLStatus = "expired"
)

type CustomDomain struct {
	ID                string       `gorm:"primaryKey;type:varchar(64)" json:"id"`
	PageID            string       `gorm:"index;type:varchar(64);not null" json:"page_id"`
	UserID            string       `gorm:"index;type:varchar(64);not null" json:"user_id"`
	Domain            string       `gorm:"uniqueIndex;type:varchar(255);not null" json:"domain"`
	Status            DomainStatus `gorm:"type:varchar(32);default:'pending'" json:"status"`
	SSLStatus         SSLStatus    `gorm:"type:varchar(32);default:'provisioning'" json:"ssl_status"`
	SSLIssuer         string       `gorm:"type:varchar(128);default:'Let''s Encrypt R3'" json:"ssl_issuer"`
	SSLExpiresAt      *time.Time   `json:"ssl_expires_at,omitempty"`
	VerificationToken string       `gorm:"type:varchar(64);not null" json:"verification_token"`
	CNAMETarget       string       `gorm:"type:varchar(255);default:'cname.klikin.id'" json:"cname_target"`
	TXTRecordName     string       `gorm:"type:varchar(255);not null" json:"txt_record_name"`
	RedirectWWW       bool         `gorm:"default:true" json:"redirect_www"`
	FallbackSubdomain bool         `gorm:"default:true" json:"fallback_subdomain"`
	LastCheckedAt     *time.Time   `json:"last_checked_at,omitempty"`
	CheckCount        int          `gorm:"default:0" json:"check_count"`
	LastErrorCode     string       `gorm:"type:varchar(64)" json:"last_error_code,omitempty"`
	ErrorMessage      string       `gorm:"type:text" json:"error_message,omitempty"`
	GuideSentCount    int          `gorm:"default:0" json:"guide_sent_count"`
	LastGuideSentAt   *time.Time   `json:"last_guide_sent_at,omitempty"`
	CreatedAt         time.Time    `json:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at"`
}

// DomainDiagnosticLog stores DNS resolution checks, SSL provisioning events, and administrative actions for custom domains.
type DomainDiagnosticLog struct {
	ID            string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	DomainID      string    `gorm:"index;type:varchar(64)" json:"domain_id"`
	DomainName    string    `gorm:"index;type:varchar(255);not null" json:"domain_name"`
	PageID        string    `gorm:"index;type:varchar(64)" json:"page_id"`
	PageSlug      string    `gorm:"type:varchar(128)" json:"page_slug"`
	UserID        string    `gorm:"index;type:varchar(64)" json:"user_id"`
	OwnerUsername string    `gorm:"type:varchar(128)" json:"owner_username"`
	EventType     string    `gorm:"index;type:varchar(32);not null" json:"event_type"` // DNS_CHECK, DNS_ERROR, SSL_PROVISION, SSL_ERROR, DOMAIN_DETACHED, GUIDE_SENT, STATUS_OVERRIDE, DOMAIN_ADDED
	Severity      string    `gorm:"index;type:varchar(16);default:'info'" json:"severity"` // info, warning, error, critical
	ErrorCode     string    `gorm:"type:varchar(64)" json:"error_code"`
	ResolvedCNAME string    `gorm:"type:varchar(255)" json:"resolved_cname,omitempty"`
	ResolvedTXT   string    `gorm:"type:varchar(255)" json:"resolved_txt,omitempty"`
	Message       string    `gorm:"type:text;not null" json:"message"`
	ActorID       string    `gorm:"type:varchar(64)" json:"actor_id"`
	ActorName     string    `gorm:"type:varchar(128)" json:"actor_name"`
	CreatedAt     time.Time `gorm:"index" json:"created_at"`
}
