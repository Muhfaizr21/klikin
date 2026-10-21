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
	err := config.DB.Preload("Links", func(db *gorm.DB) *gorm.DB {
		return db.Where("is_active = ?", true).Order("links.order asc, links.created_at asc")
	}).Where("slug = ? AND is_published = ?", slug, true).First(&page).Error

	if err != nil {
		views.RenderError(w, http.StatusNotFound, "Halaman bio tidak ditemukan atau belum dipublikasi")
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Halaman bio berhasil dimuat", page)
}
