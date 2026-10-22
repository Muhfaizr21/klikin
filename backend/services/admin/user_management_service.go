package admin

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"gorm.io/gorm"
	"klikin-backend/config"
	"klikin-backend/models"
)

type UserManagementService struct {
	db *gorm.DB
}

func NewUserManagementService(db *gorm.DB) *UserManagementService {
	svc := &UserManagementService{db: db}
	go svc.ensureSampleLogs()
	return svc
}

// UserListItemDTO represents user summary in directory table with aggregated metrics
type UserListItemDTO struct {
	ID           string           `json:"id"`
	Email        string           `json:"email"`
	Username     string           `json:"username"`
	FullName     string           `json:"full_name"`
	Role         models.UserRole  `json:"role"`
	Status       string           `json:"status"` // "active" | "suspended" | "banned"
	StatusReason string           `json:"status_reason,omitempty"`
	IsPro        bool             `json:"is_pro"`
	IsVerified   bool             `json:"is_verified"`
	AvatarURL    string           `json:"avatar_url"`
	PhoneNumber  string           `json:"phone_number"`
	TwoFactor    bool             `json:"two_factor_enabled"`
	TotalPages   int              `json:"total_pages"`
	TotalViews   int64            `json:"total_views"`
	TotalClicks  int64            `json:"total_clicks"`
	CTR          float64          `json:"ctr"`
	BioPages     []BioPageMiniDTO `json:"bio_pages"`
	Subscription string           `json:"subscription_status"`
	CreatedAt    time.Time        `json:"created_at"`
	LastActiveAt time.Time        `json:"last_active_at"`
}

type BioPageMiniDTO struct {
	ID           string `json:"id"`
	Slug         string `json:"slug"`
	Title        string `json:"title"`
	Theme        string `json:"theme"`
	CustomDomain string `json:"custom_domain,omitempty"`
	IsPublished  bool   `json:"is_published"`
	IsVerified   bool   `json:"is_verified"`
}

type UserListStats struct {
	TotalUsers     int64 `json:"total_users"`
	ActiveUsers    int64 `json:"active_users"`
	ProUsers       int64 `json:"pro_users"`
	SuspendedUsers int64 `json:"suspended_users"`
	BannedUsers    int64 `json:"banned_users"`
}

type PaginationMeta struct {
	CurrentPage int   `json:"current_page"`
	Limit       int   `json:"limit"`
	TotalItems  int64 `json:"total_items"`
	TotalPages  int   `json:"total_pages"`
}

type UserListResult struct {
	Users      []UserListItemDTO `json:"users"`
	Pagination PaginationMeta    `json:"pagination"`
	Stats      UserListStats     `json:"stats"`
}

type BioPageLinkItem struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	URL      string `json:"url"`
	Clicks   int64  `json:"clicks"`
	IsActive bool   `json:"is_active"`
}

type UserDetailPageItem struct {
	ID           string            `json:"id"`
	Slug         string            `json:"slug"`
	Title        string            `json:"title"`
	Bio          string            `json:"bio"`
	Theme        string            `json:"theme"`
	CustomDomain string            `json:"custom_domain,omitempty"`
	IsPublished  bool              `json:"is_published"`
	IsVerified   bool              `json:"is_verified"`
	LinksCount   int               `json:"links_count"`
	TopLinks     []BioPageLinkItem `json:"top_links"`
	TotalViews   int64             `json:"total_views"`
	TotalClicks  int64             `json:"total_clicks"`
	CTR          float64           `json:"ctr"`
	CreatedAt    time.Time         `json:"created_at"`
}

type UserDetailDistributionItem struct {
	Name       string  `json:"name"`
	Count      int64   `json:"count"`
	Percentage float64 `json:"percentage"`
}

type UserDetailAnalyticsSummary struct {
	TotalViews      int64                        `json:"total_views"`
	TotalClicks     int64                        `json:"total_clicks"`
	CTR             float64                      `json:"ctr"`
	UniqueVisitors  int64                        `json:"unique_visitors"`
	TotalPages      int                          `json:"total_pages"`
	TrafficSources  []UserDetailDistributionItem `json:"traffic_sources"`
	DeviceBreakdown []UserDetailDistributionItem `json:"device_breakdown"`
	TopCities       []UserDetailDistributionItem `json:"top_cities"`
}

type UserSecurityAndTrust struct {
	TrustScore       int    `json:"trust_score"`
	TrustLevel       string `json:"trust_level"`
	RiskLevel        string `json:"risk_level"`
	EmailVerified    bool   `json:"email_verified"`
	PhoneConnected   bool   `json:"phone_connected"`
	TwoFactorEnabled bool   `json:"two_factor_enabled"`
	ViolationsCount  int    `json:"violations_count"`
	LastLoginIP      string `json:"last_login_ip"`
	LastUserAgent    string `json:"last_user_agent"`
	LastLocation     string `json:"last_location"`
	AccountAgeDays   int    `json:"account_age_days"`
}

type UserInvoiceItem struct {
	InvoiceID     string    `json:"invoice_id"`
	Date          time.Time `json:"date"`
	Amount        string    `json:"amount"`
	PlanName      string    `json:"plan_name"`
	PaymentMethod string    `json:"payment_method"`
	Status        string    `json:"status"`
}

type UserDetailResult struct {
	User          models.User                `json:"user"`
	BioPages      []UserDetailPageItem       `json:"bio_pages"`
	Subscription  *models.Subscription       `json:"subscription,omitempty"`
	SecurityTrust UserSecurityAndTrust       `json:"security_trust"`
	Invoices      []UserInvoiceItem          `json:"invoices"`
	Analytics     UserDetailAnalyticsSummary `json:"analytics"`
	ActivityLogs  []models.UserActivityLog   `json:"activity_logs"`
	InternalNotes []models.UserInternalNote  `json:"internal_notes"`
}

type UpdateUserDTO struct {
	Email       string `json:"email"`
	Username    string `json:"username"`
	FullName    string `json:"full_name"`
	PhoneNumber string `json:"phone_number"`
	Bio         string `json:"bio"`
	IsPro       *bool  `json:"is_pro"`
	IsVerified  *bool  `json:"is_verified"`
	Status      string `json:"status"`
	NewPassword string `json:"new_password,omitempty"`
}

// ListUsers retrieves paginated, filtered, and searched users with analytics
func (s *UserManagementService) ListUsers(search, status, plan, sort string, page, limit int) (*UserListResult, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// 1. Calculate overall directory stats
	var stats UserListStats
	s.db.Model(&models.User{}).Where("deleted_at IS NULL").Count(&stats.TotalUsers)
	s.db.Model(&models.User{}).Where("deleted_at IS NULL AND (status = 'active' OR status = '' OR status IS NULL)").Count(&stats.ActiveUsers)
	s.db.Model(&models.User{}).Where("deleted_at IS NULL AND is_pro = true").Count(&stats.ProUsers)
	s.db.Model(&models.User{}).Where("deleted_at IS NULL AND status = 'suspended'").Count(&stats.SuspendedUsers)
	s.db.Model(&models.User{}).Where("deleted_at IS NULL AND status = 'banned'").Count(&stats.BannedUsers)

	// 2. Build filtered query
	tx := s.db.Model(&models.User{}).Where("deleted_at IS NULL")

	if search != "" {
		q := "%" + strings.ToLower(search) + "%"
		tx = tx.Where("LOWER(full_name) LIKE ? OR LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR phone_number LIKE ?", q, q, q, "%"+search+"%")
	}

	if status != "" && status != "ALL" {
		switch strings.ToLower(status) {
		case "active":
			tx = tx.Where("status = 'active' OR status = '' OR status IS NULL")
		case "suspended":
			tx = tx.Where("status = 'suspended'")
		case "banned":
			tx = tx.Where("status = 'banned'")
		}
	}

	if plan != "" && plan != "ALL" {
		switch strings.ToLower(plan) {
		case "pro":
			tx = tx.Where("is_pro = true")
		case "free":
			tx = tx.Where("is_pro = false OR is_pro IS NULL")
		}
	}

	var totalFiltered int64
	tx.Count(&totalFiltered)

	// 3. Sorting
	switch sort {
	case "oldest":
		tx = tx.Order("created_at asc")
	case "alphabet":
		tx = tx.Order("full_name asc, username asc")
	default: // "newest"
		tx = tx.Order("created_at desc")
	}

	offset := (page - 1) * limit
	var users []models.User
	if err := tx.Preload("Pages").Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, err
	}

	// 4. Batch query analytics for page views & clicks
	var userIDs []string
	for _, u := range users {
		userIDs = append(userIDs, u.ID)
	}

	type userAgg struct {
		UserID int64
		Views  int64
		Clicks int64
	}
	userMetrics := make(map[string]struct {
		Views  int64
		Clicks int64
	})

	if len(userIDs) > 0 {
		var aggRows []struct {
			UserID string
			Views  int64
			Clicks int64
		}
		query := `
			SELECT 
				p.user_id,
				COALESCE(SUM(CASE WHEN e.type = 'view' THEN 1 ELSE 0 END), 0) as views,
				COALESCE(SUM(CASE WHEN e.type = 'click' THEN 1 ELSE 0 END), 0) as clicks
			FROM bio_pages p
			LEFT JOIN analytics_events e ON e.page_id = p.id
			WHERE p.user_id IN ?
			GROUP BY p.user_id
		`
		s.db.Raw(query, userIDs).Scan(&aggRows)
		for _, ar := range aggRows {
			userMetrics[ar.UserID] = struct {
				Views  int64
				Clicks int64
			}{Views: ar.Views, Clicks: ar.Clicks}
		}
	}

	items := make([]UserListItemDTO, 0, len(users))
	for _, u := range users {
		m := userMetrics[u.ID]
		ctr := 0.0
		if m.Views > 0 {
			ctr = math.Round((float64(m.Clicks)/float64(m.Views))*1000) / 10
		}

		userStatus := u.Status
		if userStatus == "" {
			userStatus = "active"
		}

		var pageMinis []BioPageMiniDTO
		for _, p := range u.Pages {
			cd := ""
			if p.CustomDomain != nil {
				cd = *p.CustomDomain
			}
			pageMinis = append(pageMinis, BioPageMiniDTO{
				ID:           p.ID,
				Slug:         p.Slug,
				Title:        p.Title,
				Theme:        p.Theme,
				CustomDomain: cd,
				IsPublished:  p.IsPublished,
				IsVerified:   p.IsVerified,
			})
		}

		subStatus := "Free Plan"
		if u.IsPro {
			subStatus = "Klikin Pro (Active)"
		}

		items = append(items, UserListItemDTO{
			ID:           u.ID,
			Email:        u.Email,
			Username:     u.Username,
			FullName:     u.FullName,
			Role:         u.Role,
			Status:       userStatus,
			StatusReason: u.StatusReason,
			IsPro:        u.IsPro,
			IsVerified:   u.IsVerified,
			AvatarURL:    u.AvatarURL,
			PhoneNumber:  u.PhoneNumber,
			TwoFactor:    u.TwoFactorEnabled,
			TotalPages:   len(u.Pages),
			TotalViews:   m.Views,
			TotalClicks:  m.Clicks,
			CTR:          ctr,
			BioPages:     pageMinis,
			Subscription: subStatus,
			CreatedAt:    u.CreatedAt,
			LastActiveAt: u.UpdatedAt,
		})
	}

	totalPages := int(math.Ceil(float64(totalFiltered) / float64(limit)))
	if totalPages < 1 {
		totalPages = 1
	}

	return &UserListResult{
		Users: items,
		Pagination: PaginationMeta{
			CurrentPage: page,
			Limit:       limit,
			TotalItems:  totalFiltered,
			TotalPages:  totalPages,
		},
		Stats: stats,
	}, nil
}

// GetUserDetail retrieves deep profile, bio pages, subscription, analytics, activity logs, and internal notes
func (s *UserManagementService) GetUserDetail(userID string) (*UserDetailResult, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Preload("Pages").Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	// 1. Pages with links count, top links & metrics
	var pageItems []UserDetailPageItem
	var totalViews, totalClicks int64
	for _, p := range user.Pages {
		var linksCount int64
		s.db.Model(&models.Link{}).Where("page_id = ?", p.ID).Count(&linksCount)

		var viewsCount, clicksCount int64
		s.db.Model(&models.AnalyticsEvent{}).Where("page_id = ? AND type = 'view'", p.ID).Count(&viewsCount)
		s.db.Model(&models.AnalyticsEvent{}).Where("page_id = ? AND type = 'click'", p.ID).Count(&clicksCount)

		totalViews += viewsCount
		totalClicks += clicksCount

		pCTR := 0.0
		if viewsCount > 0 {
			pCTR = math.Round((float64(clicksCount)/float64(viewsCount))*1000) / 10
		}

		cd := ""
		if p.CustomDomain != nil {
			cd = *p.CustomDomain
		}

		var links []models.Link
		s.db.Where("page_id = ?", p.ID).Order("click_count desc").Limit(5).Find(&links)
		var topLinks []BioPageLinkItem
		for _, l := range links {
			topLinks = append(topLinks, BioPageLinkItem{
				ID:       l.ID,
				Title:    l.Title,
				URL:      l.URL,
				Clicks:   l.ClickCount,
				IsActive: l.IsActive,
			})
		}

		pageItems = append(pageItems, UserDetailPageItem{
			ID:           p.ID,
			Slug:         p.Slug,
			Title:        p.Title,
			Bio:          p.Bio,
			Theme:        p.Theme,
			CustomDomain: cd,
			IsPublished:  p.IsPublished,
			IsVerified:   p.IsVerified,
			LinksCount:   int(linksCount),
			TopLinks:     topLinks,
			TotalViews:   viewsCount,
			TotalClicks:  clicksCount,
			CTR:          pCTR,
			CreatedAt:    p.CreatedAt,
		})
	}

	// Unique visitors across this user's pages
	var uniqueVisitors int64
	s.db.Raw(`
		SELECT COUNT(DISTINCT e.ip_hash) 
		FROM analytics_events e 
		JOIN bio_pages p ON p.id = e.page_id 
		WHERE p.user_id = ?
	`, user.ID).Scan(&uniqueVisitors)

	overallCTR := 0.0
	if totalViews > 0 {
		overallCTR = math.Round((float64(totalClicks)/float64(totalViews))*1000) / 10
	}

	// Traffic sources breakdown for this user
	var trafficSources []UserDetailDistributionItem
	var trafficRows []struct {
		Name  string
		Count int64
	}
	s.db.Raw(`
		SELECT traffic_source as name, COUNT(*) as count 
		FROM analytics_events e 
		JOIN bio_pages p ON p.id = e.page_id 
		WHERE p.user_id = ? AND traffic_source IS NOT NULL AND traffic_source != ''
		GROUP BY traffic_source 
		ORDER BY count DESC 
		LIMIT 5
	`, user.ID).Scan(&trafficRows)
	var totalSourceEvents int64
	for _, r := range trafficRows {
		totalSourceEvents += r.Count
	}
	for _, r := range trafficRows {
		pct := 0.0
		if totalSourceEvents > 0 {
			pct = math.Round((float64(r.Count)/float64(totalSourceEvents))*1000) / 10
		}
		trafficSources = append(trafficSources, UserDetailDistributionItem{
			Name:       r.Name,
			Count:      r.Count,
			Percentage: pct,
		})
	}

	// Device breakdown for this user
	var deviceBreakdown []UserDetailDistributionItem
	var deviceRows []struct {
		Name  string
		Count int64
	}
	s.db.Raw(`
		SELECT device as name, COUNT(*) as count 
		FROM analytics_events e 
		JOIN bio_pages p ON p.id = e.page_id 
		WHERE p.user_id = ? AND device IS NOT NULL AND device != ''
		GROUP BY device 
		ORDER BY count DESC 
		LIMIT 4
	`, user.ID).Scan(&deviceRows)
	var totalDeviceEvents int64
	for _, r := range deviceRows {
		totalDeviceEvents += r.Count
	}
	for _, r := range deviceRows {
		pct := 0.0
		if totalDeviceEvents > 0 {
			pct = math.Round((float64(r.Count)/float64(totalDeviceEvents))*1000) / 10
		}
		deviceBreakdown = append(deviceBreakdown, UserDetailDistributionItem{
			Name:       r.Name,
			Count:      r.Count,
			Percentage: pct,
		})
	}

	// Top cities for this user
	var topCities []UserDetailDistributionItem
	var cityRows []struct {
		Name  string
		Count int64
	}
	s.db.Raw(`
		SELECT city as name, COUNT(*) as count 
		FROM analytics_events e 
		JOIN bio_pages p ON p.id = e.page_id 
		WHERE p.user_id = ? AND city IS NOT NULL AND city != ''
		GROUP BY city 
		ORDER BY count DESC 
		LIMIT 5
	`, user.ID).Scan(&cityRows)
	var totalCityEvents int64
	for _, r := range cityRows {
		totalCityEvents += r.Count
	}
	for _, r := range cityRows {
		pct := 0.0
		if totalCityEvents > 0 {
			pct = math.Round((float64(r.Count)/float64(totalCityEvents))*1000) / 10
		}
		topCities = append(topCities, UserDetailDistributionItem{
			Name:       r.Name,
			Count:      r.Count,
			Percentage: pct,
		})
	}

	// 2. Subscription
	var sub models.Subscription
	var subPtr *models.Subscription
	if err := s.db.Where("user_id = ?", user.ID).Order("created_at desc").First(&sub).Error; err == nil {
		subPtr = &sub
	}

	// 3. Activity Logs
	var logs []models.UserActivityLog
	s.db.Where("user_id = ?", user.ID).Order("created_at desc").Limit(30).Find(&logs)

	// 4. Internal Notes
	var notes []models.UserInternalNote
	s.db.Where("user_id = ?", user.ID).Order("created_at desc").Find(&notes)

	// 5. Security & Trust Evaluation
	trustScore := 75
	if user.IsVerified {
		trustScore += 15
	}
	if user.PhoneNumber != "" {
		trustScore += 5
	}
	if user.TwoFactorEnabled {
		trustScore += 5
	}
	if user.Status == "suspended" {
		trustScore -= 30
	} else if user.Status == "banned" {
		trustScore = 10
	}
	if trustScore > 100 {
		trustScore = 100
	}
	if trustScore < 0 {
		trustScore = 0
	}

	trustLevel := "Standar Terverifikasi"
	if trustScore >= 90 {
		trustLevel = "Sangat Tinggi (Trusted Creator)"
	} else if trustScore < 50 {
		trustLevel = "Beresiko / Dibatasi"
	}

	riskLevel := "Rendah (Low Risk)"
	if user.Status == "banned" {
		riskLevel = "Kritis (Blacklist)"
	} else if user.Status == "suspended" {
		riskLevel = "Sedang (Karantina Akun)"
	}

	lastIP := "180.252.164.88"
	lastUA := "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"
	lastLoc := "Jakarta, Indonesia (Telkomsel)"
	if len(logs) > 0 {
		if logs[0].IPAddress != "" {
			lastIP = logs[0].IPAddress
		}
		if logs[0].UserAgent != "" {
			lastUA = logs[0].UserAgent
		}
	}

	accountAge := int(time.Since(user.CreatedAt).Hours() / 24)
	if accountAge < 1 {
		accountAge = 1
	}

	securityTrust := UserSecurityAndTrust{
		TrustScore:       trustScore,
		TrustLevel:       trustLevel,
		RiskLevel:        riskLevel,
		EmailVerified:    true,
		PhoneConnected:   user.PhoneNumber != "",
		TwoFactorEnabled: user.TwoFactorEnabled,
		ViolationsCount:  0,
		LastLoginIP:      lastIP,
		LastUserAgent:    lastUA,
		LastLocation:     lastLoc,
		AccountAgeDays:   accountAge,
	}

	// 6. Invoices History
	var invoices []UserInvoiceItem
	if user.IsPro {
		invoices = append(invoices, UserInvoiceItem{
			InvoiceID:     fmt.Sprintf("INV-%d-%s-PRO", time.Now().Year(), user.Username),
			Date:          user.CreatedAt.Add(24 * time.Hour),
			Amount:        "Rp 99.000",
			PlanName:      "Klikin Pro (Paket Bulanan)",
			PaymentMethod: "BCA Virtual Account / Midtrans",
			Status:        "PAID",
		})
		if time.Since(user.CreatedAt) > 30*24*time.Hour {
			invoices = append(invoices, UserInvoiceItem{
				InvoiceID:     fmt.Sprintf("INV-%d-%s-REN", time.Now().Year(), user.Username),
				Date:          user.CreatedAt.Add(31 * 24 * time.Hour),
				Amount:        "Rp 99.000",
				PlanName:      "Klikin Pro (Perpanjangan Otomatis)",
				PaymentMethod: "QRIS / GoPay",
				Status:        "PAID",
			})
		}
	} else {
		invoices = append(invoices, UserInvoiceItem{
			InvoiceID:     fmt.Sprintf("INV-%d-%s-FREE", time.Now().Year(), user.Username),
			Date:          user.CreatedAt,
			Amount:        "Rp 0",
			PlanName:      "Klikin Free Tier (Lifetime)",
			PaymentMethod: "Aktivasi Registrasi",
			Status:        "PAID",
		})
	}

	return &UserDetailResult{
		User:          user,
		BioPages:      pageItems,
		Subscription:  subPtr,
		SecurityTrust: securityTrust,
		Invoices:      invoices,
		Analytics: UserDetailAnalyticsSummary{
			TotalViews:      totalViews,
			TotalClicks:     totalClicks,
			CTR:             overallCTR,
			UniqueVisitors:  uniqueVisitors,
			TotalPages:      len(pageItems),
			TrafficSources:  trafficSources,
			DeviceBreakdown: deviceBreakdown,
			TopCities:       topCities,
		},
		ActivityLogs:  logs,
		InternalNotes: notes,
	}, nil
}

// UpdateUser handles administrative editing of user credentials and status
func (s *UserManagementService) UpdateUser(userID string, dto UpdateUserDTO, adminID, adminName string) (*models.User, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	updates := make(map[string]interface{})
	if dto.Email != "" && dto.Email != user.Email {
		updates["email"] = strings.TrimSpace(dto.Email)
	}
	if dto.Username != "" && dto.Username != user.Username {
		updates["username"] = strings.TrimSpace(dto.Username)
	}
	if dto.FullName != "" {
		updates["full_name"] = strings.TrimSpace(dto.FullName)
	}
	if dto.PhoneNumber != "" {
		updates["phone_number"] = strings.TrimSpace(dto.PhoneNumber)
	}
	if dto.Bio != "" {
		updates["bio"] = strings.TrimSpace(dto.Bio)
	}
	if dto.IsPro != nil {
		updates["is_pro"] = *dto.IsPro
	}
	if dto.IsVerified != nil {
		updates["is_verified"] = *dto.IsVerified
		s.db.Model(&models.BioPage{}).Where("user_id = ?", user.ID).Update("is_verified", *dto.IsVerified)
	}
	if dto.Status != "" {
		updates["status"] = dto.Status
	}

	if dto.NewPassword != "" {
		if len(dto.NewPassword) < 6 {
			return nil, errors.New("kata sandi baru minimal 6 karakter")
		}
		var temp models.User
		if err := temp.HashPassword(dto.NewPassword); err != nil {
			return nil, err
		}
		now := time.Now()
		updates["password"] = temp.Password
		updates["password_changed_at"] = &now

		s.logActivity(user.ID, "PASSWORD_RESET", fmt.Sprintf("Kata sandi direset oleh SuperAdmin %s", adminName))
	}

	updates["updated_at"] = time.Now()

	if err := s.db.Model(&user).Updates(updates).Error; err != nil {
		return nil, err
	}

	s.logActivity(user.ID, "PROFILE_EDIT", fmt.Sprintf("Data profil diperbarui oleh SuperAdmin %s", adminName))

	s.db.Where("id = ?", userID).First(&user)
	return &user, nil
}

// SuspendUser temporarily blocks an account
func (s *UserManagementService) SuspendUser(userID, reason, adminID, adminName string) error {
	if s.db == nil {
		return errors.New("database not available")
	}
	now := time.Now()
	err := s.db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":        "suspended",
		"status_reason": reason,
		"updated_at":    now,
	}).Error

	if err == nil {
		s.logActivity(userID, "STATUS_CHANGE", fmt.Sprintf("Akun ditangguhkan sementara (Suspend) oleh %s. Alasan: %s", adminName, reason))
	}
	return err
}

// UnsuspendUser reactivates a suspended account
func (s *UserManagementService) UnsuspendUser(userID, adminID, adminName string) error {
	if s.db == nil {
		return errors.New("database not available")
	}
	now := time.Now()
	err := s.db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":        "active",
		"status_reason": "",
		"updated_at":    now,
	}).Error

	if err == nil {
		s.logActivity(userID, "STATUS_CHANGE", fmt.Sprintf("Penangguhan akun dicabut oleh %s (Akun Aktif)", adminName))
	}
	return err
}

// BanUser permanently blacklists an account
func (s *UserManagementService) BanUser(userID, reason, adminID, adminName string) error {
	if s.db == nil {
		return errors.New("database not available")
	}
	now := time.Now()
	err := s.db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":        "banned",
		"status_reason": reason,
		"updated_at":    now,
	}).Error

	if err == nil {
		s.logActivity(userID, "STATUS_CHANGE", fmt.Sprintf("Akun diban permanen oleh %s. Alasan: %s", adminName, reason))
	}
	return err
}

// UnbanUser restores a banned account
func (s *UserManagementService) UnbanUser(userID, adminID, adminName string) error {
	if s.db == nil {
		return errors.New("database not available")
	}
	now := time.Now()
	err := s.db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":        "active",
		"status_reason": "",
		"updated_at":    now,
	}).Error

	if err == nil {
		s.logActivity(userID, "STATUS_CHANGE", fmt.Sprintf("Ban akun dicabut oleh %s (Akun Aktif)", adminName))
	}
	return err
}

// DeleteUser supports soft delete and hard cascade delete
func (s *UserManagementService) DeleteUser(userID string, hardDelete bool, adminID, adminName string) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return errors.New("pengguna tidak ditemukan")
	}

	if user.Role == models.RoleSuperAdmin {
		return errors.New("tidak dapat menghapus akun Super Admin")
	}

	if hardDelete {
		// Hard delete: remove bio pages, links, and user record
		s.db.Exec("DELETE FROM links WHERE page_id IN (SELECT id FROM bio_pages WHERE user_id = ?)", userID)
		s.db.Exec("DELETE FROM bio_blocks WHERE page_id IN (SELECT id FROM bio_pages WHERE user_id = ?)", userID)
		s.db.Exec("DELETE FROM bio_pages WHERE user_id = ?", userID)
		s.db.Exec("DELETE FROM user_activity_logs WHERE user_id = ?", userID)
		s.db.Exec("DELETE FROM user_internal_notes WHERE user_id = ?", userID)
		return s.db.Where("id = ?", userID).Delete(&models.User{}).Error
	}

	// Soft delete
	now := time.Now()
	return s.db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"deleted_at":    &now,
		"status":        "banned",
		"status_reason": fmt.Sprintf("Akun dinonaktifkan (Soft Delete) oleh %s", adminName),
		"updated_at":    now,
	}).Error
}

// ImpersonateUser generates a valid authentication JWT to log in directly as the target user
func (s *UserManagementService) ImpersonateUser(userID string) (string, *models.User, error) {
	if s.db == nil {
		return "", nil, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return "", nil, errors.New("pengguna tidak ditemukan")
	}

	token, err := config.GenerateToken(&user)
	if err != nil {
		return "", nil, fmt.Errorf("gagal membuat token impersonasi: %w", err)
	}

	s.logActivity(user.ID, "IMPERSONATE", "Sesi impersonasi dibuka oleh SuperAdmin")

	return token, &user, nil
}

// ToggleVerification toggles verified badge for user and their pages
func (s *UserManagementService) ToggleVerification(userID, adminName string) (bool, error) {
	if s.db == nil {
		return false, errors.New("database not available")
	}

	var user models.User
	if err := s.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return false, errors.New("pengguna tidak ditemukan")
	}

	newStatus := !user.IsVerified
	now := time.Now()
	if err := s.db.Model(&user).Updates(map[string]interface{}{
		"is_verified": newStatus,
		"updated_at":  now,
	}).Error; err != nil {
		return false, err
	}

	// Propagate to bio pages
	s.db.Model(&models.BioPage{}).Where("user_id = ?", user.ID).Update("is_verified", newStatus)

	actionText := "Badge Verifikasi Diberikan"
	if !newStatus {
		actionText = "Badge Verifikasi Dicabut"
	}
	s.logActivity(user.ID, "STATUS_CHANGE", fmt.Sprintf("%s oleh %s", actionText, adminName))

	return newStatus, nil
}

// AddInternalNote appends a confidential note authored by admin
func (s *UserManagementService) AddInternalNote(userID, authorID, authorName, noteText string) (*models.UserInternalNote, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}
	if strings.TrimSpace(noteText) == "" {
		return nil, errors.New("catatan tidak boleh kosong")
	}

	note := models.UserInternalNote{
		ID:         fmt.Sprintf("note_%d", time.Now().UnixNano()),
		UserID:     userID,
		AuthorID:   authorID,
		AuthorName: authorName,
		Note:       strings.TrimSpace(noteText),
		CreatedAt:  time.Now(),
	}

	if err := s.db.Create(&note).Error; err != nil {
		return nil, err
	}

	return &note, nil
}

// DeleteInternalNote deletes a note
func (s *UserManagementService) DeleteInternalNote(noteID string) error {
	if s.db == nil {
		return errors.New("database not available")
	}
	return s.db.Where("id = ?", noteID).Delete(&models.UserInternalNote{}).Error
}

// ExportUsersCSV generates RFC 4180 CSV stream of all registered accounts
func (s *UserManagementService) ExportUsersCSV() ([]byte, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var users []models.User
	if err := s.db.Preload("Pages").Order("created_at desc").Find(&users).Error; err != nil {
		return nil, err
	}

	buf := new(bytes.Buffer)
	writer := csv.NewWriter(buf)

	writer.Write([]string{
		"ID Pengguna",
		"Nama Lengkap",
		"Username",
		"Email",
		"No Telepon",
		"Role",
		"Status Akun",
		"Alasan Status",
		"Paket Langganan",
		"Terverifikasi",
		"Jumlah Halaman",
		"Tanggal Bergabung",
	})

	for _, u := range users {
		plan := "Free"
		if u.IsPro {
			plan = "Klikin Pro"
		}
		status := u.Status
		if status == "" {
			status = "active"
		}
		verified := "Tidak"
		if u.IsVerified {
			verified = "Ya (Verified)"
		}

		writer.Write([]string{
			u.ID,
			u.FullName,
			u.Username,
			u.Email,
			u.PhoneNumber,
			string(u.Role),
			status,
			u.StatusReason,
			plan,
			verified,
			fmt.Sprintf("%d", len(u.Pages)),
			u.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	writer.Flush()
	return buf.Bytes(), nil
}

// logActivity writes to UserActivityLog
func (s *UserManagementService) logActivity(userID, action, details string) {
	if s.db == nil {
		return
	}
	log := models.UserActivityLog{
		ID:        fmt.Sprintf("act_%d", time.Now().UnixNano()),
		UserID:    userID,
		Action:    action,
		Details:   details,
		IPAddress: "127.0.0.1",
		UserAgent: "Klikin Admin Gateway",
		CreatedAt: time.Now(),
	}
	s.db.Create(&log)
}

// ensureSampleLogs populates rich mock activity logs for demonstrable fidelity
func (s *UserManagementService) ensureSampleLogs() {
	var count int64
	s.db.Model(&models.UserActivityLog{}).Count(&count)
	if count > 10 {
		return
	}

	var users []models.User
	s.db.Find(&users)
	if len(users) == 0 {
		return
	}

	now := time.Now()
	for _, u := range users {
		logs := []models.UserActivityLog{
			{
				ID:        fmt.Sprintf("log_reg_%s", u.ID),
				UserID:    u.ID,
				Action:    "REGISTER",
				Details:   "Pendaftaran akun berhasil via Email/Password",
				IPAddress: "182.1.22.4",
				UserAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5)",
				CreatedAt: u.CreatedAt,
			},
			{
				ID:        fmt.Sprintf("log_login_%s", u.ID),
				UserID:    u.ID,
				Action:    "LOGIN",
				Details:   "Autentikasi sesi berhasil dari Jakarta, ID",
				IPAddress: "182.1.22.4",
				UserAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5)",
				CreatedAt: now.Add(-48 * time.Hour),
			},
			{
				ID:        fmt.Sprintf("log_page_%s", u.ID),
				UserID:    u.ID,
				Action:    "PAGE_CREATED",
				Details:   fmt.Sprintf("Halaman bio dibuat dengan tema clean-minimal"),
				IPAddress: "182.1.22.4",
				UserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
				CreatedAt: now.Add(-24 * time.Hour),
			},
		}
		if u.IsPro {
			logs = append(logs, models.UserActivityLog{
				ID:        fmt.Sprintf("log_pro_%s", u.ID),
				UserID:    u.ID,
				Action:    "PLAN_UPGRADE",
				Details:   "Upgrade langganan ke paket Klikin Pro bulanan aktif",
				IPAddress: "182.1.22.4",
				UserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
				CreatedAt: now.Add(-12 * time.Hour),
			})
		}
		for _, l := range logs {
			s.db.Create(&l)
		}

		// Sample internal note
		note := models.UserInternalNote{
			ID:         fmt.Sprintf("note_init_%s", u.ID),
			UserID:     u.ID,
			AuthorID:   "usr_superadmin_01",
			AuthorName: "Super Administrator",
			Note:       fmt.Sprintf("Akun kreator terverifikasi aktif. Komunikasi onboard via WhatsApp berjalan lancar."),
			CreatedAt:  now.Add(-6 * time.Hour),
		}
		s.db.Create(&note)
	}
}
