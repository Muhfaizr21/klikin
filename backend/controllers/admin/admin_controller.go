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

// GetUsers returns the full list of platform accounts for SuperAdmin
func (c *AdminController) GetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := c.service.ListUsers()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat daftar pengguna: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar seluruh pengguna platform", users)
}
