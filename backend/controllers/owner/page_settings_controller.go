package owner

import (
	"encoding/json"
	"errors"
	"net/http"

	"klikin-backend/middlewares"
	"klikin-backend/services/page"
	"klikin-backend/views"
)

type PageSettingsController struct {
	service *page.PageSettingsService
}

func NewPageSettingsController(service *page.PageSettingsService) *PageSettingsController {
	return &PageSettingsController{service: service}
}

func (c *PageSettingsController) getUserID(r *http.Request) (string, error) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil || claims.UserID == "" {
		return "", errors.New("unauthorized")
	}
	return claims.UserID, nil
}

// GetSettings handles GET /api/owner/page/settings
func (c *PageSettingsController) GetSettings(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	settings, err := c.service.GetSettings(userID)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Pengaturan halaman berhasil dimuat", settings)
}

// UpdateSlug handles PUT /api/owner/page/slug
func (c *PageSettingsController) UpdateSlug(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		Slug string `json:"slug"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	slug, err := c.service.UpdateSlug(userID, body.Slug)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Slug tautan berhasil diubah menjadi: "+slug, map[string]string{
		"slug": slug,
	})
}

// UpdateVisibility handles PUT /api/owner/page/visibility
func (c *PageSettingsController) UpdateVisibility(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		Visibility string `json:"visibility"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	if err := c.service.UpdateVisibility(userID, body.Visibility); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Status visibilitas halaman berhasil diperbarui", nil)
}

// UpdatePassword handles PUT /api/owner/page/password
func (c *PageSettingsController) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		IsProtected bool   `json:"is_protected"`
		Password    string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	if err := c.service.UpdatePassword(userID, body.IsProtected, body.Password); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	msg := "Proteksi kata sandi berhasil diaktifkan"
	if !body.IsProtected {
		msg = "Proteksi kata sandi dinonaktifkan"
	}
	views.RenderSuccess(w, http.StatusOK, msg, nil)
}

// UpdateCustom404 handles PUT /api/owner/page/404
func (c *PageSettingsController) UpdateCustom404(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		RedirectURL string `json:"redirect_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	if err := c.service.UpdateCustom404(userID, body.RedirectURL); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Custom 404 redirect berhasil diperbarui", nil)
}

// UpdateFavicon handles PUT /api/owner/page/favicon
func (c *PageSettingsController) UpdateFavicon(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		FaviconURL string `json:"favicon_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	if err := c.service.UpdateFavicon(userID, body.FaviconURL); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Favicon halaman berhasil diperbarui", nil)
}

// UpdateSEO handles PUT /api/owner/page/seo
func (c *PageSettingsController) UpdateSEO(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		Title       string `json:"meta_title"`
		Description string `json:"meta_description"`
		OGImage     string `json:"og_image"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	if err := c.service.UpdateSEO(userID, body.Title, body.Description, body.OGImage); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Meta SEO dan Open Graph berhasil diperbarui", nil)
}

// UpdateTracking handles PUT /api/owner/page/tracking
func (c *PageSettingsController) UpdateTracking(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		GA4ID         string `json:"ga4_id"`
		MetaPixelID   string `json:"meta_pixel_id"`
		TikTokPixelID string `json:"tiktok_pixel_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	if err := c.service.UpdateTrackingPixels(userID, body.GA4ID, body.MetaPixelID, body.TikTokPixelID); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Pixel tracking analitik berhasil diperbarui", nil)
}
