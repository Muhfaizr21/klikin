package owner

import (
	"encoding/json"
	"errors"
	"net/http"

	"klikin-backend/middlewares"
	"klikin-backend/services/support"
	"klikin-backend/views"
)

type SupportController struct {
	service *support.SupportService
}

func NewSupportController(service *support.SupportService) *SupportController {
	return &SupportController{service: service}
}

func (c *SupportController) getUserID(r *http.Request) (string, error) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil || claims.UserID == "" {
		return "", errors.New("unauthorized")
	}
	return claims.UserID, nil
}

// GetTickets handles GET /api/owner/support/tickets
func (c *SupportController) GetTickets(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	tickets, err := c.service.GetTickets(userID)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Daftar tiket bantuan berhasil dimuat", tickets)
}

// CreateTicket handles POST /api/owner/support/tickets
func (c *SupportController) CreateTicket(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		Subject       string `json:"subject"`
		Category      string `json:"category"`
		Priority      string `json:"priority"`
		Description   string `json:"description"`
		AttachmentURL string `json:"attachment_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	ticket, err := c.service.CreateTicket(userID, body.Subject, body.Category, body.Priority, body.Description, body.AttachmentURL)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusCreated, "Tiket bantuan berhasil dibuat. Tim kami akan segera menanggapi.", ticket)
}

// GetTicketDetails handles GET /api/owner/support/tickets/{id}
func (c *SupportController) GetTicketDetails(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	ticketID := r.PathValue("id")
	ticket, err := c.service.GetTicketDetails(userID, ticketID)
	if err != nil {
		views.RenderError(w, http.StatusNotFound, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Detail tiket bantuan berhasil dimuat", ticket)
}

// ReplyTicket handles POST /api/owner/support/tickets/{id}/reply
func (c *SupportController) ReplyTicket(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	ticketID := r.PathValue("id")
	var body struct {
		Message       string `json:"message"`
		AttachmentURL string `json:"attachment_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	msg, err := c.service.ReplyTicket(userID, ticketID, body.Message, body.AttachmentURL)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Pesan balasan berhasil terkirim", msg)
}

// GetFAQs handles GET /api/owner/support/faq
func (c *SupportController) GetFAQs(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	faqs, err := c.service.GetFAQs(category)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Daftar FAQ berhasil dimuat", faqs)
}

// SubmitContact handles POST /api/owner/support/contact
func (c *SupportController) SubmitContact(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		Name    string `json:"name"`
		Email   string `json:"email"`
		Subject string `json:"subject"`
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	ticket, err := c.service.SubmitContactForm(userID, body.Name, body.Email, body.Subject, body.Message)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Pesan kontak Anda telah kami terima!", ticket)
}

// SubmitFeedback handles POST /api/owner/support/feedback
func (c *SupportController) SubmitFeedback(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		Type        string `json:"type"`
		Title       string `json:"title"`
		Description string `json:"description"`
		Rating      int    `json:"rating"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	feedback, err := c.service.SubmitFeedback(userID, body.Type, body.Title, body.Description, body.Rating)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Terima kasih atas saran dan masukan Anda!", feedback)
}
