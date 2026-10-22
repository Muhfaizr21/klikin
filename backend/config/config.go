package config

import (
	"log"
	"os"

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

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret != "" {
		SetJWTSecret(jwtSecret)
	} else if appEnv == "production" {
		log.Println("⚠️  WARNING: JWT_SECRET environment variable is not set in production mode!")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabasePublishableKey := os.Getenv("SUPABASE_PUBLISHABLE_KEY")
	supabaseSecretKey := os.Getenv("SUPABASE_SECRET_KEY")
	supabaseJWKSURL := os.Getenv("SUPABASE_JWKS_URL")

	midtransMerchantID := os.Getenv("MIDTRANS_MERCHANT_ID")
	if midtransMerchantID == "" {
		midtransMerchantID = "G284508566"
	}
	midtransClientKey := os.Getenv("MIDTRANS_CLIENT_KEY")
	if midtransClientKey == "" {
		midtransClientKey = "SB-Mid-client-NLCyIuf2UU1OSpzD"
	}
	midtransServerKey := os.Getenv("MIDTRANS_SERVER_KEY")
	if midtransServerKey == "" {
		midtransServerKey = "SB-Mid-server-dUkRH5CEcu0rXDYRhW-Zn_sv"
	}
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
