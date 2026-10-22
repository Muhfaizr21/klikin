package models

import (
	"time"

	"gorm.io/gorm"
)

// PlatformSetting represents global system configuration for Klikin (Section 3.9)
type PlatformSetting struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// 1. Umum & Pemeliharaan
	PlatformName       string `gorm:"size:100;default:'Klikin'" json:"platform_name"`
	PlatformTagline    string `gorm:"size:255;default:'Satu Link untuk Semua Channel Jualan & Konten Anda'" json:"platform_tagline"`
	LogoURL            string `gorm:"size:500;default:''" json:"logo_url"`
	FaviconURL         string `gorm:"size:500;default:''" json:"favicon_url"`
	MaintenanceMode    bool   `gorm:"default:false" json:"maintenance_mode"`
	MaintenanceNotice  string `gorm:"type:text;default:'Sistem Klikin sedang dalam pemeliharaan berkala untuk peningkatan performa. Silakan coba kembali beberapa saat lagi.'" json:"maintenance_notice"`
	DefaultLanguage    string `gorm:"size:10;default:'id'" json:"default_language"`

	// 2. Trial & Harga Paket
	TrialDurationDays      int    `gorm:"default:14" json:"trial_duration_days"`
	ProMonthlyPrice        int64  `gorm:"default:29000" json:"pro_monthly_price"`
	ProYearlyPrice         int64  `gorm:"default:290000" json:"pro_yearly_price"`
	Currency               string `gorm:"size:10;default:'IDR'" json:"currency"`
	FreeMaxLinks           int    `gorm:"default:5" json:"free_max_links"`
	ProMaxLinks            int    `gorm:"default:-1" json:"pro_max_links"` // -1 represents unlimited
	FreeAllowCustomDomain  bool   `gorm:"default:false" json:"free_allow_custom_domain"`
	ProAllowCustomDomain   bool   `gorm:"default:true" json:"pro_allow_custom_domain"`
	FreeShowBadge          bool   `gorm:"default:true" json:"free_show_badge"`
	ProShowBadge           bool   `gorm:"default:false" json:"pro_show_badge"`

	// 3. Email (SMTP Transaksional)
	SMTPHost       string `gorm:"size:255;default:'smtp.resend.com'" json:"smtp_host"`
	SMTPPort       int    `gorm:"default:587" json:"smtp_port"`
	SMTPUsername   string `gorm:"size:255;default:'resend'" json:"smtp_username"`
	SMTPPassword   string `gorm:"size:255;default:'re_secret_key'" json:"smtp_password"`
	SMTPFromEmail  string `gorm:"size:255;default:'noreply@klikin.id'" json:"smtp_from_email"`
	SMTPFromName   string `gorm:"size:100;default:'Klikin Notification'" json:"smtp_from_name"`
	SMTPEncryption string `gorm:"size:20;default:'tls'" json:"smtp_encryption"`

	// 4. Pembayaran (Midtrans & Stripe)
	ActiveGateway          string `gorm:"size:50;default:'midtrans'" json:"active_gateway"`
	PaymentTestMode        bool   `gorm:"default:true" json:"payment_test_mode"`
	MidtransServerKey      string `gorm:"size:255;default:'SB-Mid-server-demo'" json:"midtrans_server_key"`
	MidtransClientKey      string `gorm:"size:255;default:'SB-Mid-client-demo'" json:"midtrans_client_key"`
	StripePublishableKey   string `gorm:"size:255;default:'pk_test_demo'" json:"stripe_publishable_key"`
	StripeSecretKey        string `gorm:"size:255;default:'sk_test_demo'" json:"stripe_secret_key"`
	StripeWebhookSecret    string `gorm:"size:255;default:'whsec_demo'" json:"stripe_webhook_secret"`

	// 5. Domain & Subdomain
	DefaultSubdomainRoot   string `gorm:"size:100;default:'klikin.id'" json:"default_subdomain_root"`
	MaxDomainsPerUserFree  int    `gorm:"default:0" json:"max_domains_per_user_free"`
	MaxDomainsPerUserPro   int    `gorm:"default:3" json:"max_domains_per_user_pro"`
	ReservedSubdomains     string `gorm:"type:text;default:'admin,api,app,www,billing,support,root,mail,auth,status,dev,test'" json:"reserved_subdomains"`

	// 6. SEO & Crawler
	DefaultMetaTitle       string `gorm:"size:255;default:'Klikin : Satu Link untuk Semua Channel Jualan & Konten Anda'" json:"default_meta_title"`
	DefaultMetaDescription string `gorm:"type:text;default:'Platform Link-in-Bio terjangkau untuk influencer kecil dan UMKM Indonesia. Hubungkan toko online, WhatsApp, dan sosial media dalam satu halaman cepat.'" json:"default_meta_description"`
	DefaultOGImage         string `gorm:"size:500;default:'/assets/og-preview.png'" json:"default_og_image"`
	EnableSitemap          bool   `gorm:"default:true" json:"enable_sitemap"`
	RobotsTxtContent       string `gorm:"type:text;default:'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://klikin.id/sitemap.xml'" json:"robots_txt_content"`

	LastUpdatedBy string `gorm:"size:100;default:'Super Admin'" json:"last_updated_by"`
}
