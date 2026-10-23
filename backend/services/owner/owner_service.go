package owner

import (
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
	pageSvc "klikin-backend/services/page"
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
	page.CustomCSS = sanitizeCustomCSS(dto.CustomCSS)
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

	pageSvc.InvalidatePublicPageCache()
	return &page, nil
}

// sanitizeCustomCSS strips dangerous HTML/script breakout sequences from user-provided CSS
func sanitizeCustomCSS(raw string) string {
	if raw == "" {
		return ""
	}
	cleaned := raw
	dangerousTokens := []string{"</style", "<style", "<script", "</script", "javascript:", "expression(", "vbscript:"}
	for _, token := range dangerousTokens {
		lower := strings.ToLower(cleaned)
		for strings.Contains(lower, token) {
			idx := strings.Index(lower, token)
			cleaned = cleaned[:idx] + cleaned[idx+len(token):]
			lower = strings.ToLower(cleaned)
		}
	}
	return strings.TrimSpace(cleaned)
}

// sanitizeAndValidateURL prevents Stored XSS by enforcing strict protocol whitelisting (SEC-06)
func sanitizeAndValidateURL(rawURL string) (string, error) {
	trimmed := strings.TrimSpace(rawURL)
	if trimmed == "" || trimmed == "#" {
		return trimmed, nil
	}

	lower := strings.ToLower(trimmed)
	// Explicitly reject dangerous executable or data URIs
	disallowedPrefixes := []string{"javascript:", "data:", "vbscript:", "file:", "blob:", "about:"}
	for _, p := range disallowedPrefixes {
		if strings.HasPrefix(lower, p) {
			return "", errors.New("skema URL berbahaya ditolak oleh sistem keamanan (hanya diizinkan http, https, mailto, tel, whatsapp)")
		}
	}

	// Auto-prepend https:// if scheme is missing
	if !strings.HasPrefix(lower, "http://") && !strings.HasPrefix(lower, "https://") &&
		!strings.HasPrefix(lower, "mailto:") && !strings.HasPrefix(lower, "tel:") &&
		!strings.HasPrefix(lower, "whatsapp:") {
		trimmed = "https://" + trimmed
	}

	parsed, err := url.Parse(trimmed)
	if err != nil {
		return "", errors.New("format URL tidak valid")
	}

	allowedSchemes := map[string]bool{
		"http":     true,
		"https":    true,
		"mailto":   true,
		"tel":      true,
		"whatsapp": true,
	}
	if !allowedSchemes[parsed.Scheme] {
		return "", fmt.Errorf("skema URL '%s' tidak diizinkan", parsed.Scheme)
	}

	return trimmed, nil
}

// validateBlockModeration checks URL, Title, and Content against active BlacklistedDomain & Keyword rules (Module 3.5 sync)
func (s *OwnerService) validateBlockModeration(userID string, page *models.BioPage, blockID, title, content, rawURL string) error {
	if s.db == nil {
		return nil
	}

	var rules []models.BlacklistedDomain
	if err := s.db.Where("is_active = ?", true).Find(&rules).Error; err != nil {
		return nil
	}

	lowerURL := strings.ToLower(strings.TrimSpace(rawURL))
	combinedText := strings.ToLower(title + " " + content + " " + rawURL)

	for _, b := range rules {
		pattern := strings.ToLower(strings.TrimSpace(b.Pattern))
		if pattern == "" {
			continue
		}

		matched := false
		if b.MatchType == "keyword" {
			matched = strings.Contains(combinedText, pattern)
		} else {
			matched = lowerURL != "" && strings.Contains(lowerURL, pattern)
		}

		if matched {
			_ = s.db.Model(&models.BlacklistedDomain{}).Where("id = ?", b.ID).
				UpdateColumn("hit_count", gorm.Expr("hit_count + 1")).Error

			if page != nil {
				now := time.Now()
				report := models.ContentReport{
					ID:            fmt.Sprintf("rep_auto_%d", now.UnixNano()),
					PageID:        page.ID,
					Slug:          page.Slug,
					OwnerUserID:   userID,
					ReporterName:  "Sistem Filter Otomatis Klikin",
					ReporterEmail: "security@klikin.id",
					ReporterIP:    "127.0.0.1",
					Category:      b.Category,
					Severity:      b.Severity,
					Description:   fmt.Sprintf("Blok '%s' memicu aturan daftar hitam '%s' (%s)", title, b.Pattern, b.Reason),
					TargetURL:     rawURL,
					Status:        models.ReportStatusPending,
					CreatedAt:     now,
					UpdatedAt:     now,
				}
				_ = s.db.Create(&report)
			}

			return fmt.Errorf("konten/tautan ditolak oleh sistem keamanan Klikin: '%s' terdeteksi melanggar kebijakan (%s)", b.Pattern, strings.ToUpper(b.Category))
		}
	}
	return nil
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

	// Enforce FreeMaxLinks from PlatformSetting for Free Tier users
	var user models.User
	if err := s.db.Select("is_pro").Where("id = ?", userID).First(&user).Error; err == nil && !user.IsPro {
		var setting models.PlatformSetting
		if errSet := s.db.Select("free_max_links").First(&setting).Error; errSet == nil && setting.FreeMaxLinks > 0 {
			if int(count) >= setting.FreeMaxLinks {
				return nil, fmt.Errorf("akun Gratis dibatasi maksimal %d blok/tautan per halaman. Silakan upgrade ke Klikin Pro untuk tautan tanpa batas", setting.FreeMaxLinks)
			}
		}
	}

	blockID := fmt.Sprintf("blk_%d", time.Now().UnixNano())
	safeURL, err := sanitizeAndValidateURL(dto.URL)
	if err != nil {
		return nil, err
	}
	dto.URL = safeURL

	if err := s.validateBlockModeration(userID, &page, blockID, dto.Title, dto.Content, dto.URL); err != nil {
		return nil, err
	}

	block := models.BioBlock{
		ID:        blockID,
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

	pageSvc.InvalidatePublicPageCache()
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
		safeURL, err := sanitizeAndValidateURL(*dto.URL)
		if err != nil {
			return nil, err
		}
		block.URL = safeURL
	}
	var page models.BioPage
	_ = s.db.Where("id = ?", block.PageID).First(&page).Error
	if err := s.validateBlockModeration(userID, &page, block.ID, block.Title, block.Content, block.URL); err != nil {
		return nil, err
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

	pageSvc.InvalidatePublicPageCache()
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

	pageSvc.InvalidatePublicPageCache()
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

	pageSvc.InvalidatePublicPageCache()
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
	err := s.db.Transaction(func(tx *gorm.DB) error {
		for i, id := range blockIDs {
			if err := tx.Model(&models.BioBlock{}).
				Where("id = ? AND page_id = ?", id, page.ID).
				Update("order", i).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err == nil {
		pageSvc.InvalidatePublicPageCache()
	}
	return err
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

	safeURL, err := sanitizeAndValidateURL(dto.URL)
	if err != nil {
		return nil, err
	}
	dto.URL = safeURL

	if err := s.validateBlockModeration(userID, &page, "", dto.Title, "", dto.URL); err != nil {
		return nil, err
	}

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

	pageSvc.InvalidatePublicPageCache()
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

	pageSvc.InvalidatePublicPageCache()
	return nil
}
