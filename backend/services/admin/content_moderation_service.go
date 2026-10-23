package admin

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"math"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
)

// ContentModerationUseCase defines the contract for Super Admin Content Moderation (Readme 3.5 - SOLID DIP & ISP)
type ContentModerationUseCase interface {
	ListPublicPages(filter ModerationPageFilter) (*ModerationPageListResult, error)
	GetPageModerationDetail(pageID string) (*PageModerationDetailResult, error)
	FlagPage(pageID string, dto FlagPageDTO, actor AdminActor) (*models.BioPage, error)
	ClearPageFlag(pageID string, note string, actor AdminActor) (*models.BioPage, error)
	TakeDownPage(pageID string, dto TakeDownPageDTO, actor AdminActor) (*models.BioPage, error)
	RestorePage(pageID string, note string, actor AdminActor) (*models.BioPage, error)
	BanViolator(userID string, dto BanViolatorDTO, actor AdminActor) (*models.User, error)
	ScanAllPagesAgainstBlacklist(actor AdminActor) (*AutoScanResult, error)

	ListVisitorReports(filter VisitorReportFilter) (*VisitorReportListResult, error)
	SubmitPublicReport(dto SubmitPublicReportDTO, clientIP string) (*models.ContentReport, error)
	ReviewVisitorReport(reportID string, dto ReviewReportDTO, actor AdminActor) (*models.ContentReport, error)

	ListBlacklist(search, category string) ([]models.BlacklistedDomain, error)
	AddBlacklist(dto SaveBlacklistDTO, actor AdminActor) (*models.BlacklistedDomain, error)
	ToggleBlacklist(id string, actor AdminActor) (*models.BlacklistedDomain, error)
	DeleteBlacklist(id string, actor AdminActor) error

	ListModerationLogs(search, action string, page, limit int) (*ModerationLogListResult, error)
	ExportModerationCSV() ([]byte, error)
}

// ModerationOverviewStats holds real-time Trust & Safety KPIs from PostgreSQL
type ModerationOverviewStats struct {
	TotalPublicPages     int64 `json:"total_public_pages"`
	LivePublishedPages   int64 `json:"live_published_pages"`
	FlaggedPagesCount    int64 `json:"flagged_pages_count"`
	TakenDownPagesCount  int64 `json:"taken_down_pages_count"`
	PendingReportsCount  int64 `json:"pending_reports_count"`
	ActionedReportsCount int64 `json:"actioned_reports_count"`
	ActiveBlacklistCount int64 `json:"active_blacklist_count"`
	BannedViolatorsCount int64 `json:"banned_violators_count"`
	TotalBlockedHits     int64 `json:"total_blocked_hits"`
}

// ModerationPageFilter encapsulates query parameters for listing pages
type ModerationPageFilter struct {
	Search           string
	ModerationStatus string // "all" | "clean" | "flagged" | "taken_down"
	Category         string // "all" | "phishing" | "spam" | "adult" | "gambling"
	Published        string // "all" | "live" | "offline"
	Sort             string // "updated_desc" | "reports_desc" | "flagged_desc" | "views_desc"
	Page             int
	Limit            int
}

// ModerationPageItemDTO represents a bio page row in the moderation console
type ModerationPageItemDTO struct {
	PageID              string     `json:"page_id"`
	Slug                string     `json:"slug"`
	Title               string     `json:"title"`
	Bio                 string     `json:"bio"`
	AvatarURL           string     `json:"avatar_url"`
	Theme               string     `json:"theme"`
	CustomDomain        string     `json:"custom_domain"`
	IsPublished         bool       `json:"is_published"`
	IsVerified          bool       `json:"is_verified"`
	ModerationStatus    string     `json:"moderation_status"` // "clean" | "flagged" | "taken_down"
	FlagCategory        string     `json:"flag_category"`
	FlagReason          string     `json:"flag_reason"`
	FlagSeverity        string     `json:"flag_severity"`
	FlaggedAt           *time.Time `json:"flagged_at,omitempty"`
	TakedownReason      string     `json:"takedown_reason"`
	TakenDownAt         *time.Time `json:"taken_down_at,omitempty"`
	UserID              string     `json:"user_id"`
	Username            string     `json:"username"`
	UserFullName        string     `json:"user_full_name"`
	UserEmail           string     `json:"user_email"`
	UserStatus          string     `json:"user_status"` // "ACTIVE" | "SUSPENDED" | "BANNED"
	IsPro               bool       `json:"is_pro"`
	ActiveLinksCount    int        `json:"active_links_count"`
	ActiveBlocksCount   int        `json:"active_blocks_count"`
	PendingReportsCount int        `json:"pending_reports_count"`
	TotalReportsCount   int        `json:"total_reports_count"`
	MatchedBlacklist    []string   `json:"matched_blacklist"`
	RiskScore           int        `json:"risk_score"` // 0 - 100 computed dynamically from links/reports/flags
	UpdatedAt           time.Time  `json:"updated_at"`
}

// ModerationPageListResult wraps paginated pages and overview stats
type ModerationPageListResult struct {
	Pages      []ModerationPageItemDTO `json:"pages"`
	Stats      ModerationOverviewStats `json:"stats"`
	Pagination PaginationMeta          `json:"pagination"`
}

// PageModerationDetailResult provides 360-degree inspection of a bio page, its links, blocks, reports, and logs
type PageModerationDetailResult struct {
	Page             models.BioPage         `json:"page"`
	Owner            models.User            `json:"owner"`
	Blocks           []models.BioBlock      `json:"blocks"`
	Links            []models.Link          `json:"links"`
	Reports          []models.ContentReport `json:"reports"`
	Logs             []models.ModerationLog `json:"logs"`
	MatchedBlacklist []string               `json:"matched_blacklist"`
	RiskScore        int                    `json:"risk_score"`
}

// VisitorReportFilter encapsulates query parameters for visitor reports
type VisitorReportFilter struct {
	Search   string
	Status   string // "all" | "pending" | "actioned" | "dismissed"
	Category string // "all" | "phishing" | "spam" | "adult" | "gambling"
	Severity string // "all" | "critical" | "high" | "medium" | "low"
	Page     int
	Limit    int
}

// VisitorReportItemDTO enriches ContentReport with owner and page status
type VisitorReportItemDTO struct {
	models.ContentReport
	PageTitle        string `json:"page_title"`
	PageIsPublished  bool   `json:"page_is_published"`
	ModerationStatus string `json:"moderation_status"`
	OwnerUsername    string `json:"owner_username"`
	OwnerFullName    string `json:"owner_full_name"`
	OwnerEmail       string `json:"owner_email"`
	OwnerStatus      string `json:"owner_status"`
}

// VisitorReportListResult wraps paginated visitor reports
type VisitorReportListResult struct {
	Reports    []VisitorReportItemDTO `json:"reports"`
	Pagination PaginationMeta         `json:"pagination"`
}

// ModerationLogListResult wraps paginated moderation logs
type ModerationLogListResult struct {
	Logs       []models.ModerationLog `json:"logs"`
	Pagination PaginationMeta         `json:"pagination"`
}

// AutoScanResult summarizes a platform-wide blacklist & heuristic scan
type AutoScanResult struct {
	ScannedPages int      `json:"scanned_pages"`
	ScannedURLs  int      `json:"scanned_urls"`
	FlaggedPages int      `json:"flagged_pages"`
	Matches      []string `json:"matches"`
}

// DTOs for Administrative Actions
type FlagPageDTO struct {
	Category string `json:"category"` // "phishing" | "spam" | "adult" | "gambling" | "scam"
	Severity string `json:"severity"` // "low" | "medium" | "high" | "critical"
	Reason   string `json:"reason"`
}

type TakeDownPageDTO struct {
	Category        string `json:"category"`
	Reason          string `json:"reason"`
	SuspendOwner    bool   `json:"suspend_owner"`
	BanOwner        bool   `json:"ban_owner"`
	BlacklistDomain string `json:"blacklist_domain"` // optional domain to add to blacklist immediately
}

type BanViolatorDTO struct {
	Reason          string `json:"reason"`
	TakeDownPage    bool   `json:"take_down_page"`
	RevokeSessions  bool   `json:"revoke_sessions"`
	BlacklistDomain string `json:"blacklist_domain"`
}

type SubmitPublicReportDTO struct {
	Slug          string `json:"slug"`
	Category      string `json:"category"` // "phishing" | "spam" | "adult" | "gambling" | "scam"
	Description   string `json:"description"`
	TargetURL     string `json:"target_url"`
	ReporterName  string `json:"reporter_name"`
	ReporterEmail string `json:"reporter_email"`
}

type ReviewReportDTO struct {
	Decision       string `json:"decision"` // "dismiss" | "flag_page" | "takedown_page" | "ban_user"
	ResolutionNote string `json:"resolution_note"`
	Severity       string `json:"severity"`
	BlacklistURL   string `json:"blacklist_url"`
}

type SaveBlacklistDTO struct {
	Pattern   string `json:"pattern"`
	MatchType string `json:"match_type"` // "domain" | "url_contains" | "exact_url"
	Category  string `json:"category"`   // "phishing" | "spam" | "adult" | "gambling"
	Severity  string `json:"severity"`   // "medium" | "high" | "critical"
	Reason    string `json:"reason"`
}

// ContentModerationService implements ContentModerationUseCase
type ContentModerationService struct {
	db *gorm.DB
}

// NewContentModerationService initializes the service and seeds initial realistic moderation data if empty
func NewContentModerationService(db *gorm.DB) *ContentModerationService {
	svc := &ContentModerationService{db: db}
	go svc.ensureModerationDataSynced()
	return svc
}

func (s *ContentModerationService) ensureModerationDataSynced() {
	if s.db == nil {
		return
	}
	time.Sleep(450 * time.Millisecond)

	// Normalize empty moderation_status on existing bio_pages
	s.db.Model(&models.BioPage{}).
		Where("moderation_status IS NULL OR moderation_status = ''").
		Update("moderation_status", "clean")

	// 1. Seed initial BlacklistedDomain rules if table is empty
	var blCount int64
	s.db.Model(&models.BlacklistedDomain{}).Count(&blCount)
	now := time.Now()
	if blCount == 0 {
		initialBlacklist := []models.BlacklistedDomain{
			{
				ID:          "bl_dom_01",
				Pattern:     "slot-gacor-vip.xyz",
				MatchType:   "domain",
				Category:    "gambling",
				Severity:    "critical",
				Reason:      "Domain judi slot online ilegal yang sering disisipkan pada bio link spam",
				HitCount:    42,
				IsActive:    true,
				AddedBy:     "usr_superadmin_01",
				AddedByName: "Super Admin",
				CreatedAt:   now.AddDate(0, 0, -14),
				UpdatedAt:   now.AddDate(0, 0, -1),
			},
			{
				ID:          "bl_dom_02",
				Pattern:     "hadiah-bank-resmi.my.id",
				MatchType:   "domain",
				Category:    "phishing",
				Severity:    "critical",
				Reason:      "Situs phishing kredensial mobile banking & OTP palsu",
				HitCount:    29,
				IsActive:    true,
				AddedBy:     "usr_superadmin_01",
				AddedByName: "Super Admin",
				CreatedAt:   now.AddDate(0, 0, -10),
				UpdatedAt:   now.AddDate(0, 0, -2),
			},
			{
				ID:          "bl_dom_03",
				Pattern:     " Zeus88-maxwin.cc",
				MatchType:   "domain",
				Category:    "gambling",
				Severity:    "critical",
				Reason:      "Jaringan afiliasi judi daring terlarang (Kominfo Trust+)",
				HitCount:    18,
				IsActive:    true,
				AddedBy:     "usr_superadmin_01",
				AddedByName: "Super Admin",
				CreatedAt:   now.AddDate(0, 0, -8),
				UpdatedAt:   now.AddDate(0, 0, -3),
			},
			{
				ID:          "bl_dom_04",
				Pattern:     "claim-dana-kaget-palsu.com",
				MatchType:   "url_contains",
				Category:    "phishing",
				Severity:    "high",
				Reason:      "Tautan scam saldo e-wallet palsu pencuri akun sosial media",
				HitCount:    15,
				IsActive:    true,
				AddedBy:     "usr_superadmin_01",
				AddedByName: "Super Admin",
				CreatedAt:   now.AddDate(0, 0, -6),
				UpdatedAt:   now.AddDate(0, 0, -1),
			},
			{
				ID:          "bl_dom_05",
				Pattern:     "adult-cam-vip18.net",
				MatchType:   "domain",
				Category:    "adult",
				Severity:    "high",
				Reason:      "Konten dewasa eksplisit melanggar Ketentuan Layanan Klikin",
				HitCount:    9,
				IsActive:    true,
				AddedBy:     "usr_superadmin_01",
				AddedByName: "Super Admin",
				CreatedAt:   now.AddDate(0, 0, -5),
				UpdatedAt:   now.AddDate(0, 0, -2),
			},
			{
				ID:          "bl_dom_06",
				Pattern:     "crypto-doubler-instant.io",
				MatchType:   "domain",
				Category:    "spam",
				Severity:    "medium",
				Reason:      "Skema ponzi pengganda aset kripto & spam bot otomatis",
				HitCount:    7,
				IsActive:    true,
				AddedBy:     "usr_superadmin_01",
				AddedByName: "Super Admin",
				CreatedAt:   now.AddDate(0, 0, -3),
				UpdatedAt:   now,
			},
		}
		for i := range initialBlacklist {
			initialBlacklist[i].Pattern = strings.TrimSpace(strings.ToLower(initialBlacklist[i].Pattern))
			_ = s.db.Create(&initialBlacklist[i]).Error
		}
	}

	// 2. Seed realistic Visitor Reports & Flagged BioPages if ContentReport table is empty
	var reportCount int64
	s.db.Model(&models.ContentReport{}).Count(&reportCount)
	if reportCount == 0 {
		var pages []models.BioPage
		s.db.Order("created_at desc").Find(&pages)
		if len(pages) > 0 {
			// Pick up to 3 existing pages to attach realistic reports & flags for demonstration
			p1 := pages[0]
			t1 := now.Add(-2 * time.Hour)
			_ = s.db.Model(&models.BioPage{}).Where("id = ?", p1.ID).Updates(map[string]interface{}{
				"moderation_status": "flagged",
				"flag_category":     "phishing",
				"flag_severity":     "high",
				"flag_reason":       "Dilaporkan pengunjung karena mengarahkan tombol klaim voucher ke formulir login mencurigakan.",
				"flagged_at":        &t1,
			}).Error

			r1 := models.ContentReport{
				ID:            "rep_mod_01",
				PageID:        p1.ID,
				Slug:          p1.Slug,
				OwnerUserID:   p1.UserID,
				ReporterName:  "Dimas Pratama (Pengunjung)",
				ReporterEmail: "dimas.pratama@gmail.com",
				ReporterIP:    "103.147.88.21",
				Category:      "phishing",
				Severity:      "high",
				Description:   "Tautan promo giveaway di bagian bawah halaman meminta login akun Instagram dan kode OTP WhatsApp.",
				TargetURL:     "https://hadiah-bank-resmi.my.id/claim",
				Status:        models.ReportStatusPending,
				CreatedAt:     t1,
				UpdatedAt:     t1,
			}
			_ = s.db.Create(&r1).Error

			if len(pages) > 1 {
				p2 := pages[1]
				t2 := now.Add(-5 * time.Hour)
				_ = s.db.Model(&models.BioPage{}).Where("id = ?", p2.ID).Updates(map[string]interface{}{
					"moderation_status": "flagged",
					"flag_category":     "gambling",
					"flag_severity":     "critical",
					"flag_reason":       "Terdeteksi indikasi tautan redirect afiliasi judi online pada blok eksternal.",
					"flagged_at":        &t2,
				}).Error

				r2 := models.ContentReport{
					ID:            "rep_mod_02",
					PageID:        p2.ID,
					Slug:          p2.Slug,
					OwnerUserID:   p2.UserID,
					ReporterName:  "Siti Rahmawati",
					ReporterEmail: "siti.rahma@yahoo.com",
					ReporterIP:    "114.122.41.90",
					Category:      "gambling",
					Severity:      "critical",
					Description:   "Ada banner tersembunyi yang mengarahkan pengunjung ke situs slot gacor VIP saat diklik dari perangkat mobile.",
					TargetURL:     "https://slot-gacor-vip.xyz/register",
					Status:        models.ReportStatusPending,
					CreatedAt:     t2,
					UpdatedAt:     t2,
				}
				_ = s.db.Create(&r2).Error
			}

			if len(pages) > 2 {
				p3 := pages[2]
				t3 := now.Add(-18 * time.Hour)
				revAt := now.Add(-12 * time.Hour)
				r3 := models.ContentReport{
					ID:             "rep_mod_03",
					PageID:         p3.ID,
					Slug:           p3.Slug,
					OwnerUserID:    p3.UserID,
					ReporterName:   "Andi Wijaya",
					ReporterEmail:  "andi.w@outlook.com",
					ReporterIP:     "182.253.12.44",
					Category:       "spam",
					Severity:       "low",
					Description:    "Terlalu banyak pop-up tautan afiliasi diskon yang berulang.",
					TargetURL:      "https://klikin.id/" + p3.Slug,
					Status:         models.ReportStatusDismissed,
					ResolutionNote: "Setelah diperiksa tim Trust & Safety, seluruh tautan mengarah ke marketplace resmi Shopee & Tokopedia (aman).",
					ReviewedBy:     "usr_superadmin_01",
					ReviewedByName: "Super Admin",
					ReviewedAt:     &revAt,
					CreatedAt:      t3,
					UpdatedAt:      revAt,
				}
				_ = s.db.Create(&r3).Error
			}
		}
	}

	// 3. Seed initial ModerationLog entries if empty
	var logCount int64
	s.db.Model(&models.ModerationLog{}).Count(&logCount)
	if logCount == 0 {
		initialLogs := []models.ModerationLog{
			{
				ID:            "modlog_init_01",
				Action:        "ADD_BLACKLIST",
				TargetType:    "blacklist",
				TargetID:      "bl_dom_01",
				TargetSlug:    "slot-gacor-vip.xyz",
				Category:      "gambling",
				Severity:      "critical",
				Reason:        "Pemblokiran otomatis domain judi slot online ilegal",
				Details:       "Menambahkan domain slot-gacor-vip.xyz ke daftar hitam global Klikin",
				AdminID:       "usr_superadmin_01",
				AdminName:     "Super Admin",
				CreatedAt:     now.Add(-48 * time.Hour),
			},
			{
				ID:            "modlog_init_02",
				Action:        "ADD_BLACKLIST",
				TargetType:    "blacklist",
				TargetID:      "bl_dom_02",
				TargetSlug:    "hadiah-bank-resmi.my.id",
				Category:      "phishing",
				Severity:      "critical",
				Reason:        "Situs phishing kredensial mobile banking",
				Details:       "Menambahkan domain hadiah-bank-resmi.my.id ke daftar hitam global Klikin",
				AdminID:       "usr_superadmin_01",
				AdminName:     "Super Admin",
				CreatedAt:     now.Add(-36 * time.Hour),
			},
			{
				ID:            "modlog_init_03",
				Action:        "DISMISS_REPORT",
				TargetType:    "report",
				TargetID:      "rep_mod_03",
				TargetSlug:    "tokokopi",
				Category:      "spam",
				Severity:      "low",
				Reason:        "Tautan mengarah ke e-commerce resmi",
				Details:       "Menolak laporan pengunjung rep_mod_03 karena konten terbukti aman",
				AdminID:       "usr_superadmin_01",
				AdminName:     "Super Admin",
				CreatedAt:     now.Add(-12 * time.Hour),
			},
		}
		for i := range initialLogs {
			_ = s.db.Create(&initialLogs[i]).Error
		}
	}
}

// computeOverviewStats calculates real-time Trust & Safety KPIs in a single parallel wave
func (s *ContentModerationService) computeOverviewStats() ModerationOverviewStats {
	var stats ModerationOverviewStats
	if s.db == nil {
		return stats
	}

	var wg sync.WaitGroup
	wg.Add(4)

	go func() {
		defer wg.Done()
		var pScan struct {
			TotalPublicPages    int64
			LivePublishedPages  int64
			FlaggedPagesCount   int64
			TakenDownPagesCount int64
		}
		s.db.Raw(`
			SELECT
				COUNT(*) AS total_public_pages,
				COALESCE(SUM(CASE WHEN is_published = true AND COALESCE(moderation_status, '') != 'taken_down' THEN 1 ELSE 0 END), 0) AS live_published_pages,
				COALESCE(SUM(CASE WHEN moderation_status = 'flagged' THEN 1 ELSE 0 END), 0) AS flagged_pages_count,
				COALESCE(SUM(CASE WHEN moderation_status = 'taken_down' THEN 1 ELSE 0 END), 0) AS taken_down_pages_count
			FROM bio_pages
		`).Scan(&pScan)
		stats.TotalPublicPages = pScan.TotalPublicPages
		stats.LivePublishedPages = pScan.LivePublishedPages
		stats.FlaggedPagesCount = pScan.FlaggedPagesCount
		stats.TakenDownPagesCount = pScan.TakenDownPagesCount
	}()

	go func() {
		defer wg.Done()
		var rScan struct {
			PendingReportsCount  int64
			ActionedReportsCount int64
		}
		s.db.Raw(`
			SELECT
				COALESCE(SUM(CASE WHEN status = ? THEN 1 ELSE 0 END), 0) AS pending_reports_count,
				COALESCE(SUM(CASE WHEN status = ? THEN 1 ELSE 0 END), 0) AS actioned_reports_count
			FROM content_reports
		`, models.ReportStatusPending, models.ReportStatusActioned).Scan(&rScan)
		stats.PendingReportsCount = rScan.PendingReportsCount
		stats.ActionedReportsCount = rScan.ActionedReportsCount
	}()

	go func() {
		defer wg.Done()
		var bScan struct {
			ActiveBlacklistCount int64
			TotalBlockedHits     int64
		}
		s.db.Raw(`
			SELECT
				COALESCE(SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END), 0) AS active_blacklist_count,
				COALESCE(SUM(hit_count), 0) AS total_blocked_hits
			FROM blacklisted_domains
		`).Scan(&bScan)
		stats.ActiveBlacklistCount = bScan.ActiveBlacklistCount
		stats.TotalBlockedHits = bScan.TotalBlockedHits
	}()

	go func() {
		defer wg.Done()
		s.db.Model(&models.User{}).Where("status = ? AND deleted_at IS NULL", "banned").Count(&stats.BannedViolatorsCount)
	}()

	wg.Wait()
	return stats
}

// ListPublicPages returns all tenant bio pages with moderation status, risk score, and report counts
func (s *ContentModerationService) ListPublicPages(filter ModerationPageFilter) (*ModerationPageListResult, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 15
	}

	var (
		pages      []models.BioPage
		pagesErr   error
		users      []models.User
		blacklist  []models.BlacklistedDomain
		allLinks   []models.Link
		allBlocks  []models.BioBlock
		allReports []models.ContentReport
		wg         sync.WaitGroup
	)

	wg.Add(6)
	go func() {
		defer wg.Done()
		pagesErr = s.db.Order("updated_at desc").Find(&pages).Error
	}()
	go func() {
		defer wg.Done()
		s.db.Unscoped().Find(&users)
	}()
	go func() {
		defer wg.Done()
		s.db.Where("is_active = ?", true).Find(&blacklist)
	}()
	go func() {
		defer wg.Done()
		s.db.Where("is_active = ?", true).Find(&allLinks)
	}()
	go func() {
		defer wg.Done()
		s.db.Where("is_active = ?", true).Find(&allBlocks)
	}()
	go func() {
		defer wg.Done()
		s.db.Find(&allReports)
	}()
	wg.Wait()

	if pagesErr != nil {
		return nil, pagesErr
	}

	userMap := make(map[string]models.User, len(users))
	for _, u := range users {
		userMap[u.ID] = u
	}

	linksByPage := make(map[string][]models.Link)
	for _, l := range allLinks {
		linksByPage[l.PageID] = append(linksByPage[l.PageID], l)
	}

	blocksByPage := make(map[string][]models.BioBlock)
	for _, b := range allBlocks {
		blocksByPage[b.PageID] = append(blocksByPage[b.PageID], b)
	}

	pendingByPage := make(map[string]int)
	totalRepByPage := make(map[string]int)
	for _, r := range allReports {
		totalRepByPage[r.PageID]++
		if r.Status == models.ReportStatusPending {
			pendingByPage[r.PageID]++
		}
	}

	searchLower := strings.ToLower(strings.TrimSpace(filter.Search))
	statusFilter := strings.ToLower(strings.TrimSpace(filter.ModerationStatus))
	catFilter := strings.ToLower(strings.TrimSpace(filter.Category))
	pubFilter := strings.ToLower(strings.TrimSpace(filter.Published))

	var items []ModerationPageItemDTO
	for _, p := range pages {
		u := userMap[p.UserID]
		modStatus := p.ModerationStatus
		if modStatus == "" {
			modStatus = "clean"
		}

		// Filter checks
		if statusFilter != "" && statusFilter != "all" && modStatus != statusFilter {
			continue
		}
		if catFilter != "" && catFilter != "all" && strings.ToLower(p.FlagCategory) != catFilter {
			continue
		}
		if pubFilter == "live" && !p.IsPublished {
			continue
		}
		if pubFilter == "offline" && p.IsPublished {
			continue
		}

		if searchLower != "" {
			match := strings.Contains(strings.ToLower(p.Slug), searchLower) ||
				strings.Contains(strings.ToLower(p.Title), searchLower) ||
				strings.Contains(strings.ToLower(p.Bio), searchLower) ||
				strings.Contains(strings.ToLower(u.Username), searchLower) ||
				strings.Contains(strings.ToLower(u.Email), searchLower) ||
				strings.Contains(strings.ToLower(u.FullName), searchLower) ||
				strings.Contains(strings.ToLower(p.FlagReason), searchLower)
			if !match {
				continue
			}
		}

		// Check URLs against blacklist & calculate risk score
		pageLinks := linksByPage[p.ID]
		pageBlocks := blocksByPage[p.ID]
		matchedSet := make(map[string]bool)
		for _, l := range pageLinks {
			uLower := strings.ToLower(l.URL)
			for _, bl := range blacklist {
				if bl.Pattern != "" && strings.Contains(uLower, strings.ToLower(bl.Pattern)) {
					matchedSet[bl.Pattern] = true
				}
			}
		}
		for _, b := range pageBlocks {
			uLower := strings.ToLower(b.URL)
			for _, bl := range blacklist {
				if bl.Pattern != "" && strings.Contains(uLower, strings.ToLower(bl.Pattern)) {
					matchedSet[bl.Pattern] = true
				}
			}
		}

		var matchedList []string
		for k := range matchedSet {
			matchedList = append(matchedList, k)
		}

		riskScore := 5
		if modStatus == "flagged" {
			riskScore += 45
		} else if modStatus == "taken_down" {
			riskScore = 95
		}
		if p.FlagSeverity == "critical" {
			riskScore += 30
		} else if p.FlagSeverity == "high" {
			riskScore += 20
		}
		riskScore += pendingByPage[p.ID] * 15
		riskScore += len(matchedList) * 25
		if riskScore > 100 {
			riskScore = 100
		}

		customDom := ""
		if p.CustomDomain != nil {
			customDom = *p.CustomDomain
		}

		items = append(items, ModerationPageItemDTO{
			PageID:              p.ID,
			Slug:                p.Slug,
			Title:               p.Title,
			Bio:                 p.Bio,
			AvatarURL:           p.AvatarURL,
			Theme:               p.Theme,
			CustomDomain:        customDom,
			IsPublished:         p.IsPublished,
			IsVerified:          p.IsVerified || u.IsVerified,
			ModerationStatus:    modStatus,
			FlagCategory:        p.FlagCategory,
			FlagReason:          p.FlagReason,
			FlagSeverity:        p.FlagSeverity,
			FlaggedAt:           p.FlaggedAt,
			TakedownReason:      p.TakedownReason,
			TakenDownAt:         p.TakenDownAt,
			UserID:              u.ID,
			Username:            u.Username,
			UserFullName:        u.FullName,
			UserEmail:           u.Email,
			UserStatus:          string(u.Status),
			IsPro:               u.IsPro,
			ActiveLinksCount:    len(pageLinks),
			ActiveBlocksCount:   len(pageBlocks),
			PendingReportsCount: pendingByPage[p.ID],
			TotalReportsCount:   totalRepByPage[p.ID],
			MatchedBlacklist:    matchedList,
			RiskScore:           riskScore,
			UpdatedAt:           p.UpdatedAt,
		})
	}

	// Sort items: prioritize flagged & high risk if requested
	if filter.Sort == "risk_desc" || filter.Sort == "" {
		// Sort by RiskScore descending, then UpdatedAt descending
		for i := 0; i < len(items); i++ {
			for j := i + 1; j < len(items); j++ {
				if items[j].RiskScore > items[i].RiskScore ||
					(items[j].RiskScore == items[i].RiskScore && items[j].UpdatedAt.After(items[i].UpdatedAt)) {
					items[i], items[j] = items[j], items[i]
				}
			}
		}
	} else if filter.Sort == "reports_desc" {
		for i := 0; i < len(items); i++ {
			for j := i + 1; j < len(items); j++ {
				if items[j].PendingReportsCount > items[i].PendingReportsCount {
					items[i], items[j] = items[j], items[i]
				}
			}
		}
	}

	total := int64(len(items))
	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))
	if totalPages < 1 {
		totalPages = 1
	}
	start := (filter.Page - 1) * filter.Limit
	if start > len(items) {
		start = len(items)
	}
	end := start + filter.Limit
	if end > len(items) {
		end = len(items)
	}

	return &ModerationPageListResult{
		Pages: items[start:end],
		Stats: s.computeOverviewStats(),
		Pagination: PaginationMeta{
			TotalItems:  total,
			CurrentPage: filter.Page,
			Limit:       filter.Limit,
			TotalPages:  totalPages,
		},
	}, nil
}

// GetPageModerationDetail returns full inspection details for a single bio page
func (s *ContentModerationService) GetPageModerationDetail(pageID string) (*PageModerationDetailResult, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var page models.BioPage
	if err := s.db.Where("id = ? OR slug = ?", pageID, pageID).First(&page).Error; err != nil {
		return nil, errors.New("halaman publik tidak ditemukan")
	}

	var owner models.User
	_ = s.db.Unscoped().Where("id = ?", page.UserID).First(&owner).Error

	var blocks []models.BioBlock
	s.db.Where("page_id = ?", page.ID).Order("bio_blocks.order asc").Find(&blocks)

	var links []models.Link
	s.db.Where("page_id = ?", page.ID).Order("links.order asc").Find(&links)

	var reports []models.ContentReport
	s.db.Where("page_id = ?", page.ID).Order("created_at desc").Find(&reports)

	var logs []models.ModerationLog
	s.db.Where("target_id = ? OR target_slug = ? OR owner_user_id = ?", page.ID, page.Slug, page.UserID).
		Order("created_at desc").Limit(25).Find(&logs)

	var blacklist []models.BlacklistedDomain
	s.db.Where("is_active = ?", true).Find(&blacklist)

	matchedSet := make(map[string]bool)
	for _, l := range links {
		uLower := strings.ToLower(l.URL)
		for _, bl := range blacklist {
			if bl.Pattern != "" && strings.Contains(uLower, strings.ToLower(bl.Pattern)) {
				matchedSet[bl.Pattern] = true
			}
		}
	}
	for _, b := range blocks {
		uLower := strings.ToLower(b.URL)
		for _, bl := range blacklist {
			if bl.Pattern != "" && strings.Contains(uLower, strings.ToLower(bl.Pattern)) {
				matchedSet[bl.Pattern] = true
			}
		}
	}
	var matchedList []string
	for k := range matchedSet {
		matchedList = append(matchedList, k)
	}

	riskScore := 10
	if page.ModerationStatus == "flagged" {
		riskScore += 45
	} else if page.ModerationStatus == "taken_down" {
		riskScore = 95
	}
	riskScore += len(matchedList) * 25
	if riskScore > 100 {
		riskScore = 100
	}

	return &PageModerationDetailResult{
		Page:             page,
		Owner:            owner,
		Blocks:           blocks,
		Links:            links,
		Reports:          reports,
		Logs:             logs,
		MatchedBlacklist: matchedList,
		RiskScore:        riskScore,
	}, nil
}

// FlagPage marks a page with a violation category (phishing, spam, adult, gambling) without taking it down yet
func (s *ContentModerationService) FlagPage(pageID string, dto FlagPageDTO, actor AdminActor) (*models.BioPage, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var page models.BioPage
	if err := s.db.Where("id = ?", pageID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	cat := strings.ToLower(strings.TrimSpace(dto.Category))
	if cat == "" {
		cat = "phishing"
	}
	sev := strings.ToLower(strings.TrimSpace(dto.Severity))
	if sev == "" {
		sev = "high"
	}
	reason := strings.TrimSpace(dto.Reason)
	if reason == "" {
		reason = fmt.Sprintf("Halaman ditandai (%s) oleh tim Trust & Safety untuk peninjauan keamanan.", strings.ToUpper(cat))
	}

	now := time.Now()
	page.ModerationStatus = "flagged"
	page.FlagCategory = cat
	page.FlagSeverity = sev
	page.FlagReason = reason
	page.FlaggedAt = &now
	page.UpdatedAt = now

	if err := s.db.Save(&page).Error; err != nil {
		return nil, fmt.Errorf("gagal menandai halaman: %w", err)
	}

	var owner models.User
	_ = s.db.Where("id = ?", page.UserID).First(&owner).Error

	s.recordModerationLog(models.ModerationLog{
		Action:        "FLAG_PAGE",
		TargetType:    "page",
		TargetID:      page.ID,
		TargetSlug:    page.Slug,
		OwnerUserID:   page.UserID,
		OwnerUsername: owner.Username,
		Category:      cat,
		Severity:      sev,
		Reason:        reason,
		Details:       fmt.Sprintf("Menandai halaman /%s sebagai %s (%s): %s", page.Slug, strings.ToUpper(cat), strings.ToUpper(sev), reason),
		AdminID:       actor.ID,
		AdminName:     actor.Name,
	})

	// Send warning notification to owner
	_ = s.db.Create(&models.Notification{
		ID:        fmt.Sprintf("notif_mod_%d", now.UnixNano()),
		UserID:    page.UserID,
		Title:     "⚠️ Peringatan Keamanan Konten Halaman Bio",
		Message:   fmt.Sprintf("Halaman /%s Anda ditandai dalam kategori %s: %s. Mohon segera periksa dan hapus tautan yang melanggar ketentuan.", page.Slug, strings.ToUpper(cat), reason),
		Type:      "security",
		IsRead:    false,
		CreatedAt: now,
	}).Error

	return &page, nil
}

// ClearPageFlag removes a flag and marks the page as clean
func (s *ContentModerationService) ClearPageFlag(pageID string, note string, actor AdminActor) (*models.BioPage, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var page models.BioPage
	if err := s.db.Where("id = ?", pageID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	now := time.Now()
	page.ModerationStatus = "clean"
	page.FlagCategory = ""
	page.FlagReason = ""
	page.FlagSeverity = "low"
	page.FlaggedAt = nil
	page.UpdatedAt = now

	if err := s.db.Save(&page).Error; err != nil {
		return nil, err
	}

	// Mark pending reports on this page as reviewed/dismissed
	s.db.Model(&models.ContentReport{}).
		Where("page_id = ? AND status = ?", page.ID, models.ReportStatusPending).
		Updates(map[string]interface{}{
			"status":           models.ReportStatusDismissed,
			"resolution_note":  "Halaman telah diverifikasi bersih oleh Super Admin: " + note,
			"reviewed_by":      actor.ID,
			"reviewed_by_name": actor.Name,
			"reviewed_at":      &now,
			"updated_at":       now,
		})

	var owner models.User
	_ = s.db.Where("id = ?", page.UserID).First(&owner).Error

	s.recordModerationLog(models.ModerationLog{
		Action:        "CLEAR_FLAG",
		TargetType:    "page",
		TargetID:      page.ID,
		TargetSlug:    page.Slug,
		OwnerUserID:   page.UserID,
		OwnerUsername: owner.Username,
		Reason:        note,
		Details:       fmt.Sprintf("Membersihkan flag pada halaman /%s (Status kembali CLEAN)", page.Slug),
		AdminID:       actor.ID,
		AdminName:     actor.Name,
	})

	return &page, nil
}

// TakeDownPage immediately unpublishes a page, marks it taken_down, resolves pending reports, and optionally suspends/bans the owner
func (s *ContentModerationService) TakeDownPage(pageID string, dto TakeDownPageDTO, actor AdminActor) (*models.BioPage, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var page models.BioPage
	if err := s.db.Where("id = ?", pageID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	reason := strings.TrimSpace(dto.Reason)
	if reason == "" {
		reason = "Pelanggaran Ketentuan Layanan Klikin (Take Down oleh Super Admin)"
	}
	cat := strings.ToLower(strings.TrimSpace(dto.Category))
	if cat == "" {
		if page.FlagCategory != "" {
			cat = page.FlagCategory
		} else {
			cat = "phishing"
		}
	}

	now := time.Now()
	page.IsPublished = false
	page.ModerationStatus = "taken_down"
	page.FlagCategory = cat
	page.FlagSeverity = "critical"
	page.TakedownReason = reason
	page.TakenDownAt = &now
	page.TakenDownBy = actor.Name
	page.UpdatedAt = now

	if err := s.db.Save(&page).Error; err != nil {
		return nil, fmt.Errorf("gagal melakukan take-down halaman: %w", err)
	}

	// Resolve all pending visitor reports for this page as actioned
	s.db.Model(&models.ContentReport{}).
		Where("page_id = ? AND status = ?", page.ID, models.ReportStatusPending).
		Updates(map[string]interface{}{
			"status":           models.ReportStatusActioned,
			"resolution_note":  "Halaman di-take down oleh Super Admin: " + reason,
			"reviewed_by":      actor.ID,
			"reviewed_by_name": actor.Name,
			"reviewed_at":      &now,
			"updated_at":       now,
		})

	var owner models.User
	if err := s.db.Where("id = ?", page.UserID).First(&owner).Error; err == nil {
		if dto.BanOwner && owner.Role != models.RoleSuperAdmin {
			owner.Status = "banned"
			owner.StatusReason = "Akun diblokir permanen akibat pelanggaran konten halaman /" + page.Slug + ": " + reason
			owner.UpdatedAt = now
			_ = s.db.Save(&owner).Error
		} else if dto.SuspendOwner && owner.Role != models.RoleSuperAdmin {
			owner.Status = "suspended"
			owner.StatusReason = "Akun ditangguhkan akibat take-down halaman /" + page.Slug + ": " + reason
			owner.UpdatedAt = now
			_ = s.db.Save(&owner).Error
		}
	}

	// Optionally add domain to blacklist
	if strings.TrimSpace(dto.BlacklistDomain) != "" {
		_, _ = s.AddBlacklist(SaveBlacklistDTO{
			Pattern:   strings.TrimSpace(dto.BlacklistDomain),
			MatchType: "domain",
			Category:  cat,
			Severity:  "critical",
			Reason:    fmt.Sprintf("Diblokir otomatis saat take-down halaman /%s (%s)", page.Slug, reason),
		}, actor)
	}

	s.recordModerationLog(models.ModerationLog{
		Action:        "TAKEDOWN_PAGE",
		TargetType:    "page",
		TargetID:      page.ID,
		TargetSlug:    page.Slug,
		OwnerUserID:   page.UserID,
		OwnerUsername: owner.Username,
		Category:      cat,
		Severity:      "critical",
		Reason:        reason,
		Details:       fmt.Sprintf("Take-down halaman publik /%s (@%s). Alasan: %s", page.Slug, owner.Username, reason),
		AdminID:       actor.ID,
		AdminName:     actor.Name,
	})

	// Notify owner
	_ = s.db.Create(&models.Notification{
		ID:        fmt.Sprintf("notif_td_%d", now.UnixNano()),
		UserID:    page.UserID,
		Title:     "🚨 Halaman Bio Anda Di-Take Down",
		Message:   fmt.Sprintf("Halaman publik /%s telah dinonaktifkan oleh Tim Moderasi Klikin karena pelanggaran kategori %s: %s", page.Slug, strings.ToUpper(cat), reason),
		Type:      "security",
		IsRead:    false,
		CreatedAt: now,
	}).Error

	return &page, nil
}

// RestorePage restores a taken-down page back to live & clean status
func (s *ContentModerationService) RestorePage(pageID string, note string, actor AdminActor) (*models.BioPage, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var page models.BioPage
	if err := s.db.Where("id = ?", pageID).First(&page).Error; err != nil {
		return nil, errors.New("halaman bio tidak ditemukan")
	}

	now := time.Now()
	page.IsPublished = true
	page.ModerationStatus = "clean"
	page.FlagCategory = ""
	page.FlagReason = ""
	page.TakedownReason = ""
	page.TakenDownAt = nil
	page.UpdatedAt = now

	if err := s.db.Save(&page).Error; err != nil {
		return nil, err
	}

	var owner models.User
	_ = s.db.Where("id = ?", page.UserID).First(&owner).Error

	s.recordModerationLog(models.ModerationLog{
		Action:        "RESTORE_PAGE",
		TargetType:    "page",
		TargetID:      page.ID,
		TargetSlug:    page.Slug,
		OwnerUserID:   page.UserID,
		OwnerUsername: owner.Username,
		Reason:        note,
		Details:       fmt.Sprintf("Memulihkan halaman /%s kembali online (LIVE). Catatan: %s", page.Slug, note),
		AdminID:       actor.ID,
		AdminName:     actor.Name,
	})

	return &page, nil
}

// BanViolator permanently bans the offending tenant user and takes down their bio page
func (s *ContentModerationService) BanViolator(userID string, dto BanViolatorDTO, actor AdminActor) (*models.User, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}
	if user.Role == models.RoleSuperAdmin {
		return nil, errors.New("akun Super Admin tidak dapat di-ban")
	}

	reason := strings.TrimSpace(dto.Reason)
	if reason == "" {
		reason = "Pelanggaran berat Ketentuan Layanan Klikin (Phishing / Judi / Konten Terlarang)"
	}

	now := time.Now()
	user.Status = "banned"
	user.StatusReason = reason
	user.UpdatedAt = now

	if err := s.db.Save(&user).Error; err != nil {
		return nil, err
	}

	var page models.BioPage
	if err := s.db.Where("user_id = ?", user.ID).First(&page).Error; err == nil {
		page.IsPublished = false
		page.ModerationStatus = "taken_down"
		page.TakedownReason = "Akun pemilik diblokir permanen: " + reason
		page.TakenDownAt = &now
		page.TakenDownBy = actor.Name
		_ = s.db.Save(&page).Error

		// Action any pending reports on this user's page
		s.db.Model(&models.ContentReport{}).
			Where("owner_user_id = ? AND status = ?", user.ID, models.ReportStatusPending).
			Updates(map[string]interface{}{
				"status":           models.ReportStatusActioned,
				"resolution_note":  "Akun pelanggar di-ban permanen & halaman di-take down: " + reason,
				"reviewed_by":      actor.ID,
				"reviewed_by_name": actor.Name,
				"reviewed_at":      &now,
				"updated_at":       now,
			})
	}

	if strings.TrimSpace(dto.BlacklistDomain) != "" {
		_, _ = s.AddBlacklist(SaveBlacklistDTO{
			Pattern:   strings.TrimSpace(dto.BlacklistDomain),
			MatchType: "domain",
			Category:  "phishing",
			Severity:  "critical",
			Reason:    fmt.Sprintf("Domain terkait akun pelanggar @%s", user.Username),
		}, actor)
	}

	// Also log in UserActivityLog so User Management module is 100% synced
	_ = s.db.Create(&models.UserActivityLog{
		ID:        fmt.Sprintf("ual_ban_%d", now.UnixNano()),
		UserID:    user.ID,
		Action:    "ADMIN_BAN_VIOLATOR",
		Details:   fmt.Sprintf("Akun @%s di-ban permanen oleh %s melalui Konsol Moderasi Konten: %s", user.Username, actor.Name, reason),
		IPAddress: "127.0.0.1",
		UserAgent: "Klikin Trust & Safety Console",
		CreatedAt: now,
	}).Error

	s.recordModerationLog(models.ModerationLog{
		Action:        "BAN_VIOLATOR",
		TargetType:    "user",
		TargetID:      user.ID,
		TargetSlug:    page.Slug,
		OwnerUserID:   user.ID,
		OwnerUsername: user.Username,
		Category:      "violation",
		Severity:      "critical",
		Reason:        reason,
		Details:       fmt.Sprintf("Ban permanen user pelanggar @%s (%s) & take-down halaman /%s", user.Username, user.Email, page.Slug),
		AdminID:       actor.ID,
		AdminName:     actor.Name,
	})

	return &user, nil
}

// ScanAllPagesAgainstBlacklist scans all live BioPages, Links, and BioBlocks against active BlacklistedDomains & heuristics
func (s *ContentModerationService) ScanAllPagesAgainstBlacklist(actor AdminActor) (*AutoScanResult, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var pages []models.BioPage
	s.db.Find(&pages)

	var blacklist []models.BlacklistedDomain
	s.db.Where("is_active = ?", true).Find(&blacklist)

	suspiciousKeywords := []struct {
		keyword  string
		category string
		severity string
	}{
		{"slot-gacor", "gambling", "critical"},
		{"maxwin", "gambling", "critical"},
		{"zeus88", "gambling", "critical"},
		{"phishing", "phishing", "critical"},
		{"claim-dana", "phishing", "high"},
		{"adult-cam", "adult", "high"},
	}

	result := &AutoScanResult{
		ScannedPages: len(pages),
		Matches:      []string{},
	}

	now := time.Now()
	for _, p := range pages {
		var links []models.Link
		s.db.Where("page_id = ?", p.ID).Find(&links)

		var blocks []models.BioBlock
		s.db.Where("page_id = ?", p.ID).Find(&blocks)

		result.ScannedURLs += len(links) + len(blocks)

		matchedCat := ""
		matchedSev := ""
		matchedReason := ""

		checkURL := func(raw string) {
			uLower := strings.ToLower(strings.TrimSpace(raw))
			if uLower == "" {
				return
			}
			for _, bl := range blacklist {
				pat := strings.ToLower(strings.TrimSpace(bl.Pattern))
				if pat != "" && strings.Contains(uLower, pat) {
					matchedCat = bl.Category
					matchedSev = bl.Severity
					matchedReason = fmt.Sprintf("Auto-Scanner mendeteksi tautan menuju domain blacklist '%s'", bl.Pattern)
					result.Matches = append(result.Matches, fmt.Sprintf("/%s -> %s", p.Slug, bl.Pattern))
					return
				}
			}
			for _, kw := range suspiciousKeywords {
				if strings.Contains(uLower, kw.keyword) {
					matchedCat = kw.category
					matchedSev = kw.severity
					matchedReason = fmt.Sprintf("Auto-Scanner mendeteksi kata kunci berbahaya '%s' pada URL", kw.keyword)
					result.Matches = append(result.Matches, fmt.Sprintf("/%s -> %s", p.Slug, kw.keyword))
					return
				}
			}
		}

		for _, l := range links {
			checkURL(l.URL)
		}
		for _, b := range blocks {
			checkURL(b.URL)
		}

		if matchedCat != "" && p.ModerationStatus == "clean" {
			p.ModerationStatus = "flagged"
			p.FlagCategory = matchedCat
			p.FlagSeverity = matchedSev
			p.FlagReason = matchedReason
			p.FlaggedAt = &now
			_ = s.db.Save(&p).Error
			result.FlaggedPages++
		}
	}

	s.recordModerationLog(models.ModerationLog{
		Action:     "AUTO_SECURITY_SCAN",
		TargetType: "platform",
		TargetID:   "all_pages",
		Reason:     "Pemindaian otomatis seluruh halaman & tautan terhadap database Blacklist",
		Details:    fmt.Sprintf("Memindai %d halaman dan %d tautan. Ditemukan %d indikasi baru.", result.ScannedPages, result.ScannedURLs, result.FlaggedPages),
		AdminID:    actor.ID,
		AdminName:  actor.Name,
	})

	return result, nil
}

// ListVisitorReports returns paginated visitor abuse reports with enriched page & owner info
func (s *ContentModerationService) ListVisitorReports(filter VisitorReportFilter) (*VisitorReportListResult, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 15
	}

	var reports []models.ContentReport
	if err := s.db.Order("created_at desc").Find(&reports).Error; err != nil {
		return nil, err
	}

	var pages []models.BioPage
	s.db.Find(&pages)
	pageMap := make(map[string]models.BioPage, len(pages))
	for _, p := range pages {
		pageMap[p.ID] = p
	}

	var users []models.User
	s.db.Unscoped().Find(&users)
	userMap := make(map[string]models.User, len(users))
	for _, u := range users {
		userMap[u.ID] = u
	}

	searchLower := strings.ToLower(strings.TrimSpace(filter.Search))
	statusFilter := strings.ToLower(strings.TrimSpace(filter.Status))
	catFilter := strings.ToLower(strings.TrimSpace(filter.Category))
	sevFilter := strings.ToLower(strings.TrimSpace(filter.Severity))

	var items []VisitorReportItemDTO
	for _, r := range reports {
		if statusFilter != "" && statusFilter != "all" && string(r.Status) != statusFilter {
			continue
		}
		if catFilter != "" && catFilter != "all" && strings.ToLower(r.Category) != catFilter {
			continue
		}
		if sevFilter != "" && sevFilter != "all" && strings.ToLower(r.Severity) != sevFilter {
			continue
		}

		p := pageMap[r.PageID]
		u := userMap[r.OwnerUserID]

		if searchLower != "" {
			match := strings.Contains(strings.ToLower(r.Slug), searchLower) ||
				strings.Contains(strings.ToLower(r.Description), searchLower) ||
				strings.Contains(strings.ToLower(r.TargetURL), searchLower) ||
				strings.Contains(strings.ToLower(r.ReporterName), searchLower) ||
				strings.Contains(strings.ToLower(u.Username), searchLower) ||
				strings.Contains(strings.ToLower(u.Email), searchLower)
			if !match {
				continue
			}
		}

		items = append(items, VisitorReportItemDTO{
			ContentReport:    r,
			PageTitle:        p.Title,
			PageIsPublished:  p.IsPublished,
			ModerationStatus: p.ModerationStatus,
			OwnerUsername:    u.Username,
			OwnerFullName:    u.FullName,
			OwnerEmail:       u.Email,
			OwnerStatus:      string(u.Status),
		})
	}

	total := int64(len(items))
	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))
	if totalPages < 1 {
		totalPages = 1
	}
	start := (filter.Page - 1) * filter.Limit
	if start > len(items) {
		start = len(items)
	}
	end := start + filter.Limit
	if end > len(items) {
		end = len(items)
	}

	return &VisitorReportListResult{
		Reports: items[start:end],
		Pagination: PaginationMeta{
			TotalItems:  total,
			CurrentPage: filter.Page,
			Limit:       filter.Limit,
			TotalPages:  totalPages,
		},
	}, nil
}

// SubmitPublicReport allows any visitor on a PublicBioPage to report phishing/spam/gambling/adult content
func (s *ContentModerationService) SubmitPublicReport(dto SubmitPublicReportDTO, clientIP string) (*models.ContentReport, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	slug := strings.TrimSpace(dto.Slug)
	if slug == "" {
		return nil, errors.New("slug halaman wajib diisi")
	}

	var page models.BioPage
	if err := s.db.Where("slug = ? OR id = ?", slug, slug).First(&page).Error; err != nil {
		return nil, errors.New("halaman yang dilaporkan tidak ditemukan")
	}

	cat := strings.ToLower(strings.TrimSpace(dto.Category))
	if cat == "" {
		cat = "phishing"
	}
	desc := strings.TrimSpace(dto.Description)
	if desc == "" {
		return nil, errors.New("deskripsi laporan wajib diisi")
	}

	sev := "medium"
	if cat == "phishing" || cat == "gambling" {
		sev = "critical"
	} else if cat == "adult" || cat == "scam" {
		sev = "high"
	}

	reporterName := strings.TrimSpace(dto.ReporterName)
	if reporterName == "" {
		reporterName = "Pengunjung Anonim"
	}

	now := time.Now()
	report := models.ContentReport{
		ID:            fmt.Sprintf("rep_%d", now.UnixNano()),
		PageID:        page.ID,
		Slug:          page.Slug,
		OwnerUserID:   page.UserID,
		ReporterName:  reporterName,
		ReporterEmail: strings.TrimSpace(dto.ReporterEmail),
		ReporterIP:    clientIP,
		Category:      cat,
		Severity:      sev,
		Description:   desc,
		TargetURL:     strings.TrimSpace(dto.TargetURL),
		Status:        models.ReportStatusPending,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.db.Create(&report).Error; err != nil {
		return nil, fmt.Errorf("gagal menyimpan laporan: %w", err)
	}

	// Auto-flag the page if severity is high/critical and page was clean
	if (sev == "critical" || sev == "high") && (page.ModerationStatus == "" || page.ModerationStatus == "clean") {
		page.ModerationStatus = "flagged"
		page.FlagCategory = cat
		page.FlagSeverity = sev
		page.FlagReason = fmt.Sprintf("Dilaporkan pengunjung (%s): %s", strings.ToUpper(cat), desc)
		page.FlaggedAt = &now
		_ = s.db.Save(&page).Error
	}

	return &report, nil
}

// ReviewVisitorReport processes a visitor report with a unified decision (dismiss, flag_page, takedown_page, ban_user)
func (s *ContentModerationService) ReviewVisitorReport(reportID string, dto ReviewReportDTO, actor AdminActor) (*models.ContentReport, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var report models.ContentReport
	if err := s.db.Where("id = ?", reportID).First(&report).Error; err != nil {
		return nil, errors.New("laporan pengunjung tidak ditemukan")
	}

	now := time.Now()
	decision := strings.ToLower(strings.TrimSpace(dto.Decision))
	note := strings.TrimSpace(dto.ResolutionNote)
	if note == "" {
		note = "Ditinjau oleh Super Admin (" + decision + ")"
	}

	switch decision {
	case "dismiss":
		report.Status = models.ReportStatusDismissed
		report.ResolutionNote = note
		report.ReviewedBy = actor.ID
		report.ReviewedByName = actor.Name
		report.ReviewedAt = &now
		report.UpdatedAt = now
		_ = s.db.Save(&report).Error

		s.recordModerationLog(models.ModerationLog{
			Action:      "DISMISS_REPORT",
			TargetType:  "report",
			TargetID:    report.ID,
			TargetSlug:  report.Slug,
			OwnerUserID: report.OwnerUserID,
			Category:    report.Category,
			Severity:    report.Severity,
			Reason:      note,
			Details:     fmt.Sprintf("Menolak/mengabaikan laporan pengunjung pada /%s: %s", report.Slug, note),
			AdminID:     actor.ID,
			AdminName:   actor.Name,
		})

	case "flag_page":
		report.Status = models.ReportStatusActioned
		report.ResolutionNote = note
		report.ReviewedBy = actor.ID
		report.ReviewedByName = actor.Name
		report.ReviewedAt = &now
		report.UpdatedAt = now
		_ = s.db.Save(&report).Error

		_, _ = s.FlagPage(report.PageID, FlagPageDTO{
			Category: report.Category,
			Severity: report.Severity,
			Reason:   note,
		}, actor)

	case "takedown_page":
		report.Status = models.ReportStatusActioned
		report.ResolutionNote = note
		report.ReviewedBy = actor.ID
		report.ReviewedByName = actor.Name
		report.ReviewedAt = &now
		report.UpdatedAt = now
		_ = s.db.Save(&report).Error

		_, _ = s.TakeDownPage(report.PageID, TakeDownPageDTO{
			Category:        report.Category,
			Reason:          note,
			SuspendOwner:    true,
			BlacklistDomain: dto.BlacklistURL,
		}, actor)

	case "ban_user":
		report.Status = models.ReportStatusActioned
		report.ResolutionNote = note
		report.ReviewedBy = actor.ID
		report.ReviewedByName = actor.Name
		report.ReviewedAt = &now
		report.UpdatedAt = now
		_ = s.db.Save(&report).Error

		_, _ = s.BanViolator(report.OwnerUserID, BanViolatorDTO{
			Reason:          note,
			TakeDownPage:    true,
			RevokeSessions:  true,
			BlacklistDomain: dto.BlacklistURL,
		}, actor)

	default:
		return nil, errors.New("keputusan review tidak valid (pilih: dismiss, flag_page, takedown_page, atau ban_user)")
	}

	return &report, nil
}

// ListBlacklist returns all blacklisted domains/URLs filtered by search and category
func (s *ContentModerationService) ListBlacklist(search, category string) ([]models.BlacklistedDomain, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var list []models.BlacklistedDomain
	q := s.db.Order("created_at desc")
	if category != "" && category != "all" {
		q = q.Where("category = ?", strings.ToLower(category))
	}
	if err := q.Find(&list).Error; err != nil {
		return nil, err
	}

	searchLower := strings.ToLower(strings.TrimSpace(search))
	if searchLower == "" {
		return list, nil
	}

	var filtered []models.BlacklistedDomain
	for _, item := range list {
		if strings.Contains(strings.ToLower(item.Pattern), searchLower) ||
			strings.Contains(strings.ToLower(item.Reason), searchLower) ||
			strings.Contains(strings.ToLower(item.Category), searchLower) {
			filtered = append(filtered, item)
		}
	}
	return filtered, nil
}

// AddBlacklist adds a malicious domain or URL pattern to the global blocklist
func (s *ContentModerationService) AddBlacklist(dto SaveBlacklistDTO, actor AdminActor) (*models.BlacklistedDomain, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	pattern := strings.ToLower(strings.TrimSpace(dto.Pattern))
	pattern = strings.TrimPrefix(pattern, "https://")
	pattern = strings.TrimPrefix(pattern, "http://")
	pattern = strings.TrimSuffix(pattern, "/")
	if pattern == "" {
		return nil, errors.New("domain atau pola URL wajib diisi")
	}

	var existing models.BlacklistedDomain
	if err := s.db.Where("pattern = ?", pattern).First(&existing).Error; err == nil {
		return nil, fmt.Errorf("domain/URL '%s' sudah terdaftar di dalam blacklist", pattern)
	}

	matchType := strings.ToLower(strings.TrimSpace(dto.MatchType))
	if matchType == "" {
		matchType = "domain"
	}
	cat := strings.ToLower(strings.TrimSpace(dto.Category))
	if cat == "" {
		cat = "phishing"
	}
	sev := strings.ToLower(strings.TrimSpace(dto.Severity))
	if sev == "" {
		sev = "high"
	}

	now := time.Now()
	item := models.BlacklistedDomain{
		ID:          fmt.Sprintf("bl_%d", now.UnixNano()),
		Pattern:     pattern,
		MatchType:   matchType,
		Category:    cat,
		Severity:    sev,
		Reason:      strings.TrimSpace(dto.Reason),
		HitCount:    0,
		IsActive:    true,
		AddedBy:     actor.ID,
		AddedByName: actor.Name,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.db.Create(&item).Error; err != nil {
		return nil, fmt.Errorf("gagal menambahkan ke blacklist: %w", err)
	}

	s.recordModerationLog(models.ModerationLog{
		Action:     "ADD_BLACKLIST",
		TargetType: "blacklist",
		TargetID:   item.ID,
		TargetSlug: item.Pattern,
		Category:   item.Category,
		Severity:   item.Severity,
		Reason:     item.Reason,
		Details:    fmt.Sprintf("Menambahkan '%s' (%s) ke daftar hitam domain/URL berbahaya", item.Pattern, strings.ToUpper(item.Category)),
		AdminID:    actor.ID,
		AdminName:  actor.Name,
	})

	return &item, nil
}

// ToggleBlacklist enables or disables a blacklist rule
func (s *ContentModerationService) ToggleBlacklist(id string, actor AdminActor) (*models.BlacklistedDomain, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var item models.BlacklistedDomain
	if err := s.db.Where("id = ?", id).First(&item).Error; err != nil {
		return nil, errors.New("entri blacklist tidak ditemukan")
	}

	item.IsActive = !item.IsActive
	item.UpdatedAt = time.Now()
	if err := s.db.Save(&item).Error; err != nil {
		return nil, err
	}

	return &item, nil
}

// DeleteBlacklist removes a domain/URL pattern from the blacklist
func (s *ContentModerationService) DeleteBlacklist(id string, actor AdminActor) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	var item models.BlacklistedDomain
	if err := s.db.Where("id = ?", id).First(&item).Error; err != nil {
		return errors.New("entri blacklist tidak ditemukan")
	}

	if err := s.db.Delete(&item).Error; err != nil {
		return err
	}

	s.recordModerationLog(models.ModerationLog{
		Action:     "REMOVE_BLACKLIST",
		TargetType: "blacklist",
		TargetID:   item.ID,
		TargetSlug: item.Pattern,
		Category:   item.Category,
		Details:    fmt.Sprintf("Menghapus '%s' dari daftar hitam domain/URL", item.Pattern),
		AdminID:    actor.ID,
		AdminName:  actor.Name,
	})

	return nil
}

// ListModerationLogs returns paginated history of all moderation actions
func (s *ContentModerationService) ListModerationLogs(search, action string, page, limit int) (*ModerationLogListResult, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var logs []models.ModerationLog
	q := s.db.Order("created_at desc")
	if action != "" && action != "all" {
		q = q.Where("action = ?", strings.ToUpper(action))
	}
	if err := q.Find(&logs).Error; err != nil {
		return nil, err
	}

	searchLower := strings.ToLower(strings.TrimSpace(search))
	var filtered []models.ModerationLog
	for _, l := range logs {
		if searchLower != "" {
			match := strings.Contains(strings.ToLower(l.TargetSlug), searchLower) ||
				strings.Contains(strings.ToLower(l.OwnerUsername), searchLower) ||
				strings.Contains(strings.ToLower(l.Details), searchLower) ||
				strings.Contains(strings.ToLower(l.Reason), searchLower) ||
				strings.Contains(strings.ToLower(l.Action), searchLower)
			if !match {
				continue
			}
		}
		filtered = append(filtered, l)
	}

	total := int64(len(filtered))
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages < 1 {
		totalPages = 1
	}
	start := (page - 1) * limit
	if start > len(filtered) {
		start = len(filtered)
	}
	end := start + limit
	if end > len(filtered) {
		end = len(filtered)
	}

	return &ModerationLogListResult{
		Logs: filtered[start:end],
		Pagination: PaginationMeta{
			TotalItems:  total,
			CurrentPage: page,
			Limit:       limit,
			TotalPages:  totalPages,
		},
	}, nil
}

// ExportModerationCSV exports all pages, moderation statuses, and report counts as CSV
func (s *ContentModerationService) ExportModerationCSV() ([]byte, error) {
	res, err := s.ListPublicPages(ModerationPageFilter{Page: 1, Limit: 100})
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	_ = writer.Write([]string{
		"Page ID", "Slug", "Title", "Owner Username", "Owner Email", "Owner Status",
		"Is Published", "Moderation Status", "Flag Category", "Flag Severity",
		"Risk Score", "Pending Reports", "Total Reports", "Updated At",
	})

	for _, p := range res.Pages {
		_ = writer.Write([]string{
			p.PageID,
			"/" + p.Slug,
			p.Title,
			p.Username,
			p.UserEmail,
			p.UserStatus,
			fmt.Sprintf("%v", p.IsPublished),
			strings.ToUpper(p.ModerationStatus),
			p.FlagCategory,
			p.FlagSeverity,
			fmt.Sprintf("%d", p.RiskScore),
			fmt.Sprintf("%d", p.PendingReportsCount),
			fmt.Sprintf("%d", p.TotalReportsCount),
			p.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	writer.Flush()
	return buf.Bytes(), writer.Error()
}

func (s *ContentModerationService) recordModerationLog(entry models.ModerationLog) {
	if s.db == nil {
		return
	}
	if entry.ID == "" {
		entry.ID = fmt.Sprintf("modlog_%d", time.Now().UnixNano())
	}
	if entry.CreatedAt.IsZero() {
		entry.CreatedAt = time.Now()
	}
	if entry.AdminName == "" {
		entry.AdminName = "Super Admin"
	}
	_ = s.db.Create(&entry).Error
}
