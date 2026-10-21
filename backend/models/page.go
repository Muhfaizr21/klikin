package models

import "time"

type BioPage struct {
	ID           string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	UserID       string    `gorm:"index;not null" json:"user_id"`
	Slug         string    `gorm:"uniqueIndex;not null" json:"slug"`
	Title        string    `json:"title"`
	Bio          string    `json:"bio"`
	Theme        string    `gorm:"default:'default'" json:"theme"`
	CustomDomain string    `gorm:"uniqueIndex" json:"custom_domain,omitempty"`
	IsPublished  bool      `gorm:"default:true" json:"is_published"`
	Links        []Link    `gorm:"foreignKey:PageID" json:"links,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
