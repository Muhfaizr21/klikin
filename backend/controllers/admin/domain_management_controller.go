package admin

import (
	"encoding/json"
	"net/http"
	"strconv"

	"klikin-backend/middlewares"
	adminService "klikin-backend/services/admin"
	"klikin-backend/views"
)

type DomainManagementController struct {
	useCase adminService.DomainManagementUseCase
}

func NewDomainManagementController(useCase adminService.DomainManagementUseCase) *DomainManagementController {
	return &DomainManagementController{useCase: useCase}
}

func (c *DomainManagementController) resolveAdminActor(r *http.Request) (string, string) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		return "usr_superadmin_01", "Super Admin"
	}
	name := claims.Email
	if name == "" {
		name = "Super Admin"
	}
	return claims.UserID, name
}

// GetDomains handles GET /api/admin/domains
func (c *DomainManagementController) GetDomains(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))

	filter := adminService.DomainListFilter{
		Search:    q.Get("search"),
		Status:    q.Get("status"),
		SSLStatus: q.Get("ssl_status"),
		SortBy:    q.Get("sort"),
		Page:      page,
		Limit:     limit,
	}

	res, err := c.useCase.GetDomainOverviewAndList(filter)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar domain kustom berhasil dimuat", res)
}

// GetDomainDetail handles GET /api/admin/domains/{id}
func (c *DomainManagementController) GetDomainDetail(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID domain wajib disertakan")
		return
	}

	res, err := c.useCase.GetDomainDetail(id)
	if err != nil {
		views.RenderError(w, http.StatusNotFound, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Detail diagnostik 360 domain berhasil dimuat", res)
}

// ReverifyDomainDNS handles POST /api/admin/domains/{id}/reverify
func (c *DomainManagementController) ReverifyDomainDNS(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID domain wajib disertakan")
		return
	}

	var req adminService.ReverifyDNSRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	adminID, adminName := c.resolveAdminActor(r)
	res, err := c.useCase.ReverifyDomainDNS(adminID, adminName, id, req)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Re-verifikasi DNS selesai dijalankan", res)
}

// BulkReverifyAllDNS handles POST /api/admin/domains/reverify-all
func (c *DomainManagementController) BulkReverifyAllDNS(w http.ResponseWriter, r *http.Request) {
	adminID, adminName := c.resolveAdminActor(r)
	res, err := c.useCase.BulkReverifyAllDNS(adminID, adminName)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Pengecekan massal seluruh DNS domain selesai", res)
}

// TriggerSSLProvisioning handles POST /api/admin/domains/{id}/ssl
func (c *DomainManagementController) TriggerSSLProvisioning(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID domain wajib disertakan")
		return
	}

	var req adminService.TriggerSSLRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	adminID, adminName := c.resolveAdminActor(r)
	res, err := c.useCase.TriggerSSLProvisioning(adminID, adminName, id, req)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Provisioning sertifikat SSL berhasil diperbarui", res)
}

// ReleaseDomain handles POST /api/admin/domains/{id}/release
func (c *DomainManagementController) ReleaseDomain(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID domain wajib disertakan")
		return
	}

	var req adminService.ReleaseDomainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format request tidak valid")
		return
	}

	adminID, adminName := c.resolveAdminActor(r)
	if err := c.useCase.ReleaseDomain(adminID, adminName, id, req); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Domain kustom berhasil dilepas dari halaman tenant", nil)
}

// SendDNSGuideToUser handles POST /api/admin/domains/{id}/send-guide
func (c *DomainManagementController) SendDNSGuideToUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID domain wajib disertakan")
		return
	}

	var req adminService.SendDNSGuideRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	adminID, adminName := c.resolveAdminActor(r)
	res, err := c.useCase.SendDNSGuideToUser(adminID, adminName, id, req)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Panduan konfigurasi DNS berhasil dikirim ke pengguna", res)
}

// UpdateDomainStatusManual handles PATCH /api/admin/domains/{id}/status
func (c *DomainManagementController) UpdateDomainStatusManual(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID domain wajib disertakan")
		return
	}

	var req adminService.UpdateDomainStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format request tidak valid")
		return
	}

	adminID, adminName := c.resolveAdminActor(r)
	res, err := c.useCase.UpdateDomainStatusManual(adminID, adminName, id, req)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Status domain kustom berhasil diperbarui", res)
}

// AddDomainByAdmin handles POST /api/admin/domains
func (c *DomainManagementController) AddDomainByAdmin(w http.ResponseWriter, r *http.Request) {
	var req adminService.AdminAddDomainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format request tidak valid")
		return
	}

	adminID, adminName := c.resolveAdminActor(r)
	res, err := c.useCase.AddDomainByAdmin(adminID, adminName, req)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Domain kustom berhasil dihubungkan ke halaman tenant", res)
}

// GetDiagnosticLogs handles GET /api/admin/domains/logs
func (c *DomainManagementController) GetDiagnosticLogs(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))

	filter := adminService.DiagnosticLogFilter{
		Search:    q.Get("search"),
		EventType: q.Get("event_type"),
		Severity:  q.Get("severity"),
		Page:      page,
		Limit:     limit,
	}

	res, err := c.useCase.GetDiagnosticLogs(filter)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Log error dan diagnostik DNS berhasil dimuat", res)
}
