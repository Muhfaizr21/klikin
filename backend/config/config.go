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

	clientOrigin := os.Getenv("CLIENT_ORIGIN")
	if clientOrigin == "" {
		clientOrigin = "http://localhost:5173"
	}

	databaseURL := os.Getenv("DATABASE_URL")
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabasePublishableKey := os.Getenv("SUPABASE_PUBLISHABLE_KEY")
	supabaseSecretKey := os.Getenv("SUPABASE_SECRET_KEY")
	supabaseJWKSURL := os.Getenv("SUPABASE_JWKS_URL")

	return &Config{
		Port:                   port,
		AppEnv:                 appEnv,
		ClientOrigin:           clientOrigin,
		DatabaseURL:            databaseURL,
		SupabaseURL:            supabaseURL,
		SupabasePublishableKey: supabasePublishableKey,
		SupabaseSecretKey:      supabaseSecretKey,
		SupabaseJWKSURL:        supabaseJWKSURL,
	}
}
