package models

import "time"

// TicketStatus represents the lifecycle of support ticket
type TicketStatus string

const (
	TicketStatusOpen       TicketStatus = "open"
	TicketStatusInProgress TicketStatus = "in_progress"
	TicketStatusResolved   TicketStatus = "resolved"
	TicketStatusClosed     TicketStatus = "closed"
)

// SupportTicket represents user customer support tickets (Readme 4.11)
type SupportTicket struct {
	ID            string          `gorm:"primaryKey;type:varchar(64)" json:"id"`
	UserID        string          `gorm:"index;type:varchar(64);not null" json:"user_id"`
	TicketNumber  string          `gorm:"uniqueIndex;type:varchar(32);not null" json:"ticket_number"`
	Subject       string          `gorm:"type:varchar(255);not null" json:"subject"`
	Category      string          `gorm:"type:varchar(64);not null" json:"category"` // "billing", "domain", "feature", "bug", "account", "other"
	Priority      string          `gorm:"type:varchar(32);default:'medium'" json:"priority"` // "low", "medium", "high", "urgent"
	Status        TicketStatus    `gorm:"type:varchar(32);default:'open'" json:"status"`
	Description   string          `gorm:"type:text;not null" json:"description"`
	AttachmentURL string          `gorm:"type:varchar(255)" json:"attachment_url,omitempty"`
	User          *User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Messages      []TicketMessage `gorm:"foreignKey:TicketID" json:"messages,omitempty"`
	CreatedAt     time.Time       `gorm:"index" json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

// TicketMessage represents conversation thread between user and support (Readme 4.11)
type TicketMessage struct {
	ID            string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	TicketID      string    `gorm:"index;type:varchar(64);not null" json:"ticket_id"`
	SenderType    string    `gorm:"type:varchar(32);not null" json:"sender_type"` // "user" | "support"
	SenderName    string    `gorm:"type:varchar(128);not null" json:"sender_name"`
	Message       string    `gorm:"type:text;not null" json:"message"`
	AttachmentURL string    `gorm:"type:varchar(255)" json:"attachment_url,omitempty"`
	CreatedAt     time.Time `gorm:"index" json:"created_at"`
}

// CannedResponse represents pre-written reply templates for Super Admin (Readme 3.8)
type CannedResponse struct {
	ID        string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Title     string    `gorm:"type:varchar(128);not null" json:"title"`
	Category  string    `gorm:"type:varchar(64);default:'general'" json:"category"` // "billing", "technical", "general", "domain", "feature"
	Content   string    `gorm:"type:text;not null" json:"content"`
	Shortcut  string    `gorm:"type:varchar(32)" json:"shortcut,omitempty"` // e.g. "/halo", "/billing", "/dns"
	CreatedBy string    `gorm:"type:varchar(128)" json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BroadcastAnnouncement represents mass broadcasts/announcements sent to users or segments (Readme 3.8)
type BroadcastAnnouncement struct {
	ID            string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Title         string    `gorm:"type:varchar(255);not null" json:"title"`
	TargetSegment string    `gorm:"type:varchar(64);default:'all'" json:"target_segment"` // "all", "active", "free", "pro", "suspended"
	Channel       string    `gorm:"type:varchar(32);default:'in_app'" json:"channel"` // "in_app", "email", "both"
	Message       string    `gorm:"type:text;not null" json:"message"`
	ActionURL     string    `gorm:"type:varchar(255)" json:"action_url,omitempty"`
	SentCount     int       `gorm:"default:0" json:"sent_count"`
	Status        string    `gorm:"type:varchar(32);default:'sent'" json:"status"` // "sent", "draft"
	CreatedBy     string    `gorm:"type:varchar(128)" json:"created_by"`
	SentAt        time.Time `json:"sent_at"`
	CreatedAt     time.Time `json:"created_at"`
}

// CommunicationAuditLog logs all administrative outgoing communication events (Readme 3.8)
type CommunicationAuditLog struct {
	ID          string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	ActionType  string    `gorm:"type:varchar(64);not null" json:"action_type"` // "broadcast", "direct_notification", "ticket_reply", "status_change"
	Recipient   string    `gorm:"type:varchar(128);not null" json:"recipient"` // Target user email or segment name
	TargetID    string    `gorm:"type:varchar(64)" json:"target_id,omitempty"` // Ticket ID, User ID, or Broadcast ID
	Subject     string    `gorm:"type:varchar(255);not null" json:"subject"`
	Channel     string    `gorm:"type:varchar(32);not null" json:"channel"` // "in_app", "email", "dashboard_thread"
	Status      string    `gorm:"type:varchar(32);default:'delivered'" json:"status"`
	AdminEmail  string    `gorm:"type:varchar(128);not null" json:"admin_email"`
	DetailsJSON string    `gorm:"type:text" json:"details_json,omitempty"`
	CreatedAt   time.Time `gorm:"index" json:"created_at"`
}

// FAQItem represents knowledge base / FAQ (Readme 4.11)
type FAQItem struct {
	ID        string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	Category  string    `gorm:"type:varchar(64);not null" json:"category"`
	Question  string    `gorm:"type:varchar(255);not null" json:"question"`
	Answer    string    `gorm:"type:text;not null" json:"answer"`
	OrderNum  int       `gorm:"default:0" json:"order_num"`
	CreatedAt time.Time `json:"created_at"`
}

// UserFeedback represents feature suggestions or user reviews (Readme 4.11)
type UserFeedback struct {
	ID          string    `gorm:"primaryKey;type:varchar(64)" json:"id"`
	UserID      string    `gorm:"index;type:varchar(64);not null" json:"user_id"`
	Type        string    `gorm:"type:varchar(64);default:'feature_request'" json:"type"` // "feature_request", "bug_report", "praise", "general"
	Title       string    `gorm:"type:varchar(255);not null" json:"title"`
	Description string    `gorm:"type:text;not null" json:"description"`
	Rating      int       `gorm:"default:5" json:"rating"` // 1-5
	Status      string    `gorm:"type:varchar(32);default:'received'" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}
