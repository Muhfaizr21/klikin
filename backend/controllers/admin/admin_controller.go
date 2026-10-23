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

// GetStats returns global platform metrics visible exclusively to SuperAdmin
func (c *AdminController) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := c.service.GetStats()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengambil statistik: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Statistik platform berhasil diambil", stats)
}

// GetOverview returns comprehensive platform overview intelligence including revenue breakdown, top tenants, funnel, cohorts, and hourly traffic
func (c *AdminController) GetOverview(w http.ResponseWriter, r *http.Request) {
	overview, err := c.service.GetOverview()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat ringkasan platform: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Ringkasan analitik platform berhasil dimuat", overview)
}

