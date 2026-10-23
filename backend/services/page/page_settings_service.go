package page

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"klikin-backend/models"
)

type PageSettingsService struct {
	db *gorm.DB
}

func NewPageSettingsService(db *gorm.DB) *PageSettingsService {
	return &PageSettingsService{db: db}
}

var slugRegex = regexp.MustCompile(`^[a-z0-9][a-z0-9-_]{2,31}$`)

var reservedSlugs = map[string]bool{
	"admin": true, "api": true, "login": true, "register": true, "signup": true,
	"dashboard": true, "billing": true, "settings": true, "support": true,
	"leads": true, "domain": true, "analytics": true, "explore": true,
	"auth": true, "help": true, "status": true, "terms": true, "privacy": true,
}

type PageSettingsResponse struct {
	ID                  string `json:"id"`
	UserID              string `json:"user_id"`
	Slug                string `json:"slug"`
	Title               string `json:"title"`
	Bio                 string `json:"bio"`
	AvatarURL           string `json:"avatar_url"`
	FaviconURL          string `json:"favicon_url"`
	Visibility          string `json:"visibility"` // "public" | "private"
	IsPublished         bool   `json:"is_published"`
	IsPasswordProtected bool   `json:"is_password_protected"`
	HasPassword         bool   `json:"has_password"`
	Custom404Redirect   string `json:"custom_404_redirect"`
	MetaTitle           string `json:"meta_title"`
	MetaDescription     string `json:"meta_description"`
	OGImage             string `json:"og_image"`
	GA4ID               string `json:"ga4_id"`
	MetaPixelID         string `json:"meta_pixel_id"`
	TikTokPixelID       string `json:"tiktok_pixel_id"`
	IsPro               bool   `json:"is_pro"`
	CustomDomain        string `json:"custom_domain,omitempty"`
}

// GetSettings retrieves the complete page settings for the user
func (s *PageSettingsService) GetSettings(userID string) (*PageSettingsResponse, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	customDomainStr := ""
	if page.CustomDomain != nil {
		customDomainStr = *page.CustomDomain
	}

	visibility := page.Visibility
	if visibility == "" {
		if page.IsPublished {
			visibility = "public"
		} else {
			visibility = "private"
		}
	}

	return &PageSettingsResponse{
		ID:                  page.ID,
		UserID:              page.UserID,
		Slug:                page.Slug,
		Title:               page.Title,
		Bio:                 page.Bio,
		AvatarURL:           page.AvatarURL,
		FaviconURL:          page.FaviconURL,
		Visibility:          visibility,
		IsPublished:         page.IsPublished,
		IsPasswordProtected: page.IsPasswordProtected,
		HasPassword:         page.PagePassword != "",
		Custom404Redirect:   page.Custom404Redirect,
		MetaTitle:           page.MetaTitle,
		MetaDescription:     page.MetaDescription,
		OGImage:             page.OGImage,
		GA4ID:               page.GA4ID,
		MetaPixelID:         page.MetaPixelID,
		TikTokPixelID:       page.TikTokPixelID,
		IsPro:               user.IsPro,
		CustomDomain:        customDomainStr,
	}, nil
}

// UpdateSlug updates and validates the bio page slug
func (s *PageSettingsService) UpdateSlug(userID string, newSlug string) (string, error) {
	if s.db == nil {
		return "", errors.New("database not available")
	}

	cleanSlug := strings.ToLower(strings.TrimSpace(newSlug))
	if cleanSlug == "" {
		return "", errors.New("slug tautan tidak boleh kosong")
	}

	if !slugRegex.MatchString(cleanSlug) {
		return "", errors.New("slug hanya boleh berisi huruf kecil, angka, tanda minus (-), dan garis bawah (_), panjang 3-32 karakter")
	}

	if reservedSlugs[cleanSlug] {
		return "", errors.New("slug ini merupakan kata khusus sistem dan tidak dapat digunakan")
	}

	var setting models.PlatformSetting
	if err := s.db.Select("reserved_subdomains").First(&setting).Error; err == nil && setting.ReservedSubdomains != "" {
		for _, rSlug := range strings.Split(setting.ReservedSubdomains, ",") {
			if strings.EqualFold(strings.TrimSpace(rSlug), cleanSlug) {
				return "", errors.New("slug ini dicadangkan oleh sistem Klikin dan tidak dapat digunakan")
			}
		}
	}

	// Check if already taken by another bio page
	var count int64
	s.db.Model(&models.BioPage{}).Where("slug = ? AND user_id != ?", cleanSlug, userID).Count(&count)
	if count > 0 {
		return "", errors.New("slug ini sudah dipakai oleh pengguna lain, silakan pilih slug lain")
	}

	// Update page slug and user username
	now := time.Now()
	if err := s.db.Model(&models.BioPage{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		"slug":       cleanSlug,
		"updated_at": now,
	}).Error; err != nil {
		return "", err
	}

	_ = s.db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"username":   cleanSlug,
		"updated_at": now,
	})

	InvalidatePublicPageCache()
	return cleanSlug, nil
}

// UpdateVisibility toggles public vs private
func (s *PageSettingsService) UpdateVisibility(userID string, visibility string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	cleanVis := strings.ToLower(strings.TrimSpace(visibility))
	if cleanVis != "public" && cleanVis != "private" {
		return errors.New("visibilitas hanya dapat berupa 'public' atau 'private'")
	}

	isPublished := cleanVis == "public"

	err := s.db.Model(&models.BioPage{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		"visibility":   cleanVis,
		"is_published": isPublished,
		"updated_at":   time.Now(),
	}).Error
	if err == nil {
		InvalidatePublicPageCache()
	}
	return err
}

// UpdatePassword sets or disables page protection (Requires Pro)
func (s *PageSettingsService) UpdatePassword(userID string, isProtected bool, password string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return errors.New("pengguna tidak ditemukan")
	}

	if isProtected && !user.IsPro {
		return errors.New("fitur proteksi kata sandi halaman adalah fitur eksklusif Klikin Pro")
	}

	cleanPassword := strings.TrimSpace(password)
	if isProtected && cleanPassword == "" {
		return errors.New("kata sandi tidak boleh kosong jika proteksi diaktifkan")
	}

	updates := map[string]interface{}{
		"is_password_protected": isProtected,
		"updated_at":             time.Now(),
	}

	if isProtected {
		hashed, err := bcrypt.GenerateFromPassword([]byte(cleanPassword), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("gagal mengenkripsi kata sandi halaman: %w", err)
		}
		updates["page_password"] = string(hashed)
	} else {
		updates["page_password"] = ""
	}

	err := s.db.Model(&models.BioPage{}).Where("user_id = ?", userID).Updates(updates).Error
	if err == nil {
		InvalidatePublicPageCache()
	}
	return err
}

// UpdateCustom404 sets 404 fallback URL
func (s *PageSettingsService) UpdateCustom404(userID string, redirectURL string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	cleanURL := strings.TrimSpace(redirectURL)
	if cleanURL != "" {
		var user models.User
		if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
			return errors.New("pengguna tidak ditemukan")
		}
		if !user.IsPro {
			return errors.New("fitur custom 404 redirect adalah fitur eksklusif Klikin Pro")
		}
		if !strings.HasPrefix(cleanURL, "http://") && !strings.HasPrefix(cleanURL, "https://") {
			cleanURL = "https://" + cleanURL
		}
	}

	return s.db.Model(&models.BioPage{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		"custom_404_redirect": cleanURL,
		"updated_at":          time.Now(),
	}).Error
}

// UpdateFavicon updates favicon URL
func (s *PageSettingsService) UpdateFavicon(userID string, faviconURL string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	cleanURL := strings.TrimSpace(faviconURL)
	if cleanURL != "" {
		var user models.User
		if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
			return errors.New("pengguna tidak ditemukan")
		}
		if !user.IsPro {
			return errors.New("fitur upload custom favicon adalah fitur eksklusif Klikin Pro")
		}
	}

	return s.db.Model(&models.BioPage{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		"favicon_url": cleanURL,
		"updated_at":  time.Now(),
	}).Error
}

// UpdateSEO sets SEO and Open Graph tags
func (s *PageSettingsService) UpdateSEO(userID string, title, description, ogImage string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	return s.db.Model(&models.BioPage{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		"meta_title":       strings.TrimSpace(title),
		"meta_description": strings.TrimSpace(description),
		"og_image":         strings.TrimSpace(ogImage),
		"updated_at":       time.Now(),
	}).Error
}

// UpdateTrackingPixels updates GA4, Meta Pixel, and TikTok Pixel IDs
func (s *PageSettingsService) UpdateTrackingPixels(userID string, ga4ID, metaPixelID, tiktokPixelID string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return errors.New("pengguna tidak ditemukan")
	}

	cleanGA4 := strings.ToUpper(strings.TrimSpace(ga4ID))
	cleanMeta := strings.TrimSpace(metaPixelID)
	cleanTikTok := strings.TrimSpace(tiktokPixelID)

	if (cleanGA4 != "" || cleanMeta != "" || cleanTikTok != "") && !user.IsPro {
		return errors.New("fitur integrasi pixel pelacakan (GA4, Meta, TikTok) adalah fitur eksklusif Klikin Pro")
	}

	return s.db.Model(&models.BioPage{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		"ga4_id":          cleanGA4,
		"meta_pixel_id":   cleanMeta,
		"tiktok_pixel_id": cleanTikTok,
		"updated_at":      time.Now(),
	}).Error
}
