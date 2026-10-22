package public

import (
	"encoding/json"
	"net/http"
	"strings"

	analyticsService "klikin-backend/services/analytics"
	"klikin-backend/views"
)

type TrackController struct {
	service *analyticsService.AnalyticsService
}

func NewTrackController(service *analyticsService.AnalyticsService) *TrackController {
	return &TrackController{service: service}
}

type TrackViewRequest struct {
	Slug     string `json:"slug"`
	PageID   string `json:"page_id"`
	Referrer string `json:"referrer"`
}

type TrackClickRequest struct {
	Slug        string `json:"slug"`
	PageID      string `json:"page_id"`
	BlockID     string `json:"block_id"`
	LinkID      string `json:"link_id"`
	TargetTitle string `json:"target_title"`
	TargetURL   string `json:"target_url"`
	Referrer    string `json:"referrer"`
}

// TrackView records a page view from the public bio page
func (c *TrackController) TrackView(w http.ResponseWriter, r *http.Request) {
	var req TrackViewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	ip := extractClientIP(r)
	ua := r.Header.Get("User-Agent")
	ref := req.Referrer
	if ref == "" {
		ref = r.Header.Get("Referer")
	}

	err := c.service.RecordEvent(analyticsService.RecordEventDTO{
		Slug:      req.Slug,
		PageID:    req.PageID,
		Type:      "view",
		Referrer:  ref,
		UserAgent: ua,
		IP:        ip,
	})

	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "View recorded", nil)
}

// TrackClick records a link click from the public bio page
func (c *TrackController) TrackClick(w http.ResponseWriter, r *http.Request) {
	var req TrackClickRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	ip := extractClientIP(r)
	ua := r.Header.Get("User-Agent")
	ref := req.Referrer
	if ref == "" {
		ref = r.Header.Get("Referer")
	}

	err := c.service.RecordEvent(analyticsService.RecordEventDTO{
		Slug:        req.Slug,
		PageID:      req.PageID,
		Type:        "click",
		BlockID:     req.BlockID,
		LinkID:      req.LinkID,
		TargetTitle: req.TargetTitle,
		TargetURL:   req.TargetURL,
		Referrer:    ref,
		UserAgent:   ua,
		IP:          ip,
	})

	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Click recorded", nil)
}

func extractClientIP(r *http.Request) string {
	xfwd := r.Header.Get("X-Forwarded-For")
	if xfwd != "" {
		parts := strings.Split(xfwd, ",")
		return strings.TrimSpace(parts[0])
	}
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}
	return r.RemoteAddr
}
