package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                   string
	AppEnv                 string
	ClientOrigin           string
	DatabaseURL            string
	SupabaseURL            string
	SupabasePublishableKey string
	SupabaseSecretKey      string
	SupabaseJWKSURL        string
	JWTSecret              string
	MidtransMerchantID     string
	MidtransClientKey      string
	MidtransServerKey      string
	MidtransIsProduction   bool
}

var currentAppEnv = "development"

func GetAppEnv() string {
	return currentAppEnv
}

func LoadConfig() *Config {
	// Attempt to load .env file if present (with fallback for root dir)
	if err := godotenv.Load(); err != nil {
		if err2 := godotenv.Load("backend/.env"); err2 != nil {
			log.Println("ℹ️  No .env file found or failed to load, reading from system environment")
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}
	currentAppEnv = appEnv

	clientOrigin := os.Getenv("CLIENT_ORIGIN")
	if clientOrigin == "" {
		clientOrigin = "http://localhost:5173"
	}

	jwtSecret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if jwtSecret != "" {
		if len(jwtSecret) < 32 && appEnv == "production" {
			log.Fatalf("FATAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long in production (current length: %d)", len(jwtSecret))
		}
		SetJWTSecret(jwtSecret)
	} else if appEnv == "production" {
		log.Fatalf("FATAL SECURITY ERROR: JWT_SECRET environment variable is mandatory in production!")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabasePublishableKey := os.Getenv("SUPABASE_PUBLISHABLE_KEY")
	supabaseSecretKey := os.Getenv("SUPABASE_SECRET_KEY")
	supabaseJWKSURL := os.Getenv("SUPABASE_JWKS_URL")

	midtransMerchantID := strings.TrimSpace(os.Getenv("MIDTRANS_MERCHANT_ID"))
	midtransClientKey := strings.TrimSpace(os.Getenv("MIDTRANS_CLIENT_KEY"))
	midtransServerKey := strings.TrimSpace(os.Getenv("MIDTRANS_SERVER_KEY"))
	midtransIsProd := os.Getenv("MIDTRANS_IS_PRODUCTION") == "true"

	return &Config{
		Port:                   port,
		AppEnv:                 appEnv,
		ClientOrigin:           clientOrigin,
		DatabaseURL:            databaseURL,
		SupabaseURL:            supabaseURL,
		SupabasePublishableKey: supabasePublishableKey,
		SupabaseSecretKey:      supabaseSecretKey,
		SupabaseJWKSURL:        supabaseJWKSURL,
		JWTSecret:              jwtSecret,
		MidtransMerchantID:     midtransMerchantID,
		MidtransClientKey:      midtransClientKey,
		MidtransServerKey:      midtransServerKey,
		MidtransIsProduction:   midtransIsProd,
	}
}
