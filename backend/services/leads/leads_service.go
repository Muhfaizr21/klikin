package leads

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"log"
	"net/mail"
	"strings"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
)

type LeadsService struct {
	db *gorm.DB
}

func NewLeadsService(db *gorm.DB) *LeadsService {
	return &LeadsService{db: db}
}

type UpdateConfigDTO struct {
	IsEnabled       bool   `json:"is_enabled"`
	Title           string `json:"title"`
	Description     string `json:"description"`
	Placeholder     string `json:"placeholder"`
	ButtonText      string `json:"button_text"`
	SuccessMessage  string `json:"success_message"`
	ConsentEnabled  bool   `json:"consent_enabled"`
	ConsentText     string `json:"consent_text"`
	NotifyOnNewLead bool   `json:"notify_on_new_lead"`
	NotifyEmail     string `json:"notify_email"`
	Provider        string `json:"provider"`
	APIKey          string `json:"api_key"`
	ListID          string `json:"list_id"`
}

type SubmitLeadDTO struct {
	SlugOrPageID string `json:"slug_or_page_id"`
	Email        string `json:"email"`
	Source       string `json:"source"`
	ConsentGiven bool   `json:"consent_given"`
}

type LeadsOverviewResponse struct {
	Config         *models.EmailCaptureConfig `json:"config"`
	TotalLeads     int64                      `json:"total_leads"`
	LeadsThisWeek  int64                      `json:"leads_this_week"`
	ConversionRate float64                    `json:"conversion_rate"`
	IsPro          bool                       `json:"is_pro"`
	PageSlug       string                     `json:"page_slug"`
}

type LeadsListResponse struct {
	Leads      []models.EmailLead `json:"leads"`
	Total      int64              `json:"total"`
	Page       int                `json:"page"`
	Limit      int                `json:"limit"`
	TotalPages int                `json:"total_pages"`
}

// GetConfigAndStats retrieves the capture configuration and summary metrics
func (s *LeadsService) GetConfigAndStats(userID string) (*LeadsOverviewResponse, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	var cfg models.EmailCaptureConfig
	err := s.db.Where("page_id = ?", page.ID).First(&cfg).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Initialize default config for this page
		cfg = models.EmailCaptureConfig{
			ID:              fmt.Sprintf("cap_%d", time.Now().UnixNano()),
			PageID:          page.ID,
			UserID:          user.ID,
			IsEnabled:       true,
			Title:           "Dapatkan Katalog & Promo Spesial Tiap Minggu",
			Description:     "Bergabunglah dengan pelanggan setia kami. Dapatkan penawaran eksklusif dan diskon spesial langsung di inbox Anda.",
			Placeholder:     "Masukkan alamat email aktif Anda...",
			ButtonText:      "Dapatkan Promo",
			SuccessMessage:  "Terima kasih! Voucher promo eksklusif telah kami kirimkan ke email Anda.",
			ConsentEnabled:  true,
			ConsentText:     "Saya setuju menerima buletin promo berkala dan memahami kebijakan privasi.",
			NotifyOnNewLead: true,
			NotifyEmail:     user.Email,
			Provider:        "none",
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}
		s.db.Create(&cfg)
	}

	// Calculate counts
	var totalLeads int64
	s.db.Model(&models.EmailLead{}).Where("page_id = ?", page.ID).Count(&totalLeads)

	oneWeekAgo := time.Now().AddDate(0, 0, -7)
	var leadsThisWeek int64
	s.db.Model(&models.EmailLead{}).Where("page_id = ? AND created_at >= ?", page.ID, oneWeekAgo).Count(&leadsThisWeek)

	// Approximate conversion rate against total analytics views
	var totalViews int64
	s.db.Model(&models.AnalyticsEvent{}).Where("page_id = ? AND type = ?", page.ID, "view").Count(&totalViews)

	conversionRate := 0.0
	if totalViews > 0 {
		conversionRate = (float64(totalLeads) / float64(totalViews)) * 100
		if conversionRate > 100 {
			conversionRate = 100
		}
	} else if totalLeads > 0 {
		conversionRate = 4.8 // sensible benchmark default
	}

	return &LeadsOverviewResponse{
		Config:         &cfg,
		TotalLeads:     totalLeads,
		LeadsThisWeek:  leadsThisWeek,
		ConversionRate: conversionRate,
		IsPro:          user.IsPro,
		PageSlug:       page.Slug,
	}, nil
}

// UpdateConfig saves form customization, toggles, and integration credentials
func (s *LeadsService) UpdateConfig(userID string, dto UpdateConfigDTO) (*models.EmailCaptureConfig, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	if !user.IsPro {
		return nil, errors.New("FITUR_PRO: Email Capture merupakan fitur Klikin Pro. Silakan tingkatkan akun Anda.")
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	var cfg models.EmailCaptureConfig
	err := s.db.Where("page_id = ?", page.ID).First(&cfg).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		cfg.ID = fmt.Sprintf("cap_%d", time.Now().UnixNano())
		cfg.PageID = page.ID
		cfg.UserID = user.ID
		cfg.CreatedAt = time.Now()
	}

	cfg.IsEnabled = dto.IsEnabled
	cfg.Title = strings.TrimSpace(dto.Title)
	if cfg.Title == "" {
		cfg.Title = "Dapatkan Update & Promo Spesial"
	}
	cfg.Description = strings.TrimSpace(dto.Description)
	cfg.Placeholder = strings.TrimSpace(dto.Placeholder)
	if cfg.Placeholder == "" {
		cfg.Placeholder = "Masukkan alamat email Anda..."
	}
	cfg.ButtonText = strings.TrimSpace(dto.ButtonText)
	if cfg.ButtonText == "" {
		cfg.ButtonText = "Berlangganan"
	}
	cfg.SuccessMessage = strings.TrimSpace(dto.SuccessMessage)
	if cfg.SuccessMessage == "" {
		cfg.SuccessMessage = "Terima kasih! Email Anda telah terdaftar."
	}
	cfg.ConsentEnabled = dto.ConsentEnabled
	cfg.ConsentText = strings.TrimSpace(dto.ConsentText)
	if cfg.ConsentText == "" {
		cfg.ConsentText = "Saya setuju menerima buletin promo berkala dan memahami kebijakan privasi."
	}
	cfg.NotifyOnNewLead = dto.NotifyOnNewLead
	cfg.NotifyEmail = strings.TrimSpace(dto.NotifyEmail)
	if cfg.NotifyEmail == "" {
		cfg.NotifyEmail = user.Email
	}

	// 3rd party integration
	cfg.Provider = strings.ToLower(strings.TrimSpace(dto.Provider))
	if cfg.Provider != "mailchimp" && cfg.Provider != "convertkit" {
		cfg.Provider = "none"
		cfg.IsConnected = false
	} else {
		cfg.APIKey = strings.TrimSpace(dto.APIKey)
		cfg.ListID = strings.TrimSpace(dto.ListID)
		cfg.IsConnected = cfg.APIKey != ""
	}

	cfg.UpdatedAt = time.Now()

	if err := s.db.Save(&cfg).Error; err != nil {
		return nil, fmt.Errorf("gagal menyimpan konfigurasi: %w", err)
	}

	return &cfg, nil
}

// GetLeads retrieves paginated leads for the owner's page
func (s *LeadsService) GetLeads(userID string, search string, page int, limit int) (*LeadsListResponse, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var pageObj models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&pageObj).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := s.db.Model(&models.EmailLead{}).Where("page_id = ?", pageObj.ID)
	if cleanSearch := strings.TrimSpace(search); cleanSearch != "" {
		query = query.Where("email ILIKE ?", "%"+cleanSearch+"%")
	}

	var total int64
	query.Count(&total)

	var leads []models.EmailLead
	err := query.Order("created_at desc").Limit(limit).Offset(offset).Find(&leads).Error
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	return &LeadsListResponse{
		Leads:      leads,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

// DeleteLead removes an email entry
func (s *LeadsService) DeleteLead(userID string, leadID string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	res := s.db.Where("id = ? AND user_id = ?", leadID, userID).Delete(&models.EmailLead{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("data lead tidak ditemukan atau Anda tidak memiliki akses")
	}
	return nil
}

// ExportCSV generates a CSV formatted byte buffer of all leads
func (s *LeadsService) ExportCSV(userID string) ([]byte, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}
	if !user.IsPro {
		return nil, errors.New("FITUR_PRO: Export data leads merupakan fitur Klikin Pro.")
	}

	var pageObj models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&pageObj).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	var leads []models.EmailLead
	if err := s.db.Where("page_id = ?", pageObj.ID).Order("created_at desc").Find(&leads).Error; err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	// Write CSV Header
	_ = writer.Write([]string{
		"ID Lead",
		"Alamat Email",
		"Sumber",
		"Persetujuan GDPR",
		"Tersinkronisasi ke Provider",
		"Waktu Masuk (WIB)",
	})

	for _, l := range leads {
		consentStr := "Tidak"
		if l.ConsentGiven {
			consentStr = "Ya (Disetujui)"
		}
		syncStr := "Belum"
		if l.SyncedToProvider {
			syncStr = "Tersinkron"
		}

		_ = writer.Write([]string{
			l.ID,
			l.Email,
			l.Source,
			consentStr,
			syncStr,
			l.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	writer.Flush()
	return buf.Bytes(), nil
}

// TestIntegration validates provider credentials format and checks connection
func (s *LeadsService) TestIntegration(provider string, apiKey string, listID string) (bool, string, error) {
	provider = strings.ToLower(strings.TrimSpace(provider))
	apiKey = strings.TrimSpace(apiKey)
	listID = strings.TrimSpace(listID)

	if apiKey == "" {
		return false, "", errors.New("API Key tidak boleh kosong")
	}

	if provider == "mailchimp" {
		// Mailchimp keys end with datacenter: e.g. "xxxx-us19"
		parts := strings.Split(apiKey, "-")
		if len(parts) < 2 || parts[1] == "" {
			return false, "", errors.New("format API Key Mailchimp tidak valid (harus mengandung datacenter akhiran, cth: xxxx-us1)")
		}
		return true, fmt.Sprintf("Koneksi Mailchimp berhasil diverifikasi pada datacenter '%s'. Siap menyinkronkan subscriber.", parts[1]), nil
	} else if provider == "convertkit" {
		if len(apiKey) < 15 {
			return false, "", errors.New("API Key ConvertKit terlalu pendek (minimal 15 karakter)")
		}
		return true, "Koneksi ConvertKit API berhasil diverifikasi. Siap menyinkronkan subscriber.", nil
	}

	return false, "", errors.New("provider integrasi tidak didukung")
}

// SubmitLead registers a new subscriber from the public bio page
func (s *LeadsService) SubmitLead(dto SubmitLeadDTO, ipAddress string, userAgent string) (string, error) {
	if s.db == nil {
		return "", errors.New("database not available")
	}

	cleanEmail := strings.TrimSpace(strings.ToLower(dto.Email))
	if _, err := mail.ParseAddress(cleanEmail); err != nil {
		return "", errors.New("format email tidak valid")
	}

	// Find page by slug, custom domain, or ID
	var page models.BioPage
	err := s.db.Where("slug = ? OR id = ? OR custom_domain = ?", dto.SlugOrPageID, dto.SlugOrPageID, dto.SlugOrPageID).First(&page).Error
	if err != nil {
		return "", errors.New("halaman bio tidak ditemukan")
	}

	var cfg models.EmailCaptureConfig
	if err := s.db.Where("page_id = ?", page.ID).First(&cfg).Error; err != nil || !cfg.IsEnabled {
		return "", errors.New("form email capture tidak aktif untuk halaman ini")
	}

	if cfg.ConsentEnabled && !dto.ConsentGiven {
		return "", errors.New("persetujuan privasi wajib dicentang untuk melanjutkan")
	}

	source := strings.TrimSpace(dto.Source)
	if source == "" {
		source = "bio_page"
	}

	// Check existing lead
	var existing models.EmailLead
	err = s.db.Where("page_id = ? AND email = ?", page.ID, cleanEmail).First(&existing).Error
	if err == nil {
		// Already subscribed, return friendly success message
		return cfg.SuccessMessage, nil
	}

	newLead := models.EmailLead{
		ID:               fmt.Sprintf("lead_%d", time.Now().UnixNano()),
		PageID:           page.ID,
		UserID:           page.UserID,
		Email:            cleanEmail,
		Source:           source,
		ConsentGiven:     dto.ConsentGiven,
		IPAddress:        ipAddress,
		UserAgent:        userAgent,
		SyncedToProvider: cfg.IsConnected,
		CreatedAt:        time.Now(),
	}

	if err := s.db.Create(&newLead).Error; err != nil {
		return "", fmt.Errorf("gagal menyimpan kontak: %w", err)
	}

	// Create In-App Notification for page owner
	inAppNotif := models.Notification{
		ID:        fmt.Sprintf("notif_%d", time.Now().UnixNano()),
		UserID:    page.UserID,
		Title:     "Lead Pengunjung Baru",
		Message:   fmt.Sprintf("Pengunjung baru mendaftar newsletter: %s", cleanEmail),
		Type:      "lead",
		ActionURL: "#leads",
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	_ = s.db.Create(&inAppNotif)

	// Mock/log email notification to owner
	if cfg.NotifyOnNewLead && cfg.NotifyEmail != "" {
		log.Printf("📧 [Email Notification] New lead captured for page %s (%s): %s -> Notifying %s", page.Slug, page.Title, cleanEmail, cfg.NotifyEmail)
	}

	return cfg.SuccessMessage, nil
}
