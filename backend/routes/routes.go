package routes

import (
	"net/http"

	"klikin-backend/config"
	"klikin-backend/controllers"
	"klikin-backend/middlewares"
)

// SetupRoutes registers all application routes and returns the top-level http.Handler
func SetupRoutes(cfg *config.Config) http.Handler {
	mux := http.NewServeMux()

	// Initialize Controllers
	healthCtrl := controllers.NewHealthController()
	userCtrl := controllers.NewUserController()
	pageCtrl := controllers.NewPageController()

	// Register Routes
	mux.HandleFunc("GET /api/health", healthCtrl.Check)
	mux.HandleFunc("GET /api/user/profile", userCtrl.GetProfile)
	mux.HandleFunc("GET /api/pages/{slug}", pageCtrl.GetBySlug)

	// Apply Middlewares (Logger, CORS)
	handler := middlewares.Logger(mux)
	handler = middlewares.EnableCORS(cfg.ClientOrigin)(handler)

	return handler
}
