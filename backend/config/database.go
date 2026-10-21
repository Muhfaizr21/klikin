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
	if err := db.AutoMigrate(&models.User{}, &models.BioPage{}, &models.Link{}); err != nil {
		log.Printf("⚠️ AutoMigrate warning: %v", err)
	} else {
		log.Println("✅ Database schema migrated successfully: users, bio_pages, links")
		// Run initial database seeder
		if err := SeedDatabase(db); err != nil {
			log.Printf("⚠️ SeedDatabase warning: %v", err)
		}
	}

	DB = db
	return db, nil
}
