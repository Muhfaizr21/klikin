package models

import "time"

// UserActivityLog records security, administrative, and user events for Section 3.2 & 3.10
type UserActivityLog struct {
	ID        string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	UserID    string    `gorm:"index;not null;type:varchar(64)" json:"user_id"`
	Action    string    `gorm:"type:varchar(64);not null" json:"action"` // "LOGIN", "PAGE_CREATED", "LINK_UPDATED", "PASSWORD_RESET", "STATUS_CHANGE", "PROFILE_EDIT"
	Details   string    `gorm:"type:text" json:"details"`
	IPAddress string    `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent string    `gorm:"type:text" json:"user_agent"`
	CreatedAt time.Time `gorm:"index;not null" json:"created_at"`
}

// UserInternalNote records confidential administrative notes about a user account
type UserInternalNote struct {
	ID         string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	UserID     string    `gorm:"index;not null;type:varchar(64)" json:"user_id"`
	AuthorID   string    `gorm:"type:varchar(64)" json:"author_id"`
	AuthorName string    `gorm:"type:varchar(128)" json:"author_name"`
	Note       string    `gorm:"type:text;not null" json:"note"`
	CreatedAt  time.Time `gorm:"index;not null" json:"created_at"`
}
