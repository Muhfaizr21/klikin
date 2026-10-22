package models

import (
	"time"
)

// EmailCaptureConfig holds the form settings, copy, and optional 3rd-party newsletter integration
type EmailCaptureConfig struct {
	ID              string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	PageID          string    `gorm:"uniqueIndex;type:varchar(64);not null" json:"page_id"`
	UserID          string    `gorm:"index;type:varchar(64);not null" json:"user_id"`
	IsEnabled       bool      `gorm:"default:false" json:"is_enabled"`
	Title           string    `gorm:"type:varchar(255);default:'Dapatkan Update & Promo Spesial'" json:"title"`
	Description     string    `gorm:"type:text" json:"description"`
	Placeholder     string    `gorm:"type:varchar(128);default:'Masukkan alamat email Anda...'" json:"placeholder"`
	ButtonText      string    `gorm:"type:varchar(64);default:'Berlangganan'" json:"button_text"`
	SuccessMessage  string    `gorm:"type:varchar(255);default:'Terima kasih! Email Anda telah terdaftar.'" json:"success_message"`
	ConsentEnabled  bool      `gorm:"default:true" json:"consent_enabled"`
	ConsentText     string    `gorm:"type:text" json:"consent_text"`
	NotifyOnNewLead bool      `gorm:"default:true" json:"notify_on_new_lead"`
	NotifyEmail     string    `gorm:"type:varchar(255)" json:"notify_email"`
	Provider        string    `gorm:"type:varchar(32);default:'none'" json:"provider"` // "none" | "mailchimp" | "convertkit"
	APIKey          string    `gorm:"type:varchar(255)" json:"api_key"`
	ListID          string    `gorm:"type:varchar(128)" json:"list_id"`
	IsConnected     bool      `gorm:"default:false" json:"is_connected"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// EmailLead stores incoming subscriber contact entries
type EmailLead struct {
	ID               string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	PageID           string    `gorm:"index;type:varchar(64);not null" json:"page_id"`
	UserID           string    `gorm:"index;type:varchar(64);not null" json:"user_id"`
	Email            string    `gorm:"index;type:varchar(255);not null" json:"email"`
	Source           string    `gorm:"type:varchar(64);default:'bio_page'" json:"source"`
	ConsentGiven     bool      `gorm:"default:true" json:"consent_given"`
	IPAddress        string    `gorm:"type:varchar(64)" json:"ip_address"`
	UserAgent        string    `gorm:"type:text" json:"user_agent"`
	SyncedToProvider bool      `gorm:"default:false" json:"synced_to_provider"`
	CreatedAt        time.Time `gorm:"index" json:"created_at"`
}
