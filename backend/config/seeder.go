package config

import (
	"log"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
)

// SeedDatabase seeds initial accounts (SUPER_ADMIN and ACCOUNT_OWNER) with isolated bio pages and sample links
func SeedDatabase(db *gorm.DB) error {
	if db == nil {
		return nil
	}

	// 1. Seed SUPER_ADMIN
	var adminCount int64
	db.Model(&models.User{}).Where("email = ?", "admin@klikin.id").Count(&adminCount)
	if adminCount == 0 {
		admin := models.User{
			ID:        "usr_superadmin_01",
			Email:     "admin@klikin.id",
			Username:  "superadmin",
			FullName:  "Super Administrator",
			Role:      models.RoleSuperAdmin,
			IsPro:     true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := admin.HashPassword("admin12345"); err != nil {
			log.Printf("⚠️ Failed to hash admin password: %v", err)
		} else {
			if err := db.Create(&admin).Error; err != nil {
				log.Printf("⚠️ Failed to seed superadmin: %v", err)
			} else {
				log.Println("🌱 [Seeder] SuperAdmin seeded: admin@klikin.id / admin12345")
			}
		}
	}

	// 2. Seed ACCOUNT_OWNER 1: Kopi Seduh Nusantara (UMKM Creator)
	var ownerCount int64
	db.Model(&models.User{}).Where("email = ?", "owner@klikin.id").Count(&ownerCount)
	if ownerCount == 0 {
		owner := models.User{
			ID:        "usr_owner_kopi",
			Email:     "owner@klikin.id",
			Username:  "kopiseduh",
			FullName:  "Kopi Seduh Nusantara",
			Role:      models.RoleAccountOwner,
			IsPro:     true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := owner.HashPassword("owner12345"); err != nil {
			log.Printf("⚠️ Failed to hash owner password: %v", err)
		} else {
			if err := db.Create(&owner).Error; err != nil {
				log.Printf("⚠️ Failed to seed owner: %v", err)
			} else {
				log.Println("🌱 [Seeder] Account Owner seeded: owner@klikin.id / owner12345")

				// Seed isolated BioPage for this Owner
				kopiPage := models.BioPage{
					ID:           "page_kopiseduh",
					UserID:       owner.ID,
					Slug:         "kopiseduh",
					Title:        "Kopi Seduh Nusantara",
					Bio:          "Roastery biji kopi lokal single origin dan alat seduh manual. Pengiriman seluruh Indonesia.",
					Theme:        "midnight",
					CustomDomain: nil,
					IsPublished:  true,
					CreatedAt:    time.Now(),
					UpdatedAt:    time.Now(),
				}
				db.Create(&kopiPage)

				// Seed initial Links for this page
				links := []models.Link{
					{
						ID:         "link_kopi_01",
						PageID:     kopiPage.ID,
						Title:      "Toko Online Official",
						URL:        "https://shopee.co.id/kopiseduh",
						Icon:       "ShoppingBag",
						Order:      0,
						IsActive:   true,
						ClickCount: 1420,
						CreatedAt:  time.Now(),
						UpdatedAt:  time.Now(),
					},
					{
						ID:         "link_kopi_02",
						PageID:     kopiPage.ID,
						Title:      "Konsultasi WhatsApp Cepat",
						URL:        "https://wa.me/6281234567890?text=Halo%20kak%2C%20mau%20order%20biji%20kopi",
						Icon:       "MessageCircle",
						Order:      1,
						IsActive:   true,
						ClickCount: 890,
						CreatedAt:  time.Now(),
						UpdatedAt:  time.Now(),
					},
					{
						ID:         "link_kopi_03",
						PageID:     kopiPage.ID,
						Title:      "Video Tutorial & Review Produk",
						URL:        "https://youtube.com/@kopiseduh",
						Icon:       "PlayCircle",
						Order:      2,
						IsActive:   true,
						ClickCount: 540,
						CreatedAt:  time.Now(),
						UpdatedAt:  time.Now(),
					},
				}
				db.Create(&links)
				log.Println("🌱 [Seeder] Isolated Bio Page and links seeded for kopiseduh")
			}
		}
	}

	// 3. Seed ACCOUNT_OWNER 2: Creative Studio (demonstrates multiple isolated workspaces)
	var creatorCount int64
	db.Model(&models.User{}).Where("email = ?", "creator@klikin.id").Count(&creatorCount)
	if creatorCount == 0 {
		creator := models.User{
			ID:        "usr_owner_creator",
			Email:     "creator@klikin.id",
			Username:  "creativestudio",
			FullName:  "Studio Kreatif Indonesia",
			Role:      models.RoleAccountOwner,
			IsPro:     false,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := creator.HashPassword("creator12345"); err == nil {
			if err := db.Create(&creator).Error; err == nil {
				studioPage := models.BioPage{
					ID:          "page_creativestudio",
					UserID:      creator.ID,
					Slug:        "creativestudio",
					Title:       "Studio Kreatif",
					Bio:         "Portofolio desain grafis, visual branding, dan ilustrasi digital.",
					Theme:       "emerald",
					IsPublished: true,
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}
				db.Create(&studioPage)
				log.Println("🌱 [Seeder] Second Account Owner seeded: creator@klikin.id / creator12345")
			}
		}
	}

	return nil
}
