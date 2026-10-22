package config

import (
	"log"
	"strconv"
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
			Price:              49000,
			Currency:           "IDR",
			CurrentPeriodStart: periodStart,
			CurrentPeriodEnd:   periodEnd,
			CancelAtPeriodEnd:  false,
			PaymentMethodBrand: "mastercard",
			PaymentMethodLast4: "4242",
			PaymentMethodExp:   "12/28",
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
				Amount:         49000,
				Tax:            5390,
				Total:          54390,
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
				Amount:         49000,
				Tax:            5390,
				Total:          54390,
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
				Subject:   "Selamat Datang di Klikin — Mulai Personalisasi Bio Anda",
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
				SenderName: "Dina — Tim Support Klikin",
				Message:    "Halo Kak! Ya, integrasi TikTok Pixel di menu Pengaturan Halaman sudah otomatis melacak event ViewContent saat bio dikunjungi dan event Click ketika pengunjung menekan salah satu tautan Anda. Terima kasih!",
				CreatedAt:  now.AddDate(0, 0, -2),
			},
		}
		db.Create(&msgs)
		log.Println("🌱 [Seeder] Seeded sample resolved support ticket with messages")
	}

	return nil
}
