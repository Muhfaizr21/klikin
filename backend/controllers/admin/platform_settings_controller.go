package admin

import (
	"encoding/json"
	"net/http"
	"strings"

	"klikin-backend/middlewares"
	adminService "klikin-backend/services/admin"
	"klikin-backend/views"
)

type PlatformSettingsController struct {
	service *adminService.PlatformSettingsService
}

func NewPlatformSettingsController(service *adminService.PlatformSettingsService) *PlatformSettingsController {
	return &PlatformSettingsController{service: service}
}

func extractSettingsAdmin(r *http.Request) (string, string) {
	claims := middlewares.GetUserFromContext(r)
	email := "admin@klikin.id"
	if claims != nil && claims.Email != "" {
		email = claims.Email
	}

	ip := r.RemoteAddr
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		ip = strings.Split(fwd, ",")[0]
	}
	ip = strings.TrimSpace(ip)

	return email, ip
}

// GetSettings retrieves current platform configuration
func (c *PlatformSettingsController) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := c.service.GetOrCreateSettings()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat pengaturan platform: "+err.Error())
		return
	}

	// For security, mask sensitive credentials when sending to client
	maskedSettings := *settings
	if len(maskedSettings.SMTPPassword) > 4 {
		maskedSettings.SMTPPassword = maskedSettings.SMTPPassword[:2] + "••••••••" + maskedSettings.SMTPPassword[len(maskedSettings.SMTPPassword)-2:]
	}
	if len(maskedSettings.MidtransServerKey) > 6 {
		maskedSettings.MidtransServerKey = maskedSettings.MidtransServerKey[:4] + "••••••••"
	}
	if len(maskedSettings.StripeSecretKey) > 6 {
		maskedSettings.StripeSecretKey = maskedSettings.StripeSecretKey[:4] + "••••••••"
	}
	if len(maskedSettings.StripeWebhookSecret) > 6 {
		maskedSettings.StripeWebhookSecret = maskedSettings.StripeWebhookSecret[:4] + "••••••••"
	}

	views.RenderSuccess(w, http.StatusOK, "Pengaturan platform berhasil diambil", maskedSettings)
}

// UpdateGeneral updates general and maintenance settings
func (c *PlatformSettingsController) UpdateGeneral(w http.ResponseWriter, r *http.Request) {
	adminEmail, ip := extractSettingsAdmin(r)
	var dto adminService.UpdateGeneralSettingsDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	updated, err := c.service.UpdateGeneral(adminEmail, ip, dto)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memperbarui pengaturan umum: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Pengaturan umum berhasil diperbarui", updated)
}

// UpdatePricing updates pricing, trial and tier limitations
func (c *PlatformSettingsController) UpdatePricing(w http.ResponseWriter, r *http.Request) {
	adminEmail, ip := extractSettingsAdmin(r)
	var dto adminService.UpdatePricingSettingsDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	updated, err := c.service.UpdatePricing(adminEmail, ip, dto)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memperbarui paket & harga: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Paket & harga berhasil diperbarui", updated)
}

// UpdateEmail updates SMTP configurations
func (c *PlatformSettingsController) UpdateEmail(w http.ResponseWriter, r *http.Request) {
	adminEmail, ip := extractSettingsAdmin(r)
	var dto adminService.UpdateEmailSettingsDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	updated, err := c.service.UpdateEmail(adminEmail, ip, dto)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memperbarui SMTP: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Konfigurasi SMTP berhasil diperbarui", updated)
}

// SendTestEmail sends a test email to verify SMTP
func (c *PlatformSettingsController) SendTestEmail(w http.ResponseWriter, r *http.Request) {
	adminEmail, ip := extractSettingsAdmin(r)
	var dto adminService.SendTestEmailDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	res, err := c.service.SendTestEmail(adminEmail, ip, dto.RecipientEmail)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal mengirim email uji: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, res, map[string]string{
		"recipient": dto.RecipientEmail,
		"message":   res,
	})
}

// UpdatePayment updates payment gateway settings
func (c *PlatformSettingsController) UpdatePayment(w http.ResponseWriter, r *http.Request) {
	adminEmail, ip := extractSettingsAdmin(r)
	var dto adminService.UpdatePaymentSettingsDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	updated, err := c.service.UpdatePayment(adminEmail, ip, dto)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memperbarui gateway pembayaran: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Gateway pembayaran berhasil diperbarui", updated)
}

// UpdateDomain updates default domain and reserved subdomains
func (c *PlatformSettingsController) UpdateDomain(w http.ResponseWriter, r *http.Request) {
	adminEmail, ip := extractSettingsAdmin(r)
	var dto adminService.UpdateDomainSettingsDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	updated, err := c.service.UpdateDomain(adminEmail, ip, dto)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memperbarui domain: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Domain & subdomain berhasil diperbarui", updated)
}

// UpdateSEO updates default SEO metadata and robots.txt
func (c *PlatformSettingsController) UpdateSEO(w http.ResponseWriter, r *http.Request) {
	adminEmail, ip := extractSettingsAdmin(r)
	var dto adminService.UpdateSEOSettingsDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	updated, err := c.service.UpdateSEO(adminEmail, ip, dto)
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memperbarui SEO: "+err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "SEO & Crawler berhasil diperbarui", updated)
}
