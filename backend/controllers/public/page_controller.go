package public

import (
	"errors"
	"net/http"

	pageSvc "klikin-backend/services/page"
	"klikin-backend/views"
)

type PageController struct {
	service pageSvc.PublicPageProvider
}

func NewPageController(service pageSvc.PublicPageProvider) *PageController {
	return &PageController{service: service}
}

// GetBySlug retrieves a published bio page by its public slug via PublicPageProvider
func (c *PageController) GetBySlug(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		views.RenderError(w, http.StatusBadRequest, "Slug halaman diperlukan")
		return
	}

	reqPass := r.Header.Get("X-Page-Password")
	if reqPass == "" {
		reqPass = r.URL.Query().Get("password")
	}

	page, err := c.service.GetPublishedPage(slug, reqPass)
	if err != nil {
		switch {
		case errors.Is(err, pageSvc.ErrDatabaseUnavailable):
			views.RenderError(w, http.StatusServiceUnavailable, err.Error())
		case errors.Is(err, pageSvc.ErrPageTakenDown), errors.Is(err, pageSvc.ErrOwnerSuspended):
			views.RenderError(w, http.StatusForbidden, err.Error())
		default:
			views.RenderError(w, http.StatusNotFound, err.Error())
		}
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Halaman bio berhasil dimuat", page)
}
