package config

import (
	"log"
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

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// Optimize connection pooling for Supabase / PostgreSQL
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetConnMaxLifetime(15 * time.Minute)

	log.Println("✅ Successfully connected to Supabase PostgreSQL!")

	// Auto-migrate tables
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
	); err != nil {
		log.Printf("⚠️ AutoMigrate warning: %v", err)
	} else {
		log.Println("✅ Database schema migrated successfully: all 18 core models")
		// Add performance composite indexes for analytics
		_ = db.Exec(`CREATE INDEX IF NOT EXISTS idx_analytics_events_composite ON analytics_events(page_id, created_at, type);`).Error
		_ = db.Exec(`CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON analytics_events(page_id, type, created_at);`).Error

		// Run initial database seeder
		if err := SeedDatabase(db); err != nil {
			log.Printf("⚠️ SeedDatabase warning: %v", err)
		}
	}

	DB = db
	return db, nil
}
