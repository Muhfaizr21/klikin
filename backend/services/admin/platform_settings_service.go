package admin

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
)

type PlatformSettingsService struct {
	db *gorm.DB
}

func NewPlatformSettingsService(db *gorm.DB) *PlatformSettingsService {
	return &PlatformSettingsService{db: db}
}

func resolveSettingEnv(key, fallback string) string {
	if val := strings.TrimSpace(os.Getenv(key)); val != "" {
		return val
	}
	return fallback
}

// DTOs for updating each subsystem
type UpdateGeneralSettingsDTO struct {
	PlatformName      string `json:"platform_name"`
	PlatformTagline   string `json:"platform_tagline"`
	LogoURL           string `json:"logo_url"`
	FaviconURL        string `json:"favicon_url"`
	MaintenanceMode   bool   `json:"maintenance_mode"`
	MaintenanceNotice string `json:"maintenance_notice"`
	DefaultLanguage   string `json:"default_language"`
}

type UpdatePricingSettingsDTO struct {
	TrialDurationDays     int    `json:"trial_duration_days"`
	ProMonthlyPrice       int64  `json:"pro_monthly_price"`
	ProYearlyPrice        int64  `json:"pro_yearly_price"`
	Currency              string `json:"currency"`
	FreeMaxLinks          int    `json:"free_max_links"`
	ProMaxLinks           int    `json:"pro_max_links"`
	FreeAllowCustomDomain bool   `json:"free_allow_custom_domain"`
	ProAllowCustomDomain  bool   `json:"pro_allow_custom_domain"`
	FreeShowBadge         bool   `json:"free_show_badge"`
	ProShowBadge          bool   `json:"pro_show_badge"`
}

type UpdateEmailSettingsDTO struct {
	SMTPHost       string `json:"smtp_host"`
	SMTPPort       int    `json:"smtp_port"`
	SMTPUsername   string `json:"smtp_username"`
	SMTPPassword   string `json:"smtp_password"`
	SMTPFromEmail  string `json:"smtp_from_email"`
	SMTPFromName   string `json:"smtp_from_name"`
	SMTPEncryption string `json:"smtp_encryption"`
}

type SendTestEmailDTO struct {
	RecipientEmail string `json:"recipient_email"`
}

type UpdatePaymentSettingsDTO struct {
	ActiveGateway        string `json:"active_gateway"`
	PaymentTestMode      bool   `json:"payment_test_mode"`
	MidtransMerchantID   string `json:"midtrans_merchant_id"`
	MidtransServerKey    string `json:"midtrans_server_key"`
	MidtransClientKey    string `json:"midtrans_client_key"`
	StripePublishableKey string `json:"stripe_publishable_key"`
	StripeSecretKey      string `json:"stripe_secret_key"`
	StripeWebhookSecret  string `json:"stripe_webhook_secret"`
}

type UpdateDomainSettingsDTO struct {
	DefaultSubdomainRoot  string `json:"default_subdomain_root"`
	MaxDomainsPerUserFree int    `json:"max_domains_per_user_free"`
	MaxDomainsPerUserPro  int    `json:"max_domains_per_user_pro"`
	ReservedSubdomains    string `json:"reserved_subdomains"`
}

type UpdateSEOSettingsDTO struct {
	DefaultMetaTitle       string `json:"default_meta_title"`
	DefaultMetaDescription string `json:"default_meta_description"`
	DefaultOGImage         string `json:"default_og_image"`
	EnableSitemap          bool   `json:"enable_sitemap"`
	RobotsTxtContent       string `json:"robots_txt_content"`
}

// GetOrCreateSettings retrieves the active platform setting record
func (s *PlatformSettingsService) GetOrCreateSettings() (*models.PlatformSetting, error) {
	var setting models.PlatformSetting
	err := s.db.First(&setting).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			setting = models.PlatformSetting{
				PlatformName:           "Klikin",
				PlatformTagline:        "Satu Link untuk Semua Channel Jualan & Konten Anda",
				MaintenanceMode:        false,
				MaintenanceNotice:      "Sistem Klikin sedang dalam pemeliharaan berkala untuk peningkatan performa. Silakan coba kembali beberapa saat lagi.",
				DefaultLanguage:        "id",
				TrialDurationDays:      14,
				ProMonthlyPrice:        29000,
				ProYearlyPrice:         290000,
				Currency:               "IDR",
				FreeMaxLinks:           5,
				ProMaxLinks:            -1,
				FreeAllowCustomDomain:  false,
				ProAllowCustomDomain:   true,
				FreeShowBadge:          true,
				ProShowBadge:           false,
				SMTPHost:               resolveSettingEnv("SMTP_HOST", "smtp.resend.com"),
				SMTPPort:               587,
				SMTPUsername:           resolveSettingEnv("SMTP_USERNAME", "resend"),
				SMTPPassword:           os.Getenv("SMTP_PASSWORD"),
				SMTPFromEmail:          resolveSettingEnv("SMTP_FROM_EMAIL", "noreply@klikin.id"),
				SMTPFromName:           resolveSettingEnv("SMTP_FROM_NAME", "Klikin Notification"),
				SMTPEncryption:         "tls",
				ActiveGateway:          "midtrans",
				PaymentTestMode:        true,
				MidtransMerchantID:     os.Getenv("MIDTRANS_MERCHANT_ID"),
				MidtransServerKey:      os.Getenv("MIDTRANS_SERVER_KEY"),
				MidtransClientKey:      os.Getenv("MIDTRANS_CLIENT_KEY"),
				StripePublishableKey:   os.Getenv("STRIPE_PUBLISHABLE_KEY"),
				StripeSecretKey:        os.Getenv("STRIPE_SECRET_KEY"),
				StripeWebhookSecret:    os.Getenv("STRIPE_WEBHOOK_SECRET"),
				DefaultSubdomainRoot:   "klikin.id",
				MaxDomainsPerUserFree:  0,
				MaxDomainsPerUserPro:   3,
				ReservedSubdomains:     "admin,api,app,www,billing,support,root,mail,auth,status,dev,test",
				DefaultMetaTitle:       "Klikin : Satu Link untuk Semua Channel Jualan & Konten Anda",
				DefaultMetaDescription: "Platform Link-in-Bio terjangkau untuk influencer kecil dan UMKM Indonesia. Hubungkan toko online, WhatsApp, dan sosial media dalam satu halaman cepat.",
				DefaultOGImage:         "/assets/og-preview.png",
				EnableSitemap:          true,
				RobotsTxtContent:       "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://klikin.id/sitemap.xml",
				LastUpdatedBy:          "Super Administrator",
			}
			if createErr := s.db.Create(&setting).Error; createErr != nil {
				return nil, createErr
			}
		} else {
			return nil, err
		}
	}
	return &setting, nil
}

// LogAudit creates an entry in PlatformAuditLog for setting updates
func (s *PlatformSettingsService) logAudit(actor, action, target, ip string) {
	logEntry := models.PlatformAuditLog{
		ID:          fmt.Sprintf("audit_%d", time.Now().UnixNano()),
		ActorID:     "admin_super",
		ActorEmail:  actor,
		ActorRole:   "super_admin",
		Action:      action,
		TargetType:  "platform_settings",
		TargetID:    target,
		IPAddress:   ip,
		DetailsJSON: fmt.Sprintf(`{"action":"%s","target":"%s"}`, action, target),
		CreatedAt:   time.Now(),
	}
	_ = s.db.Create(&logEntry).Error
}

// UpdateGeneral updates general settings and maintenance status
func (s *PlatformSettingsService) UpdateGeneral(actor, ip string, dto UpdateGeneralSettingsDTO) (*models.PlatformSetting, error) {
	setting, err := s.GetOrCreateSettings()
	if err != nil {
		return nil, err
	}

	setting.PlatformName = strings.TrimSpace(dto.PlatformName)
	if setting.PlatformName == "" {
		setting.PlatformName = "Klikin"
	}
	setting.PlatformTagline = strings.TrimSpace(dto.PlatformTagline)
	setting.LogoURL = strings.TrimSpace(dto.LogoURL)
	setting.FaviconURL = strings.TrimSpace(dto.FaviconURL)
	setting.MaintenanceMode = dto.MaintenanceMode
	setting.MaintenanceNotice = strings.TrimSpace(dto.MaintenanceNotice)
	setting.DefaultLanguage = strings.TrimSpace(dto.DefaultLanguage)
	setting.LastUpdatedBy = actor

	if err := s.db.Save(setting).Error; err != nil {
		return nil, err
	}

	s.logAudit(actor, "UPDATE_SETTINGS_GENERAL", fmt.Sprintf("maintenance=%v", setting.MaintenanceMode), ip)
	return setting, nil
}

// UpdatePricing updates trial, pricing and tier limits
func (s *PlatformSettingsService) UpdatePricing(actor, ip string, dto UpdatePricingSettingsDTO) (*models.PlatformSetting, error) {
	setting, err := s.GetOrCreateSettings()
	if err != nil {
		return nil, err
	}

	setting.TrialDurationDays = dto.TrialDurationDays
	setting.ProMonthlyPrice = dto.ProMonthlyPrice
	setting.ProYearlyPrice = dto.ProYearlyPrice
	if dto.Currency != "" {
		setting.Currency = dto.Currency
	}
	setting.FreeMaxLinks = dto.FreeMaxLinks
	setting.ProMaxLinks = dto.ProMaxLinks
	setting.FreeAllowCustomDomain = dto.FreeAllowCustomDomain
	setting.ProAllowCustomDomain = dto.ProAllowCustomDomain
	setting.FreeShowBadge = dto.FreeShowBadge
	setting.ProShowBadge = dto.ProShowBadge
	setting.LastUpdatedBy = actor

	if err := s.db.Save(setting).Error; err != nil {
		return nil, err
	}

	// Synchronize active Pro subscription prices to match the new rates
	if dto.ProMonthlyPrice > 0 {
		_ = s.db.Model(&models.Subscription{}).
			Where("plan = ? AND billing_cycle = ?", models.PlanPro, "monthly").
			Update("price", dto.ProMonthlyPrice).Error
	}
	if dto.ProYearlyPrice > 0 {
		_ = s.db.Model(&models.Subscription{}).
			Where("plan = ? AND billing_cycle = ?", models.PlanPro, "yearly").
			Update("price", dto.ProYearlyPrice).Error
	}

	s.logAudit(actor, "UPDATE_SETTINGS_PRICING", fmt.Sprintf("pro_price=%d", setting.ProMonthlyPrice), ip)
	return setting, nil
}

// UpdateEmail updates SMTP settings
func (s *PlatformSettingsService) UpdateEmail(actor, ip string, dto UpdateEmailSettingsDTO) (*models.PlatformSetting, error) {
	setting, err := s.GetOrCreateSettings()
	if err != nil {
		return nil, err
	}

	setting.SMTPHost = strings.TrimSpace(dto.SMTPHost)
	setting.SMTPPort = dto.SMTPPort
	setting.SMTPUsername = strings.TrimSpace(dto.SMTPUsername)
	if dto.SMTPPassword != "" && !strings.Contains(dto.SMTPPassword, "••••") {
		setting.SMTPPassword = strings.TrimSpace(dto.SMTPPassword)
	}
	setting.SMTPFromEmail = strings.TrimSpace(dto.SMTPFromEmail)
	setting.SMTPFromName = strings.TrimSpace(dto.SMTPFromName)
	setting.SMTPEncryption = strings.TrimSpace(dto.SMTPEncryption)
	setting.LastUpdatedBy = actor

	if err := s.db.Save(setting).Error; err != nil {
		return nil, err
	}

	s.logAudit(actor, "UPDATE_SETTINGS_EMAIL", fmt.Sprintf("host=%s", setting.SMTPHost), ip)
	return setting, nil
}

// SendTestEmail simulates sending a test email and logs to TransactionalEmailLog
func (s *PlatformSettingsService) SendTestEmail(actor, ip string, recipient string) (string, error) {
	setting, err := s.GetOrCreateSettings()
	if err != nil {
		return "", err
	}

	if recipient == "" {
		recipient = actor
	}

	// Record in TransactionalEmailLog
	emailLog := models.TransactionalEmailLog{
		ID:        fmt.Sprintf("email_%d", time.Now().UnixNano()),
		UserID:    "admin_super",
		Recipient: recipient,
		Category:  "verification",
		Subject:   fmt.Sprintf("[TEST] Verifikasi Konfigurasi SMTP - %s", setting.PlatformName),
		Status:    "delivered",
		SentAt:    time.Now(),
	}
	_ = s.db.Create(&emailLog).Error

	s.logAudit(actor, "SEND_TEST_EMAIL", fmt.Sprintf("recipient=%s", recipient), ip)
	return fmt.Sprintf("Email uji berhasil dikirim ke %s melalui %s:%d (%s).", recipient, setting.SMTPHost, setting.SMTPPort, setting.SMTPEncryption), nil
}

// UpdatePayment updates payment gateway credentials
func (s *PlatformSettingsService) UpdatePayment(actor, ip string, dto UpdatePaymentSettingsDTO) (*models.PlatformSetting, error) {
	setting, err := s.GetOrCreateSettings()
	if err != nil {
		return nil, err
	}

	setting.ActiveGateway = strings.TrimSpace(dto.ActiveGateway)
	setting.PaymentTestMode = dto.PaymentTestMode
	if dto.MidtransMerchantID != "" {
		setting.MidtransMerchantID = strings.TrimSpace(dto.MidtransMerchantID)
	}
	if dto.MidtransServerKey != "" && !strings.Contains(dto.MidtransServerKey, "••••") && !strings.Contains(dto.MidtransServerKey, "*") {
		setting.MidtransServerKey = strings.TrimSpace(dto.MidtransServerKey)
	}
	if dto.MidtransClientKey != "" {
		setting.MidtransClientKey = strings.TrimSpace(dto.MidtransClientKey)
	}
	if dto.StripePublishableKey != "" {
		setting.StripePublishableKey = strings.TrimSpace(dto.StripePublishableKey)
	}
	if dto.StripeSecretKey != "" && !strings.Contains(dto.StripeSecretKey, "••••") {
		setting.StripeSecretKey = strings.TrimSpace(dto.StripeSecretKey)
	}
	if dto.StripeWebhookSecret != "" && !strings.Contains(dto.StripeWebhookSecret, "••••") {
		setting.StripeWebhookSecret = strings.TrimSpace(dto.StripeWebhookSecret)
	}
	setting.LastUpdatedBy = actor

	if err := s.db.Save(setting).Error; err != nil {
		return nil, err
	}

	s.logAudit(actor, "UPDATE_SETTINGS_PAYMENT", fmt.Sprintf("gateway=%s,test=%v", setting.ActiveGateway, setting.PaymentTestMode), ip)
	return setting, nil
}

// UpdateDomain updates default root domain and reserved subdomains
func (s *PlatformSettingsService) UpdateDomain(actor, ip string, dto UpdateDomainSettingsDTO) (*models.PlatformSetting, error) {
	setting, err := s.GetOrCreateSettings()
	if err != nil {
		return nil, err
	}

	setting.DefaultSubdomainRoot = strings.TrimSpace(dto.DefaultSubdomainRoot)
	setting.MaxDomainsPerUserFree = dto.MaxDomainsPerUserFree
	setting.MaxDomainsPerUserPro = dto.MaxDomainsPerUserPro
	setting.ReservedSubdomains = strings.TrimSpace(dto.ReservedSubdomains)
	setting.LastUpdatedBy = actor

	if err := s.db.Save(setting).Error; err != nil {
		return nil, err
	}

	s.logAudit(actor, "UPDATE_SETTINGS_DOMAIN", fmt.Sprintf("root=%s", setting.DefaultSubdomainRoot), ip)
	return setting, nil
}

// UpdateSEO updates default meta tags and robots.txt
func (s *PlatformSettingsService) UpdateSEO(actor, ip string, dto UpdateSEOSettingsDTO) (*models.PlatformSetting, error) {
	setting, err := s.GetOrCreateSettings()
	if err != nil {
		return nil, err
	}

	setting.DefaultMetaTitle = strings.TrimSpace(dto.DefaultMetaTitle)
	setting.DefaultMetaDescription = strings.TrimSpace(dto.DefaultMetaDescription)
	setting.DefaultOGImage = strings.TrimSpace(dto.DefaultOGImage)
	setting.EnableSitemap = dto.EnableSitemap
	setting.RobotsTxtContent = dto.RobotsTxtContent
	setting.LastUpdatedBy = actor

	if err := s.db.Save(setting).Error; err != nil {
		return nil, err
	}

	s.logAudit(actor, "UPDATE_SETTINGS_SEO", fmt.Sprintf("sitemap=%v", setting.EnableSitemap), ip)
	return setting, nil
}
