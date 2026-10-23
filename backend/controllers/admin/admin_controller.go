package admin

import (
	"net/http"

	adminService "klikin-backend/services/admin"
	"klikin-backend/views"
)

type AdminController struct {
	service *adminService.AdminService
}

func NewAdminController(service *adminService.AdminService) *AdminController {
	return &AdminController{service: service}
}

func parseFilter(r *http.Request) adminService.OverviewFilter {
	return adminService.OverviewFilter{
		Period:     r.URL.Query().Get("period"),
		Compare:    r.URL.Query().Get("compare"),
		TenantType: r.URL.Query().Get("tenant_type"),
		TenantID:   r.URL.Query().Get("tenant_id"),
	}
}

// GetStats returns global platform metrics visible exclusively to SuperAdmin
func (c *AdminController) GetStats(w http.ResponseWriter, r *http.Request) {
	filter := parseFilter(r)
	stats, err := c.service.GetStatsFiltered(filter)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengambil statistik: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Statistik platform berhasil diambil", stats)
}

// GetOverview returns comprehensive platform overview intelligence including revenue breakdown, top tenants, funnel, cohorts, and hourly traffic
func (c *AdminController) GetOverview(w http.ResponseWriter, r *http.Request) {
	filter := parseFilter(r)
	overview, err := c.service.GetOverviewFiltered(filter)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat ringkasan platform: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Ringkasan analitik platform berhasil dimuat", overview)
}

