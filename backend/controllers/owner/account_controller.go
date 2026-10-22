package owner

import (
	"encoding/json"
	"net/http"

	"klikin-backend/middlewares"
	accountService "klikin-backend/services/account"
	"klikin-backend/views"
)

type AccountController struct {
	service *accountService.AccountService
}

func NewAccountController(service *accountService.AccountService) *AccountController {
	return &AccountController{service: service}
}

// GetProfile returns current user's profile
func (c *AccountController) GetProfile(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid")
		return
	}

	user, err := c.service.GetProfile(claims.UserID)
	if err != nil {
		views.RenderError(w, http.StatusNotFound, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Profil berhasil dimuat", user)
}

// UpdateProfile updates personal information and avatar (WebP validated)
func (c *AccountController) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid")
		return
	}

	var dto accountService.UpdateProfileDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload JSON tidak valid")
		return
	}

	user, err := c.service.UpdateProfile(claims.UserID, dto)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Profil akun berhasil diperbarui", user)
}

// ChangePassword updates user password after verifying current password
func (c *AccountController) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid")
		return
	}

	var dto accountService.ChangePasswordDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload JSON tidak valid")
		return
	}

	if err := c.service.ChangePassword(claims.UserID, dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Kata sandi berhasil diperbarui dengan aman", nil)
}

// Toggle2FA configures two-factor authentication
func (c *AccountController) Toggle2FA(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid")
		return
	}

	var dto accountService.Toggle2FADTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload JSON tidak valid")
		return
	}

	result, err := c.service.Toggle2FA(claims.UserID, dto)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Status autentikasi dua faktor berhasil disesuaikan", result)
}

// GetSessions lists active login sessions
func (c *AccountController) GetSessions(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid")
		return
	}

	userAgent := r.UserAgent()
	clientIP := r.RemoteAddr

	sessions, err := c.service.GetActiveSessions(claims.UserID, userAgent, clientIP)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar sesi aktif berhasil dimuat", sessions)
}

// RevokeOtherSessions terminates other active sessions
func (c *AccountController) RevokeOtherSessions(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid")
		return
	}

	if err := c.service.RevokeOtherSessions(claims.UserID); err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Semua sesi lain berhasil dikeluarkan", nil)
}

// ExportData downloads full GDPR-compliant JSON archive
func (c *AccountController) ExportData(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid")
		return
	}

	data, err := c.service.ExportAccountData(claims.UserID)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Arsip data akun siap diunduh", data)
}

// DeleteAccount handles account deletion with confirmation password
func (c *AccountController) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid")
		return
	}

	var dto accountService.DeleteAccountDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload JSON tidak valid")
		return
	}

	if err := c.service.DeleteAccount(claims.UserID, dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Akun berhasil dinonaktifkan", nil)
}
