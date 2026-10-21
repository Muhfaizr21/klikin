package models

import "time"

type Link struct {
	ID         string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	PageID     string    `gorm:"index;not null" json:"page_id"`
	Title      string    `gorm:"not null" json:"title"`
	URL        string    `gorm:"not null" json:"url"`
	Icon       string    `json:"icon,omitempty"`
	Order      int       `gorm:"default:0" json:"order"`
	IsActive   bool      `gorm:"default:true" json:"is_active"`
	ClickCount int64     `gorm:"default:0" json:"click_count"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
