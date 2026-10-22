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

// FinanceManagementController handles HTTP endpoints for Section 3.7 (Keuangan)
type FinanceManagementController struct {
	service adminService.FinanceManagementUseCase
}

// NewFinanceManagementController instantiates the controller with injected use case
func NewFinanceManagementController(service adminService.FinanceManagementUseCase) *FinanceManagementController {
	return &FinanceManagementController{service: service}
}

func extractFinanceAdminActor(r *http.Request) adminService.AdminActor {
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

// GetSummary returns full financial KPIs, revenue, profits, margins, and 5W1H metrics
func (c *FinanceManagementController) GetSummary(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "30d"
	}

	summary, err := c.service.GetFinanceSummary(period)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat ringkasan keuangan: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Ringkasan keuangan berhasil dimuat", summary)
}

// ListExpenses returns paginated infrastructure expenses
func (c *FinanceManagementController) ListExpenses(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page := 1
	if p, err := strconv.Atoi(q.Get("page")); err == nil && p > 0 {
		page = p
	}
	limit := 15
	if l, err := strconv.Atoi(q.Get("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	result, err := c.service.ListExpenses(adminService.ExpenseFilterParams{
		Search:      q.Get("search"),
		Category:    q.Get("category"),
		MonthPeriod: q.Get("month_period"),
		Sort:        q.Get("sort"),
		Page:        page,
		Limit:       limit,
	})
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat daftar biaya infrastruktur: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar biaya infrastruktur berhasil dimuat", result)
}

// CreateExpense records a new infrastructure or operational expense
func (c *FinanceManagementController) CreateExpense(w http.ResponseWriter, r *http.Request) {
	var dto adminService.SaveExpenseDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format payload tidak valid: "+err.Error())
		return
	}

	actor := extractFinanceAdminActor(r)
	expense, err := c.service.CreateExpense(dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal mencatat biaya: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Biaya infrastruktur berhasil dicatat", expense)
}

// UpdateExpense edits an existing infrastructure expense
func (c *FinanceManagementController) UpdateExpense(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID biaya wajib disertakan")
		return
	}

	var dto adminService.SaveExpenseDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format payload tidak valid: "+err.Error())
		return
	}

	actor := extractFinanceAdminActor(r)
	expense, err := c.service.UpdateExpense(id, dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal memperbarui biaya: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Biaya infrastruktur berhasil diperbarui", expense)
}

// DeleteExpense removes an expense record
func (c *FinanceManagementController) DeleteExpense(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		views.RenderError(w, http.StatusBadRequest, "ID biaya wajib disertakan")
		return
	}

	actor := extractFinanceAdminActor(r)
	if err := c.service.DeleteExpense(id, actor); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal menghapus biaya: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Biaya infrastruktur berhasil dihapus", nil)
}

// ListTransactions returns paginated invoice transactions with enriched buyer details
func (c *FinanceManagementController) ListTransactions(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page := 1
	if p, err := strconv.Atoi(q.Get("page")); err == nil && p > 0 {
		page = p
	}
	limit := 15
	if l, err := strconv.Atoi(q.Get("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	result, err := c.service.ListTransactions(adminService.TransactionFilterParams{
		Search:  q.Get("search"),
		Status:  q.Get("status"),
		Channel: q.Get("channel"),
		Sort:    q.Get("sort"),
		Page:    page,
		Limit:   limit,
	})
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat transaksi: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Buku transaksi berhasil dimuat", result)
}

// CreateManualInvoice issues an invoice manually
func (c *FinanceManagementController) CreateManualInvoice(w http.ResponseWriter, r *http.Request) {
	var dto adminService.CreateManualInvoiceDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format payload tidak valid: "+err.Error())
		return
	}

	actor := extractFinanceAdminActor(r)
	invoice, err := c.service.CreateManualInvoice(dto, actor)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal menerbitkan faktur manual: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Faktur manual berhasil diterbitkan", invoice)
}

// ExportCSV downloads financial report as CSV
func (c *FinanceManagementController) ExportCSV(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "30d"
	}

	data, err := c.service.ExportFinanceCSV(period)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengekspor laporan keuangan: "+err.Error())
		return
	}

	filename := fmt.Sprintf("klikin-finance-%s-%s.csv", period, time.Now().Format("20060102-150405"))
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

// GetAuditLogs returns financial audit trails
func (c *FinanceManagementController) GetAuditLogs(w http.ResponseWriter, r *http.Request) {
	limit := 20
	if l, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	logs, err := c.service.GetFinancialAuditLogs(limit)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat log audit: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Log audit keuangan berhasil dimuat", logs)
}
