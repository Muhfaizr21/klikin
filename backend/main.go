package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"klikin-backend/config"
	"klikin-backend/routes"
)

func main() {
	cfg := config.LoadConfig()

	// Initialize Supabase Database connection
	if _, err := config.ConnectDatabase(cfg.DatabaseURL); err != nil {
		log.Printf("⚠️  Database connection error: %v", err)
	}

	handler := routes.SetupRoutes(cfg)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Channel to listen for errors coming from the listener.
	serverErrors := make(chan error, 1)

	// Start the service listening for requests.
	go func() {
		log.Printf("🚀 Klikin Backend running on port :%s (env: %s)", cfg.Port, cfg.AppEnv)
		log.Printf("📍 Available endpoints:")
		log.Printf("   - GET http://localhost:%s/api/health", cfg.Port)
		log.Printf("   - GET http://localhost:%s/api/user/profile", cfg.Port)
		log.Printf("   - GET http://localhost:%s/api/pages/demo", cfg.Port)
		serverErrors <- server.ListenAndServe()
	}()

	// Channel to listen for an interrupt or terminate signal from the OS.
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	// Blocking main and waiting for shutdown.
	select {
	case err := <-serverErrors:
		if err != nil && err != http.ErrServerClosed {
			log.Fatalf("Error starting server: %v", err)
		}

	case sig := <-shutdown:
		log.Printf("Received signal %v. Initiating graceful shutdown...", sig)

		// Give outstanding requests a deadline for completion.
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Asking listener to shut down and shed load.
		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Graceful shutdown failed, forcing close: %v", err)
			_ = server.Close()
		}

		fmt.Println("Server stopped cleanly.")
	}
}
