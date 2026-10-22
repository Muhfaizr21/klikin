package models

import "time"

// ContentReportStatus defines visitor report states
type ContentReportStatus string

const (
	ReportStatusPending   ContentReportStatus = "pending"
	ReportStatusReviewed  ContentReportStatus = "reviewed"
	ReportStatusActioned  ContentReportStatus = "actioned"
	ReportStatusDismissed ContentReportStatus = "dismissed"
)

// ContentReport stores reports submitted by public visitors or automated scanners (Readme 3.5)
type ContentReport struct {
	ID             string              `gorm:"primaryKey;type:varchar(64)" json:"id"`
	PageID         string              `gorm:"index;type:varchar(64);not null" json:"page_id"`
	Slug           string              `gorm:"index;type:varchar(128);not null" json:"slug"`
	OwnerUserID    string              `gorm:"index;type:varchar(64);not null" json:"owner_user_id"`
	ReporterName   string              `gorm:"type:varchar(128)" json:"reporter_name"`
	ReporterEmail  string              `gorm:"type:varchar(128)" json:"reporter_email"`
	ReporterIP     string              `gorm:"type:varchar(64)" json:"reporter_ip"`
	Category       string              `gorm:"index;type:varchar(32);not null" json:"category"` // "phishing" | "spam" | "adult" | "gambling" | "scam"
	Severity       string              `gorm:"type:varchar(16);default:'medium'" json:"severity"` // "low" | "medium" | "high" | "critical"
	Description    string              `gorm:"type:text;not null" json:"description"`
	TargetURL      string              `gorm:"type:varchar(512)" json:"target_url"` // specific suspicious link on the page
	Status         ContentReportStatus `gorm:"index;type:varchar(32);default:'pending'" json:"status"`
	ResolutionNote string              `gorm:"type:text" json:"resolution_note"`
	ReviewedBy     string              `gorm:"type:varchar(64)" json:"reviewed_by"`
	ReviewedByName string              `gorm:"type:varchar(128)" json:"reviewed_by_name"`
	ReviewedAt     *time.Time          `json:"reviewed_at,omitempty"`
	CreatedAt      time.Time           `gorm:"index" json:"created_at"`
	UpdatedAt      time.Time           `json:"updated_at"`
}

// BlacklistedDomain stores malicious domains, URLs, or patterns blocked platform-wide (Readme 3.5)
type BlacklistedDomain struct {
	ID            string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Pattern       string    `gorm:"uniqueIndex;type:varchar(255);not null" json:"pattern"` // e.g., "slot-gacor-vip.xyz" or "phishing-login.net"
	MatchType     string    `gorm:"type:varchar(32);default:'domain'" json:"match_type"`   // "domain" | "url_contains" | "exact_url"
	Category      string    `gorm:"type:varchar(32);not null" json:"category"`             // "phishing" | "spam" | "adult" | "gambling"
	Severity      string    `gorm:"type:varchar(16);default:'high'" json:"severity"`       // "medium" | "high" | "critical"
	Reason        string    `gorm:"type:text" json:"reason"`
	HitCount      int64     `gorm:"default:0" json:"hit_count"` // how many times blocked/detected
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	AddedBy       string    `gorm:"type:varchar(64)" json:"added_by"`
	AddedByName   string    `gorm:"type:varchar(128)" json:"added_by_name"`
	CreatedAt     time.Time `gorm:"index" json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ModerationLog records immutable history of all content moderation actions (Readme 3.5)
type ModerationLog struct {
	ID            string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Action        string    `gorm:"index;type:varchar(64);not null" json:"action"` // "FLAG_PAGE", "CLEAR_FLAG", "TAKEDOWN_PAGE", "RESTORE_PAGE", "BAN_VIOLATOR", "RESOLVE_REPORT", "DISMISS_REPORT", "ADD_BLACKLIST", "REMOVE_BLACKLIST"
	TargetType    string    `gorm:"type:varchar(32);not null" json:"target_type"`  // "page" | "user" | "report" | "blacklist"
	TargetID      string    `gorm:"index;type:varchar(64)" json:"target_id"`
	TargetSlug    string    `gorm:"type:varchar(128)" json:"target_slug"`
	OwnerUserID   string    `gorm:"index;type:varchar(64)" json:"owner_user_id"`
	OwnerUsername string    `gorm:"type:varchar(128)" json:"owner_username"`
	Category      string    `gorm:"type:varchar(32)" json:"category"`
	Severity      string    `gorm:"type:varchar(16)" json:"severity"`
	Reason        string    `gorm:"type:text" json:"reason"`
	Details       string    `gorm:"type:text" json:"details"`
	AdminID       string    `gorm:"type:varchar(64)" json:"admin_id"`
	AdminName     string    `gorm:"type:varchar(128)" json:"admin_name"`
	CreatedAt     time.Time `gorm:"index" json:"created_at"`
}
