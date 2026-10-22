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
	accountSvc "klikin-backend/services/account"
	adminSvc "klikin-backend/services/admin"
	analyticsSvc "klikin-backend/services/analytics"
	authSvc "klikin-backend/services/auth"
	billingSvc "klikin-backend/services/billing"
	domainSvc "klikin-backend/services/domain"
	leadsSvc "klikin-backend/services/leads"
	notificationSvc "klikin-backend/services/notification"
	ownerSvc "klikin-backend/services/owner"
	pageSvc "klikin-backend/services/page"
	supportSvc "klikin-backend/services/support"
)

// SetupRoutes registers all application routes with clear domain separation
func SetupRoutes(cfg *config.Config) http.Handler {
	mux := http.NewServeMux()

	// 1. Initialize Domain Services (Clean Architecture)
	authService := authSvc.NewAuthService(config.DB)
	accountService := accountSvc.NewAccountService(config.DB)
	adminService := adminSvc.NewAdminService(config.DB)
	ownerService := ownerSvc.NewOwnerService(config.DB)
	analyticsService := analyticsSvc.NewAnalyticsService(config.DB)
	domainService := domainSvc.NewDomainService(config.DB)
	leadsService := leadsSvc.NewLeadsService(config.DB)
	billingService := billingSvc.NewBillingService(config.DB)
	pageSettingsService := pageSvc.NewPageSettingsService(config.DB)
	notificationService := notificationSvc.NewNotificationService(config.DB)
	supportService := supportSvc.NewSupportService(config.DB)

	// 2. Initialize Controllers with Injected Services
	authController := authCtrl.NewAuthController(authService)
	accountController := ownerCtrl.NewAccountController(accountService)
	adminController := adminCtrl.NewAdminController(adminService)
	ownerController := ownerCtrl.NewOwnerController(ownerService)
	analyticsController := ownerCtrl.NewAnalyticsController(analyticsService)
	publicPageController := publicCtrl.NewPageController()
	trackController := publicCtrl.NewTrackController(analyticsService)
	healthController := publicCtrl.NewHealthController(cfg)
	domainController := ownerCtrl.NewDomainController(domainService)
	leadsController := ownerCtrl.NewLeadsController(leadsService)
	publicLeadsController := publicCtrl.NewLeadsPublicController(leadsService)
	billingController := ownerCtrl.NewBillingController(billingService)
	pageSettingsController := ownerCtrl.NewPageSettingsController(pageSettingsService)
	notificationController := ownerCtrl.NewNotificationController(notificationService)
	supportController := ownerCtrl.NewSupportController(supportService)

	// --- 3. PUBLIC ENDPOINTS ---
	mux.HandleFunc("GET /api/health", healthController.Check)
	mux.HandleFunc("GET /api/pages/{slug}", publicPageController.GetBySlug)
	mux.HandleFunc("POST /api/track/view", trackController.TrackView)
	mux.HandleFunc("POST /api/track/click", trackController.TrackClick)
	mux.HandleFunc("POST /api/public/capture", publicLeadsController.SubmitLead)

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
	mux.HandleFunc("POST /api/owner/blocks", middlewares.RequireRole(models.RoleAccountOwner, ownerController.CreateBlock))
	mux.HandleFunc("PUT /api/owner/blocks/reorder", middlewares.RequireRole(models.RoleAccountOwner, ownerController.ReorderBlocks))
	mux.HandleFunc("PUT /api/owner/blocks/{id}", middlewares.RequireRole(models.RoleAccountOwner, ownerController.UpdateBlock))
	mux.HandleFunc("DELETE /api/owner/blocks/{id}", middlewares.RequireRole(models.RoleAccountOwner, ownerController.DeleteBlock))
	mux.HandleFunc("POST /api/owner/blocks/{id}/duplicate", middlewares.RequireRole(models.RoleAccountOwner, ownerController.DuplicateBlock))
	mux.HandleFunc("GET /api/owner/analytics", middlewares.RequireRole(models.RoleAccountOwner, analyticsController.GetAnalytics))
	mux.HandleFunc("GET /api/owner/analytics/export", middlewares.RequireRole(models.RoleAccountOwner, analyticsController.ExportCSV))

	// Custom Domain Endpoints (Readme 4.6)
	mux.HandleFunc("GET /api/owner/domain", middlewares.RequireRole(models.RoleAccountOwner, domainController.GetDomain))
	mux.HandleFunc("POST /api/owner/domain", middlewares.RequireRole(models.RoleAccountOwner, domainController.AddDomain))
	mux.HandleFunc("POST /api/owner/domain/verify", middlewares.RequireRole(models.RoleAccountOwner, domainController.VerifyDomain))
	mux.HandleFunc("PUT /api/owner/domain", middlewares.RequireRole(models.RoleAccountOwner, domainController.UpdateSettings))
	mux.HandleFunc("DELETE /api/owner/domain", middlewares.RequireRole(models.RoleAccountOwner, domainController.DeleteDomain))

	// Email Capture & Leads Endpoints (Readme 4.8 Pro)
	mux.HandleFunc("GET /api/owner/leads/config", middlewares.RequireRole(models.RoleAccountOwner, leadsController.GetConfig))
	mux.HandleFunc("PUT /api/owner/leads/config", middlewares.RequireRole(models.RoleAccountOwner, leadsController.UpdateConfig))
	mux.HandleFunc("GET /api/owner/leads", middlewares.RequireRole(models.RoleAccountOwner, leadsController.GetLeads))
	mux.HandleFunc("DELETE /api/owner/leads/{id}", middlewares.RequireRole(models.RoleAccountOwner, leadsController.DeleteLead))
	mux.HandleFunc("GET /api/owner/leads/export", middlewares.RequireRole(models.RoleAccountOwner, leadsController.ExportCSV))
	mux.HandleFunc("POST /api/owner/leads/test-integration", middlewares.RequireRole(models.RoleAccountOwner, leadsController.TestIntegration))

	// Subscription & Billing Endpoints (Readme 4.7)
	mux.HandleFunc("GET /api/owner/billing", middlewares.RequireRole(models.RoleAccountOwner, billingController.GetBilling))
	mux.HandleFunc("POST /api/owner/billing/trial", middlewares.RequireRole(models.RoleAccountOwner, billingController.StartTrial))
	mux.HandleFunc("POST /api/owner/billing/upgrade", middlewares.RequireRole(models.RoleAccountOwner, billingController.UpgradePlan))
	mux.HandleFunc("POST /api/owner/billing/downgrade", middlewares.RequireRole(models.RoleAccountOwner, billingController.DowngradePlan))
	mux.HandleFunc("POST /api/owner/billing/reactivate", middlewares.RequireRole(models.RoleAccountOwner, billingController.ReactivateSubscription))
	mux.HandleFunc("POST /api/owner/billing/cancel", middlewares.RequireRole(models.RoleAccountOwner, billingController.CancelSubscription))
	mux.HandleFunc("POST /api/owner/billing/promo", middlewares.RequireRole(models.RoleAccountOwner, billingController.ValidatePromo))
	mux.HandleFunc("PUT /api/owner/billing/payment-method", middlewares.RequireRole(models.RoleAccountOwner, billingController.UpdatePaymentMethod))
	mux.HandleFunc("GET /api/owner/billing/invoices", middlewares.RequireRole(models.RoleAccountOwner, billingController.GetInvoices))
	mux.HandleFunc("GET /api/owner/billing/invoices/{id}", middlewares.RequireRole(models.RoleAccountOwner, billingController.GetInvoiceReceipt))

	// Page Settings Endpoints (Readme 4.9)
	mux.HandleFunc("GET /api/owner/page/settings", middlewares.RequireRole(models.RoleAccountOwner, pageSettingsController.GetSettings))
	mux.HandleFunc("PUT /api/owner/page/slug", middlewares.RequireRole(models.RoleAccountOwner, pageSettingsController.UpdateSlug))
	mux.HandleFunc("PUT /api/owner/page/visibility", middlewares.RequireRole(models.RoleAccountOwner, pageSettingsController.UpdateVisibility))
	mux.HandleFunc("PUT /api/owner/page/password", middlewares.RequireRole(models.RoleAccountOwner, pageSettingsController.UpdatePassword))
	mux.HandleFunc("PUT /api/owner/page/404", middlewares.RequireRole(models.RoleAccountOwner, pageSettingsController.UpdateCustom404))
	mux.HandleFunc("PUT /api/owner/page/favicon", middlewares.RequireRole(models.RoleAccountOwner, pageSettingsController.UpdateFavicon))
	mux.HandleFunc("PUT /api/owner/page/seo", middlewares.RequireRole(models.RoleAccountOwner, pageSettingsController.UpdateSEO))
	mux.HandleFunc("PUT /api/owner/page/tracking", middlewares.RequireRole(models.RoleAccountOwner, pageSettingsController.UpdateTracking))

	// User Notifications Endpoints (Readme 4.10)
	mux.HandleFunc("GET /api/owner/notifications", middlewares.RequireRole(models.RoleAccountOwner, notificationController.GetOverview))
	mux.HandleFunc("PUT /api/owner/notifications/{id}/read", middlewares.RequireRole(models.RoleAccountOwner, notificationController.MarkAsRead))
	mux.HandleFunc("POST /api/owner/notifications/read-all", middlewares.RequireRole(models.RoleAccountOwner, notificationController.MarkAllAsRead))
	mux.HandleFunc("DELETE /api/owner/notifications/{id}", middlewares.RequireRole(models.RoleAccountOwner, notificationController.DeleteNotification))
	mux.HandleFunc("GET /api/owner/notifications/preferences", middlewares.RequireRole(models.RoleAccountOwner, notificationController.GetPreferences))
	mux.HandleFunc("PUT /api/owner/notifications/preferences", middlewares.RequireRole(models.RoleAccountOwner, notificationController.UpdatePreferences))

	// User Support & Tickets Endpoints (Readme 4.11)
	mux.HandleFunc("GET /api/owner/support/tickets", middlewares.RequireRole(models.RoleAccountOwner, supportController.GetTickets))
	mux.HandleFunc("POST /api/owner/support/tickets", middlewares.RequireRole(models.RoleAccountOwner, supportController.CreateTicket))
	mux.HandleFunc("GET /api/owner/support/tickets/{id}", middlewares.RequireRole(models.RoleAccountOwner, supportController.GetTicketDetails))
	mux.HandleFunc("POST /api/owner/support/tickets/{id}/reply", middlewares.RequireRole(models.RoleAccountOwner, supportController.ReplyTicket))
	mux.HandleFunc("GET /api/owner/support/faq", supportController.GetFAQs)
	mux.HandleFunc("POST /api/owner/support/contact", middlewares.RequireRole(models.RoleAccountOwner, supportController.SubmitContact))
	mux.HandleFunc("POST /api/owner/support/feedback", middlewares.RequireRole(models.RoleAccountOwner, supportController.SubmitFeedback))

	// --- 11. USER ACCOUNT & SECURITY ENDPOINTS (Readme 4.1 & Startup Spec) ---
	mux.HandleFunc("GET /api/user/profile", middlewares.RequireAuth(accountController.GetProfile))
	mux.HandleFunc("PUT /api/user/profile", middlewares.RequireAuth(accountController.UpdateProfile))
	mux.HandleFunc("PUT /api/user/password", middlewares.RequireAuth(accountController.ChangePassword))
	mux.HandleFunc("PUT /api/user/2fa", middlewares.RequireAuth(accountController.Toggle2FA))
	mux.HandleFunc("GET /api/user/sessions", middlewares.RequireAuth(accountController.GetSessions))
	mux.HandleFunc("POST /api/user/sessions/revoke-others", middlewares.RequireAuth(accountController.RevokeOtherSessions))
	mux.HandleFunc("GET /api/user/export", middlewares.RequireAuth(accountController.ExportData))
	mux.HandleFunc("DELETE /api/user/account", middlewares.RequireAuth(accountController.DeleteAccount))

	// Apply Middlewares (Logger, CORS)
	handler := middlewares.Logger(mux)
	handler = middlewares.EnableCORS(cfg.ClientOrigin)(handler)

	return handler
}
