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

// GetWorkspace returns the isolated bio page, blocks, & links strictly belonging to the authenticated Owner
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

// UpdatePage updates bio page details, styles, fonts, colors, SEO, and status
func (c *OwnerController) UpdatePage(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var dto ownerService.UpdateBioPageDTO
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

// CreateBlock adds a new block to the bio page
func (c *OwnerController) CreateBlock(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var dto ownerService.CreateBlockDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	block, err := c.service.CreateBlock(claims.UserID, dto)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Blok bio berhasil ditambahkan", block)
}

// UpdateBlock updates block properties
func (c *OwnerController) UpdateBlock(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	blockID := r.PathValue("id")
	if blockID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID blok tidak valid")
		return
	}

	var dto ownerService.UpdateBlockDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	block, err := c.service.UpdateBlock(claims.UserID, blockID, dto)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Blok bio berhasil diperbarui", block)
}

// DeleteBlock removes a block
func (c *OwnerController) DeleteBlock(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	blockID := r.PathValue("id")
	if blockID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID blok tidak valid")
		return
	}

	if err := c.service.DeleteBlock(claims.UserID, blockID); err != nil {
		views.RenderError(w, http.StatusNotFound, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Blok bio berhasil dihapus", nil)
}

// DuplicateBlock creates a duplicate of an existing block
func (c *OwnerController) DuplicateBlock(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	blockID := r.PathValue("id")
	if blockID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID blok tidak valid")
		return
	}

	block, err := c.service.DuplicateBlock(claims.UserID, blockID)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Blok bio berhasil diduplikasi", block)
}

// ReorderBlocks updates the order sequence of blocks
func (c *OwnerController) ReorderBlocks(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var payload struct {
		BlockIDs []string `json:"block_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if err := c.service.ReorderBlocks(claims.UserID, payload.BlockIDs); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Urutan blok berhasil diperbarui", nil)
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

	views.RenderSuccess(w, http.StatusOK, "Tautan berhasil dihapus", nil)
}
