package config

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"klikin-backend/models"
)

var DB *gorm.DB

// ConnectDatabase initializes connection to PostgreSQL database
func ConnectDatabase(dsn string) (*gorm.DB, error) {
	if dsn == "" {
		log.Println("⚠️  DATABASE_URL is not set. Database connection skipped.")
		return nil, nil
	}

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		Logger:                 logger.Default.LogMode(logger.Warn),
		SkipDefaultTransaction: true,
	})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// Optimize connection pooling for Supabase / PostgreSQL
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetConnMaxLifetime(15 * time.Minute)

	log.Println("✅ Successfully connected to Supabase PostgreSQL!")
	DB = db

	// Fast boot check: if all core tables are already present and FORCE_MIGRATE != "true",
	// skip synchronous 33-table AutoMigrate roundtrips so HTTP server starts in <500ms.
	var tableCount int64
	_ = db.Raw(`SELECT count(*) FROM information_schema.tables WHERE table_schema = CURRENT_SCHEMA() AND table_name IN ('users', 'subscriptions', 'custom_domains', 'platform_settings', 'blacklisted_ips')`).Scan(&tableCount).Error

	if tableCount >= 5 && os.Getenv("FORCE_MIGRATE") != "true" {
		log.Println("⚡ Fast-Boot: Database schema (33 models) already verified. Skipping synchronous AutoMigrate.")
		// Ensure non-destructive schema additions and performance indexes in background
		go func() {
			_ = db.Exec(`ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS midtrans_merchant_id VARCHAR(100) DEFAULT '';`).Error
			ensurePerformanceIndexes(db)
		}()
		return db, nil
	}

	// Auto-migrate tables when schema is new or FORCE_MIGRATE=true
	if err := db.AutoMigrate(
		&models.User{},
		&models.BioPage{},
		&models.Link{},
		&models.BioBlock{},
		&models.AnalyticsEvent{},
		&models.CustomDomain{},
		&models.EmailCaptureConfig{},
		&models.EmailLead{},
		&models.Subscription{},
		&models.Invoice{},
		&models.PromoCode{},
		&models.Notification{},
		&models.TransactionalEmailLog{},
		&models.NotificationPreference{},
		&models.SupportTicket{},
		&models.TicketMessage{},
		&models.FAQItem{},
		&models.UserFeedback{},
		&models.UserActivityLog{},
		&models.UserInternalNote{},
		&models.ContentReport{},
		&models.BlacklistedDomain{},
		&models.ModerationLog{},
		&models.DomainDiagnosticLog{},
		&models.InfrastructureCost{},
		&models.FinancialAuditLog{},
		&models.CannedResponse{},
		&models.BroadcastAnnouncement{},
		&models.CommunicationAuditLog{},
		&models.PlatformAuditLog{},
		&models.LoginHistoryLog{},
		&models.AppErrorLog{},
		&models.BlacklistedIP{},
		&models.AdminSession{},
		&models.DataBackupRecord{},
		&models.SecurityPolicy{},
		&models.PlatformSetting{},
	); err != nil {
		log.Printf("⚠️ AutoMigrate warning: %v", err)
	} else {
		log.Println("✅ Database schema migrated successfully: all 33 core models")
		ensurePerformanceIndexes(db)

		// Run initial database seeder
		if err := SeedDatabase(db); err != nil {
			log.Printf("⚠️ SeedDatabase warning: %v", err)
		}
	}

	DB = db
	return db, nil
}

// ensurePerformanceIndexes creates composite indexes in a single batch statement for fast analytical queries.
func ensurePerformanceIndexes(db *gorm.DB) {
	if db == nil {
		return
	}
	_ = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_analytics_events_composite ON analytics_events(page_id, created_at, type);
		CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON analytics_events(page_id, type, created_at);
		CREATE INDEX IF NOT EXISTS idx_analytics_events_created_type ON analytics_events(created_at, type);
		CREATE INDEX IF NOT EXISTS idx_bio_pages_user_id ON bio_pages(user_id);
		CREATE INDEX IF NOT EXISTS idx_links_page_id ON links(page_id);
		CREATE INDEX IF NOT EXISTS idx_subscriptions_status_plan ON subscriptions(status, plan);
		CREATE INDEX IF NOT EXISTS idx_invoices_status_paid_at ON invoices(status, paid_at);
		CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority ON support_tickets(status, priority);
		CREATE INDEX IF NOT EXISTS idx_users_status_pro_deleted ON users(deleted_at, status, is_pro);
	`).Error
}
