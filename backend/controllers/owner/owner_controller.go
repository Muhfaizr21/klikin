package owner

import (
	"encoding/json"
	"net/http"

	"klikin-backend/middlewares"
	ownerService "klikin-backend/services/owner"
	"klikin-backend/views"
)

type OwnerController struct {
	service *ownerService.OwnerService
}

func NewOwnerController(service *ownerService.OwnerService) *OwnerController {
	return &OwnerController{service: service}
}

// GetWorkspace returns the isolated bio page & links strictly belonging to the authenticated Owner
func (c *OwnerController) GetWorkspace(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	workspace, err := c.service.GetWorkspace(claims.UserID)
	if err != nil {
		views.RenderError(w, http.StatusNotFound, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Ruang kerja pemilik akun berhasil dimuat", workspace)
}

// UpdatePage updates bio page information (title, bio, theme)
func (c *OwnerController) UpdatePage(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var dto ownerService.UpdatePageDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	updated, err := c.service.UpdateBioPage(claims.UserID, dto)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Pengaturan Bio Page berhasil disimpan", updated)
}

// CreateLink adds a link to the owner's isolated space
func (c *OwnerController) CreateLink(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var dto ownerService.CreateLinkDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	link, err := c.service.CreateLink(claims.UserID, dto)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Tautan berhasil ditambahkan", link)
}

// DeleteLink removes a link, enforcing tenant ownership
func (c *OwnerController) DeleteLink(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	linkID := r.PathValue("id")
	if linkID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID tautan tidak valid")
		return
	}

	if err := c.service.DeleteLink(claims.UserID, linkID); err != nil {
		views.RenderError(w, http.StatusNotFound, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Tautan berhasil dihapus", map[string]string{"id": linkID})
}
