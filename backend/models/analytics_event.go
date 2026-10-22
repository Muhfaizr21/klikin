package models

import "time"

// AnalyticsEvent records granular page view and link click events for deep analytics
type AnalyticsEvent struct {
	ID            string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	PageID        string    `gorm:"index;not null;type:varchar(64)" json:"page_id"`
	Type          string    `gorm:"index;not null;type:varchar(16)" json:"type"` // "view" | "click"
	BlockID       string    `gorm:"index;type:varchar(64)" json:"block_id,omitempty"`
	LinkID        string    `gorm:"index;type:varchar(64)" json:"link_id,omitempty"`
	TargetTitle   string    `json:"target_title,omitempty"`
	TargetURL     string    `json:"target_url,omitempty"`
	Referrer      string    `json:"referrer,omitempty"`
	TrafficSource string    `gorm:"index;type:varchar(32)" json:"traffic_source"` // Instagram, TikTok, WhatsApp, Twitter/X, Direct, Referral
	Country       string    `gorm:"type:varchar(64)" json:"country"`              // Indonesia, Singapore, etc.
	City          string    `gorm:"type:varchar(64)" json:"city"`                 // Jakarta, Surabaya, Bandung, Medan, Denpasar
	Device        string    `gorm:"type:varchar(32)" json:"device"`               // Mobile, Desktop, Tablet
	Browser       string    `gorm:"type:varchar(32)" json:"browser"`              // Chrome, Safari, Instagram WebView, TikTok WebView, etc.
	IPHash        string    `gorm:"type:varchar(64)" json:"-"`                    // Anonymized hash for unique visitor metrics
	CreatedAt     time.Time `gorm:"index;not null" json:"created_at"`
}
