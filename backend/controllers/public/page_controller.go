package public

import (
	"net/http"

	"gorm.io/gorm"
	"klikin-backend/config"
	"klikin-backend/models"
	"klikin-backend/views"
)

type PageController struct{}

func NewPageController() *PageController {
	return &PageController{}
}

// GetBySlug retrieves a published bio page by its public slug
func (c *PageController) GetBySlug(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		views.RenderError(w, http.StatusBadRequest, "Slug halaman diperlukan")
		return
	}

	if config.DB == nil {
		views.RenderError(w, http.StatusServiceUnavailable, "Database not available")
		return
	}

	var page models.BioPage
	err := config.DB.Preload("Blocks", func(db *gorm.DB) *gorm.DB {
		return db.Where("is_active = ?", true).Order("bio_blocks.order asc, bio_blocks.created_at asc")
	}).Preload("Links", func(db *gorm.DB) *gorm.DB {
		return db.Where("is_active = ?", true).Order("links.order asc, links.created_at asc")
	}).Preload("EmailCapture").Where("slug = ? AND is_published = ?", slug, true).First(&page).Error

	if err != nil {
		// Fallback 10 langkah ke depan: Cek apakah slug merupakan domain kustom yang aktif
		var cd models.CustomDomain
		if errCd := config.DB.Where("domain = ? AND status = ?", slug, models.DomainStatusActive).First(&cd).Error; errCd == nil {
			err = config.DB.Preload("Blocks", func(db *gorm.DB) *gorm.DB {
				return db.Where("is_active = ?", true).Order("bio_blocks.order asc, bio_blocks.created_at asc")
			}).Preload("Links", func(db *gorm.DB) *gorm.DB {
				return db.Where("is_active = ?", true).Order("links.order asc, links.created_at asc")
			}).Preload("EmailCapture").Where("id = ? AND is_published = ?", cd.PageID, true).First(&page).Error
		}
	}

	if err != nil {
		views.RenderError(w, http.StatusNotFound, "Halaman bio tidak ditemukan atau belum dipublikasi")
		return
	}

	var owner models.User
	if errOwner := config.DB.Select("is_pro").Where("id = ?", page.UserID).First(&owner).Error; errOwner == nil {
		page.IsPro = owner.IsPro
	}

	// Enforce page password protection
	if page.IsPasswordProtected && page.PagePassword != "" {
		reqPass := r.Header.Get("X-Page-Password")
		if reqPass == "" {
			reqPass = r.URL.Query().Get("password")
		}
		if reqPass != page.PagePassword {
			page.IsLocked = true
			page.Blocks = nil
			page.Links = nil
			page.EmailCapture = nil
		}
	}
	page.PagePassword = ""

	views.RenderSuccess(w, http.StatusOK, "Halaman bio berhasil dimuat", page)
}
