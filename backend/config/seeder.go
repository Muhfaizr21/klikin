package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
	"klikin-backend/models"
)

func resolveEnvOrDefault(key, devDefault string) string {
	if val := strings.TrimSpace(os.Getenv(key)); val != "" {
		return val
	}
	if GetAppEnv() == "production" {
		return ""
	}
	return devDefault
}

// SeedDatabase seeds initial accounts (SUPER_ADMIN and ACCOUNT_OWNER) with isolated bio pages and sample links
func SeedDatabase(db *gorm.DB) error {
	if db == nil {
		return nil
	}

	isProd := GetAppEnv() == "production"
	seedDemo := strings.EqualFold(strings.TrimSpace(os.Getenv("SEED_DEMO_DATA")), "true")
	if isProd && !seedDemo {
		log.Println("ℹ️  [Seeder] Production environment detected and SEED_DEMO_DATA!=true. Skipping demo data seeding.")
		return nil
	}

	adminEmail := resolveEnvOrDefault("ADMIN_SEED_EMAIL", "admin@klikin.id")
	adminPassword := resolveEnvOrDefault("ADMIN_SEED_PASSWORD", "admin12345")

	// 1. Seed SUPER_ADMIN
	var adminCount int64
	if adminEmail != "" && adminPassword != "" {
		db.Model(&models.User{}).Where("email = ?", adminEmail).Count(&adminCount)
		if adminCount == 0 {
			admin := models.User{
				ID:        "usr_superadmin_01",
				Email:     adminEmail,
				Username:  "superadmin",
				FullName:  "Super Administrator",
				Role:      models.RoleSuperAdmin,
				IsPro:     true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			if err := admin.HashPassword(adminPassword); err != nil {
				log.Printf("⚠️ Failed to hash admin password: %v", err)
			} else {
				if err := db.Create(&admin).Error; err != nil {
					log.Printf("⚠️ Failed to seed superadmin: %v", err)
				} else {
					log.Printf("🌱 [Seeder] SuperAdmin seeded: %s", adminEmail)
				}
			}
		}
	}

	ownerEmail := resolveEnvOrDefault("OWNER_SEED_EMAIL", "owner@klikin.id")
	ownerPassword := resolveEnvOrDefault("OWNER_SEED_PASSWORD", "owner12345")

	// 2. Seed ACCOUNT_OWNER 1: Kopi Seduh Nusantara (UMKM Creator)
	var ownerCount int64
	if ownerEmail == "" || ownerPassword == "" {
		return nil
	}
	db.Model(&models.User{}).Where("email = ?", ownerEmail).Count(&ownerCount)
	if ownerCount == 0 {
		owner := models.User{
			ID:        "usr_owner_kopi",
			Email:     ownerEmail,
			Username:  "kopiseduh",
			FullName:  "Kopi Seduh Nusantara",
			Role:      models.RoleAccountOwner,
			IsPro:     true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := owner.HashPassword(ownerPassword); err != nil {
			log.Printf("⚠️ Failed to hash owner password: %v", err)
		} else {
			if err := db.Create(&owner).Error; err != nil {
				log.Printf("⚠️ Failed to seed owner: %v", err)
			} else {
				log.Printf("🌱 [Seeder] Account Owner seeded: %s", ownerEmail)

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

	// 4. Seed sample BioBlocks for kopiseduh if none exist
	var blockCount int64
	db.Model(&models.BioBlock{}).Where("page_id = ?", "page_kopiseduh").Count(&blockCount)
	if blockCount == 0 {
		blocks := []models.BioBlock{
			{
				ID:        "blk_kopi_01",
				PageID:    "page_kopiseduh",
				Type:      "header",
				Title:     "Katalog & Penawaran Unggulan",
				Order:     0,
				IsActive:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			{
				ID:        "blk_kopi_02",
				PageID:    "page_kopiseduh",
				Type:      "link",
				Title:     "Toko Resmi di Shopee",
				Subtitle:  "Dapatkan diskon ongkir dan promo flash sale harian",
				URL:       "https://shopee.co.id/kopiseduh",
				Icon:      "ShoppingBag",
				Order:     1,
				IsActive:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			{
				ID:        "blk_kopi_03",
				PageID:    "page_kopiseduh",
				Type:      "divider",
				Content:   "solid",
				Order:     2,
				IsActive:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			{
				ID:        "blk_kopi_04",
				PageID:    "page_kopiseduh",
				Type:      "text",
				Title:     "Tentang Roastery Kami",
				Content:   "Biji kopi pilihan dipanggang segar setiap minggu menggunakan profil artisan demi cita rasa terbaik nusantara.",
				Order:     3,
				IsActive:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			{
				ID:        "blk_kopi_05",
				PageID:    "page_kopiseduh",
				Type:      "socials",
				Title:     "Media Sosial Resmi",
				Settings:  `[{"platform":"instagram","url":"https://instagram.com/kopiseduh"},{"platform":"tiktok","url":"https://tiktok.com/@kopiseduh"},{"platform":"whatsapp","url":"https://wa.me/6281234567890"}]`,
				Order:     4,
				IsActive:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			{
				ID:        "blk_kopi_06",
				PageID:    "page_kopiseduh",
				Type:      "embed",
				Title:     "Video Panduan Seduh V60 Pemula",
				URL:       "https://www.youtube.com/watch?v=1uN_Nl2QY4g",
				Order:     5,
				IsActive:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
		}
		if err := db.Create(&blocks).Error; err == nil {
			log.Println("🌱 [Seeder] Initial BioBlocks seeded for kopiseduh")
		}
	}

	// 5. Seed realistic analytics history for kopiseduh if none exist
	var eventCount int64
	db.Model(&models.AnalyticsEvent{}).Where("page_id = ?", "page_kopiseduh").Count(&eventCount)
	if eventCount == 0 {
		now := time.Now()
		var sampleEvents []models.AnalyticsEvent

		trafficSources := []string{"Instagram", "TikTok", "Direct", "WhatsApp", "Twitter / X", "Referral"}
		cities := []string{"Jakarta", "Surabaya", "Bandung", "Medan", "Denpasar", "Semarang", "Makassar"}
		browsers := []string{"Chrome", "Safari", "Instagram In-App", "TikTok In-App", "Edge", "Firefox"}
		devices := []string{"Mobile", "Mobile", "Mobile", "Desktop", "Tablet"}
		links := []struct {
			Title string
			URL   string
		}{
			{Title: "WhatsApp Admin & Pemesanan", URL: "https://wa.me/6281234567890"},
			{Title: "Toko Resmi Shopee", URL: "https://shopee.co.id/kopiseduh"},
			{Title: "Katalog Reseller & Mitra Kafe", URL: "https://drive.google.com/file/d/catalog-sample"},
			{Title: "Official Tokopedia Store", URL: "https://tokopedia.com/kopiseduh"},
		}

		// Seed across past 30 days with natural weekly fluctuation and growth
		for dayOffset := 30; dayOffset >= 0; dayOffset-- {
			dayTime := now.AddDate(0, 0, -dayOffset)
			// Baseline daily views between 120 and 380
			baseViews := 160 + (30-dayOffset)*4 + (dayOffset%5)*25
			baseClicks := int(float64(baseViews) * (0.42 + float64(dayOffset%7)*0.04))

			for i := 0; i < baseViews; i++ {
				src := trafficSources[i%len(trafficSources)]
				city := cities[i%len(cities)]
				dev := devices[i%len(devices)]
				brw := browsers[i%len(browsers)]
				ref := "https://instagram.com/"
				if src == "TikTok" {
					ref = "https://tiktok.com/"
				} else if src == "Direct" {
					ref = "direct"
				}

				sampleEvents = append(sampleEvents, models.AnalyticsEvent{
					ID:            "evt_view_" + dayTime.Format("20060102") + "_" + time.Now().Format("150405") + "_" + strconv.Itoa(i),
					PageID:        "page_kopiseduh",
					Type:          "view",
					Referrer:      ref,
					TrafficSource: src,
					Country:       "Indonesia",
					City:          city,
					Device:        dev,
					Browser:       brw,
					IPHash:        "usr_ip_hash_" + strconv.Itoa((i*7)%45),
					CreatedAt:     dayTime.Add(time.Duration(i*3) * time.Minute),
				})
			}

			for j := 0; j < baseClicks; j++ {
				l := links[j%len(links)]
				src := trafficSources[j%len(trafficSources)]
				city := cities[j%len(cities)]
				dev := devices[j%len(devices)]
				brw := browsers[j%len(browsers)]

				sampleEvents = append(sampleEvents, models.AnalyticsEvent{
					ID:            "evt_click_" + dayTime.Format("20060102") + "_" + time.Now().Format("150405") + "_" + strconv.Itoa(j),
					PageID:        "page_kopiseduh",
					Type:          "click",
					TargetTitle:   l.Title,
					TargetURL:     l.URL,
					Referrer:      "https://klikin.id/p/kopiseduh",
					TrafficSource: src,
					Country:       "Indonesia",
					City:          city,
					Device:        dev,
					Browser:       brw,
					IPHash:        "usr_ip_hash_" + strconv.Itoa((j*7)%45),
					CreatedAt:     dayTime.Add(time.Duration(j*4) * time.Minute),
				})
			}
		}

		// Insert in batches of 500
		for i := 0; i < len(sampleEvents); i += 500 {
			end := i + 500
			if end > len(sampleEvents) {
				end = len(sampleEvents)
			}
			if err := db.Create(sampleEvents[i:end]).Error; err != nil {
				log.Printf("⚠️ Failed to batch seed analytics events: %v", err)
				break
			}
		}
		log.Printf("🌱 [Seeder] %d analytics events seeded for kopiseduh across 30 days", len(sampleEvents))
	}

	// 5. Seed Email Capture Config & Sample Leads for kopiseduh
	var leadConfigCount int64
	db.Model(&models.EmailCaptureConfig{}).Where("page_id = ?", "page_kopiseduh").Count(&leadConfigCount)
	if leadConfigCount == 0 {
		cfg := models.EmailCaptureConfig{
			ID:              "cap_kopiseduh_01",
			PageID:          "page_kopiseduh",
			UserID:          "usr_owner_kopi",
			IsEnabled:       true,
			Title:           "Dapatkan Katalog & Promo Spesial Tiap Minggu",
			Description:     "Bergabunglah dengan 2,400+ pecinta kopi artisan nusantara. Dapatkan voucher diskon 15% untuk pemesanan roast bean pertama Anda.",
			Placeholder:     "Masukkan alamat email terbaik Anda...",
			ButtonText:      "Dapatkan Voucher 15%",
			SuccessMessage:  "Terima kasih! Kode voucher diskon 15% telah dikirimkan ke email Anda.",
			ConsentEnabled:  true,
			ConsentText:     "Saya setuju menerima buletin promo mingguan dan memahami kebijakan privasi.",
			NotifyOnNewLead: true,
			NotifyEmail:     "kopi@nusantara.id",
			Provider:        "mailchimp",
			APIKey:          "mc_••••••••••••3fa1-us19",
			ListID:          "aud_kopiseduh_vip",
			IsConnected:     true,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}
		db.Create(&cfg)

		sampleLeads := []models.EmailLead{
			{
				ID:               "lead_kopi_01",
				PageID:           "page_kopiseduh",
				UserID:           "usr_owner_kopi",
				Email:            "hendra.wijaya@gmail.com",
				Source:           "instagram",
				ConsentGiven:     true,
				IPAddress:        "180.252.110.12",
				UserAgent:        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)",
				SyncedToProvider: true,
				CreatedAt:        time.Now().Add(-2 * time.Hour),
			},
			{
				ID:               "lead_kopi_02",
				PageID:           "page_kopiseduh",
				UserID:           "usr_owner_kopi",
				Email:            "dina.lestari@perusahaan.co.id",
				Source:           "direct",
				ConsentGiven:     true,
				IPAddress:        "114.122.45.67",
				UserAgent:        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
				SyncedToProvider: true,
				CreatedAt:        time.Now().Add(-18 * time.Hour),
			},
			{
				ID:               "lead_kopi_03",
				PageID:           "page_kopiseduh",
				UserID:           "usr_owner_kopi",
				Email:            "barista.fikri@kafeartisan.com",
				Source:           "tiktok",
				ConsentGiven:     true,
				IPAddress:        "103.28.14.88",
				UserAgent:        "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
				SyncedToProvider: true,
				CreatedAt:        time.Now().Add(-1 * 24 * time.Hour),
			},
			{
				ID:               "lead_kopi_04",
				PageID:           "page_kopiseduh",
				UserID:           "usr_owner_kopi",
				Email:            "rina.septiani@yahoo.com",
				Source:           "whatsapp",
				ConsentGiven:     true,
				IPAddress:        "182.1.200.34",
				UserAgent:        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2)",
				SyncedToProvider: true,
				CreatedAt:        time.Now().Add(-3 * 24 * time.Hour),
			},
			{
				ID:               "lead_kopi_05",
				PageID:           "page_kopiseduh",
				UserID:           "usr_owner_kopi",
				Email:            "kevin.roastery@gmail.com",
				Source:           "referral",
				ConsentGiven:     true,
				IPAddress:        "36.85.90.15",
				UserAgent:        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
				SyncedToProvider: true,
				CreatedAt:        time.Now().Add(-5 * 24 * time.Hour),
			},
		}
		db.Create(&sampleLeads)
		log.Println("🌱 [Seeder] Seeded Email Capture config & 5 sample leads for kopiseduh")
	}

	// 6. Seed Promo Codes
	var promoCount int64
	db.Model(&models.PromoCode{}).Count(&promoCount)
	if promoCount == 0 {
		promos := []models.PromoCode{
			{
				ID:              "promo_50",
				Code:            "KLIKINPRO50",
				DiscountPercent: 50,
				Description:     "Diskon 50% untuk langganan bulan pertama",
				MaxUses:         500,
				UsedCount:       24,
				IsActive:        true,
				CreatedAt:       time.Now(),
			},
			{
				ID:              "promo_20",
				Code:            "STARTUP2026",
				DiscountPercent: 20,
				Description:     "Diskon 20% khusus pegiat startup & UMKM",
				MaxUses:         1000,
				UsedCount:       87,
				IsActive:        true,
				CreatedAt:       time.Now(),
			},
			{
				ID:              "promo_free",
				Code:            "FREE1MONTH",
				DiscountPercent: 100,
				Description:     "Gratis 1 bulan paket Klikin Pro",
				MaxUses:         50,
				UsedCount:       12,
				IsActive:        true,
				CreatedAt:       time.Now(),
			},
		}
		db.Create(&promos)
		log.Println("🌱 [Seeder] Seeded 3 promo discount codes")
	}

	// 7. Seed Subscription & Invoices for kopiseduh
	var subCount int64
	db.Model(&models.Subscription{}).Where("user_id = ?", "usr_owner_kopi").Count(&subCount)
	if subCount == 0 {
		now := time.Now()
		periodStart := now.AddDate(0, 0, -10)
		periodEnd := now.AddDate(0, 0, 20)

		sub := models.Subscription{
			ID:                 "sub_kopi_01",
			UserID:             "usr_owner_kopi",
			Plan:               models.PlanPro,
			BillingCycle:       "monthly",
			Status:             models.SubscriptionStatusActive,
			Price:              29000,
			Currency:           "IDR",
			CurrentPeriodStart: periodStart,
			CurrentPeriodEnd:   periodEnd,
			CancelAtPeriodEnd:  false,
			PaymentMethodBrand: "midtrans",
			PaymentMethodLast4: "snap",
			PaymentMethodExp:   "active",
			CreatedAt:          periodStart,
			UpdatedAt:          now,
		}
		db.Create(&sub)

		pastPaid1 := now.AddDate(0, 0, -10)
		pastPaid2 := now.AddDate(0, -1, -10)

		invoices := []models.Invoice{
			{
				ID:             "inv_kopi_02",
				InvoiceNumber:  "INV-2026-0042",
				UserID:         "usr_owner_kopi",
				SubscriptionID: sub.ID,
				PlanName:       "Klikin Pro (Bulanan)",
				BillingCycle:   "monthly",
				Amount:         29000,
				Tax:            3190,
				Total:          32190,
				Status:         "paid",
				BillingReason:  "subscription_cycle",
				PaidAt:         &pastPaid1,
				CreatedAt:      pastPaid1,
			},
			{
				ID:             "inv_kopi_01",
				InvoiceNumber:  "INV-2026-0018",
				UserID:         "usr_owner_kopi",
				SubscriptionID: sub.ID,
				PlanName:       "Klikin Pro (Bulanan)",
				BillingCycle:   "monthly",
				Amount:         29000,
				Tax:            3190,
				Total:          32190,
				Status:         "paid",
				BillingReason:  "subscription_create",
				PaidAt:         &pastPaid2,
				CreatedAt:      pastPaid2,
			},
		}
		db.Create(&invoices)
		log.Println("🌱 [Seeder] Seeded subscription and 2 billing invoices for kopiseduh")
	}

	// 10. Seed In-App Notifications (Readme 4.10)
	var notifCount int64
	db.Model(&models.Notification{}).Where("user_id = ?", "usr_owner_kopi").Count(&notifCount)
	if notifCount == 0 {
		now := time.Now()
		notifs := []models.Notification{
			{
				ID:        "notif_01",
				UserID:    "usr_owner_kopi",
				Title:     "Domain Kustom Aktif",
				Message:   "Domain pribadi kopiseduh.id telah terverifikasi dengan sertifikat SSL aktif.",
				Type:      "domain",
				ActionURL: "#domain",
				IsRead:    false,
				CreatedAt: now.Add(-2 * time.Hour),
			},
			{
				ID:        "notif_02",
				UserID:    "usr_owner_kopi",
				Title:     "Lead Pengunjung Baru",
				Message:   "Pengunjung baru mendaftar newsletter: budi.santoso@gmail.com",
				Type:      "lead",
				ActionURL: "#leads",
				IsRead:    false,
				CreatedAt: now.Add(-6 * time.Hour),
			},
			{
				ID:        "notif_03",
				UserID:    "usr_owner_kopi",
				Title:     "Pembayaran Langganan Berhasil",
				Message:   "Invoice INV-2026-0042 sebesar Rp 54.390 telah lunas melalui kartu utama Anda.",
				Type:      "billing",
				ActionURL: "#billing",
				IsRead:    true,
				CreatedAt: now.AddDate(0, 0, -10),
			},
			{
				ID:        "notif_04",
				UserID:    "usr_owner_kopi",
				Title:     "Selamat Datang di Klikin Pro!",
				Message:   "Nikmati fitur tanpa watermark, analitik mendalam 90 hari, dan domain kustom.",
				Type:      "success",
				ActionURL: "#billing",
				IsRead:    true,
				CreatedAt: now.AddDate(0, -1, 0),
			},
		}
		db.Create(&notifs)
		log.Println("🌱 [Seeder] Seeded initial in-app notifications for kopiseduh")
	}

	// 11. Seed Transactional Email Logs (Readme 4.10)
	var emailLogCount int64
	db.Model(&models.TransactionalEmailLog{}).Where("user_id = ?", "usr_owner_kopi").Count(&emailLogCount)
	if emailLogCount == 0 {
		now := time.Now()
		emailLogs := []models.TransactionalEmailLog{
			{
				ID:        "eml_01",
				UserID:    "usr_owner_kopi",
				Subject:   "Status Domain: kopiseduh.id Berhasil Terverifikasi",
				Recipient: "owner@kopiseduh.id",
				Category:  "domain_status",
				Status:    "delivered",
				SentAt:    now.Add(-2 * time.Hour),
			},
			{
				ID:        "eml_02",
				UserID:    "usr_owner_kopi",
				Subject:   "Bukti Pembayaran & Faktur Resmi Paket Klikin Pro #INV-2026-0042",
				Recipient: "owner@kopiseduh.id",
				Category:  "billing",
				Status:    "delivered",
				SentAt:    now.AddDate(0, 0, -10),
			},
			{
				ID:        "eml_03",
				UserID:    "usr_owner_kopi",
				Subject:   "Konfirmasi Verifikasi Email Akun Klikin Anda",
				Recipient: "owner@kopiseduh.id",
				Category:  "verification",
				Status:    "delivered",
				SentAt:    now.AddDate(0, -1, -5),
			},
			{
				ID:        "eml_04",
				UserID:    "usr_owner_kopi",
				Subject:   "Selamat Datang di Klikin: Mulai Personalisasi Bio Anda",
				Recipient: "owner@kopiseduh.id",
				Category:  "welcome",
				Status:    "delivered",
				SentAt:    now.AddDate(0, -1, -5),
			},
		}
		db.Create(&emailLogs)
		log.Println("🌱 [Seeder] Seeded transactional email audit logs for kopiseduh")
	}

	// 12. Seed FAQs and Help Center (Readme 4.11)
	var faqCount int64
	db.Model(&models.FAQItem{}).Count(&faqCount)
	if faqCount == 0 {
		faqs := []models.FAQItem{
			{
				ID:        "faq_01",
				Category:  "Akun & Profil",
				Question:  "Bagaimana cara mengubah username atau slug halaman bio saya?",
				Answer:    "Anda dapat membuka menu 'Pengaturan Halaman', masukkan slug baru yang diinginkan, lalu klik Simpan. Sistem akan memvalidasi ketersediaan slug secara otomatis.",
				OrderNum:  1,
				CreatedAt: time.Now(),
			},
			{
				ID:        "faq_02",
				Category:  "Domain & DNS",
				Question:  "Berapa lama proses propagasi DNS saat menghubungkan domain kustom?",
				Answer:    "Propagasi DNS umumnya memakan waktu 5-30 menit, tergantung provider domain Anda (seperti Niagahoster, Cloudflare, atau Rumahweb). Sertifikat SSL akan terpasang otomatis setelah verifikasi berhasil.",
				OrderNum:  2,
				CreatedAt: time.Now(),
			},
			{
				ID:        "faq_03",
				Category:  "Langganan & Pembayaran",
				Question:  "Apa yang terjadi jika saya downgrade atau membatalkan langganan Klikin Pro?",
				Answer:    "Layanan Pro Anda tetap aktif sepenuhnya hingga akhir masa aktif yang telah dibayar (Grace Period). Tautan dan data leads Anda tidak akan dihapus.",
				OrderNum:  3,
				CreatedAt: time.Now(),
			},
			{
				ID:        "faq_04",
				Category:  "Analitik & Tracking",
				Question:  "Di mana saya bisa memasang Meta Pixel dan Google Analytics 4 (GA4)?",
				Answer:    "Buka menu 'Pengaturan Halaman', gulir ke bagian 'Pixel Tracking & Analitik'. Masukkan Measurement ID GA4 (G-XXXX) atau ID Meta Pixel Anda, lalu simpan perubahan.",
				OrderNum:  4,
				CreatedAt: time.Now(),
			},
			{
				ID:        "faq_05",
				Category:  "Email Leads",
				Question:  "Bisakah saya mengekspor data email leads ke format CSV?",
				Answer:    "Tentu saja! Masuk ke menu 'Email Leads', lalu klik tombol 'Ekspor CSV' di pojok kanan atas tabel kontak.",
				OrderNum:  5,
				CreatedAt: time.Now(),
			},
		}
		db.Create(&faqs)
		log.Println("🌱 [Seeder] Seeded knowledge base FAQ items")
	}

	// 13. Seed Sample Support Ticket & Message (Readme 4.11)
	var ticketCount int64
	db.Model(&models.SupportTicket{}).Where("user_id = ?", "usr_owner_kopi").Count(&ticketCount)
	if ticketCount == 0 {
		now := time.Now()
		tkt := models.SupportTicket{
			ID:            "tkt_sample_01",
			UserID:        "usr_owner_kopi",
			TicketNumber:  "TKT-2026-0102",
			Subject:       "Pertanyaan seputar penempelan TikTok Pixel",
			Category:      "feature",
			Priority:      "medium",
			Status:        models.TicketStatusResolved,
			Description:   "Halo tim Klikin, apakah penempelan TikTok Pixel sudah mendukung event ViewContent dan Click secara otomatis?",
			AttachmentURL: "",
			CreatedAt:     now.AddDate(0, 0, -3),
			UpdatedAt:     now.AddDate(0, 0, -2),
		}
		db.Create(&tkt)

		msgs := []models.TicketMessage{
			{
				ID:         "msg_s01",
				TicketID:   tkt.ID,
				SenderType: "user",
				SenderName: "Kopi Seduh Nusantara",
				Message:    "Halo tim Klikin, apakah penempelan TikTok Pixel sudah mendukung event ViewContent dan Click secara otomatis?",
				CreatedAt:  now.AddDate(0, 0, -3),
			},
			{
				ID:         "msg_s02",
				TicketID:   tkt.ID,
				SenderType: "support",
				SenderName: "Dina - Tim Support Klikin",
				Message:    "Halo Kak! Ya, integrasi TikTok Pixel di menu Pengaturan Halaman sudah otomatis melacak event ViewContent saat bio dikunjungi dan event Click ketika pengunjung menekan salah satu tautan Anda. Terima kasih!",
				CreatedAt:  now.AddDate(0, 0, -2),
			},
		}
		db.Create(&msgs)
		log.Println("🌱 [Seeder] Seeded sample resolved support ticket with messages")
	}

	// 14. Seed Infrastructure & Operational Costs (Readme 3.7)
	var expenseCount int64
	db.Model(&models.InfrastructureCost{}).Count(&expenseCount)
	if expenseCount == 0 {
		now := time.Now()
		currentMonth := now.Format("2006-01")
		prevMonth1 := now.AddDate(0, -1, 0).Format("2006-01")
		prevMonth2 := now.AddDate(0, -2, 0).Format("2006-01")

		sampleExpenses := []models.InfrastructureCost{
			{
				ID:           "cost_infra_01",
				Category:     models.ExpenseCategoryDatabase,
				Title:        "Supabase Managed PostgreSQL Compute & Storage",
				Vendor:       "Supabase Inc.",
				Amount:       385000,
				BillingCycle: "monthly",
				MonthPeriod:  currentMonth,
				IncurredDate: now.AddDate(0, 0, -18),
				Notes:        "Dedicated compute 2 vCPU, 4GB RAM, connection pooling & auto backup.",
				CreatedBy:    "usr_superadmin_01",
				CreatedAt:    now.AddDate(0, 0, -18),
				UpdatedAt:    now.AddDate(0, 0, -18),
			},
			{
				ID:           "cost_infra_02",
				Category:     models.ExpenseCategoryServerVPS,
				Title:        "Cloudflare Enterprise Edge & Worker Proxies",
				Vendor:       "Cloudflare",
				Amount:       310000,
				BillingCycle: "monthly",
				MonthPeriod:  currentMonth,
				IncurredDate: now.AddDate(0, 0, -17),
				Notes:        "Global edge caching, DDoS protection, edge routing latency under 15ms.",
				CreatedBy:    "usr_superadmin_01",
				CreatedAt:    now.AddDate(0, 0, -17),
				UpdatedAt:    now.AddDate(0, 0, -17),
			},
			{
				ID:           "cost_infra_03",
				Category:     models.ExpenseCategoryDomainDNS,
				Title:        "Custom Domain DNS & Wildcard SSL Automation",
				Vendor:       "Cloudflare for SaaS",
				Amount:       145000,
				BillingCycle: "monthly",
				MonthPeriod:  currentMonth,
				IncurredDate: now.AddDate(0, 0, -15),
				Notes:        "Automated custom domain SSL certificate provisioning for Pro subscribers.",
				CreatedBy:    "usr_superadmin_01",
				CreatedAt:    now.AddDate(0, 0, -15),
				UpdatedAt:    now.AddDate(0, 0, -15),
			},
			{
				ID:           "cost_infra_04",
				Category:     models.ExpenseCategoryEmailSMTP,
				Title:        "Resend Pro Transactional Email Gateway",
				Vendor:       "Resend",
				Amount:       155000,
				BillingCycle: "monthly",
				MonthPeriod:  currentMonth,
				IncurredDate: now.AddDate(0, 0, -14),
				Notes:        "Email verification, billing receipts, domain notifications & password reset.",
				CreatedBy:    "usr_superadmin_01",
				CreatedAt:    now.AddDate(0, 0, -14),
				UpdatedAt:    now.AddDate(0, 0, -14),
			},
			{
				ID:           "cost_infra_05",
				Category:     models.ExpenseCategoryPaymentFee,
				Title:        "Midtrans & QRIS Payment Gateway MDR Interchange",
				Vendor:       "Midtrans / Bank Indonesia",
				Amount:       48500,
				BillingCycle: "monthly",
				MonthPeriod:  currentMonth,
				IncurredDate: now.AddDate(0, 0, -10),
				Notes:        "0.7% QRIS fee and IDR 4.000 VA interchange per settled invoice.",
				CreatedBy:    "usr_superadmin_01",
				CreatedAt:    now.AddDate(0, 0, -10),
				UpdatedAt:    now.AddDate(0, 0, -10),
			},
			{
				ID:           "cost_infra_06",
				Category:     models.ExpenseCategorySecuritySSL,
				Title:        "Sentry Application Performance & Error Monitoring",
				Vendor:       "Sentry.io",
				Amount:       180000,
				BillingCycle: "monthly",
				MonthPeriod:  currentMonth,
				IncurredDate: now.AddDate(0, 0, -8),
				Notes:        "Full-stack APM, tracing, and alert dispatching.",
				CreatedBy:    "usr_superadmin_01",
				CreatedAt:    now.AddDate(0, 0, -8),
				UpdatedAt:    now.AddDate(0, 0, -8),
			},
			{
				ID:           "cost_infra_prev1_01",
				Category:     models.ExpenseCategoryDatabase,
				Title:        "Supabase Managed PostgreSQL Compute",
				Vendor:       "Supabase Inc.",
				Amount:       385000,
				BillingCycle: "monthly",
				MonthPeriod:  prevMonth1,
				IncurredDate: now.AddDate(0, -1, -15),
				Notes:        "Database monthly operational cost.",
				CreatedBy:    "usr_superadmin_01",
				CreatedAt:    now.AddDate(0, -1, -15),
				UpdatedAt:    now.AddDate(0, -1, -15),
			},
			{
				ID:           "cost_infra_prev1_02",
				Category:     models.ExpenseCategoryServerVPS,
				Title:        "Cloudflare Edge Hosting & Bandwidth",
				Vendor:       "Cloudflare",
				Amount:       310000,
				BillingCycle: "monthly",
				MonthPeriod:  prevMonth1,
				IncurredDate: now.AddDate(0, -1, -15),
				Notes:        "Edge CDN and compute.",
				CreatedBy:    "usr_superadmin_01",
				CreatedAt:    now.AddDate(0, -1, -15),
				UpdatedAt:    now.AddDate(0, -1, -15),
			},
			{
				ID:           "cost_infra_prev2_01",
				Category:     models.ExpenseCategoryDatabase,
				Title:        "Supabase Managed PostgreSQL Compute",
				Vendor:       "Supabase Inc.",
				Amount:       385000,
				BillingCycle: "monthly",
				MonthPeriod:  prevMonth2,
				IncurredDate: now.AddDate(0, -2, -15),
				Notes:        "Database monthly operational cost.",
				CreatedBy:    "usr_superadmin_01",
				CreatedAt:    now.AddDate(0, -2, -15),
				UpdatedAt:    now.AddDate(0, -2, -15),
			},
		}
		db.Create(&sampleExpenses)
		log.Println("🌱 [Seeder] Seeded infrastructure and operational costs")
	}

	// 15. Ensure existing invoices have PaymentChannel populated
	db.Model(&models.Invoice{}).Where("payment_channel = '' OR payment_channel IS NULL").Update("payment_channel", "qris")

	// 16. Seed Support Canned Responses (Readme 3.8)
	var cannedCount int64
	db.Model(&models.CannedResponse{}).Count(&cannedCount)
	if cannedCount == 0 {
		now := time.Now()
		canned := []models.CannedResponse{
			{
				ID:        "can_01",
				Title:     "Salam Pembuka Ramah",
				Category:  "general",
				Shortcut:  "/halo",
				Content:   "Halo Kak! Terima kasih telah menghubungi layanan bantuan Klikin. Ada yang bisa kami bantu terkait akun atau halaman bio Anda hari ini?",
				CreatedBy: "admin@klikin.id",
				CreatedAt: now.AddDate(0, 0, -10),
				UpdatedAt: now.AddDate(0, 0, -10),
			},
			{
				ID:        "can_02",
				Title:     "Panduan CNAME Domain Kustom",
				Category:  "domain",
				Shortcut:  "/dns",
				Content:   "Halo Kak! Untuk menghubungkan domain kustom ke Klikin, silakan buka DNS Management penyedia domain Anda dan tambahkan CNAME Record: Host: @ (atau subdomain pilihan) menuju target: cname.klikin.id. Propagasi DNS umumnya memakan waktu antara 15 menit hingga maksimal 24 jam.",
				CreatedBy: "admin@klikin.id",
				CreatedAt: now.AddDate(0, 0, -9),
				UpdatedAt: now.AddDate(0, 0, -9),
			},
			{
				ID:        "can_03",
				Title:     "Informasi Faktur & Tagihan",
				Category:  "billing",
				Shortcut:  "/billing",
				Content:   "Halo Kak! Riwayat tagihan dan invoice resmi berlangganan Klikin Pro dapat diunduh langsung melalui dashboard di menu Pengaturan Akun > Tagihan & Invoice. Jika ada kendala pembayaran otomatis, sistem kami siap membantu verifikasi manual.",
				CreatedBy: "admin@klikin.id",
				CreatedAt: now.AddDate(0, 0, -8),
				UpdatedAt: now.AddDate(0, 0, -8),
			},
			{
				ID:        "can_04",
				Title:     "Instruksi Reset Password",
				Category:  "technical",
				Shortcut:  "/reset-pass",
				Content:   "Halo Kak! Demi keamanan akun Anda, silakan gunakan tautan Lupa Password di halaman masuk Klikin untuk menerima tautan pembaruan kata sandi baru ke email yang terdaftar.",
				CreatedBy: "admin@klikin.id",
				CreatedAt: now.AddDate(0, 0, -7),
				UpdatedAt: now.AddDate(0, 0, -7),
			},
			{
				ID:        "can_05",
				Title:     "Eksklusif Fitur Klikin Pro",
				Category:  "feature",
				Shortcut:  "/upgrade-pro",
				Content:   "Halo Kak! Fitur domain kustom mandiri, penghapusan watermark Klikin, dan analitik pengunjung mendalam tersedia secara eksklusif untuk pengguna paket Klikin Pro. Anda dapat melakukan aktivasi instan melalui menu Langganan.",
				CreatedBy: "admin@klikin.id",
				CreatedAt: now.AddDate(0, 0, -6),
				UpdatedAt: now.AddDate(0, 0, -6),
			},
		}
		db.Create(&canned)
		log.Println("🌱 [Seeder] Seeded support canned responses")
	}

	// 17. Seed Additional Support Tickets for Realistic Inbox (Readme 3.8)
	var totalTickets int64
	db.Model(&models.SupportTicket{}).Count(&totalTickets)
	if totalTickets < 4 {
		now := time.Now()
		tickets := []models.SupportTicket{
			{
				ID:           "tkt_sample_02",
				UserID:       "usr_owner_kopi",
				TicketNumber: "TKT-2026-0215",
				Subject:      "Kendala propagasi SSL pada domain kedai-kopi.com",
				Category:     "domain",
				Priority:     "high",
				Status:       models.TicketStatusInProgress,
				Description:  "Halo, saya sudah update CNAME record sejak kemarin sore tapi status SSL di dashboard Klikin masih menunjukkan tanda peringatan kuning.",
				CreatedAt:    now.Add(-6 * time.Hour),
				UpdatedAt:    now.Add(-2 * time.Hour),
			},
			{
				ID:           "tkt_sample_03",
				UserID:       "usr_owner_creator",
				TicketNumber: "TKT-2026-0301",
				Subject:      "Permintaan faktur pajak untuk pembayaran langganan tahunan",
				Category:     "billing",
				Priority:     "medium",
				Status:       models.TicketStatusOpen,
				Description:  "Selamat siang tim Klikin, kami membutuhkan faktur pajak perusahaan untuk pembayaran langganan Pro tahunan kami yang baru saja berhasil dibayarkan.",
				CreatedAt:    now.Add(-3 * time.Hour),
				UpdatedAt:    now.Add(-3 * time.Hour),
			},
			{
				ID:           "tkt_sample_04",
				UserID:       "usr_owner_creator",
				TicketNumber: "TKT-2026-0302",
				Subject:      "Saran penambahan blok integrasi Spotify Podcast",
				Category:     "feature",
				Priority:     "low",
				Status:       models.TicketStatusOpen,
				Description:  "Apakah ada rencana menambahkan widget pemutar audio langsung dari Spotify untuk halaman bio kreator?",
				CreatedAt:    now.Add(-1 * time.Hour),
				UpdatedAt:    now.Add(-1 * time.Hour),
			},
			{
				ID:           "tkt_sample_05",
				UserID:       "usr_owner_kopi",
				TicketNumber: "TKT-2026-0188",
				Subject:      "Gagal upload favicon format ico",
				Category:     "bug",
				Priority:     "urgent",
				Status:       models.TicketStatusResolved,
				Description:  "Saat upload icon favicon format .ico muncul notifikasi format tidak didukung, padahal di petunjuk tertulis boleh format ico.",
				CreatedAt:    now.AddDate(0, 0, -5),
				UpdatedAt:    now.AddDate(0, 0, -4),
			},
		}

		for _, t := range tickets {
			var exists int64
			db.Model(&models.SupportTicket{}).Where("id = ?", t.ID).Count(&exists)
			if exists == 0 {
				db.Create(&t)
			}
		}

		// Messages for tkt_sample_02
		var msg02Count int64
		db.Model(&models.TicketMessage{}).Where("ticket_id = ?", "tkt_sample_02").Count(&msg02Count)
		if msg02Count == 0 {
			msgs02 := []models.TicketMessage{
				{
					ID:         "msg_s02_1",
					TicketID:   "tkt_sample_02",
					SenderType: "user",
					SenderName: "Kopi Seduh Nusantara",
					Message:    "Halo, saya sudah update CNAME record sejak kemarin sore tapi status SSL di dashboard Klikin masih menunjukkan tanda peringatan kuning.",
					CreatedAt:  now.Add(-6 * time.Hour),
				},
				{
					ID:         "msg_s02_2",
					TicketID:   "tkt_sample_02",
					SenderType: "support",
					SenderName: "Super Administrator",
					Message:    "Halo Kak! Kami sedang melakukan pengecekan DNS lookup ke nameserver Cloudflare domain Anda. Sertifikat SSL Let's Encrypt sedang dalam antrean penerbitan.",
					CreatedAt:  now.Add(-2 * time.Hour),
				},
			}
			db.Create(&msgs02)
		}

		// Messages for tkt_sample_03
		var msg03Count int64
		db.Model(&models.TicketMessage{}).Where("ticket_id = ?", "tkt_sample_03").Count(&msg03Count)
		if msg03Count == 0 {
			msg03 := models.TicketMessage{
				ID:         "msg_s03_1",
				TicketID:   "tkt_sample_03",
				SenderType: "user",
				SenderName: "Sarah Alatas",
				Message:    "Selamat siang tim Klikin, kami membutuhkan faktur pajak perusahaan untuk pembayaran langganan Pro tahunan kami yang baru saja berhasil dibayarkan.",
				CreatedAt:  now.Add(-3 * time.Hour),
			}
			db.Create(&msg03)
		}

		// Messages for tkt_sample_04
		var msg04Count int64
		db.Model(&models.TicketMessage{}).Where("ticket_id = ?", "tkt_sample_04").Count(&msg04Count)
		if msg04Count == 0 {
			msg04 := models.TicketMessage{
				ID:         "msg_s04_1",
				TicketID:   "tkt_sample_04",
				SenderType: "user",
				SenderName: "Sarah Alatas",
				Message:    "Apakah ada rencana menambahkan widget pemutar audio langsung dari Spotify untuk halaman bio kreator?",
				CreatedAt:  now.Add(-1 * time.Hour),
			}
			db.Create(&msg04)
		}

		log.Println("🌱 [Seeder] Seeded realistic support ticket threads")
	}

	// 18. Seed Broadcast Announcements & Communication Logs (Readme 3.8)
	var bcCount int64
	db.Model(&models.BroadcastAnnouncement{}).Count(&bcCount)
	if bcCount == 0 {
		now := time.Now()
		broadcasts := []models.BroadcastAnnouncement{
			{
				ID:            "bc_01",
				Title:         "Pembaruan Infrastruktur Domain & Kecepatan CDN Global",
				TargetSegment: "all",
				Channel:       "in_app",
				Message:       "Kami telah meningkatkan routing edge network Klikin untuk akses 40% lebih cepat bagi pengunjung halaman bio Anda di seluruh Indonesia.",
				ActionURL:     "/settings/domain",
				SentCount:     145,
				Status:        "sent",
				CreatedBy:     "admin@klikin.id",
				SentAt:        now.AddDate(0, 0, -4),
				CreatedAt:     now.AddDate(0, 0, -4),
			},
			{
				ID:            "bc_02",
				Title:         "Fitur Baru: Integrasi Meta Pixel & TikTok Pixel Otomatis",
				TargetSegment: "pro",
				Channel:       "both",
				Message:       "Kini pengguna Klikin Pro dapat menautkan Pixel periklanan tanpa koding untuk melacak konversi pengunjung secara real-time.",
				ActionURL:     "/settings/page-settings",
				SentCount:     88,
				Status:        "sent",
				CreatedBy:     "admin@klikin.id",
				SentAt:        now.AddDate(0, 0, -2),
				CreatedAt:     now.AddDate(0, 0, -2),
			},
		}
		db.Create(&broadcasts)

		commLogs := []models.CommunicationAuditLog{
			{
				ID:          "comm_sample_01",
				ActionType:  "broadcast",
				Recipient:   "Segment: all (145 penerima)",
				TargetID:    "bc_01",
				Subject:     "Pembaruan Infrastruktur Domain & Kecepatan CDN Global",
				Channel:     "in_app",
				Status:      "delivered",
				AdminEmail:  "admin@klikin.id",
				DetailsJSON: `{"recipients_count":145,"target_segment":"all"}`,
				CreatedAt:   now.AddDate(0, 0, -4),
			},
			{
				ID:          "comm_sample_02",
				ActionType:  "broadcast",
				Recipient:   "Segment: pro (88 penerima)",
				TargetID:    "bc_02",
				Subject:     "Fitur Baru: Integrasi Meta Pixel & TikTok Pixel Otomatis",
				Channel:     "both",
				Status:      "delivered",
				AdminEmail:  "admin@klikin.id",
				DetailsJSON: `{"recipients_count":88,"target_segment":"pro"}`,
				CreatedAt:   now.AddDate(0, 0, -2),
			},
			{
				ID:          "comm_sample_03",
				ActionType:  "ticket_reply",
				Recipient:   "usr_owner_kopi",
				TargetID:    "tkt_sample_02",
				Subject:     "Kendala propagasi SSL pada domain kedai-kopi.com",
				Channel:     "dashboard_thread",
				Status:      "delivered",
				AdminEmail:  "admin@klikin.id",
				DetailsJSON: `{"ticket_number":"TKT-2026-0215"}`,
				CreatedAt:   now.Add(-2 * time.Hour),
			},
		}
		db.Create(&commLogs)
		log.Println("🌱 [Seeder] Seeded broadcast announcements and communication audit logs")
	}

	// 19. Seed Security & Audit Data (Readme 3.10)
	var policyCount int64
	db.Model(&models.SecurityPolicy{}).Count(&policyCount)
	if policyCount == 0 {
		defaultPolicy := models.SecurityPolicy{
			ID:                      "sec_policy_default",
			Require2FAForSuperAdmin: true,
			MaxFailedLoginAttempts:  5,
			RateLimitRequestsPerMin: 120,
			SessionTimeoutHours:     24,
			AutoIPBlockOnBruteForce: true,
			UpdatedAt:               time.Now(),
		}
		db.Create(&defaultPolicy)
		log.Println("🌱 [Seeder] Seeded default security policy")
	}

	var auditCount int64
	db.Model(&models.PlatformAuditLog{}).Count(&auditCount)
	if auditCount == 0 {
		now := time.Now()
		audits := []models.PlatformAuditLog{
			{
				ID:          "audit_01",
				ActorID:     "usr_superadmin_01",
				ActorEmail:  "admin@klikin.id",
				ActorRole:   "SUPER_ADMIN",
				Action:      "SECURITY_POLICY_UPDATED",
				TargetType:  "security",
				TargetID:    "sec_policy_default",
				IPAddress:   "127.0.0.1",
				DetailsJSON: `{"enforce_2fa":true,"session_timeout_hours":24}`,
				CreatedAt:   now.Add(-24 * time.Hour),
			},
			{
				ID:          "audit_02",
				ActorID:     "usr_superadmin_01",
				ActorEmail:  "admin@klikin.id",
				ActorRole:   "SUPER_ADMIN",
				Action:      "IP_BLACKLISTED",
				TargetType:  "security",
				TargetID:    "198.51.100.44",
				IPAddress:   "127.0.0.1",
				DetailsJSON: `{"reason":"Repeated unauthorized auth probing","hits":42}`,
				CreatedAt:   now.Add(-18 * time.Hour),
			},
			{
				ID:          "audit_03",
				ActorID:     "usr_superadmin_01",
				ActorEmail:  "admin@klikin.id",
				ActorRole:   "SUPER_ADMIN",
				Action:      "BACKUP_TRIGGERED",
				TargetType:  "backup",
				TargetID:    "bkp_20261022_manual",
				IPAddress:   "127.0.0.1",
				DetailsJSON: `{"backup_type":"manual","scope":"full_database"}`,
				CreatedAt:   now.Add(-12 * time.Hour),
			},
			{
				ID:          "audit_04",
				ActorID:     "usr_superadmin_01",
				ActorEmail:  "admin@klikin.id",
				ActorRole:   "SUPER_ADMIN",
				Action:      "BROADCAST_SENT",
				TargetType:  "broadcast",
				TargetID:    "bc_02",
				IPAddress:   "127.0.0.1",
				DetailsJSON: `{"title":"Fitur Baru: Integrasi Meta Pixel","recipients":88}`,
				CreatedAt:   now.Add(-6 * time.Hour),
			},
			{
				ID:          "audit_05",
				ActorID:     "usr_superadmin_01",
				ActorEmail:  "admin@klikin.id",
				ActorRole:   "SUPER_ADMIN",
				Action:      "SUPPORT_TICKET_REPLIED",
				TargetType:  "support",
				TargetID:    "tkt_sample_02",
				IPAddress:   "127.0.0.1",
				DetailsJSON: `{"ticket_number":"TKT-2026-0215","status":"in_progress"}`,
				CreatedAt:   now.Add(-2 * time.Hour),
			},
		}
		db.Create(&audits)
		log.Println("🌱 [Seeder] Seeded platform audit logs")
	}

	var loginCount int64
	db.Model(&models.LoginHistoryLog{}).Count(&loginCount)
	if loginCount == 0 {
		now := time.Now()
		logins := []models.LoginHistoryLog{
			{
				ID:            "log_login_01",
				UserID:        "usr_superadmin_01",
				UserEmail:     "admin@klikin.id",
				IPAddress:     "127.0.0.1",
				UserAgent:     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				DeviceType:    "desktop",
				Location:      "Jakarta, Indonesia",
				Status:        "success",
				FailureReason: "",
				CreatedAt:     now.Add(-30 * time.Minute),
			},
			{
				ID:            "log_login_02",
				UserID:        "usr_owner_kopi",
				UserEmail:     "owner@klikin.id",
				IPAddress:     "180.244.135.22",
				UserAgent:     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
				DeviceType:    "desktop",
				Location:      "Bandung, Indonesia",
				Status:        "success",
				FailureReason: "",
				CreatedAt:     now.Add(-2 * time.Hour),
			},
			{
				ID:            "log_login_03",
				UserID:        "",
				UserEmail:     "unknown.attacker@protonmail.com",
				IPAddress:     "198.51.100.44",
				UserAgent:     "Python-requests/2.31.0",
				DeviceType:    "desktop",
				Location:      "Frankfurt, Germany",
				Status:        "failed",
				FailureReason: "User not found or invalid credentials",
				CreatedAt:     now.Add(-5 * time.Hour),
			},
			{
				ID:            "log_login_04",
				UserID:        "usr_owner_creator",
				UserEmail:     "creator@klikin.id",
				IPAddress:     "114.122.38.10",
				UserAgent:     "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
				DeviceType:    "mobile",
				Location:      "Surabaya, Indonesia",
				Status:        "success",
				FailureReason: "",
				CreatedAt:     now.Add(-7 * time.Hour),
			},
			{
				ID:            "log_login_05",
				UserID:        "",
				UserEmail:     "root@klikin.id",
				IPAddress:     "198.51.100.44",
				UserAgent:     "curl/8.4.0",
				DeviceType:    "desktop",
				Location:      "Frankfurt, Germany",
				Status:        "failed",
				FailureReason: "Brute-force limit triggered",
				CreatedAt:     now.Add(-8 * time.Hour),
			},
		}
		db.Create(&logins)
		log.Println("🌱 [Seeder] Seeded login history logs")
	}

	var errLogCount int64
	db.Model(&models.AppErrorLog{}).Count(&errLogCount)
	if errLogCount == 0 {
		now := time.Now()
		resTime := now.Add(-3 * time.Hour)
		errors := []models.AppErrorLog{
			{
				ID:          "err_log_01",
				Severity:    "warning",
				Message:     "Rate limit threshold 80% reached for IP 114.122.38.10",
				StackTrace:  "middleware.RateLimiter() -> controllers.PublicPageView() at ratelimit.go:58",
				Endpoint:    "/api/v1/pages/kopiseduh",
				Method:      "GET",
				StatusCode:  429,
				UserID:      "",
				IPAddress:   "114.122.38.10",
				Resolved:    true,
				ResolvedBy:  "admin@klikin.id",
				ResolvedAt:  &resTime,
				CreatedAt:   now.Add(-4 * time.Hour),
			},
			{
				ID:          "err_log_02",
				Severity:    "error",
				Message:     "DNS CNAME lookup timed out after 3000ms for custom domain kedai-kopi.com",
				StackTrace:  "services.VerifyDNS() at domain_service.go:142\nnet.LookupCNAME(\"kedai-kopi.com\")\ncontext deadline exceeded",
				Endpoint:    "/api/v1/domains/verify",
				Method:      "POST",
				StatusCode:  504,
				UserID:      "usr_owner_kopi",
				IPAddress:   "180.244.135.22",
				Resolved:    false,
				CreatedAt:   now.Add(-2 * time.Hour),
			},
			{
				ID:          "err_log_03",
				Severity:    "critical",
				Message:     "Midtrans webhook signature validation mismatch for order ORDER-KLIKIN-8891",
				StackTrace:  "controllers.MidtransWebhook() at payment_controller.go:88\ncrypto.SHA512 mismatch: computed hash does not match payload signature",
				Endpoint:    "/api/v1/webhooks/midtrans",
				Method:      "POST",
				StatusCode:  400,
				UserID:      "",
				IPAddress:   "103.208.23.6",
				Resolved:    false,
				CreatedAt:   now.Add(-45 * time.Minute),
			},
		}
		db.Create(&errors)
		log.Println("🌱 [Seeder] Seeded application error logs")
	}

	var blacklistCount int64
	db.Model(&models.BlacklistedIP{}).Count(&blacklistCount)
	if blacklistCount == 0 {
		now := time.Now()
		lastHit := now.Add(-30 * time.Minute)
		expiry := now.AddDate(0, 1, 0)
		blacklists := []models.BlacklistedIP{
			{
				ID:        "bl_ip_01",
				IPAddress: "198.51.100.44",
				Reason:    "Brute force credential stuffing attacks on /api/auth/login",
				TotalHits: 142,
				LastHitAt: &lastHit,
				BlockedAt: now.Add(-18 * time.Hour),
				ExpiresAt: &expiry,
				IsActive:  true,
				CreatedBy: "admin@klikin.id",
				CreatedAt: now.Add(-18 * time.Hour),
				UpdatedAt: now.Add(-30 * time.Minute),
			},
			{
				ID:        "bl_ip_02",
				IPAddress: "203.0.113.88",
				Reason:    "Malicious web vulnerability scanning and path traversal attempts",
				TotalHits: 29,
				LastHitAt: &lastHit,
				BlockedAt: now.Add(-48 * time.Hour),
				ExpiresAt: nil,
				IsActive:  true,
				CreatedBy: "admin@klikin.id",
				CreatedAt: now.Add(-48 * time.Hour),
				UpdatedAt: now.Add(-2 * time.Hour),
			},
		}
		db.Create(&blacklists)
		log.Println("🌱 [Seeder] Seeded blacklisted IP addresses")
	}

	var sessionCount int64
	db.Model(&models.AdminSession{}).Count(&sessionCount)
	if sessionCount == 0 {
		now := time.Now()
		sessions := []models.AdminSession{
			{
				ID:           "sess_admin_current",
				AdminID:      "usr_superadmin_01",
				AdminEmail:   "admin@klikin.id",
				TokenSnippet: "eyJhbGciOi...9aB1",
				IPAddress:    "127.0.0.1",
				UserAgent:    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
				Device:       "macOS / Chrome 120 (Sesi Ini)",
				LastActiveAt: now,
				ExpiresAt:    now.Add(24 * time.Hour),
				IsRevoked:    false,
				CreatedAt:    now.Add(-2 * time.Hour),
			},
			{
				ID:           "sess_admin_secondary",
				AdminID:      "usr_superadmin_01",
				AdminEmail:   "admin@klikin.id",
				TokenSnippet: "eyJhbGciOi...k8X2",
				IPAddress:    "180.244.135.22",
				UserAgent:    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) Mobile/15E148",
				Device:       "iPhone 15 Pro / Safari Mobile",
				LastActiveAt: now.Add(-5 * time.Hour),
				ExpiresAt:    now.Add(19 * time.Hour),
				IsRevoked:    false,
				CreatedAt:    now.Add(-5 * time.Hour),
			},
		}
		db.Create(&sessions)
		log.Println("🌱 [Seeder] Seeded active admin sessions")
	}

	var backupCount int64
	db.Model(&models.DataBackupRecord{}).Count(&backupCount)
	if backupCount == 0 {
		now := time.Now()
		backups := []models.DataBackupRecord{
			{
				ID:            "bkp_20261020_auto",
				BackupName:    "klikin-backup-scheduled-20261020.sql.gz",
				BackupType:    "scheduled",
				FileSizeBytes: 14285700,
				Status:        "completed",
				DownloadURL:   "/api/admin/security/backups/bkp_20261020_auto/download",
				TriggeredBy:   "system_cron",
				Notes:         "Daily automated cloud snapshot backup",
				CreatedAt:     now.AddDate(0, 0, -2),
			},
			{
				ID:            "bkp_20261022_manual",
				BackupName:    "klikin-backup-manual-pre-migration.sql.gz",
				BackupType:    "manual",
				FileSizeBytes: 15124000,
				Status:        "completed",
				DownloadURL:   "/api/admin/security/backups/bkp_20261022_manual/download",
				TriggeredBy:   "admin@klikin.id",
				Notes:         "Manual schema & transactional data export by Super Admin",
				CreatedAt:     now.Add(-12 * time.Hour),
			},
		}
		db.Create(&backups)
		log.Println("🌱 [Seeder] Seeded data backup records")
	}

	return nil
}
