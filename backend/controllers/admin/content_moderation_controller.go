package admin

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	adminService "klikin-backend/services/admin"
	"klikin-backend/views"
)

// ContentModerationController handles HTTP endpoints for Section 3.5 (Moderasi Konten)
type ContentModerationController struct {
	service adminService.ContentModerationUseCase
}

// NewContentModerationController instantiates the controller with injected use case (SOLID DIP)
func NewContentModerationController(service adminService.ContentModerationUseCase) *ContentModerationController {
	return &ContentModerationController{service: service}
}

// ListPages handles GET /api/admin/moderation/pages
func (c *ContentModerationController) ListPages(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page := 1
	if p, err := strconv.Atoi(q.Get("page")); err == nil && p > 0 {
		page = p
	}
	limit := 15
	if l, err := strconv.Atoi(q.Get("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	res, err := c.service.ListPublicPages(adminService.ModerationPageFilter{
		Search:           q.Get("search"),
		ModerationStatus: q.Get("status"),
		Category:         q.Get("category"),
		Published:        q.Get("published"),
		Sort:             q.Get("sort"),
		Page:             page,
		Limit:            limit,
	})
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat daftar halaman publik: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar halaman moderasi berhasil dimuat", res)
}

// GetPageDetail handles GET /api/admin/moderation/pages/{pageId}
func (c *ContentModerationController) GetPageDetail(w http.ResponseWriter, r *http.Request) {
	pageID := r.PathValue("pageId")
	if pageID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID halaman diperlukan")
		return
	}

	res, err := c.service.GetPageModerationDetail(pageID)
	if err != nil {
		views.RenderError(w, http.StatusNotFound, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Detail moderasi halaman berhasil dimuat", res)
}

// FlagPage handles POST /api/admin/moderation/pages/{pageId}/flag
func (c *ContentModerationController) FlagPage(w http.ResponseWriter, r *http.Request) {
	pageID := r.PathValue("pageId")
	if pageID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID halaman diperlukan")
		return
	}

	var dto adminService.FlagPageDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload JSON tidak valid")
		return
	}

	actor := extractAdminActor(r)
	page, err := c.service.FlagPage(pageID, dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Halaman /%s berhasil di-flag sebagai %s", page.Slug, strings.ToUpper(page.FlagCategory)), page)
}

// ClearFlag handles POST /api/admin/moderation/pages/{pageId}/clear-flag
func (c *ContentModerationController) ClearFlag(w http.ResponseWriter, r *http.Request) {
	pageID := r.PathValue("pageId")
	if pageID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID halaman diperlukan")
		return
	}

	var payload struct {
		Note string `json:"note"`
	}
	_ = json.NewDecoder(r.Body).Decode(&payload)

	actor := extractAdminActor(r)
	page, err := c.service.ClearPageFlag(pageID, payload.Note, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Flag pada halaman /%s berhasil dibersihkan (Status: CLEAN)", page.Slug), page)
}

// TakeDownPage handles POST /api/admin/moderation/pages/{pageId}/takedown
func (c *ContentModerationController) TakeDownPage(w http.ResponseWriter, r *http.Request) {
	pageID := r.PathValue("pageId")
	if pageID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID halaman diperlukan")
		return
	}

	var dto adminService.TakeDownPageDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload JSON tidak valid")
		return
	}

	actor := extractAdminActor(r)
	page, err := c.service.TakeDownPage(pageID, dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Halaman /%s berhasil di-take down dari publik", page.Slug), page)
}

// RestorePage handles POST /api/admin/moderation/pages/{pageId}/restore
func (c *ContentModerationController) RestorePage(w http.ResponseWriter, r *http.Request) {
	pageID := r.PathValue("pageId")
	if pageID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID halaman diperlukan")
		return
	}

	var payload struct {
		Note string `json:"note"`
	}
	_ = json.NewDecoder(r.Body).Decode(&payload)

	actor := extractAdminActor(r)
	page, err := c.service.RestorePage(pageID, payload.Note, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Halaman /%s berhasil dipulihkan dan kembali online", page.Slug), page)
}

// BanViolator handles POST /api/admin/moderation/users/{userId}/ban
func (c *ContentModerationController) BanViolator(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userId")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID user diperlukan")
		return
	}

	var dto adminService.BanViolatorDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload JSON tidak valid")
		return
	}

	actor := extractAdminActor(r)
	user, err := c.service.BanViolator(userID, dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("User pelanggar @%s berhasil di-ban permanen & halaman di-take down", user.Username), user)
}

// ScanAllPages handles POST /api/admin/moderation/scan
func (c *ContentModerationController) ScanAllPages(w http.ResponseWriter, r *http.Request) {
	actor := extractAdminActor(r)
	res, err := c.service.ScanAllPagesAgainstBlacklist(actor)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Pemindaian selesai: %d halaman & %d tautan diperiksa (%d temuan baru)", res.ScannedPages, res.ScannedURLs, res.FlaggedPages), res)
}

// ListReports handles GET /api/admin/moderation/reports
func (c *ContentModerationController) ListReports(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page := 1
	if p, err := strconv.Atoi(q.Get("page")); err == nil && p > 0 {
		page = p
	}
	limit := 15
	if l, err := strconv.Atoi(q.Get("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	res, err := c.service.ListVisitorReports(adminService.VisitorReportFilter{
		Search:   q.Get("search"),
		Status:   q.Get("status"),
		Category: q.Get("category"),
		Severity: q.Get("severity"),
		Page:     page,
		Limit:    limit,
	})
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar laporan pengunjung berhasil dimuat", res)
}

// ReviewReport handles POST /api/admin/moderation/reports/{reportId}/review
func (c *ContentModerationController) ReviewReport(w http.ResponseWriter, r *http.Request) {
	reportID := r.PathValue("reportId")
	if reportID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID laporan diperlukan")
		return
	}

	var dto adminService.ReviewReportDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload JSON tidak valid")
		return
	}

	actor := extractAdminActor(r)
	report, err := c.service.ReviewVisitorReport(reportID, dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Laporan pengunjung berhasil ditindaklanjuti", report)
}

// SubmitPublicReport handles POST /api/public/reports (unauthenticated visitor abuse reporting)
func (c *ContentModerationController) SubmitPublicReport(w http.ResponseWriter, r *http.Request) {
	var dto adminService.SubmitPublicReportDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format laporan tidak valid")
		return
	}

	clientIP := r.Header.Get("X-Forwarded-For")
	if clientIP == "" {
		clientIP = r.RemoteAddr
	}

	report, err := c.service.SubmitPublicReport(dto, clientIP)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Terima kasih! Laporan Anda telah diterima oleh Tim Trust & Safety Klikin.", report)
}

// ListBlacklist handles GET /api/admin/moderation/blacklist
func (c *ContentModerationController) ListBlacklist(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	items, err := c.service.ListBlacklist(q.Get("search"), q.Get("category"))
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar hitam domain/URL berhasil dimuat", items)
}

// AddBlacklist handles POST /api/admin/moderation/blacklist
func (c *ContentModerationController) AddBlacklist(w http.ResponseWriter, r *http.Request) {
	var dto adminService.SaveBlacklistDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload JSON tidak valid")
		return
	}

	actor := extractAdminActor(r)
	item, err := c.service.AddBlacklist(dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, fmt.Sprintf("Domain/URL '%s' berhasil ditambahkan ke daftar hitam", item.Pattern), item)
}

// ToggleBlacklist handles PUT /api/admin/moderation/blacklist/{id}/toggle
func (c *ContentModerationController) ToggleBlacklist(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID blacklist diperlukan")
		return
	}

	actor := extractAdminActor(r)
	item, err := c.service.ToggleBlacklist(id, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Status aturan blacklist '%s' berhasil diperbarui", item.Pattern), item)
}

// DeleteBlacklist handles DELETE /api/admin/moderation/blacklist/{id}
func (c *ContentModerationController) DeleteBlacklist(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID blacklist diperlukan")
		return
	}

	actor := extractAdminActor(r)
	if err := c.service.DeleteBlacklist(id, actor); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Entri berhasil dihapus dari daftar hitam", nil)
}

// ListLogs handles GET /api/admin/moderation/logs
func (c *ContentModerationController) ListLogs(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page := 1
	if p, err := strconv.Atoi(q.Get("page")); err == nil && p > 0 {
		page = p
	}
	limit := 20
	if l, err := strconv.Atoi(q.Get("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	res, err := c.service.ListModerationLogs(q.Get("search"), q.Get("action"), page, limit)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Riwayat log moderasi berhasil dimuat", res)
}

// ExportCSV handles GET /api/admin/moderation/export
func (c *ContentModerationController) ExportCSV(w http.ResponseWriter, r *http.Request) {
	data, err := c.service.ExportModerationCSV()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengekspor CSV moderasi: "+err.Error())
		return
	}

	filename := fmt.Sprintf("klikin-moderation-audit-%s.csv", time.Now().Format("2006-01-02"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}
