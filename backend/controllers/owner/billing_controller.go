package owner

import (
	"encoding/json"
	"errors"
	"net/http"

	"klikin-backend/middlewares"
	"klikin-backend/models"
	"klikin-backend/services/billing"
	"klikin-backend/views"
)

type BillingController struct {
	service *billing.BillingService
}

func NewBillingController(service *billing.BillingService) *BillingController {
	return &BillingController{service: service}
}

func (c *BillingController) getUserID(r *http.Request) (string, error) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil || claims.UserID == "" {
		return "", errors.New("unauthorized")
	}
	return claims.UserID, nil
}

// GetBilling handles GET /api/owner/billing
func (c *BillingController) GetBilling(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	details, err := c.service.GetSubscriptionDetails(userID)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Informasi langganan berhasil dimuat", details)
}

// StartTrial handles POST /api/owner/billing/trial
func (c *BillingController) StartTrial(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		Days int `json:"days"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	sub, err := c.service.StartTrial(userID, body.Days)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Masa uji coba Klikin Pro 14 hari berhasil diaktifkan!", sub)
}

// UpgradePlan handles POST /api/owner/billing/upgrade
func (c *BillingController) UpgradePlan(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		Plan         string `json:"plan"`
		BillingCycle string `json:"billing_cycle"`
		PromoCode    string `json:"promo_code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	targetPlan := models.PlanType(body.Plan)
	sub, invoice, err := c.service.UpgradePlan(userID, targetPlan, body.BillingCycle, body.PromoCode)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Langganan berhasil diupgrade ke "+string(sub.Plan), map[string]interface{}{
		"subscription": sub,
		"invoice":      invoice,
	})
}

// DowngradePlan handles POST /api/owner/billing/downgrade
func (c *BillingController) DowngradePlan(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	sub, err := c.service.DowngradePlan(userID)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Permintaan downgrade berhasil dijadwalkan pada akhir periode", sub)
}

// ReactivateSubscription handles POST /api/owner/billing/reactivate
func (c *BillingController) ReactivateSubscription(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	sub, err := c.service.ReactivateSubscription(userID)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Langganan Klikin Pro Anda berhasil direaktivasi!", sub)
}

// CancelSubscription handles POST /api/owner/billing/cancel
func (c *BillingController) CancelSubscription(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	sub, err := c.service.CancelSubscription(userID, body.Reason)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Langganan Anda telah dibatalkan. Akses Pro tetap aktif hingga akhir periode.", sub)
}

// ValidatePromo handles POST /api/owner/billing/promo
func (c *BillingController) ValidatePromo(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	promo, err := c.service.ValidatePromoCode(body.Code)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Kode promo valid!", promo)
}

// UpdatePaymentMethod handles PUT /api/owner/billing/payment-method
func (c *BillingController) UpdatePaymentMethod(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	var body struct {
		Brand string `json:"brand"`
		Last4 string `json:"last4"`
		Exp   string `json:"exp"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	sub, err := c.service.UpdatePaymentMethod(userID, body.Brand, body.Last4, body.Exp)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Metode pembayaran berhasil diperbarui", sub)
}

// GetInvoices handles GET /api/owner/billing/invoices
func (c *BillingController) GetInvoices(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	invoices, err := c.service.GetInvoices(userID)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Daftar invoice berhasil dimuat", invoices)
}

// GetInvoiceReceipt handles GET /api/owner/billing/invoices/{id}
func (c *BillingController) GetInvoiceReceipt(w http.ResponseWriter, r *http.Request) {
	userID, err := c.getUserID(r)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa")
		return
	}
	invID := r.PathValue("id")
	receipt, err := c.service.GetInvoiceReceipt(userID, invID)
	if err != nil {
		views.RenderError(w, http.StatusNotFound, err.Error())
		return
	}
	views.RenderSuccess(w, http.StatusOK, "Detail invoice berhasil dimuat", receipt)
}
