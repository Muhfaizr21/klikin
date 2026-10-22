package models

import "time"

// PlatformAuditLog records administrative and platform operations (Readme 3.10)
type PlatformAuditLog struct {
	ID          string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	ActorID     string    `gorm:"index;type:varchar(64);not null" json:"actor_id"`
	ActorEmail  string    `gorm:"type:varchar(128);not null" json:"actor_email"`
	ActorRole   string    `gorm:"type:varchar(32);default:'SUPER_ADMIN'" json:"actor_role"`
	Action      string    `gorm:"type:varchar(64);not null;index" json:"action"` // e.g. "USER_BANNED", "DOMAIN_RELEASED", "INVOICE_REFUNDED", "IP_BLACKLISTED", "BACKUP_TRIGGERED"
	TargetType  string    `gorm:"type:varchar(64)" json:"target_type"`          // "user", "domain", "invoice", "page", "security", "backup"
	TargetID    string    `gorm:"type:varchar(64)" json:"target_id,omitempty"`
	IPAddress   string    `gorm:"type:varchar(45)" json:"ip_address"`
	DetailsJSON string    `gorm:"type:text" json:"details_json,omitempty"`
	CreatedAt   time.Time `gorm:"index;not null" json:"created_at"`
}

// LoginHistoryLog stores detailed user & admin authentication attempts (Readme 3.10)
type LoginHistoryLog struct {
	ID            string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	UserID        string    `gorm:"index;type:varchar(64)" json:"user_id,omitempty"`
	UserEmail     string    `gorm:"index;type:varchar(128);not null" json:"user_email"`
	IPAddress     string    `gorm:"type:varchar(45);not null" json:"ip_address"`
	UserAgent     string    `gorm:"type:text" json:"user_agent"`
	DeviceType    string    `gorm:"type:varchar(32);default:'desktop'" json:"device_type"` // "desktop", "mobile", "tablet"
	Location      string    `gorm:"type:varchar(128);default:'Indonesia'" json:"location"`
	Status        string    `gorm:"type:varchar(32);not null;index" json:"status"` // "success", "failed"
	FailureReason string    `gorm:"type:varchar(128)" json:"failure_reason,omitempty"`
	CreatedAt     time.Time `gorm:"index;not null" json:"created_at"`
}

// AppErrorLog stores backend and application error stack traces (Readme 3.10)
type AppErrorLog struct {
	ID          string     `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Severity    string     `gorm:"type:varchar(32);default:'error';index" json:"severity"` // "critical", "error", "warning"
	Message     string     `gorm:"type:text;not null" json:"message"`
	StackTrace  string     `gorm:"type:text" json:"stack_trace,omitempty"`
	Endpoint    string     `gorm:"type:varchar(255)" json:"endpoint"`
	Method      string     `gorm:"type:varchar(16)" json:"method"`
	StatusCode  int        `gorm:"default:500" json:"status_code"`
	UserID      string     `gorm:"type:varchar(64)" json:"user_id,omitempty"`
	IPAddress   string     `gorm:"type:varchar(45)" json:"ip_address"`
	Resolved    bool       `gorm:"default:false;index" json:"resolved"`
	ResolvedBy  string     `gorm:"type:varchar(128)" json:"resolved_by,omitempty"`
	ResolvedAt  *time.Time `json:"resolved_at,omitempty"`
	CreatedAt   time.Time  `gorm:"index;not null" json:"created_at"`
}

// BlacklistedIP stores blocked IP addresses (Readme 3.10)
type BlacklistedIP struct {
	ID        string     `gorm:"primaryKey;type:varchar(64)" json:"id"`
	IPAddress string     `gorm:"uniqueIndex;type:varchar(45);not null" json:"ip_address"`
	Reason    string     `gorm:"type:varchar(255);not null" json:"reason"`
	TotalHits int64      `gorm:"default:0" json:"total_hits"`
	LastHitAt *time.Time `json:"last_hit_at,omitempty"`
	BlockedAt time.Time  `json:"blocked_at"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	IsActive  bool       `gorm:"default:true;index" json:"is_active"`
	CreatedBy string     `gorm:"type:varchar(128)" json:"created_by"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// AdminSession represents active session tokens for Super Admins (Readme 3.10)
type AdminSession struct {
	ID           string     `gorm:"primaryKey;type:varchar(64)" json:"id"`
	AdminID      string     `gorm:"index;type:varchar(64);not null" json:"admin_id"`
	AdminEmail   string     `gorm:"type:varchar(128);not null" json:"admin_email"`
	TokenSnippet string     `gorm:"type:varchar(32)" json:"token_snippet"` // e.g. "eyJhbGci...SIu0"
	IPAddress    string     `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent    string     `gorm:"type:text" json:"user_agent"`
	Device       string     `gorm:"type:varchar(64);default:'macOS / Chrome'" json:"device"`
	LastActiveAt time.Time  `json:"last_active_at"`
	ExpiresAt    time.Time  `json:"expires_at"`
	IsRevoked    bool       `gorm:"default:false;index" json:"is_revoked"`
	RevokedAt    *time.Time `json:"revoked_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

// DataBackupRecord stores database backup history (Readme 3.10)
type DataBackupRecord struct {
	ID            string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	BackupName    string    `gorm:"type:varchar(255);not null" json:"backup_name"`
	BackupType    string    `gorm:"type:varchar(32);default:'manual'" json:"backup_type"` // "manual", "scheduled", "schema_only"
	FileSizeBytes int64     `gorm:"default:0" json:"file_size_bytes"`
	Status        string    `gorm:"type:varchar(32);default:'completed'" json:"status"` // "completed", "in_progress", "failed"
	DownloadURL   string    `gorm:"type:varchar(255)" json:"download_url,omitempty"`
	TriggeredBy   string    `gorm:"type:varchar(128);not null" json:"triggered_by"`
	Notes         string    `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt     time.Time `gorm:"index;not null" json:"created_at"`
}

// SecurityPolicy stores platform-wide security configuration (Readme 3.10)
type SecurityPolicy struct {
	ID                      string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Require2FAForSuperAdmin bool      `gorm:"default:true" json:"require_2fa_for_super_admin"`
	MaxFailedLoginAttempts  int       `gorm:"default:5" json:"max_failed_login_attempts"`
	RateLimitRequestsPerMin int       `gorm:"default:120" json:"rate_limit_requests_per_min"`
	SessionTimeoutHours     int       `gorm:"default:24" json:"session_timeout_hours"`
	AutoIPBlockOnBruteForce bool      `gorm:"default:true" json:"auto_ip_block_on_brute_force"`
	UpdatedAt               time.Time `json:"updated_at"`
}
