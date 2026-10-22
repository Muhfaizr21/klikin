package admin

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"klikin-backend/middlewares"
	adminService "klikin-backend/services/admin"
	"klikin-backend/views"
)

// UserManagementController handles administrative endpoints for Section 3.2 (Manajemen User)
type UserManagementController struct {
	service *adminService.UserManagementService
}

// NewUserManagementController instantiates controller with injected UserManagementService
func NewUserManagementController(service *adminService.UserManagementService) *UserManagementController {
	return &UserManagementController{service: service}
}

// ListUsers returns paginated users with filters (search, status, plan, sort) and platform user metrics
func (c *UserManagementController) ListUsers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	search := q.Get("search")
	status := q.Get("status")
	plan := q.Get("plan")
	sort := q.Get("sort")

	page := 1
	if p, err := strconv.Atoi(q.Get("page")); err == nil && p > 0 {
		page = p
	}

	limit := 10
	if l, err := strconv.Atoi(q.Get("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	result, err := c.service.ListUsers(search, status, plan, sort, page, limit)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat daftar pengguna: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar pengguna berhasil dimuat", result)
}

// GetUserDetail returns comprehensive user data: profile, bio pages, subscription, analytics, activity logs, internal notes
func (c *UserManagementController) GetUserDetail(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	detail, err := c.service.GetUserDetail(userID)
	if err != nil {
		views.RenderError(w, http.StatusNotFound, "Pengguna tidak ditemukan: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Detail pengguna berhasil dimuat", detail)
}

// UpdateUser handles editing user profile, credentials, status, or resetting password
func (c *UserManagementController) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	var dto adminService.UpdateUserDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format payload tidak valid: "+err.Error())
		return
	}

	adminClaims := middlewares.GetUserFromContext(r)
	adminID := "admin"
	adminName := "Super Administrator"
	if adminClaims != nil {
		adminID = adminClaims.UserID
		if adminClaims.Username != "" {
			adminName = adminClaims.Username
		} else if adminClaims.Email != "" {
			adminName = adminClaims.Email
		}
	}

	updatedUser, err := c.service.UpdateUser(userID, dto, adminID, adminName)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal memperbarui pengguna: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Data pengguna berhasil diperbarui", updatedUser)
}

// SuspendUser temporarily suspends a user with an administrative reason
func (c *UserManagementController) SuspendUser(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	adminClaims := middlewares.GetUserFromContext(r)
	adminID := "admin"
	adminName := "Super Administrator"
	if adminClaims != nil {
		adminID = adminClaims.UserID
		adminName = adminClaims.Username
	}

	if err := c.service.SuspendUser(userID, req.Reason, adminID, adminName); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal menangguhkan pengguna: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Pengguna berhasil ditangguhkan sementara", map[string]string{
		"user_id": userID,
		"status":  "suspended",
		"reason":  req.Reason,
	})
}

// UnsuspendUser reactivates a suspended user
func (c *UserManagementController) UnsuspendUser(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	adminClaims := middlewares.GetUserFromContext(r)
	adminID := "admin"
	adminName := "Super Administrator"
	if adminClaims != nil {
		adminID = adminClaims.UserID
		adminName = adminClaims.Username
	}

	if err := c.service.UnsuspendUser(userID, adminID, adminName); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal mengaktifkan kembali pengguna: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Pengguna berhasil diaktifkan kembali", map[string]string{
		"user_id": userID,
		"status":  "active",
	})
}

// BanUser permanently bans a user from the platform
func (c *UserManagementController) BanUser(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	adminClaims := middlewares.GetUserFromContext(r)
	adminID := "admin"
	adminName := "Super Administrator"
	if adminClaims != nil {
		adminID = adminClaims.UserID
		adminName = adminClaims.Username
	}

	if err := c.service.BanUser(userID, req.Reason, adminID, adminName); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal memblokir permanen pengguna: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Pengguna berhasil diblokir permanen", map[string]string{
		"user_id": userID,
		"status":  "banned",
		"reason":  req.Reason,
	})
}

// UnbanUser lifts permanent ban on a user
func (c *UserManagementController) UnbanUser(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	adminClaims := middlewares.GetUserFromContext(r)
	adminID := "admin"
	adminName := "Super Administrator"
	if adminClaims != nil {
		adminID = adminClaims.UserID
		adminName = adminClaims.Username
	}

	if err := c.service.UnbanUser(userID, adminID, adminName); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal membatalkan blokir pengguna: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Status blokir permanen berhasil dicabut", map[string]string{
		"user_id": userID,
		"status":  "active",
	})
}

// DeleteUser handles soft delete or hard purge of a user
func (c *UserManagementController) DeleteUser(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	hardDelete := r.URL.Query().Get("mode") == "hard" || r.URL.Query().Get("hard") == "true"

	adminClaims := middlewares.GetUserFromContext(r)
	adminID := "admin"
	adminName := "Super Administrator"
	if adminClaims != nil {
		adminID = adminClaims.UserID
		adminName = adminClaims.Username
	}

	if err := c.service.DeleteUser(userID, hardDelete, adminID, adminName); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal menghapus pengguna: "+err.Error())
		return
	}

	deleteType := "soft delete (dinonaktifkan)"
	if hardDelete {
		deleteType = "hard delete (dihapus permanen dari basis data)"
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Pengguna berhasil diproses dengan %s", deleteType), map[string]interface{}{
		"user_id":     userID,
		"hard_delete": hardDelete,
	})
}

// ImpersonateUser generates authentication token to log into user workspace as tenant
func (c *UserManagementController) ImpersonateUser(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	token, targetUser, err := c.service.ImpersonateUser(userID)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal melakukan impersonasi: "+err.Error())
		return
	}

	adminClaims := middlewares.GetUserFromContext(r)
	adminEmail := "admin@klikin.id"
	if adminClaims != nil && adminClaims.Email != "" {
		adminEmail = adminClaims.Email
	}

	views.RenderSuccess(w, http.StatusOK, "Sesi impersonasi berhasil dibuat", map[string]interface{}{
		"token":          token,
		"user":           targetUser,
		"impersonated_by": adminEmail,
	})
}

// ToggleVerification toggles verified badge (centang biru)
func (c *UserManagementController) ToggleVerification(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	adminClaims := middlewares.GetUserFromContext(r)
	adminName := "Super Administrator"
	if adminClaims != nil && adminClaims.Username != "" {
		adminName = adminClaims.Username
	}

	isVerified, err := c.service.ToggleVerification(userID, adminName)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal mengubah status verifikasi: "+err.Error())
		return
	}

	statusText := "dicabut"
	if isVerified {
		statusText = "diberikan (centang biru aktif)"
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Lencana verifikasi resmi berhasil %s", statusText), map[string]interface{}{
		"user_id":     userID,
		"is_verified": isVerified,
	})
}

// AddInternalNote adds an administrative note to a user profile
func (c *UserManagementController) AddInternalNote(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	var req struct {
		Note string `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Note == "" {
		views.RenderError(w, http.StatusBadRequest, "Isi catatan internal wajib diisi")
		return
	}

	adminClaims := middlewares.GetUserFromContext(r)
	adminID := "admin"
	adminName := "Super Administrator"
	if adminClaims != nil {
		adminID = adminClaims.UserID
		if adminClaims.Username != "" {
			adminName = adminClaims.Username
		} else if adminClaims.Email != "" {
			adminName = adminClaims.Email
		}
	}

	note, err := c.service.AddInternalNote(userID, adminID, adminName, req.Note)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal menambahkan catatan internal: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Catatan internal berhasil disimpan", note)
}

// DeleteInternalNote deletes an administrative note
func (c *UserManagementController) DeleteInternalNote(w http.ResponseWriter, r *http.Request) {
	noteID := r.PathValue("noteId")
	if noteID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID catatan internal wajib disertakan")
		return
	}

	if err := c.service.DeleteInternalNote(noteID); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal menghapus catatan internal: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Catatan internal berhasil dihapus", map[string]string{
		"note_id": noteID,
	})
}

// ExportCSV exports filtered user directory as a real RFC 4180 CSV spreadsheet
func (c *UserManagementController) ExportCSV(w http.ResponseWriter, r *http.Request) {
	csvData, err := c.service.ExportUsersCSV()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengekspor CSV data pengguna: "+err.Error())
		return
	}

	filename := fmt.Sprintf("klikin-direktori-pengguna-%s.csv", time.Now().Format("2006-01-02"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	// UTF-8 BOM for Microsoft Excel / Google Sheets compatibility
	w.Write([]byte{0xEF, 0xBB, 0xBF})
	w.Write(csvData)
}
