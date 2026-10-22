package public

import (
	"net/http"
	"sync"

	"klikin-backend/config"
	"klikin-backend/models"
	"klikin-backend/views"
)

type PageController struct{}

func NewPageController() *PageController {
	return &PageController{}
}

// GetBySlug retrieves a published bio page by its public slug with parallel query loading
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
	err := config.DB.Where("slug = ? AND is_published = ?", slug, true).First(&page).Error
	if err != nil {
		// Fallback: Cek apakah slug merupakan domain kustom yang aktif
		var cd models.CustomDomain
		if errCd := config.DB.Where("domain = ? AND status = ?", slug, models.DomainStatusActive).First(&cd).Error; errCd == nil {
			err = config.DB.Where("id = ? AND is_published = ?", cd.PageID, true).First(&page).Error
		}
	}

	if err != nil {
		var checkPage models.BioPage
		if errTd := config.DB.Select("moderation_status", "takedown_reason").Where("slug = ?", slug).First(&checkPage).Error; errTd == nil && checkPage.ModerationStatus == "taken_down" {
			views.RenderError(w, http.StatusForbidden, "Halaman ini telah dinonaktifkan oleh Tim Keamanan & Moderasi Klikin karena melanggar Ketentuan Layanan.")
			return
		}
		views.RenderError(w, http.StatusNotFound, "Halaman bio tidak ditemukan atau belum dipublikasi")
		return
	}

	if page.ModerationStatus == "taken_down" {
		views.RenderError(w, http.StatusForbidden, "Halaman ini telah dinonaktifkan oleh Tim Keamanan & Moderasi Klikin karena melanggar Ketentuan Layanan.")
		return
	}

	// Parallelize Blocks, Links, EmailCapture, and Owner status queries into a single network roundtrip
	var (
		blocks       []models.BioBlock
		links        []models.Link
		emailCapture models.EmailCaptureConfig
		hasEmailCap  bool
		owner        models.User
		errOwner     error
		wg           sync.WaitGroup
	)

	wg.Add(4)
	go func() {
		defer wg.Done()
		_ = config.DB.Where("page_id = ? AND is_active = ?", page.ID, true).
			Order("bio_blocks.order asc, bio_blocks.created_at asc").
			Find(&blocks).Error
	}()
	go func() {
		defer wg.Done()
		_ = config.DB.Where("page_id = ? AND is_active = ?", page.ID, true).
			Order("links.order asc, links.created_at asc").
			Find(&links).Error
	}()
	go func() {
		defer wg.Done()
		if errCap := config.DB.Where("page_id = ?", page.ID).First(&emailCapture).Error; errCap == nil {
			hasEmailCap = true
		}
	}()
	go func() {
		defer wg.Done()
		errOwner = config.DB.Select("is_pro", "status").Where("id = ?", page.UserID).First(&owner).Error
	}()
	wg.Wait()

	if errOwner == nil {
		if owner.Status == "suspended" || owner.Status == "banned" {
			views.RenderError(w, http.StatusForbidden, "Halaman bio ini sedang ditangguhkan sementara karena status akun pemilik.")
			return
		}
		page.IsPro = owner.IsPro
	}

	page.Blocks = blocks
	page.Links = links
	if hasEmailCap {
		page.EmailCapture = &emailCapture
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
