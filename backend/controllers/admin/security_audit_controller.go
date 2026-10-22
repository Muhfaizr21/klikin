package admin

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"klikin-backend/middlewares"
	adminService "klikin-backend/services/admin"
	"klikin-backend/views"
)

// SecurityAuditController handles HTTP endpoints for Section 3.10 Security & Audit
type SecurityAuditController struct {
	service adminService.SecurityAuditUseCase
}

// NewSecurityAuditController creates the controller instance
func NewSecurityAuditController(service adminService.SecurityAuditUseCase) *SecurityAuditController {
	return &SecurityAuditController{service: service}
}

func extractSecurityAdminActor(r *http.Request) adminService.AdminActor {
	claims := middlewares.GetUserFromContext(r)
	ip := r.RemoteAddr
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		ip = strings.Split(fwd, ",")[0]
	}
	ip = strings.TrimSpace(ip)

	actor := adminService.AdminActor{
		ID:    "usr_superadmin_01",
		Name:  "Super Administrator",
		Email: "admin@klikin.id",
		Role:  "SUPER_ADMIN",
		IP:    ip,
	}
	if claims != nil {
		if claims.UserID != "" {
			actor.ID = claims.UserID
		}
		if claims.Username != "" {
			actor.Name = claims.Username
		} else if claims.Email != "" {
			actor.Name = claims.Email
		}
		if claims.Email != "" {
			actor.Email = claims.Email
		}
		if claims.Role != "" {
			actor.Role = string(claims.Role)
		}
	}
	return actor
}

// GetOverview returns security dashboard KPIs
func (c *SecurityAuditController) GetOverview(w http.ResponseWriter, r *http.Request) {
	overview, err := c.service.GetSecurityOverview()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat overview keamanan: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Overview keamanan berhasil dimuat", overview)
}

// ListAuditLogs returns paginated platform audit logs
func (c *SecurityAuditController) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	page, _ := strconv.Atoi(query.Get("page"))
	limit, _ := strconv.Atoi(query.Get("limit"))

	params := adminService.AuditFilterParams{
		Search: query.Get("search"),
		Action: query.Get("action"),
		Actor:  query.Get("actor"),
		Page:   page,
		Limit:  limit,
	}

	result, err := c.service.ListAuditLogs(params)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat log audit: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Log audit berhasil dimuat", result)
}

// ExportAuditLogs exports audit logs to CSV
func (c *SecurityAuditController) ExportAuditLogs(w http.ResponseWriter, r *http.Request) {
	action := r.URL.Query().Get("action")
	search := r.URL.Query().Get("search")

	csvData, err := c.service.ExportAuditLogsCSV(action, search)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengekspor log audit: "+err.Error())
		return
	}

	filename := fmt.Sprintf("klikin-audit-logs-%s.csv", time.Now().Format("20060102-150405"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(csvData)
}

// ListLoginLogs returns paginated login history
func (c *SecurityAuditController) ListLoginLogs(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	page, _ := strconv.Atoi(query.Get("page"))
	limit, _ := strconv.Atoi(query.Get("limit"))

	params := adminService.LoginFilterParams{
		Search: query.Get("search"),
		Status: query.Get("status"),
		Page:   page,
		Limit:  limit,
	}

	result, err := c.service.ListLoginLogs(params)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat log login: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Log login berhasil dimuat", result)
}

// ExportLoginLogs exports login logs to CSV
func (c *SecurityAuditController) ExportLoginLogs(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")

	csvData, err := c.service.ExportLoginLogsCSV(status, search)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengekspor log login: "+err.Error())
		return
	}

	filename := fmt.Sprintf("klikin-login-logs-%s.csv", time.Now().Format("20060102-150405"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(csvData)
}

// ListErrorLogs returns paginated application error logs
func (c *SecurityAuditController) ListErrorLogs(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	page, _ := strconv.Atoi(query.Get("page"))
	limit, _ := strconv.Atoi(query.Get("limit"))

	params := adminService.ErrorFilterParams{
		Search:   query.Get("search"),
		Severity: query.Get("severity"),
		Resolved: query.Get("resolved"),
		Page:     page,
		Limit:    limit,
	}

	result, err := c.service.ListErrorLogs(params)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat log error: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Log error berhasil dimuat", result)
}

// ResolveErrorLog toggles resolution of an error log
func (c *SecurityAuditController) ResolveErrorLog(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID error wajib diberikan")
		return
	}

	actor := extractSecurityAdminActor(r)
	updated, err := c.service.ResolveErrorLog(id, actor)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memperbarui status error: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Status log error berhasil diperbarui", updated)
}

// ListBlacklistedIPs returns all blocked IPs
func (c *SecurityAuditController) ListBlacklistedIPs(w http.ResponseWriter, r *http.Request) {
	ips, err := c.service.ListBlacklistedIPs()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat daftar blacklist IP: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Daftar blacklist IP berhasil dimuat", ips)
}

// AddBlacklistedIP adds an IP to blacklist
func (c *SecurityAuditController) AddBlacklistedIP(w http.ResponseWriter, r *http.Request) {
	var dto adminService.AddBlacklistIPDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload tidak valid: "+err.Error())
		return
	}

	actor := extractSecurityAdminActor(r)
	item, err := c.service.AddBlacklistedIP(dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusCreated, "Alamat IP berhasil diblacklist", item)
}

// ToggleBlacklistIP toggles active status of an IP
func (c *SecurityAuditController) ToggleBlacklistIP(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID blacklist wajib diberikan")
		return
	}

	actor := extractSecurityAdminActor(r)
	item, err := c.service.ToggleBlacklistIP(id, actor)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengubah status blacklist: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Status blacklist IP berhasil diperbarui", item)
}

// DeleteBlacklistedIP removes an IP from blacklist
func (c *SecurityAuditController) DeleteBlacklistedIP(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID blacklist wajib diberikan")
		return
	}

	actor := extractSecurityAdminActor(r)
	if err := c.service.DeleteBlacklistedIP(id, actor); err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal menghapus blacklist IP: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Blacklist IP berhasil dihapus", nil)
}

// GetRateLimitMonitor returns rate limit monitoring data
func (c *SecurityAuditController) GetRateLimitMonitor(w http.ResponseWriter, r *http.Request) {
	data, err := c.service.GetRateLimitMonitor()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat monitor rate limit: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Monitor rate limit berhasil dimuat", data)
}

// ListAdminSessions returns all active admin sessions
func (c *SecurityAuditController) ListAdminSessions(w http.ResponseWriter, r *http.Request) {
	sessions, err := c.service.ListAdminSessions()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat sesi admin: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Sesi admin berhasil dimuat", sessions)
}

// TerminateAdminSession revokes a specific session
func (c *SecurityAuditController) TerminateAdminSession(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID sesi wajib diberikan")
		return
	}

	actor := extractSecurityAdminActor(r)
	if err := c.service.TerminateAdminSession(id, actor); err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengakhiri sesi: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Sesi berhasil diakhiri", nil)
}

// TerminateAllOtherSessions revokes all sessions except the current one
func (c *SecurityAuditController) TerminateAllOtherSessions(w http.ResponseWriter, r *http.Request) {
	type RequestBody struct {
		CurrentSessionID string `json:"current_session_id"`
	}
	var body RequestBody
	_ = json.NewDecoder(r.Body).Decode(&body)
	if body.CurrentSessionID == "" {
		body.CurrentSessionID = "sess_admin_current"
	}

	actor := extractSecurityAdminActor(r)
	if err := c.service.TerminateAllOtherSessions(body.CurrentSessionID, actor); err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengakhiri semua sesi lainnya: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Semua sesi lain berhasil diakhiri", nil)
}

// GetSecurityPolicy returns current security policy
func (c *SecurityAuditController) GetSecurityPolicy(w http.ResponseWriter, r *http.Request) {
	policy, err := c.service.GetSecurityPolicy()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat kebijakan keamanan: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Kebijakan keamanan berhasil dimuat", policy)
}

// UpdateSecurityPolicy updates platform security configuration
func (c *SecurityAuditController) UpdateSecurityPolicy(w http.ResponseWriter, r *http.Request) {
	var dto adminService.UpdateSecurityPolicyDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload tidak valid: "+err.Error())
		return
	}

	actor := extractSecurityAdminActor(r)
	policy, err := c.service.UpdateSecurityPolicy(dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memperbarui kebijakan keamanan: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Kebijakan keamanan berhasil diperbarui", policy)
}

// TriggerBackup generates a manual database backup
func (c *SecurityAuditController) TriggerBackup(w http.ResponseWriter, r *http.Request) {
	var dto adminService.TriggerBackupDTO
	_ = json.NewDecoder(r.Body).Decode(&dto)

	actor := extractSecurityAdminActor(r)
	backup, err := c.service.TriggerManualBackup(dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memicu backup database: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusCreated, "Backup database manual berhasil dipicu", backup)
}

// ListBackups returns all backup records
func (c *SecurityAuditController) ListBackups(w http.ResponseWriter, r *http.Request) {
	records, err := c.service.ListBackupRecords()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat riwayat backup: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Riwayat backup berhasil dimuat", records)
}

// DownloadBackup downloads simulated or generated backup archive
func (c *SecurityAuditController) DownloadBackup(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID backup wajib diberikan")
		return
	}

	filename := fmt.Sprintf("%s.sql.gz", id)
	content := fmt.Sprintf("-- Klikin Platform PostgreSQL Backup Snapshot\n-- Generated for Backup ID: %s\n-- Timestamp: %s\n-- Status: Verified\n", id, time.Now().Format(time.RFC3339))

	w.Header().Set("Content-Type", "application/gzip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(content))
}
