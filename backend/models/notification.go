package models

import "time"

// Notification represents in-app notifications (Readme 4.10)
type Notification struct {
	ID        string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	UserID    string    `gorm:"index;type:varchar(64);not null" json:"user_id"`
	Title     string    `gorm:"type:varchar(128);not null" json:"title"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	Type      string    `gorm:"type:varchar(32);default:'info'" json:"type"` // "info", "success", "warning", "billing", "domain", "lead"
	ActionURL string    `gorm:"type:varchar(255)" json:"action_url,omitempty"`
	IsRead    bool      `gorm:"default:false;index" json:"is_read"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}

// TransactionalEmailLog stores the audit log of sent transactional emails (Readme 4.10)
type TransactionalEmailLog struct {
	ID        string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	UserID    string    `gorm:"index;type:varchar(64);not null" json:"user_id"`
	Subject   string    `gorm:"type:varchar(255);not null" json:"subject"`
	Recipient string    `gorm:"type:varchar(128);not null" json:"recipient"`
	Category  string    `gorm:"type:varchar(32);not null" json:"category"` // "welcome", "verification", "billing", "domain_status"
	Status    string    `gorm:"type:varchar(32);default:'delivered'" json:"status"`
	SentAt    time.Time `json:"sent_at"`
}

// NotificationPreference stores user toggle preferences (Readme 4.10)
type NotificationPreference struct {
	ID                string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	UserID            string    `gorm:"uniqueIndex;type:varchar(64);not null" json:"user_id"`
	EmailMarketing    bool      `gorm:"default:false" json:"email_marketing"`
	EmailSecurity     bool      `gorm:"default:true" json:"email_security"`
	EmailBilling      bool      `gorm:"default:true" json:"email_billing"`
	EmailDomainStatus bool      `gorm:"default:true" json:"email_domain_status"`
	EmailNewLead      bool      `gorm:"default:true" json:"email_new_lead"`
	InAppSound        bool      `gorm:"default:true" json:"in_app_sound"`
	UpdatedAt         time.Time `json:"updated_at"`
}
