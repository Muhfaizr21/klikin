package owner

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"klikin-backend/middlewares"
	analyticsService "klikin-backend/services/analytics"
	"klikin-backend/views"
)

type AnalyticsController struct {
	service *analyticsService.AnalyticsService
}

func NewAnalyticsController(service *analyticsService.AnalyticsService) *AnalyticsController {
	return &AnalyticsController{service: service}
}

// GetAnalytics handles GET /api/owner/analytics?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&preset=...
func (c *AnalyticsController) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse query params
	query := r.URL.Query()
	startStr := query.Get("start_date")
	endStr := query.Get("end_date")
	preset := query.Get("preset")

	now := time.Now()
	endDate := now
	startDate := now.AddDate(0, 0, -6) // default: 7 days including today

	if startStr != "" && endStr != "" {
		if parsedStart, err := time.Parse("2006-01-02", startStr); err == nil {
			startDate = parsedStart
		}
		if parsedEnd, err := time.Parse("2006-01-02", endStr); err == nil {
			endDate = parsedEnd
		}
	} else if preset != "" {
		switch preset {
		case "30d":
			startDate = now.AddDate(0, 0, -29)
		case "90d":
			startDate = now.AddDate(0, 0, -89)
		case "today":
			startDate = now
		default: // "7d"
			startDate = now.AddDate(0, 0, -6)
		}
	}

	data, err := c.service.GetOwnerAnalytics(claims.UserID, startDate, endDate, true)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Data analitik berhasil dimuat", data)
}

// ExportCSV handles GET /api/owner/analytics/export?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
func (c *AnalyticsController) ExportCSV(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	query := r.URL.Query()
	startStr := query.Get("start_date")
	endStr := query.Get("end_date")

	now := time.Now()
	endDate := now
	startDate := now.AddDate(0, 0, -29) // default 30d export

	if startStr != "" && endStr != "" {
		if parsedStart, err := time.Parse("2006-01-02", startStr); err == nil {
			startDate = parsedStart
		}
		if parsedEnd, err := time.Parse("2006-01-02", endStr); err == nil {
			endDate = parsedEnd
		}
	}

	data, err := c.service.GetOwnerAnalytics(claims.UserID, startDate, endDate, true)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	if !data.IsPro {
		views.RenderError(w, http.StatusForbidden, "FITUR_PRO: Ekspor data CSV analitik merupakan fitur Klikin Pro.")
		return
	}

	// Prepare CSV response
	filename := fmt.Sprintf("klikin-analytics-%s-sd-%s.csv", data.StartDate, data.EndDate)
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	// UTF-8 BOM for Excel compatibility
	w.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// 1. Header Summary
	writer.Write([]string{"LAPORAN PERFORMA ANALITIK KLIKIN BIO"})
	writer.Write([]string{"Rentang Tanggal", fmt.Sprintf("%s s/d %s (%d Hari)", data.StartDate, data.EndDate, data.DaysCount)})
	writer.Write([]string{"Total Tampilan Halaman (Page Views)", strconv.FormatInt(data.Summary.PageViews, 10)})
	writer.Write([]string{"Total Klik Tautan (Total Clicks)", strconv.FormatInt(data.Summary.TotalClicks, 10)})
	writer.Write([]string{"Rata-rata Rasio Klik (CTR %)", fmt.Sprintf("%.2f%%", data.Summary.CTR)})
	writer.Write([]string{"Pengunjung Unik", strconv.FormatInt(data.Summary.UniqueVisitors, 10)})
	writer.Write([]string{""})

	// 2. Timeline Daily
	writer.Write([]string{"--- RINCIAN TREN HARIAN ---"})
	writer.Write([]string{"Tanggal", "Tampilan Halaman", "Total Klik", "Rasio Klik (CTR %)"})
	for _, pt := range data.Timeline {
		writer.Write([]string{
			pt.Date,
			strconv.FormatInt(pt.Views, 10),
			strconv.FormatInt(pt.Clicks, 10),
			fmt.Sprintf("%.2f%%", pt.CTR),
		})
	}
	writer.Write([]string{""})

	// 3. Links Breakdown
	writer.Write([]string{"--- PERFORMA PER TAUTAN / BLOK ---"})
	writer.Write([]string{"Judul Tautan", "URL Target", "Jumlah Klik", "Pangsa Klik (%)", "Rasio Konversi CTR (%)"})
	for _, l := range data.LinksBreakdown {
		writer.Write([]string{
			l.Title,
			l.URL,
			strconv.FormatInt(l.Clicks, 10),
			fmt.Sprintf("%.2f%%", l.ShareRate),
			fmt.Sprintf("%.2f%%", l.CTR),
		})
	}
	writer.Write([]string{""})

	// 4. Traffic Sources
	writer.Write([]string{"--- SUMBER TRAFIK (PRO) ---"})
	writer.Write([]string{"Kanal / Platform", "Jumlah Interaksi", "Persentase (%)"})
	for _, ts := range data.TrafficSources {
		writer.Write([]string{
			ts.Name,
			strconv.FormatInt(ts.Count, 10),
			fmt.Sprintf("%.2f%%", ts.Percentage),
		})
	}
}
