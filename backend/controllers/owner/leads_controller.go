package owner

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"klikin-backend/middlewares"
	"klikin-backend/services/leads"
	"klikin-backend/views"
)

type LeadsController struct {
	service *leads.LeadsService
}

func NewLeadsController(service *leads.LeadsService) *LeadsController {
	return &LeadsController{service: service}
}

func (c *LeadsController) getUserID(r *http.Request) (string, error) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil || claims.UserID == "" {
		return "", errors.New("unauthorized")
	}
	return claims.UserID, nil
}

// GetConfig handles GET /api/owner/leads/config
func (c *LeadsController) GetConfig(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	overview, err := c.service.GetConfigAndStats(userID)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Pengaturan email capture berhasil dimuat", overview)
}

// UpdateConfig handles PUT /api/owner/leads/config
func (c *LeadsController) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var dto leads.UpdateConfigDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	updated, err := c.service.UpdateConfig(userID, dto)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Pengaturan form email capture berhasil disimpan", updated)
}

// GetLeads handles GET /api/owner/leads
func (c *LeadsController) GetLeads(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	search := r.URL.Query().Get("search")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	res, err := c.service.GetLeads(userID, search, page, limit)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar email leads berhasil dimuat", res)
}

// DeleteLead handles DELETE /api/owner/leads/{id}
func (c *LeadsController) DeleteLead(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	leadID := r.PathValue("id")
	if leadID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID lead diperlukan")
		return
	}

	if err := c.service.DeleteLead(userID, leadID); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Kontak email berhasil dihapus", nil)
}

// ExportCSV handles GET /api/owner/leads/export
func (c *LeadsController) ExportCSV(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	csvData, err := c.service.ExportCSV(userID)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	filename := fmt.Sprintf("klikin_leads_%s.csv", time.Now().Format("20060102_150405"))
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Length", strconv.Itoa(len(csvData)))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(csvData)
}

// TestIntegration handles POST /api/owner/leads/test-integration
func (c *LeadsController) TestIntegration(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Provider string `json:"provider"`
		APIKey   string `json:"api_key"`
		ListID   string `json:"list_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	ok, message, err := c.service.TestIntegration(body.Provider, body.APIKey, body.ListID)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, message, map[string]interface{}{
		"connected": ok,
		"provider":  body.Provider,
	})
}
