package public

import (
	"encoding/json"
	"net/http"
	"strings"

	"klikin-backend/services/leads"
	"klikin-backend/views"
)

type LeadsPublicController struct {
	service *leads.LeadsService
}

func NewLeadsPublicController(service *leads.LeadsService) *LeadsPublicController {
	return &LeadsPublicController{service: service}
}

// SubmitLead handles POST /api/public/capture
func (c *LeadsPublicController) SubmitLead(w http.ResponseWriter, r *http.Request) {
	var dto leads.SubmitLeadDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	// Extract client IP address
	ip := r.Header.Get("X-Forwarded-For")
	if ip != "" {
		parts := strings.Split(ip, ",")
		ip = strings.TrimSpace(parts[0])
	}
	if ip == "" {
		ip = r.Header.Get("X-Real-IP")
	}
	if ip == "" {
		ip = r.RemoteAddr
	}

	userAgent := r.UserAgent()

	msg, err := c.service.SubmitLead(dto, ip, userAgent)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, msg, map[string]interface{}{
		"email":  dto.Email,
		"status": "subscribed",
	})
}
