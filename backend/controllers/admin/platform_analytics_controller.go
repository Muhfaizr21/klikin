package admin

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	adminService "klikin-backend/services/admin"
	"klikin-backend/views"
)

// PlatformAnalyticsController handles HTTP endpoints for platform-wide analytics (Section 3.6)
type PlatformAnalyticsController struct {
	service *adminService.PlatformAnalyticsService
}

// NewPlatformAnalyticsController instantiates a new controller with injected service (SOLID SRP & DI)
func NewPlatformAnalyticsController(service *adminService.PlatformAnalyticsService) *PlatformAnalyticsController {
	return &PlatformAnalyticsController{service: service}
}

// GetAnalytics returns aggregated platform analytics for 7, 30, or 90 days
func (c *PlatformAnalyticsController) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	daysStr := r.URL.Query().Get("days")
	days := 30
	if daysStr != "" {
		if parsed, err := strconv.Atoi(daysStr); err == nil && (parsed == 7 || parsed == 30 || parsed == 90) {
			days = parsed
		}
	}

	data, err := c.service.GetPlatformAnalytics(days)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat analitik platform: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Analitik platform berhasil dimuat", data)
}

// ExportCSV exports filtered platform analytics as a real CSV file
func (c *PlatformAnalyticsController) ExportCSV(w http.ResponseWriter, r *http.Request) {
	daysStr := r.URL.Query().Get("days")
	days := 30
	if daysStr != "" {
		if parsed, err := strconv.Atoi(daysStr); err == nil && (parsed == 7 || parsed == 30 || parsed == 90) {
			days = parsed
		}
	}

	csvData, err := c.service.ExportCSV(days)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengekspor CSV analitik platform: "+err.Error())
		return
	}

	filename := fmt.Sprintf("klikin-analitik-platform-%dhari-%s.csv", days, time.Now().Format("2006-01-02"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	// UTF-8 BOM for spreadsheet compatibility
	w.Write([]byte{0xEF, 0xBB, 0xBF})
	w.Write(csvData)
}
