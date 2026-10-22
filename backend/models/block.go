package models

import "time"

type BioBlock struct {
	ID        string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	PageID    string    `gorm:"index;not null" json:"page_id"`
	Type      string    `gorm:"not null" json:"type"` // link, header, divider, text, socials, embed
	Title     string    `json:"title"`
	Content   string    `json:"content"`              // text content, divider style, or markdown
	URL       string    `json:"url"`                  // target URL for link or embed
	Subtitle  string    `json:"subtitle"`             // secondary description for link
	Icon      string    `json:"icon"`                 // icon identifier
	ImageURL  string    `json:"image_url"`            // thumbnail image (WebP)
	Spotlight string    `json:"spotlight"`            // none, pulse, wiggle, bounce
	Order     int       `gorm:"default:0" json:"order"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	Settings  string    `gorm:"type:text" json:"settings"` // JSON string for platform/social links
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
