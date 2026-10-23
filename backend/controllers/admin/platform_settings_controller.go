package admin

import (
	"encoding/json"
	"net/http"
	"strings"

	"klikin-backend/middlewares"
	"klikin-backend/models"
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

func maskPlatformSettings(settings *models.PlatformSetting, reveal bool) models.PlatformSetting {
	if settings == nil {
		return models.PlatformSetting{}
	}
	masked := *settings
	if !reveal {
		if len(masked.SMTPPassword) > 4 {
			masked.SMTPPassword = masked.SMTPPassword[:2] + "••••••••" + masked.SMTPPassword[len(masked.SMTPPassword)-2:]
		} else if masked.SMTPPassword != "" {
			masked.SMTPPassword = "••••••••"
		}
		if len(masked.MidtransServerKey) > 6 {
			masked.MidtransServerKey = masked.MidtransServerKey[:4] + "••••••••"
		} else if masked.MidtransServerKey != "" {
			masked.MidtransServerKey = "••••••••"
		}
		if len(masked.StripeSecretKey) > 6 {
			masked.StripeSecretKey = masked.StripeSecretKey[:4] + "••••••••"
		} else if masked.StripeSecretKey != "" {
			masked.StripeSecretKey = "••••••••"
		}
		if len(masked.StripeWebhookSecret) > 6 {
			masked.StripeWebhookSecret = masked.StripeWebhookSecret[:4] + "••••••••"
		} else if masked.StripeWebhookSecret != "" {
			masked.StripeWebhookSecret = "••••••••"
		}
	}
	return masked
}

// GetSettings retrieves current platform configuration
func (c *PlatformSettingsController) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := c.service.GetOrCreateSettings()
	if err != nil {
		views.RenderError(w, http.StatusInternalServerError, "Gagal memuat pengaturan platform: "+err.Error())
		return
	}

	reveal := r.URL.Query().Get("reveal") == "true"
	views.RenderSuccess(w, http.StatusOK, "Pengaturan platform berhasil diambil", maskPlatformSettings(settings, reveal))
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

	middlewares.InvalidateSecurityCache()
	views.RenderSuccess(w, http.StatusOK, "Pengaturan umum berhasil diperbarui", maskPlatformSettings(updated, false))
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

	views.RenderSuccess(w, http.StatusOK, "Paket & harga berhasil diperbarui", maskPlatformSettings(updated, false))
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

	views.RenderSuccess(w, http.StatusOK, "Konfigurasi SMTP berhasil diperbarui", maskPlatformSettings(updated, false))
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

	views.RenderSuccess(w, http.StatusOK, "Gateway pembayaran berhasil diperbarui", maskPlatformSettings(updated, false))
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

	views.RenderSuccess(w, http.StatusOK, "Domain & subdomain berhasil diperbarui", maskPlatformSettings(updated, false))
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

	views.RenderSuccess(w, http.StatusOK, "SEO & Crawler berhasil diperbarui", maskPlatformSettings(updated, false))
}
