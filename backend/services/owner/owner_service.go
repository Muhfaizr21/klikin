package owner

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
)

type OwnerService struct {
	db *gorm.DB
}

func NewOwnerService(db *gorm.DB) *OwnerService {
	return &OwnerService{db: db}
}

type UpdatePageDTO struct {
	Title string `json:"title"`
	Bio   string `json:"bio"`
	Theme string `json:"theme"`
}

type CreateLinkDTO struct {
	Title string `json:"title"`
	URL   string `json:"url"`
	Icon  string `json:"icon"`
}

// GetWorkspace returns the isolated workspace (BioPage and all Links) strictly scoped to the owner's userID
func (s *OwnerService) GetWorkspace(userID string) (*models.BioPage, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var page models.BioPage
	err := s.db.Preload("Links", func(db *gorm.DB) *gorm.DB {
		return db.Order("links.order asc, links.created_at asc")
	}).Where("user_id = ?", userID).First(&page).Error

	if err != nil {
		return nil, errors.New("ruang kerja Bio Page tidak ditemukan untuk akun ini")
	}

	return &page, nil
}

// UpdateBioPage updates page details belonging strictly to the owner
func (s *OwnerService) UpdateBioPage(userID string, dto UpdatePageDTO) (*models.BioPage, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	if dto.Title != "" {
		page.Title = dto.Title
	}
	page.Bio = dto.Bio
	if dto.Theme != "" {
		page.Theme = dto.Theme
	}
	page.UpdatedAt = time.Now()

	if err := s.db.Save(&page).Error; err != nil {
		return nil, fmt.Errorf("gagal memperbarui bio page: %w", err)
	}

	return &page, nil
}

// CreateLink adds a link into the owner's page with automatic ordering
func (s *OwnerService) CreateLink(userID string, dto CreateLinkDTO) (*models.Link, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	if dto.Title == "" || dto.URL == "" {
		return nil, errors.New("judul dan tautan URL wajib diisi")
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	var count int64
	s.db.Model(&models.Link{}).Where("page_id = ?", page.ID).Count(&count)

	newLink := models.Link{
		ID:         fmt.Sprintf("link_%d", time.Now().UnixNano()),
		PageID:     page.ID,
		Title:      dto.Title,
		URL:        dto.URL,
		Icon:       dto.Icon,
		Order:      int(count),
		IsActive:   true,
		ClickCount: 0,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := s.db.Create(&newLink).Error; err != nil {
		return nil, fmt.Errorf("gagal menambahkan tautan: %w", err)
	}

	return &newLink, nil
}

// DeleteLink safely deletes a link verifying tenant ownership
func (s *OwnerService) DeleteLink(userID, linkID string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	var link models.Link
	err := s.db.Joins("JOIN bio_pages ON bio_pages.id = links.page_id").
		Where("links.id = ? AND bio_pages.user_id = ?", linkID, userID).
		First(&link).Error

	if err != nil {
		return errors.New("tautan tidak ditemukan atau Anda tidak memiliki akses ke tautan ini")
	}

	if err := s.db.Delete(&link).Error; err != nil {
		return fmt.Errorf("gagal menghapus tautan: %w", err)
	}

	return nil
}
