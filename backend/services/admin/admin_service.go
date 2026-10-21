package admin

import (
	"errors"

	"gorm.io/gorm"
	"klikin-backend/models"
)

type AdminService struct {
	db *gorm.DB
}

func NewAdminService(db *gorm.DB) *AdminService {
	return &AdminService{db: db}
}

type PlatformStats struct {
	TotalUsers     int64  `json:"total_users"`
	TotalBioPages  int64  `json:"total_bio_pages"`
	TotalLinks     int64  `json:"total_links"`
	TotalClicks    int64  `json:"total_clicks"`
	ProSubscribers int64  `json:"pro_subscribers"`
	MRR            int64  `json:"mrr"` // Estimated Monthly Recurring Revenue in IDR
	SystemUptime   string `json:"system_uptime"`
	DatabaseStatus string `json:"database_status"`
}

// GetStats aggregates platform-wide metrics exclusively for SuperAdmin
func (s *AdminService) GetStats() (*PlatformStats, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var totalUsers, totalBioPages, totalLinks, proCount int64
	s.db.Model(&models.User{}).Count(&totalUsers)
	s.db.Model(&models.BioPage{}).Count(&totalBioPages)
	s.db.Model(&models.Link{}).Count(&totalLinks)
	s.db.Model(&models.User{}).Where("is_pro = true").Count(&proCount)

	type ClickResult struct {
		Sum int64
	}
	var clickRes ClickResult
	s.db.Model(&models.Link{}).Select("COALESCE(SUM(click_count), 0) as sum").Scan(&clickRes)

	return &PlatformStats{
		TotalUsers:     totalUsers,
		TotalBioPages:  totalBioPages,
		TotalLinks:     totalLinks,
		TotalClicks:    clickRes.Sum,
		ProSubscribers: proCount,
		MRR:            proCount * 29000,
		SystemUptime:   "99.98%",
		DatabaseStatus: "connected",
	}, nil
}

// ListUsers retrieves all registered users on Klikin with their bio page metadata
func (s *AdminService) ListUsers() ([]models.User, error) {
	if s.db == nil {
		return nil, errors.New("database not available")
	}

	var users []models.User
	if err := s.db.Preload("Pages").Order("created_at desc").Find(&users).Error; err != nil {
		return nil, err
	}

	return users, nil
}
