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

// SubscriptionManagementController handles HTTP endpoints for Section 3.3 (Manajemen Langganan)
type SubscriptionManagementController struct {
	service adminService.SubscriptionManagementUseCase
}

// NewSubscriptionManagementController instantiates the controller with injected use case (SOLID DIP)
func NewSubscriptionManagementController(service adminService.SubscriptionManagementUseCase) *SubscriptionManagementController {
	return &SubscriptionManagementController{service: service}
}

func extractAdminActor(r *http.Request) adminService.AdminActor {
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

// ListSubscriptions returns paginated tenant subscriptions, filters, and global subscription stats
func (c *SubscriptionManagementController) ListSubscriptions(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page := 1
	if p, err := strconv.Atoi(q.Get("page")); err == nil && p > 0 {
		page = p
	}
	limit := 10
	if l, err := strconv.Atoi(q.Get("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	result, err := c.service.ListSubscriptions(adminService.SubscriptionFilterParams{
		Search: q.Get("search"),
		Status: q.Get("status"),
		Plan:   q.Get("plan"),
		Cycle:  q.Get("cycle"),
		Sort:   q.Get("sort"),
		Page:   page,
		Limit:  limit,
	})
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat daftar langganan: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar langganan berhasil dimuat", result)
}

// GetSubscriptionDetail returns full subscription, invoices, and billing audit logs for a user
func (c *SubscriptionManagementController) GetSubscriptionDetail(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userId")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	detail, err := c.service.GetSubscriptionDetail(userID)
	if err != nil {
		views.RenderError(w, http.StatusNotFound, "Detail langganan tidak ditemukan: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Detail langganan berhasil dimuat", detail)
}

// ChangePlanManual handles manual upgrade/downgrade without Stripe
func (c *SubscriptionManagementController) ChangePlanManual(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userId")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	var dto adminService.ChangePlanDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format payload tidak valid: "+err.Error())
		return
	}

	sub, err := c.service.ChangePlanManual(userID, dto, extractAdminActor(r))
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal mengubah paket langganan: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Paket langganan pengguna berhasil diperbarui secara manual", sub)
}

// ExtendGoodwill extends active subscription period as goodwill compensation
func (c *SubscriptionManagementController) ExtendGoodwill(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userId")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	var dto adminService.ExtendGoodwillDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format payload tidak valid: "+err.Error())
		return
	}

	sub, err := c.service.ExtendGoodwill(userID, dto, extractAdminActor(r))
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal memperpanjang langganan goodwill: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Masa aktif langganan berhasil diperpanjang +%d hari (Goodwill)", dto.Days), sub)
}

// ManageTrial handles starting, extending, shortening, or converting trial to paid
func (c *SubscriptionManagementController) ManageTrial(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userId")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	var dto adminService.ManageTrialDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format payload tidak valid: "+err.Error())
		return
	}

	sub, err := c.service.ManageTrial(userID, dto, extractAdminActor(r))
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal mengelola masa trial: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Status masa uji coba (Trial) berhasil diperbarui", sub)
}

// CancelSubscription cancels a user's subscription
func (c *SubscriptionManagementController) CancelSubscription(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userId")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	var dto adminService.CancelSubscriptionDTO
	_ = json.NewDecoder(r.Body).Decode(&dto)

	sub, err := c.service.CancelSubscription(userID, dto, extractAdminActor(r))
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal membatalkan langganan: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Langganan berhasil dibatalkan", sub)
}

// ListInvoices returns paginated platform invoices
func (c *SubscriptionManagementController) ListInvoices(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page := 1
	if p, err := strconv.Atoi(q.Get("page")); err == nil && p > 0 {
		page = p
	}
	limit := 15
	if l, err := strconv.Atoi(q.Get("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	res, err := c.service.ListAllInvoices(q.Get("search"), q.Get("status"), page, limit)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat daftar invoice: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar invoice berhasil dimuat", res)
}

// ProcessRefund processes a full refund on a paid invoice
func (c *SubscriptionManagementController) ProcessRefund(w http.ResponseWriter, r *http.Request) {
	invoiceID := r.PathValue("invoiceId")
	if invoiceID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID invoice wajib disertakan")
		return
	}

	var dto adminService.RefundInvoiceDTO
	_ = json.NewDecoder(r.Body).Decode(&dto)

	inv, err := c.service.ProcessRefund(invoiceID, dto, extractAdminActor(r))
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal memproses refund: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Refund untuk invoice %s berhasil diproses", inv.InvoiceNumber), inv)
}

// ListPromos returns all discount coupons and usage metrics
func (c *SubscriptionManagementController) ListPromos(w http.ResponseWriter, r *http.Request) {
	promos, err := c.service.ListPromoCodes()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat kupon promo: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Daftar kupon promo berhasil dimuat", promos)
}

// CreatePromo creates a new discount coupon
func (c *SubscriptionManagementController) CreatePromo(w http.ResponseWriter, r *http.Request) {
	var dto adminService.SavePromoCodeDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format payload tidak valid: "+err.Error())
		return
	}

	promo, err := c.service.CreatePromoCode(dto, extractAdminActor(r))
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal membuat kupon promo: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, fmt.Sprintf("Kupon promo %s (%d%%) berhasil dibuat", promo.Code, promo.DiscountPercent), promo)
}

// UpdatePromo updates an existing discount coupon
func (c *SubscriptionManagementController) UpdatePromo(w http.ResponseWriter, r *http.Request) {
	promoID := r.PathValue("id")
	if promoID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID kupon wajib disertakan")
		return
	}

	var dto adminService.SavePromoCodeDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format payload tidak valid: "+err.Error())
		return
	}

	promo, err := c.service.UpdatePromoCode(promoID, dto, extractAdminActor(r))
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal memperbarui kupon promo: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Kupon promo %s berhasil diperbarui", promo.Code), promo)
}

// DeletePromo removes a discount coupon
func (c *SubscriptionManagementController) DeletePromo(w http.ResponseWriter, r *http.Request) {
	promoID := r.PathValue("id")
	if promoID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID kupon wajib disertakan")
		return
	}

	if err := c.service.DeletePromoCode(promoID, extractAdminActor(r)); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal menghapus kupon promo: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Kupon promo berhasil dihapus", map[string]string{"id": promoID})
}

// GetDunningQueue returns all past-due subscriptions and failed invoices
func (c *SubscriptionManagementController) GetDunningQueue(w http.ResponseWriter, r *http.Request) {
	queue, err := c.service.GetDunningQueue()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat antrean dunning: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Antrean dunning berhasil dimuat", queue)
}

// SendDunningReminder sends a manual payment reminder to a specific overdue user
func (c *SubscriptionManagementController) SendDunningReminder(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userId")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	var req struct {
		Message string `json:"message"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	if err := c.service.SendDunningReminder(userID, req.Message, extractAdminActor(r)); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal mengirim reminder pembayaran: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Pengingat pembayaran berhasil dikirim ke email dan notifikasi pengguna", map[string]string{
		"user_id": userID,
	})
}

// SendBulkDunningReminders sends reminders to all accounts in the dunning queue
func (c *SubscriptionManagementController) SendBulkDunningReminders(w http.ResponseWriter, r *http.Request) {
	count, err := c.service.SendBulkDunningReminders(extractAdminActor(r))
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengirim reminder massal: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, fmt.Sprintf("Pengingat pembayaran berhasil dikirimkan ke %d akun tertunggak", count), map[string]int{
		"sent_count": count,
	})
}

// ResolveDunningManual marks overdue payment as resolved and reactivates subscription
func (c *SubscriptionManagementController) ResolveDunningManual(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userId")
	if userID == "" {
		views.RenderError(w, http.StatusBadRequest, "ID pengguna wajib disertakan")
		return
	}

	sub, err := c.service.ResolveDunningManual(userID, extractAdminActor(r))
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, "Gagal mengonfirmasi pelunasan: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Pembayaran berhasil dikonfirmasi lunas dan langganan kembali aktif", sub)
}

// ExportCSV exports all platform subscriptions as an RFC 4180 CSV file
func (c *SubscriptionManagementController) ExportCSV(w http.ResponseWriter, r *http.Request) {
	csvData, err := c.service.ExportSubscriptionsCSV()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengekspor CSV langganan: "+err.Error())
		return
	}

	filename := fmt.Sprintf("klikin-langganan-platform-%s.csv", time.Now().Format("2006-01-02"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	w.Write([]byte{0xEF, 0xBB, 0xBF})
	w.Write(csvData)
}
