package notification

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
)

type NotificationService struct {
	db *gorm.DB
}

func NewNotificationService(db *gorm.DB) *NotificationService {
	return &NotificationService{db: db}
}

type NotificationOverviewResponse struct {
	Notifications []models.Notification         `json:"notifications"`
	UnreadCount   int64                         `json:"unread_count"`
	RecentEmails  []models.TransactionalEmailLog `json:"recent_emails"`
	Preferences   *models.NotificationPreference `json:"preferences"`
}

// GetOverview returns all notifications, unread count, recent transactional emails, and preferences
func (s *NotificationService) GetOverview(userID string) (*NotificationOverviewResponse, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var notifs []models.Notification
	s.db.Where("user_id = ?", userID).Order("created_at desc").Limit(50).Find(&notifs)

	var unreadCount int64
	s.db.Model(&models.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Count(&unreadCount)

	var emails []models.TransactionalEmailLog
	s.db.Where("user_id = ?", userID).Order("sent_at desc").Limit(20).Find(&emails)

	prefs, err := s.GetPreferences(userID)
	if err != nil {
		return nil, err
	}

	return &NotificationOverviewResponse{
		Notifications: notifs,
		UnreadCount:   unreadCount,
		RecentEmails:  emails,
		Preferences:   prefs,
	}, nil
}

// MarkAsRead marks a single notification as read
func (s *NotificationService) MarkAsRead(userID string, notifID string) error {
	if s.db == nil {
		return errors.New("database not available")
	}
	return s.db.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", notifID, userID).
		Update("is_read", true).Error
}

// MarkAllAsRead marks all user notifications as read
func (s *NotificationService) MarkAllAsRead(userID string) error {
	if s.db == nil {
		return errors.New("database not available")
	}
	return s.db.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}

// DeleteNotification removes a notification
func (s *NotificationService) DeleteNotification(userID string, notifID string) error {
	if s.db == nil {
		return errors.New("database not available")
	}
	return s.db.Where("id = ? AND user_id = ?", notifID, userID).Delete(&models.Notification{}).Error
}

// GetPreferences gets or initializes user notification preferences
func (s *NotificationService) GetPreferences(userID string) (*models.NotificationPreference, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var prefs models.NotificationPreference
	err := s.db.Where("user_id = ?", userID).First(&prefs).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		prefs = models.NotificationPreference{
			ID:                fmt.Sprintf("np_%d", time.Now().UnixNano()),
			UserID:            userID,
			EmailMarketing:    false,
			EmailSecurity:     true,
			EmailBilling:      true,
			EmailDomainStatus: true,
			EmailNewLead:      true,
			InAppSound:        true,
			UpdatedAt:         time.Now(),
		}
		s.db.Create(&prefs)
	}

	return &prefs, nil
}

// UpdatePreferences updates the notification preferences
func (s *NotificationService) UpdatePreferences(userID string, emailMarketing, emailSecurity, emailBilling, emailDomainStatus, emailNewLead, inAppSound bool) (*models.NotificationPreference, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	prefs, err := s.GetPreferences(userID)
	if err != nil {
		return nil, err
	}

	prefs.EmailMarketing = emailMarketing
	prefs.EmailSecurity = emailSecurity
	prefs.EmailBilling = emailBilling
	prefs.EmailDomainStatus = emailDomainStatus
	prefs.EmailNewLead = emailNewLead
	prefs.InAppSound = inAppSound
	prefs.UpdatedAt = time.Now()

	if err := s.db.Save(prefs).Error; err != nil {
		return nil, err
	}

	return prefs, nil
}

// CreateNotification helper to dispatch a new notification
func (s *NotificationService) CreateNotification(userID, title, message, notifType, actionURL string) (*models.Notification, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	notif := models.Notification{
		ID:        fmt.Sprintf("notif_%d", time.Now().UnixNano()),
		UserID:    userID,
		Title:     title,
		Message:   message,
		Type:      notifType,
		ActionURL: actionURL,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	if err := s.db.Create(&notif).Error; err != nil {
		return nil, err
	}

	return &notif, nil
}
