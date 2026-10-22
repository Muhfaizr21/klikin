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

type UpdateBioPageDTO struct {
	Title           string  `json:"title"`
	Bio             string  `json:"bio"`
	AvatarURL       string  `json:"avatar_url"`
	Theme           string  `json:"theme"`
	BackgroundColor string  `json:"background_color"`
	ButtonColor     string  `json:"button_color"`
	ButtonTextColor string  `json:"button_text_color"`
	FontFamily      string  `json:"font_family"`
	ButtonRadius    string  `json:"button_radius"`
	ButtonShadow    string  `json:"button_shadow"`
	CustomCSS       string  `json:"custom_css"`
	BlockSpacing    string  `json:"block_spacing"`
	PageShadow      string  `json:"page_shadow"`
	BgImageURL      string  `json:"bg_image_url"`
	FaviconURL      string  `json:"favicon_url"`
	MetaTitle       string  `json:"meta_title"`
	MetaDescription string  `json:"meta_description"`
	OGImage         string  `json:"og_image"`
	IsPublished     *bool   `json:"is_published,omitempty"`
	IsVerified      *bool   `json:"is_verified,omitempty"`
}

type CreateBlockDTO struct {
	Type      string `json:"type"` // link, header, divider, text, socials, embed
	Title     string `json:"title"`
	Content   string `json:"content"`
	URL       string `json:"url"`
	Subtitle  string `json:"subtitle"`
	Icon      string `json:"icon"`
	ImageURL  string `json:"image_url"`
	Spotlight string `json:"spotlight"`
	Settings  string `json:"settings"`
}

type UpdateBlockDTO struct {
	Title     *string `json:"title,omitempty"`
	Content   *string `json:"content,omitempty"`
	URL       *string `json:"url,omitempty"`
	Subtitle  *string `json:"subtitle,omitempty"`
	Icon      *string `json:"icon,omitempty"`
	ImageURL  *string `json:"image_url,omitempty"`
	Spotlight *string `json:"spotlight,omitempty"`
	IsActive  *bool   `json:"is_active,omitempty"`
	Settings  *string `json:"settings,omitempty"`
}

type CreateLinkDTO struct {
	Title string `json:"title"`
	URL   string `json:"url"`
	Icon  string `json:"icon"`
}

// GetWorkspace returns the isolated workspace (BioPage, Blocks, and Links) strictly scoped to the owner's userID
func (s *OwnerService) GetWorkspace(userID string) (*models.BioPage, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var page models.BioPage
	err := s.db.Preload("Blocks", func(db *gorm.DB) *gorm.DB {
		return db.Order("bio_blocks.order asc, bio_blocks.created_at asc")
	}).Preload("Links", func(db *gorm.DB) *gorm.DB {
		return db.Order("links.order asc, links.created_at asc")
	}).Where("user_id = ?", userID).First(&page).Error

	if err != nil {
		return nil, errors.New("ruang kerja Bio Page tidak ditemukan untuk akun ini")
	}

	return &page, nil
}

// UpdateBioPage updates all bio page properties, styles, SEO, and publication status
func (s *OwnerService) UpdateBioPage(userID string, dto UpdateBioPageDTO) (*models.BioPage, error) {
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
	page.AvatarURL = dto.AvatarURL
	if dto.Theme != "" {
		page.Theme = dto.Theme
	}
	if dto.BackgroundColor != "" {
		page.BackgroundColor = dto.BackgroundColor
	}
	if dto.ButtonColor != "" {
		page.ButtonColor = dto.ButtonColor
	}
	if dto.ButtonTextColor != "" {
		page.ButtonTextColor = dto.ButtonTextColor
	}
	if dto.FontFamily != "" {
		page.FontFamily = dto.FontFamily
	}
	if dto.ButtonRadius != "" {
		page.ButtonRadius = dto.ButtonRadius
	}
	if dto.ButtonShadow != "" {
		page.ButtonShadow = dto.ButtonShadow
	}
	page.CustomCSS = dto.CustomCSS
	if dto.BlockSpacing != "" {
		page.BlockSpacing = dto.BlockSpacing
	}
	if dto.PageShadow != "" {
		page.PageShadow = dto.PageShadow
	}
	page.BgImageURL = dto.BgImageURL
	page.FaviconURL = dto.FaviconURL
	page.MetaTitle = dto.MetaTitle
	page.MetaDescription = dto.MetaDescription
	page.OGImage = dto.OGImage

	if dto.IsPublished != nil {
		page.IsPublished = *dto.IsPublished
	}
	if dto.IsVerified != nil {
		page.IsVerified = *dto.IsVerified
	}

	page.UpdatedAt = time.Now()

	if err := s.db.Save(&page).Error; err != nil {
		return nil, fmt.Errorf("gagal memperbarui bio page: %w", err)
	}

	return &page, nil
}

// CreateBlock adds a new block to the bio page
func (s *OwnerService) CreateBlock(userID string, dto CreateBlockDTO) (*models.BioBlock, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	var count int64
	s.db.Model(&models.BioBlock{}).Where("page_id = ?", page.ID).Count(&count)

	block := models.BioBlock{
		ID:        fmt.Sprintf("blk_%d", time.Now().UnixNano()),
		PageID:    page.ID,
		Type:      dto.Type,
		Title:     dto.Title,
		Content:   dto.Content,
		URL:       dto.URL,
		Subtitle:  dto.Subtitle,
		Icon:      dto.Icon,
		ImageURL:  dto.ImageURL,
		Spotlight: dto.Spotlight,
		Order:     int(count),
		IsActive:  true,
		Settings:  dto.Settings,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if block.Type == "" {
		block.Type = "link"
	}

	if err := s.db.Create(&block).Error; err != nil {
		return nil, fmt.Errorf("gagal menambahkan blok: %w", err)
	}

	return &block, nil
}

// UpdateBlock updates an existing block ensuring owner tenancy
func (s *OwnerService) UpdateBlock(userID, blockID string, dto UpdateBlockDTO) (*models.BioBlock, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var block models.BioBlock
	err := s.db.Joins("JOIN bio_pages ON bio_pages.id = bio_blocks.page_id").
		Where("bio_blocks.id = ? AND bio_pages.user_id = ?", blockID, userID).
		First(&block).Error

	if err != nil {
		return nil, errors.New("blok tidak ditemukan atau akses ditolak")
	}

	if dto.Title != nil {
		block.Title = *dto.Title
	}
	if dto.Content != nil {
		block.Content = *dto.Content
	}
	if dto.URL != nil {
		block.URL = *dto.URL
	}
	if dto.Subtitle != nil {
		block.Subtitle = *dto.Subtitle
	}
	if dto.Icon != nil {
		block.Icon = *dto.Icon
	}
	if dto.ImageURL != nil {
		block.ImageURL = *dto.ImageURL
	}
	if dto.Spotlight != nil {
		block.Spotlight = *dto.Spotlight
	}
	if dto.IsActive != nil {
		block.IsActive = *dto.IsActive
	}
	if dto.Settings != nil {
		block.Settings = *dto.Settings
	}
	block.UpdatedAt = time.Now()

	if err := s.db.Save(&block).Error; err != nil {
		return nil, fmt.Errorf("gagal memperbarui blok: %w", err)
	}

	return &block, nil
}

// DeleteBlock deletes a block ensuring owner tenancy
func (s *OwnerService) DeleteBlock(userID, blockID string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	var block models.BioBlock
	err := s.db.Joins("JOIN bio_pages ON bio_pages.id = bio_blocks.page_id").
		Where("bio_blocks.id = ? AND bio_pages.user_id = ?", blockID, userID).
		First(&block).Error

	if err != nil {
		return errors.New("blok tidak ditemukan atau akses ditolak")
	}

	if err := s.db.Delete(&block).Error; err != nil {
		return fmt.Errorf("gagal menghapus blok: %w", err)
	}

	return nil
}

// DuplicateBlock creates a copy of an existing block immediately below it
func (s *OwnerService) DuplicateBlock(userID, blockID string) (*models.BioBlock, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var original models.BioBlock
	err := s.db.Joins("JOIN bio_pages ON bio_pages.id = bio_blocks.page_id").
		Where("bio_blocks.id = ? AND bio_pages.user_id = ?", blockID, userID).
		First(&original).Error

	if err != nil {
		return nil, errors.New("blok sumber tidak ditemukan")
	}

	duplicate := models.BioBlock{
		ID:        fmt.Sprintf("blk_%d", time.Now().UnixNano()),
		PageID:    original.PageID,
		Type:      original.Type,
		Title:     original.Title + " (Salinan)",
		Content:   original.Content,
		URL:       original.URL,
		Subtitle:  original.Subtitle,
		Icon:      original.Icon,
		ImageURL:  original.ImageURL,
		Spotlight: original.Spotlight,
		Order:     original.Order + 1,
		IsActive:  true,
		Settings:  original.Settings,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(&duplicate).Error; err != nil {
		return nil, fmt.Errorf("gagal menduplikasi blok: %w", err)
	}

	return &duplicate, nil
}

// ReorderBlocks updates the display order of multiple blocks at once
func (s *OwnerService) ReorderBlocks(userID string, blockIDs []string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&page).Error; err != nil {
		return errors.New("halaman bio tidak ditemukan")
	}

	// Transaction to update orders
	return s.db.Transaction(func(tx *gorm.DB) error {
		for i, id := range blockIDs {
			if err := tx.Model(&models.BioBlock{}).
				Where("id = ? AND page_id = ?", id, page.ID).
				Update("order", i).Error; err != nil {
				return err
			}
		}
		return nil
	})
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
