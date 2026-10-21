package routes

import (
	"net/http"

	"klikin-backend/config"
	adminCtrl "klikin-backend/controllers/admin"
	authCtrl "klikin-backend/controllers/auth"
	ownerCtrl "klikin-backend/controllers/owner"
	publicCtrl "klikin-backend/controllers/public"
	"klikin-backend/middlewares"
	"klikin-backend/models"
	adminSvc "klikin-backend/services/admin"
	authSvc "klikin-backend/services/auth"
	ownerSvc "klikin-backend/services/owner"
)

// SetupRoutes registers all application routes with clear domain separation
func SetupRoutes(cfg *config.Config) http.Handler {
	mux := http.NewServeMux()

	// 1. Initialize Domain Services (Clean Architecture)
	authService := authSvc.NewAuthService(config.DB)
	adminService := adminSvc.NewAdminService(config.DB)
	ownerService := ownerSvc.NewOwnerService(config.DB)

	// 2. Initialize Controllers with Injected Services
	authController := authCtrl.NewAuthController(authService)
	adminController := adminCtrl.NewAdminController(adminService)
	ownerController := ownerCtrl.NewOwnerController(ownerService)
	publicPageController := publicCtrl.NewPageController()
	healthController := publicCtrl.NewHealthController(cfg)

	// --- 3. PUBLIC ENDPOINTS ---
	mux.HandleFunc("GET /api/health", healthController.Check)
	mux.HandleFunc("GET /api/pages/{slug}", publicPageController.GetBySlug)

	// --- 4. AUTHENTICATION ENDPOINTS ---
	mux.HandleFunc("POST /api/auth/register", authController.Register)
	mux.HandleFunc("POST /api/auth/login", authController.Login)
	mux.HandleFunc("GET /api/auth/me", middlewares.RequireAuth(authController.GetMe))

	// --- 5. SUPER ADMIN ENDPOINTS (Role: SUPER_ADMIN only) ---
	mux.HandleFunc("GET /api/admin/stats", middlewares.RequireRole(models.RoleSuperAdmin, adminController.GetStats))
	mux.HandleFunc("GET /api/admin/users", middlewares.RequireRole(models.RoleSuperAdmin, adminController.GetUsers))

	// --- 6. ACCOUNT OWNER WORKSPACE ENDPOINTS (Role: ACCOUNT_OWNER only) ---
	mux.HandleFunc("GET /api/owner/workspace", middlewares.RequireRole(models.RoleAccountOwner, ownerController.GetWorkspace))
	mux.HandleFunc("PUT /api/owner/page", middlewares.RequireRole(models.RoleAccountOwner, ownerController.UpdatePage))
	mux.HandleFunc("POST /api/owner/links", middlewares.RequireRole(models.RoleAccountOwner, ownerController.CreateLink))
	mux.HandleFunc("DELETE /api/owner/links/{id}", middlewares.RequireRole(models.RoleAccountOwner, ownerController.DeleteLink))

	// Apply Middlewares (Logger, CORS)
	handler := middlewares.Logger(mux)
	handler = middlewares.EnableCORS(cfg.ClientOrigin)(handler)

	return handler
}
