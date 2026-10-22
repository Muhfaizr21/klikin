package owner

import (
	"encoding/json"
	"errors"
	"net/http"

	"klikin-backend/middlewares"
	"klikin-backend/services/notification"
	"klikin-backend/views"
)

type NotificationController struct {
	service *notification.NotificationService
}

func NewNotificationController(service *notification.NotificationService) *NotificationController {
	return &NotificationController{service: service}
}

func (c *NotificationController) getUserID(r *http.Request) (string, error) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil || claims.UserID == "" {
		return "", errors.New("unauthorized")
	}
	return claims.UserID, nil
}

// GetOverview handles GET /api/owner/notifications
func (c *NotificationController) GetOverview(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	overview, err := c.service.GetOverview(userID)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Daftar notifikasi berhasil dimuat", overview)
}

// MarkAsRead handles PUT /api/owner/notifications/{id}/read
func (c *NotificationController) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	notifID := r.PathValue("id")
	if err := c.service.MarkAsRead(userID, notifID); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Notifikasi telah ditandai dibaca", nil)
}

// MarkAllAsRead handles POST /api/owner/notifications/read-all
func (c *NotificationController) MarkAllAsRead(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	if err := c.service.MarkAllAsRead(userID); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Semua notifikasi telah ditandai dibaca", nil)
}

// DeleteNotification handles DELETE /api/owner/notifications/{id}
func (c *NotificationController) DeleteNotification(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	notifID := r.PathValue("id")
	if err := c.service.DeleteNotification(userID, notifID); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Notifikasi berhasil dihapus", nil)
}

// GetPreferences handles GET /api/owner/notifications/preferences
func (c *NotificationController) GetPreferences(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	prefs, err := c.service.GetPreferences(userID)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Preferensi notifikasi berhasil dimuat", prefs)
}

// UpdatePreferences handles PUT /api/owner/notifications/preferences
func (c *NotificationController) UpdatePreferences(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		EmailMarketing    bool `json:"email_marketing"`
		EmailSecurity     bool `json:"email_security"`
		EmailBilling      bool `json:"email_billing"`
		EmailDomainStatus bool `json:"email_domain_status"`
		EmailNewLead      bool `json:"email_new_lead"`
		InAppSound        bool `json:"in_app_sound"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	prefs, err := c.service.UpdatePreferences(
		userID,
		body.EmailMarketing,
		body.EmailSecurity,
		body.EmailBilling,
		body.EmailDomainStatus,
		body.EmailNewLead,
		body.InAppSound,
	)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Preferensi notifikasi berhasil disimpan", prefs)
}
