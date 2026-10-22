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

// SupportManagementController handles HTTP endpoints for Section 3.8 Support & Communications
type SupportManagementController struct {
	service adminService.SupportManagementUseCase
}

// NewSupportManagementController creates the controller instance
func NewSupportManagementController(service adminService.SupportManagementUseCase) *SupportManagementController {
	return &SupportManagementController{service: service}
}

func extractSupportAdminActor(r *http.Request) adminService.AdminActor {
	claims := middlewares.GetUserFromContext(r)
	actor := adminService.AdminActor{
		ID:    "usr_superadmin_01",
		Name:  "Super Administrator",
		Email: "admin@klikin.id",
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
	}
	return actor
}

// GetStats returns support overview KPIs
func (c *SupportManagementController) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := c.service.GetSupportStats()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat statistik support: "+err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Statistik support berhasil dimuat", stats)
}

// ListTickets returns paginated tickets with filter
func (c *SupportManagementController) ListTickets(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	page, _ := strconv.Atoi(query.Get("page"))
	limit, _ := strconv.Atoi(query.Get("limit"))

	filter := adminService.TicketFilterParams{
		Search:   query.Get("search"),
		Status:   query.Get("status"),
		Category: query.Get("category"),
		Priority: query.Get("priority"),
		Sort:     query.Get("sort"),
		Page:     page,
		Limit:    limit,
	}

	result, err := c.service.ListTickets(filter)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat daftar tiket: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar tiket berhasil dimuat", result)
}

// GetTicketDetail returns ticket thread and user metadata
func (c *SupportManagementController) GetTicketDetail(w http.ResponseWriter, r *http.Request) {
	ticketID := r.PathValue("id")
	if ticketID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID tiket tidak boleh kosong")
		return
	}

	detail, err := c.service.GetTicketDetail(ticketID)
	if err != nil {
		views.RenderError(w, http.StatusNotFound, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Detail tiket berhasil dimuat", detail)
}

// ReplyTicket adds an admin message to ticket thread
func (c *SupportManagementController) ReplyTicket(w http.ResponseWriter, r *http.Request) {
	ticketID := r.PathValue("id")
	if ticketID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID tiket tidak boleh kosong")
		return
	}

	var dto adminService.TicketReplyDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload request tidak valid: "+err.Error())
		return
	}

	actor := extractSupportAdminActor(r)
	msg, err := c.service.ReplyTicket(ticketID, dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Balasan berhasil dikirimkan", msg)
}

// UpdateTicketStatus modifies ticket status/priority
func (c *SupportManagementController) UpdateTicketStatus(w http.ResponseWriter, r *http.Request) {
	ticketID := r.PathValue("id")
	if ticketID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID tiket tidak boleh kosong")
		return
	}

	var dto adminService.UpdateTicketStatusDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload request tidak valid: "+err.Error())
		return
	}

	actor := extractSupportAdminActor(r)
	ticket, err := c.service.UpdateTicketStatus(ticketID, dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Status tiket berhasil diperbarui", ticket)
}

// ListCannedResponses returns canned reply templates
func (c *SupportManagementController) ListCannedResponses(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	category := r.URL.Query().Get("category")

	items, err := c.service.ListCannedResponses(search, category)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat template balasan: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Template balasan berhasil dimuat", items)
}

// CreateCannedResponse saves a new canned reply template
func (c *SupportManagementController) CreateCannedResponse(w http.ResponseWriter, r *http.Request) {
	var dto adminService.SaveCannedResponseDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload request tidak valid: "+err.Error())
		return
	}

	actor := extractSupportAdminActor(r)
	item, err := c.service.CreateCannedResponse(dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Template balasan berhasil ditambahkan", item)
}

// UpdateCannedResponse modifies an existing canned template
func (c *SupportManagementController) UpdateCannedResponse(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID template tidak boleh kosong")
		return
	}

	var dto adminService.SaveCannedResponseDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload request tidak valid: "+err.Error())
		return
	}

	actor := extractSupportAdminActor(r)
	item, err := c.service.UpdateCannedResponse(id, dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Template balasan berhasil diperbarui", item)
}

// DeleteCannedResponse removes a canned template
func (c *SupportManagementController) DeleteCannedResponse(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID template tidak boleh kosong")
		return
	}

	actor := extractSupportAdminActor(r)
	if err := c.service.DeleteCannedResponse(id, actor); err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Template balasan berhasil dihapus", nil)
}

// ListBroadcasts returns broadcast announcements history
func (c *SupportManagementController) ListBroadcasts(w http.ResponseWriter, r *http.Request) {
	items, err := c.service.ListBroadcastAnnouncements()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat riwayat broadcast: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Riwayat broadcast berhasil dimuat", items)
}

// SendBroadcast publishes an announcement to user segments
func (c *SupportManagementController) SendBroadcast(w http.ResponseWriter, r *http.Request) {
	var dto adminService.SendBroadcastDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload request tidak valid: "+err.Error())
		return
	}

	actor := extractSupportAdminActor(r)
	item, err := c.service.SendBroadcastAnnouncement(dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Pengumuman broadcast berhasil dikirimkan", item)
}

// SendDirectNotification pushes direct notification to a specific user
func (c *SupportManagementController) SendDirectNotification(w http.ResponseWriter, r *http.Request) {
	var dto adminService.SendDirectNotificationDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Payload request tidak valid: "+err.Error())
		return
	}

	actor := extractSupportAdminActor(r)
	notif, err := c.service.SendDirectNotification(dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Notifikasi langsung berhasil dikirimkan", notif)
}

// ListCommunicationLogs returns communication audit logs
func (c *SupportManagementController) ListCommunicationLogs(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	limit, _ := strconv.Atoi(query.Get("limit"))
	channel := query.Get("channel")
	actionType := query.Get("action_type")

	logs, err := c.service.ListCommunicationLogs(limit, channel, actionType)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat log komunikasi: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Log komunikasi berhasil dimuat", logs)
}

// ExportCSV exports tickets in CSV format
func (c *SupportManagementController) ExportCSV(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	category := r.URL.Query().Get("category")
	priority := r.URL.Query().Get("priority")

	csvData, err := c.service.ExportTicketsCSV(status, category, priority)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengekspor CSV tiket: "+err.Error())
		return
	}

	filename := fmt.Sprintf("klikin-support-tickets-%s.csv", time.Now().Format("2006-01-02-150405"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(csvData)
}
