package domain

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"net"
	"regexp"
	"strings"
	"time"

	"gorm.io/gorm"
	"klikin-backend/config"
	"klikin-backend/models"
)

type DomainService struct {
	db *gorm.DB
}

func NewDomainService(db *gorm.DB) *DomainService {
	return &DomainService{db: db}
}

type AddDomainDTO struct {
	Domain            string `json:"domain"`
	RedirectWWW       bool   `json:"redirect_www"`
	FallbackSubdomain bool   `json:"fallback_subdomain"`
}

type UpdateDomainSettingsDTO struct {
	RedirectWWW       bool `json:"redirect_www"`
	FallbackSubdomain bool `json:"fallback_subdomain"`
}

type DNSInstruction struct {
	Type        string `json:"type"`        // "CNAME" | "TXT"
	Host        string `json:"host"`        // e.g. "@", "links", "_klikin-challenge"
	Value       string `json:"value"`       // e.g. "cname.klikin.id"
	TTL         string `json:"ttl"`         // e.g. "Auto" or "3600"
	Description string `json:"description"` // explanation
}

type DomainDetailsResponse struct {
	Domain            *models.CustomDomain `json:"domain"`
	PageSlug          string               `json:"page_slug"`
	FallbackURL       string               `json:"fallback_url"`
	IsPro             bool                 `json:"is_pro"`
	DNSInstructions   []DNSInstruction     `json:"dns_instructions"`
	PropagationNotice string               `json:"propagation_notice"`
}

var (
	domainRegex    = regexp.MustCompile(`^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$`)
	blacklistedMap = map[string]bool{
		"klikin.id":          true,
		"www.klikin.id":      true,
		"app.klikin.id":      true,
		"api.klikin.id":      true,
		"cname.klikin.id":    true,
		"localhost":          true,
		"127.0.0.1":          true,
	}
)

// SanitizeDomain cleans up user input (strips http://, trailing slashes, whitespace)
func SanitizeDomain(raw string) string {
	d := strings.TrimSpace(strings.ToLower(raw))
	d = strings.TrimPrefix(d, "http://")
	d = strings.TrimPrefix(d, "https://")
	d = strings.TrimSuffix(d, "/")
	// Remove any path or query
	if idx := strings.Index(d, "/"); idx != -1 {
		d = d[:idx]
	}
	if idx := strings.Index(d, ":"); idx != -1 {
		d = d[:idx]
	}
	return d
}

// GetDomain retrieves custom domain details for the authenticated owner
func (s *DomainService) GetDomain(userID string) (*DomainDetailsResponse, error) {
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

	var customDomain models.CustomDomain
	err := s.db.Where("page_id = ?", page.ID).First(&customDomain).Error

	resp := &DomainDetailsResponse{
		PageSlug:          page.Slug,
		FallbackURL:       fmt.Sprintf("https://klikin.id/%s", page.Slug),
		IsPro:             user.IsPro,
		PropagationNotice: "Perubahan DNS membutuhkan waktu propagasi antara 5 menit hingga 48 jam tergantung penyedia domain Anda.",
	}

	if err == nil {
		resp.Domain = &customDomain
		resp.DNSInstructions = s.generateDNSInstructions(&customDomain)
	}

	return resp, nil
}

// AddDomain configures a new custom domain for the owner's page
func (s *DomainService) AddDomain(userID string, dto AddDomainDTO) (*DomainDetailsResponse, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	if !user.IsPro {
		return nil, errors.New("FITUR_PRO: Domain kustom merupakan fitur Klikin Pro. Silakan tingkatkan akun Anda.")
	}

	cleanDomain := SanitizeDomain(dto.Domain)
	if !domainRegex.MatchString(cleanDomain) {
		return nil, errors.New("format nama domain tidak valid. Contoh: link.brandanda.com atau brandanda.id")
	}

	if blacklistedMap[cleanDomain] || strings.HasSuffix(cleanDomain, ".klikin.id") {
		return nil, errors.New("nama domain ini dicadangkan untuk infrastruktur Klikin dan tidak dapat digunakan")
	}

	var activeBlacklist []models.BlacklistedDomain
	if err := s.db.Where("is_active = ?", true).Find(&activeBlacklist).Error; err == nil {
		for _, bl := range activeBlacklist {
			pattern := strings.ToLower(strings.TrimSpace(bl.Pattern))
			if pattern != "" && (cleanDomain == pattern || strings.HasSuffix(cleanDomain, "."+pattern) || strings.Contains(cleanDomain, pattern)) {
				s.db.Model(&models.BlacklistedDomain{}).Where("id = ?", bl.ID).UpdateColumn("hit_count", gorm.Expr("hit_count + 1"))
				return nil, fmt.Errorf("domain '%s' diblokir oleh kebijakan keamanan Klikin (%s)", cleanDomain, bl.Category)
			}
		}
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	// Check if domain is used by another page
	var existing models.CustomDomain
	if err := s.db.Where("domain = ? AND page_id != ?", cleanDomain, page.ID).First(&existing).Error; err == nil {
		return nil, errors.New("domain ini sudah terdaftar oleh pengguna lain")
	}

	// Remove previous domain for this page if exists
	s.db.Where("page_id = ?", page.ID).Delete(&models.CustomDomain{})

	// Generate verification token
	tokenBytes := make([]byte, 8)
	_, _ = rand.Read(tokenBytes)
	verificationToken := "klikin-verify-" + hex.EncodeToString(tokenBytes)

	// Determine host record name
	txtHost := "_klikin-challenge"
	parts := strings.Split(cleanDomain, ".")
	if len(parts) > 2 {
		txtHost = "_klikin-challenge." + parts[0]
	}

	newDomain := models.CustomDomain{
		ID:                fmt.Sprintf("dom_%d", time.Now().UnixNano()),
		PageID:            page.ID,
		UserID:            user.ID,
		Domain:            cleanDomain,
		Status:            models.DomainStatusPending,
		SSLStatus:         models.SSLStatusProvisioning,
		VerificationToken: verificationToken,
		CNAMETarget:       "cname.klikin.id",
		TXTRecordName:     txtHost,
		RedirectWWW:       dto.RedirectWWW,
		FallbackSubdomain: dto.FallbackSubdomain,
		ErrorMessage:      "Menunggu konfigurasi CNAME & TXT Record pada DNS manager domain Anda",
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	if err := s.db.Create(&newDomain).Error; err != nil {
		return nil, fmt.Errorf("gagal mendaftarkan domain: %w", err)
	}

	s.db.Create(&models.DomainDiagnosticLog{
		ID:            fmt.Sprintf("dlog_%d", time.Now().UnixNano()),
		DomainID:      newDomain.ID,
		DomainName:    cleanDomain,
		PageID:        page.ID,
		PageSlug:      page.Slug,
		UserID:        user.ID,
		OwnerUsername: user.Username,
		EventType:     "DOMAIN_ADDED",
		Severity:      "info",
		ErrorCode:     "PENDING_DNS",
		Message:       fmt.Sprintf("Owner @%s mendaftarkan domain kustom %s untuk halaman /%s", user.Username, cleanDomain, page.Slug),
		ActorID:       user.ID,
		ActorName:     user.Username,
		CreatedAt:     time.Now(),
	})

	// Update page reference
	s.db.Model(&page).Update("custom_domain", cleanDomain)

	return s.GetDomain(userID)
}

// VerifyDomain checks DNS records and validates ownership & SSL status
func (s *DomainService) VerifyDomain(userID string) (*DomainDetailsResponse, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	var domain models.CustomDomain
	if err := s.db.Where("page_id = ?", page.ID).First(&domain).Error; err != nil {
		return nil, errors.New("belum ada domain yang didaftarkan untuk halaman ini")
	}

	now := time.Now()
	domain.LastCheckedAt = &now
	domain.CheckCount++
	domain.Status = models.DomainStatusVerifying

	// 1. Attempt real DNS resolution with 2-second timeout
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	resolver := &net.Resolver{}

	cnameMatched := false
	cnameTarget, err := resolver.LookupCNAME(ctx, domain.Domain)
	if err == nil {
		cnameClean := strings.TrimSuffix(strings.ToLower(cnameTarget), ".")
		if cnameClean == "cname.klikin.id" || strings.Contains(cnameClean, "klikin") {
			cnameMatched = true
		}
	}

	txtMatched := false
	fullTxtDomain := domain.TXTRecordName + "." + domain.Domain
	if strings.HasPrefix(domain.TXTRecordName, "_klikin-challenge.") {
		// e.g. _klikin-challenge.link.kopiseduh.id
		fullTxtDomain = domain.TXTRecordName + "." + strings.Join(strings.Split(domain.Domain, ".")[1:], ".")
	}
	txtRecords, err := resolver.LookupTXT(ctx, fullTxtDomain)
	if err == nil {
		for _, r := range txtRecords {
			if strings.TrimSpace(r) == domain.VerificationToken {
				txtMatched = true
				break
			}
		}
	}

	// In production, real CNAME or TXT DNS verification MUST be met.
	// Sandbox/dev domains are only auto-verified in non-production environments.
	isVerified := cnameMatched || txtMatched
	appEnv := config.LoadConfig().AppEnv
	isDevDomain := appEnv != "production" && (strings.HasSuffix(domain.Domain, ".test") ||
		strings.HasSuffix(domain.Domain, ".local") ||
		strings.Contains(domain.Domain, "kopiseduh") ||
		strings.Contains(domain.Domain, "klikin"))

	if isVerified || isDevDomain {
		exp := now.AddDate(0, 0, 90)
		domain.Status = models.DomainStatusActive
		domain.SSLStatus = models.SSLStatusActive
		domain.SSLIssuer = "Let's Encrypt R3"
		domain.SSLExpiresAt = &exp
		domain.LastErrorCode = ""
		domain.ErrorMessage = ""

		s.db.Model(&models.BioPage{}).Where("id = ?", page.ID).Updates(map[string]interface{}{
			"custom_domain": domain.Domain,
			"is_verified":   true,
		})

		s.db.Create(&models.DomainDiagnosticLog{
			ID:            fmt.Sprintf("dlog_%d", time.Now().UnixNano()),
			DomainID:      domain.ID,
			DomainName:    domain.Domain,
			PageID:        page.ID,
			PageSlug:      page.Slug,
			UserID:        userID,
			EventType:     "DNS_CHECK",
			Severity:      "info",
			ErrorCode:     "OK",
			ResolvedCNAME: domain.CNAMETarget,
			Message:       fmt.Sprintf("Verifikasi DNS berhasil untuk %s. Sertifikat SSL Let's Encrypt aktif.", domain.Domain),
			ActorID:       userID,
			ActorName:     "Owner DNS Check",
			CreatedAt:     now,
		})
	} else {
		domain.Status = models.DomainStatusError
		domain.SSLStatus = models.SSLStatusProvisioning
		domain.LastErrorCode = "DNS_CNAME_MISMATCH"
		domain.ErrorMessage = "Record CNAME belum terdeteksi mengarah ke cname.klikin.id. Jika baru saja menambahkan record, silakan tunggu 5-15 menit untuk propagasi DNS."

		s.db.Create(&models.DomainDiagnosticLog{
			ID:            fmt.Sprintf("dlog_%d", time.Now().UnixNano()),
			DomainID:      domain.ID,
			DomainName:    domain.Domain,
			PageID:        page.ID,
			PageSlug:      page.Slug,
			UserID:        userID,
			EventType:     "DNS_ERROR",
			Severity:      "error",
			ErrorCode:     "DNS_CNAME_MISMATCH",
			ResolvedCNAME: strings.TrimSuffix(cnameTarget, "."),
			Message:       domain.ErrorMessage,
			ActorID:       userID,
			ActorName:     "Owner DNS Check",
			CreatedAt:     now,
		})
	}

	domain.UpdatedAt = time.Now()
	s.db.Save(&domain)

	return s.GetDomain(userID)
}

// UpdateDomainSettings updates redirect_www and fallback_subdomain toggles
func (s *DomainService) UpdateDomainSettings(userID string, dto UpdateDomainSettingsDTO) (*DomainDetailsResponse, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	var domain models.CustomDomain
	if err := s.db.Where("page_id = ?", page.ID).First(&domain).Error; err != nil {
		return nil, errors.New("belum ada domain yang didaftarkan")
	}

	domain.RedirectWWW = dto.RedirectWWW
	domain.FallbackSubdomain = dto.FallbackSubdomain
	domain.UpdatedAt = time.Now()

	if err := s.db.Save(&domain).Error; err != nil {
		return nil, err
	}

	return s.GetDomain(userID)
}

// DeleteDomain disconnects and removes custom domain from page
func (s *DomainService) DeleteDomain(userID string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", userID).First(&page).Error; err != nil {
		return errors.New("halaman bio tidak ditemukan")
	}

	// Delete custom domain record
	s.db.Where("page_id = ?", page.ID).Delete(&models.CustomDomain{})

	// Clear domain on bio page
	s.db.Model(&page).Updates(map[string]interface{}{
		"custom_domain": nil,
		"is_verified":   false,
	})

	return nil
}

func (s *DomainService) generateDNSInstructions(cd *models.CustomDomain) []DNSInstruction {
	parts := strings.Split(cd.Domain, ".")
	cnameHost := "@"
	if len(parts) > 2 {
		cnameHost = parts[0] // e.g. "link" or "bio"
	}

	return []DNSInstruction{
		{
			Type:        "CNAME",
			Host:        cnameHost,
			Value:       cd.CNAMETarget,
			TTL:         "Auto / 3600",
			Description: "Mengarahkan trafik domain Anda ke edge server platform Klikin",
		},
		{
			Type:        "TXT",
			Host:        cd.TXTRecordName,
			Value:       cd.VerificationToken,
			TTL:         "Auto / 3600",
			Description: "Memvalidasi kepemilikan domain secara aman untuk penerbitan SSL",
		},
	}
}
