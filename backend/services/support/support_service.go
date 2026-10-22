package support

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
)

type SupportService struct {
	db *gorm.DB
}

func NewSupportService(db *gorm.DB) *SupportService {
	return &SupportService{db: db}
}

// GetTickets returns all tickets filed by user with message counts
func (s *SupportService) GetTickets(userID string) ([]models.SupportTicket, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var tickets []models.SupportTicket
	err := s.db.Where("user_id = ?", userID).
		Preload("Messages").
		Order("updated_at desc").
		Find(&tickets).Error

	return tickets, err
}

// CreateTicket opens a new support ticket and logs the initial message
func (s *SupportService) CreateTicket(userID, subject, category, priority, description, attachmentURL string) (*models.SupportTicket, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	cleanSubject := strings.TrimSpace(subject)
	cleanDesc := strings.TrimSpace(description)
	if cleanSubject == "" {
		return nil, errors.New("subjek tiket tidak boleh kosong")
	}
	if cleanDesc == "" {
		return nil, errors.New("deskripsi kendala atau pertanyaan tidak boleh kosong")
	}

	if priority == "" {
		priority = "medium"
	}
	if category == "" {
		category = "other"
	}

	now := time.Now()
	ticketNumber := fmt.Sprintf("TKT-%d-%04d", now.Year(), now.Unix()%10000)

	ticket := models.SupportTicket{
		ID:            fmt.Sprintf("tkt_%d", now.UnixNano()),
		UserID:        userID,
		TicketNumber:  ticketNumber,
		Subject:       cleanSubject,
		Category:      category,
		Priority:      priority,
		Status:        models.TicketStatusOpen,
		Description:   cleanDesc,
		AttachmentURL: strings.TrimSpace(attachmentURL),
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.db.Create(&ticket).Error; err != nil {
		return nil, err
	}

	// Create initial message
	var user models.User
	userName := "Pengguna Klikin"
	if err := s.db.Where("id = ?", userID).First(&user).Error; err == nil && user.FullName != "" {
		userName = user.FullName
	}

	msg := models.TicketMessage{
		ID:            fmt.Sprintf("msg_%d", now.UnixNano()),
		TicketID:      ticket.ID,
		SenderType:    "user",
		SenderName:    userName,
		Message:       cleanDesc,
		AttachmentURL: ticket.AttachmentURL,
		CreatedAt:     now,
	}
	s.db.Create(&msg)

	ticket.Messages = []models.TicketMessage{msg}
	return &ticket, nil
}

// GetTicketDetails returns a ticket with its conversation thread
func (s *SupportService) GetTicketDetails(userID, ticketID string) (*models.SupportTicket, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var ticket models.SupportTicket
	err := s.db.Where("id = ? AND user_id = ?", ticketID, userID).
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at asc")
		}).First(&ticket).Error
	if err != nil {
		return nil, errors.New("tiket bantuan tidak ditemukan")
	}

	return &ticket, nil
}

// ReplyTicket adds a message to the ticket conversation thread
func (s *SupportService) ReplyTicket(userID, ticketID, messageText, attachmentURL string) (*models.TicketMessage, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	cleanMsg := strings.TrimSpace(messageText)
	if cleanMsg == "" {
		return nil, errors.New("pesan balasan tidak boleh kosong")
	}

	var ticket models.SupportTicket
	if err := s.db.Where("id = ? AND user_id = ?", ticketID, userID).First(&ticket).Error; err != nil {
		return nil, errors.New("tiket tidak ditemukan")
	}

	if ticket.Status == models.TicketStatusClosed {
		return nil, errors.New("tiket ini sudah ditutup. Silakan buka tiket baru.")
	}

	var user models.User
	userName := "Pengguna"
	if err := s.db.Where("id = ?", userID).First(&user).Error; err == nil && user.FullName != "" {
		userName = user.FullName
	}

	now := time.Now()
	msg := models.TicketMessage{
		ID:            fmt.Sprintf("msg_%d", now.UnixNano()),
		TicketID:      ticket.ID,
		SenderType:    "user",
		SenderName:    userName,
		Message:       cleanMsg,
		AttachmentURL: strings.TrimSpace(attachmentURL),
		CreatedAt:     now,
	}

	if err := s.db.Create(&msg).Error; err != nil {
		return nil, err
	}

	// Update ticket updated_at and status if resolved
	updates := map[string]interface{}{
		"updated_at": now,
	}
	if ticket.Status == models.TicketStatusResolved {
		updates["status"] = models.TicketStatusInProgress
	}
	s.db.Model(&ticket).Updates(updates)

	return &msg, nil
}

// GetFAQs retrieves knowledge base articles
func (s *SupportService) GetFAQs(category string) ([]models.FAQItem, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	query := s.db.Order("order_num asc, created_at desc")
	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	var faqs []models.FAQItem
	err := query.Find(&faqs).Error
	return faqs, err
}

// SubmitContactForm handles quick support contact message
func (s *SupportService) SubmitContactForm(userID, name, email, subject, message string) (*models.SupportTicket, error) {
	return s.CreateTicket(userID, subject, "general", "medium", message, "")
}

// SubmitFeedback logs user feedback or feature ideas
func (s *SupportService) SubmitFeedback(userID, feedbackType, title, description string, rating int) (*models.UserFeedback, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	cleanTitle := strings.TrimSpace(title)
	cleanDesc := strings.TrimSpace(description)
	if cleanTitle == "" || cleanDesc == "" {
		return nil, errors.New("judul dan deskripsi saran tidak boleh kosong")
	}

	if rating < 1 {
		rating = 1
	} else if rating > 5 {
		rating = 5
	}

	if feedbackType == "" {
		feedbackType = "feature_request"
	}

	fb := models.UserFeedback{
		ID:          fmt.Sprintf("fb_%d", time.Now().UnixNano()),
		UserID:      userID,
		Type:        feedbackType,
		Title:       cleanTitle,
		Description: cleanDesc,
		Rating:      rating,
		Status:      "received",
		CreatedAt:   time.Now(),
	}

	if err := s.db.Create(&fb).Error; err != nil {
		return nil, err
	}

	return &fb, nil
}
