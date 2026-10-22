package models

import "time"

type BioPage struct {
	ID              string     `gorm:"primaryKey;type:varchar(64)" json:"id"`
	UserID          string     `gorm:"index;not null" json:"user_id"`
	Slug            string     `gorm:"uniqueIndex;not null" json:"slug"`
	Title           string     `json:"title"`
	Bio             string     `json:"bio"`
	AvatarURL       string     `json:"avatar_url"`
	Theme           string     `gorm:"default:'clean-minimal'" json:"theme"`
	CustomDomain    *string    `gorm:"uniqueIndex" json:"custom_domain,omitempty"`
	IsPublished     bool       `gorm:"default:true" json:"is_published"`
	IsVerified      bool       `gorm:"default:false" json:"is_verified"`

	// Customization Basis (Readme 4.2)
	BackgroundColor string     `gorm:"default:'#ffffff'" json:"background_color"`
	ButtonColor     string     `gorm:"default:'#0f172a'" json:"button_color"`
	ButtonTextColor string     `gorm:"default:'#ffffff'" json:"button_text_color"`
	FontFamily      string     `gorm:"default:'sans'" json:"font_family"`
	ButtonRadius    string     `gorm:"default:'rounded-xl'" json:"button_radius"`
	ButtonShadow    string     `gorm:"default:'shadow-sm'" json:"button_shadow"`

	// Customization Pro (Readme 4.2)
	CustomCSS       string     `gorm:"type:text" json:"custom_css"`
	BlockSpacing    string     `gorm:"default:'normal'" json:"block_spacing"`
	PageShadow      string     `gorm:"default:'none'" json:"page_shadow"`
	BgImageURL      string     `json:"bg_image_url"`
	FaviconURL      string     `json:"favicon_url"`

	// SEO Halaman (Readme 4.2 & 4.9)
	MetaTitle       string     `json:"meta_title"`
	MetaDescription string     `json:"meta_description"`
	OGImage         string     `json:"og_image"`

	// Pengaturan Halaman & Tracking (Readme 4.9)
	Visibility          string     `gorm:"column:visibility;default:'public'" json:"visibility"` // "public" | "private"
	IsPasswordProtected bool       `gorm:"column:is_password_protected;default:false" json:"is_password_protected"`
	PagePassword        string     `gorm:"column:page_password;type:varchar(255)" json:"-"`
	IsLocked            bool       `gorm:"-" json:"is_locked"`
	Custom404Redirect   string     `gorm:"column:custom_404_redirect;type:varchar(255)" json:"custom_404_redirect"`
	GA4ID               string     `gorm:"column:ga4_id;type:varchar(64)" json:"ga4_id"`
	MetaPixelID         string     `gorm:"column:meta_pixel_id;type:varchar(64)" json:"meta_pixel_id"`
	TikTokPixelID       string     `gorm:"column:tiktok_pixel_id;type:varchar(64)" json:"tiktok_pixel_id"`

	// Moderasi Konten & Keamanan (Readme 3.5)
	ModerationStatus    string     `gorm:"column:moderation_status;type:varchar(32);default:'clean'" json:"moderation_status"` // "clean" | "flagged" | "taken_down"
	FlagCategory        string     `gorm:"column:flag_category;type:varchar(32)" json:"flag_category,omitempty"`               // "phishing" | "spam" | "adult" | "gambling" | "scam"
	FlagReason          string     `gorm:"column:flag_reason;type:text" json:"flag_reason,omitempty"`
	FlagSeverity        string     `gorm:"column:flag_severity;type:varchar(16);default:'medium'" json:"flag_severity,omitempty"` // "low" | "medium" | "high" | "critical"
	FlaggedAt           *time.Time `gorm:"column:flagged_at" json:"flagged_at,omitempty"`
	TakedownReason      string     `gorm:"column:takedown_reason;type:text" json:"takedown_reason,omitempty"`
	TakenDownAt         *time.Time `gorm:"column:taken_down_at" json:"taken_down_at,omitempty"`
	TakenDownBy         string     `gorm:"column:taken_down_by;type:varchar(64)" json:"taken_down_by,omitempty"`

	Blocks          []BioBlock          `gorm:"foreignKey:PageID" json:"blocks,omitempty"`
	Links           []Link              `gorm:"foreignKey:PageID" json:"links,omitempty"`
	EmailCapture    *EmailCaptureConfig `gorm:"foreignKey:PageID" json:"email_capture,omitempty"`
	IsPro           bool                `gorm:"-" json:"is_pro"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`
}
