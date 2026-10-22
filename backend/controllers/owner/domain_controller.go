package owner

import (
	"encoding/json"
	"net/http"

	"klikin-backend/middlewares"
	domainService "klikin-backend/services/domain"
	"klikin-backend/views"
)

type DomainController struct {
	service *domainService.DomainService
}

func NewDomainController(service *domainService.DomainService) *DomainController {
	return &DomainController{service: service}
}

// GetDomain retrieves domain configuration and DNS instructions
func (c *DomainController) GetDomain(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	details, err := c.service.GetDomain(claims.UserID)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Informasi domain berhasil dimuat", details)
}

// AddDomain configures a new custom domain
func (c *DomainController) AddDomain(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var dto domainService.AddDomainDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	details, err := c.service.AddDomain(claims.UserID, dto)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Domain berhasil ditambahkan. Silakan ikuti instruksi DNS berikut.", details)
}

// VerifyDomain triggers re-verification of DNS records
func (c *DomainController) VerifyDomain(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	details, err := c.service.VerifyDomain(claims.UserID)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Verifikasi DNS berhasil diperbarui", details)
}

// UpdateSettings updates redirect_www and fallback_subdomain
func (c *DomainController) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var dto domainService.UpdateDomainSettingsDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	details, err := c.service.UpdateDomainSettings(claims.UserID, dto)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Pengaturan domain berhasil diperbarui", details)
}

// DeleteDomain disconnects and removes custom domain
func (c *DomainController) DeleteDomain(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	if err := c.service.DeleteDomain(claims.UserID); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Domain kustom berhasil dihapus dari halaman bio Anda", nil)
}
