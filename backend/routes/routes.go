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
	userManagementService := adminSvc.NewUserManagementService(config.DB)
	subscriptionManagementService := adminSvc.NewSubscriptionManagementService(config.DB)
	domainManagementService := adminSvc.NewDomainManagementService(config.DB)
	contentModerationService := adminSvc.NewContentModerationService(config.DB)
	platformAnalyticsService := adminSvc.NewPlatformAnalyticsService(config.DB)
	financeManagementService := adminSvc.NewFinanceManagementService(config.DB)
	supportManagementService := adminSvc.NewSupportManagementService(config.DB)
	securityAuditService := adminSvc.NewSecurityAuditService(config.DB)
	platformSettingsService := adminSvc.NewPlatformSettingsService(config.DB)
	ownerService := ownerSvc.NewOwnerService(config.DB)
	analyticsService := analyticsSvc.NewAnalyticsService(config.DB)
	domainService := domainSvc.NewDomainService(config.DB)
	leadsService := leadsSvc.NewLeadsService(config.DB)
	midtransService := billingSvc.NewMidtransService(config.DB, cfg)
	billingService := billingSvc.NewBillingService(config.DB, midtransService)
	billingService.StartInvoiceExpirationSweeper()
	pageSettingsService := pageSvc.NewPageSettingsService(config.DB)
	notificationService := notificationSvc.NewNotificationService(config.DB)
	supportService := supportSvc.NewSupportService(config.DB)

	// 2. Initialize Controllers with Injected Services
	authController := authCtrl.NewAuthController(authService)
	accountController := ownerCtrl.NewAccountController(accountService)
	adminController := adminCtrl.NewAdminController(adminService)
	userManagementController := adminCtrl.NewUserManagementController(userManagementService)
	subscriptionManagementController := adminCtrl.NewSubscriptionManagementController(subscriptionManagementService)
	domainManagementController := adminCtrl.NewDomainManagementController(domainManagementService)
	contentModerationController := adminCtrl.NewContentModerationController(contentModerationService)
	platformAnalyticsController := adminCtrl.NewPlatformAnalyticsController(platformAnalyticsService)
	financeManagementController := adminCtrl.NewFinanceManagementController(financeManagementService)
	supportManagementController := adminCtrl.NewSupportManagementController(supportManagementService)
	securityAuditController := adminCtrl.NewSecurityAuditController(securityAuditService)
	platformSettingsController := adminCtrl.NewPlatformSettingsController(platformSettingsService)
	ownerController := ownerCtrl.NewOwnerController(ownerService)
	analyticsController := ownerCtrl.NewAnalyticsController(analyticsService)
	publicPageController := publicCtrl.NewPageController()
	trackController := publicCtrl.NewTrackController(analyticsService)
	healthController := publicCtrl.NewHealthController(cfg)
	domainController := ownerCtrl.NewDomainController(domainService)
	leadsController := ownerCtrl.NewLeadsController(leadsService)
	publicLeadsController := publicCtrl.NewLeadsPublicController(leadsService)
	billingController := ownerCtrl.NewBillingController(billingService, midtransService)
	pageSettingsController := ownerCtrl.NewPageSettingsController(pageSettingsService)
	notificationController := ownerCtrl.NewNotificationController(notificationService)
	supportController := ownerCtrl.NewSupportController(supportService)

	// --- 3. PUBLIC ENDPOINTS ---
	mux.HandleFunc("GET /api/health", healthController.Check)
	mux.HandleFunc("GET /api/pages/{slug}", publicPageController.GetBySlug)
	mux.HandleFunc("POST /api/track/view", trackController.TrackView)
	mux.HandleFunc("POST /api/track/click", trackController.TrackClick)
	mux.HandleFunc("POST /api/public/capture", publicLeadsController.SubmitLead)
	mux.HandleFunc("POST /api/public/reports", contentModerationController.SubmitPublicReport)
	mux.HandleFunc("POST /api/webhooks/midtrans", billingController.HandleMidtransWebhook)

	// --- 4. AUTHENTICATION ENDPOINTS ---
	mux.HandleFunc("POST /api/auth/register", authController.Register)
	mux.HandleFunc("POST /api/auth/login", authController.Login)
	mux.HandleFunc("GET /api/auth/me", middlewares.RequireAuth(authController.GetMe))

	// --- 5. SUPER ADMIN ENDPOINTS (Role: SUPER_ADMIN only) ---
	mux.HandleFunc("GET /api/admin/stats", middlewares.RequireRole(models.RoleSuperAdmin, adminController.GetStats))
	mux.HandleFunc("GET /api/admin/users", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.ListUsers))
	mux.HandleFunc("GET /api/admin/users/export", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.ExportCSV))
	mux.HandleFunc("GET /api/admin/users/{id}", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.GetUserDetail))
	mux.HandleFunc("PUT /api/admin/users/{id}", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.UpdateUser))
	mux.HandleFunc("POST /api/admin/users/{id}/suspend", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.SuspendUser))
	mux.HandleFunc("POST /api/admin/users/{id}/unsuspend", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.UnsuspendUser))
	mux.HandleFunc("POST /api/admin/users/{id}/ban", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.BanUser))
	mux.HandleFunc("POST /api/admin/users/{id}/unban", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.UnbanUser))
	mux.HandleFunc("DELETE /api/admin/users/{id}", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.DeleteUser))
	mux.HandleFunc("POST /api/admin/users/{id}/impersonate", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.ImpersonateUser))
	mux.HandleFunc("POST /api/admin/users/{id}/verify", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.ToggleVerification))
	mux.HandleFunc("POST /api/admin/users/{id}/notes", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.AddInternalNote))
	mux.HandleFunc("DELETE /api/admin/users/notes/{noteId}", middlewares.RequireRole(models.RoleSuperAdmin, userManagementController.DeleteInternalNote))
	mux.HandleFunc("GET /api/admin/analytics/platform", middlewares.RequireRole(models.RoleSuperAdmin, platformAnalyticsController.GetAnalytics))
	mux.HandleFunc("GET /api/admin/analytics/export", middlewares.RequireRole(models.RoleSuperAdmin, platformAnalyticsController.ExportCSV))

	// Section 3.3: Super Admin Subscription, Invoice, Promo & Dunning Endpoints
	mux.HandleFunc("GET /api/admin/subscriptions", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.ListSubscriptions))
	mux.HandleFunc("GET /api/admin/subscriptions/export", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.ExportCSV))
	mux.HandleFunc("GET /api/admin/subscriptions/{userId}", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.GetSubscriptionDetail))
	mux.HandleFunc("POST /api/admin/subscriptions/{userId}/plan", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.ChangePlanManual))
	mux.HandleFunc("POST /api/admin/subscriptions/{userId}/extend", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.ExtendGoodwill))
	mux.HandleFunc("POST /api/admin/subscriptions/{userId}/trial", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.ManageTrial))
	mux.HandleFunc("POST /api/admin/subscriptions/{userId}/cancel", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.CancelSubscription))
	mux.HandleFunc("GET /api/admin/invoices", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.ListInvoices))
	mux.HandleFunc("POST /api/admin/invoices/{invoiceId}/refund", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.ProcessRefund))
	mux.HandleFunc("GET /api/admin/promos", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.ListPromos))
	mux.HandleFunc("POST /api/admin/promos", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.CreatePromo))
	mux.HandleFunc("PUT /api/admin/promos/{id}", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.UpdatePromo))
	mux.HandleFunc("DELETE /api/admin/promos/{id}", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.DeletePromo))
	mux.HandleFunc("GET /api/admin/dunning", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.GetDunningQueue))
	mux.HandleFunc("POST /api/admin/dunning/{userId}/remind", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.SendDunningReminder))
	mux.HandleFunc("POST /api/admin/dunning/remind-all", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.SendBulkDunningReminders))
	mux.HandleFunc("POST /api/admin/dunning/{userId}/resolve", middlewares.RequireRole(models.RoleSuperAdmin, subscriptionManagementController.ResolveDunningManual))

	// Section 3.4: Super Admin Custom Domain & SSL Management Endpoints
	mux.HandleFunc("GET /api/admin/domains", middlewares.RequireRole(models.RoleSuperAdmin, domainManagementController.GetDomains))
	mux.HandleFunc("POST /api/admin/domains", middlewares.RequireRole(models.RoleSuperAdmin, domainManagementController.AddDomainByAdmin))
	mux.HandleFunc("POST /api/admin/domains/reverify-all", middlewares.RequireRole(models.RoleSuperAdmin, domainManagementController.BulkReverifyAllDNS))
	mux.HandleFunc("GET /api/admin/domains/logs", middlewares.RequireRole(models.RoleSuperAdmin, domainManagementController.GetDiagnosticLogs))
	mux.HandleFunc("GET /api/admin/domains/{id}", middlewares.RequireRole(models.RoleSuperAdmin, domainManagementController.GetDomainDetail))
	mux.HandleFunc("POST /api/admin/domains/{id}/reverify", middlewares.RequireRole(models.RoleSuperAdmin, domainManagementController.ReverifyDomainDNS))
	mux.HandleFunc("POST /api/admin/domains/{id}/ssl", middlewares.RequireRole(models.RoleSuperAdmin, domainManagementController.TriggerSSLProvisioning))
	mux.HandleFunc("POST /api/admin/domains/{id}/release", middlewares.RequireRole(models.RoleSuperAdmin, domainManagementController.ReleaseDomain))
	mux.HandleFunc("POST /api/admin/domains/{id}/send-guide", middlewares.RequireRole(models.RoleSuperAdmin, domainManagementController.SendDNSGuideToUser))
	mux.HandleFunc("PATCH /api/admin/domains/{id}/status", middlewares.RequireRole(models.RoleSuperAdmin, domainManagementController.UpdateDomainStatusManual))

	// Section 3.5: Super Admin Content Moderation & Trust/Safety Endpoints
	mux.HandleFunc("GET /api/admin/moderation/pages", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.ListPages))
	mux.HandleFunc("GET /api/admin/moderation/pages/{pageId}", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.GetPageDetail))
	mux.HandleFunc("POST /api/admin/moderation/pages/{pageId}/flag", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.FlagPage))
	mux.HandleFunc("POST /api/admin/moderation/pages/{pageId}/clear-flag", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.ClearFlag))
	mux.HandleFunc("POST /api/admin/moderation/pages/{pageId}/takedown", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.TakeDownPage))
	mux.HandleFunc("POST /api/admin/moderation/pages/{pageId}/restore", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.RestorePage))
	mux.HandleFunc("POST /api/admin/moderation/users/{userId}/ban", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.BanViolator))
	mux.HandleFunc("POST /api/admin/moderation/scan", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.ScanAllPages))
	mux.HandleFunc("GET /api/admin/moderation/reports", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.ListReports))
	mux.HandleFunc("POST /api/admin/moderation/reports/{reportId}/review", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.ReviewReport))
	mux.HandleFunc("GET /api/admin/moderation/blacklist", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.ListBlacklist))
	mux.HandleFunc("POST /api/admin/moderation/blacklist", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.AddBlacklist))
	mux.HandleFunc("PUT /api/admin/moderation/blacklist/{id}/toggle", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.ToggleBlacklist))
	mux.HandleFunc("DELETE /api/admin/moderation/blacklist/{id}", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.DeleteBlacklist))
	mux.HandleFunc("GET /api/admin/moderation/logs", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.ListLogs))
	mux.HandleFunc("GET /api/admin/moderation/export", middlewares.RequireRole(models.RoleSuperAdmin, contentModerationController.ExportCSV))

	// Section 3.7: Super Admin Finance & Financial Intelligence Endpoints
	mux.HandleFunc("GET /api/admin/finance/summary", middlewares.RequireRole(models.RoleSuperAdmin, financeManagementController.GetSummary))
	mux.HandleFunc("GET /api/admin/finance/expenses", middlewares.RequireRole(models.RoleSuperAdmin, financeManagementController.ListExpenses))
	mux.HandleFunc("POST /api/admin/finance/expenses", middlewares.RequireRole(models.RoleSuperAdmin, financeManagementController.CreateExpense))
	mux.HandleFunc("PUT /api/admin/finance/expenses/{id}", middlewares.RequireRole(models.RoleSuperAdmin, financeManagementController.UpdateExpense))
	mux.HandleFunc("DELETE /api/admin/finance/expenses/{id}", middlewares.RequireRole(models.RoleSuperAdmin, financeManagementController.DeleteExpense))
	mux.HandleFunc("GET /api/admin/finance/transactions", middlewares.RequireRole(models.RoleSuperAdmin, financeManagementController.ListTransactions))
	mux.HandleFunc("POST /api/admin/finance/invoices/manual", middlewares.RequireRole(models.RoleSuperAdmin, financeManagementController.CreateManualInvoice))
	mux.HandleFunc("GET /api/admin/finance/export", middlewares.RequireRole(models.RoleSuperAdmin, financeManagementController.ExportCSV))
	mux.HandleFunc("GET /api/admin/finance/audit-logs", middlewares.RequireRole(models.RoleSuperAdmin, financeManagementController.GetAuditLogs))

	// Section 3.8: Super Admin Support & Communications Endpoints
	mux.HandleFunc("GET /api/admin/support/stats", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.GetStats))
	mux.HandleFunc("GET /api/admin/support/tickets", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.ListTickets))
	mux.HandleFunc("GET /api/admin/support/tickets/{id}", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.GetTicketDetail))
	mux.HandleFunc("POST /api/admin/support/tickets/{id}/reply", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.ReplyTicket))
	mux.HandleFunc("PATCH /api/admin/support/tickets/{id}/status", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.UpdateTicketStatus))
	mux.HandleFunc("GET /api/admin/support/canned-responses", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.ListCannedResponses))
	mux.HandleFunc("POST /api/admin/support/canned-responses", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.CreateCannedResponse))
	mux.HandleFunc("PUT /api/admin/support/canned-responses/{id}", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.UpdateCannedResponse))
	mux.HandleFunc("DELETE /api/admin/support/canned-responses/{id}", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.DeleteCannedResponse))
	mux.HandleFunc("GET /api/admin/support/broadcasts", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.ListBroadcasts))
	mux.HandleFunc("POST /api/admin/support/broadcasts", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.SendBroadcast))
	mux.HandleFunc("POST /api/admin/support/notifications/direct", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.SendDirectNotification))
	mux.HandleFunc("GET /api/admin/support/communication-logs", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.ListCommunicationLogs))
	mux.HandleFunc("GET /api/admin/support/export", middlewares.RequireRole(models.RoleSuperAdmin, supportManagementController.ExportCSV))

	// Section 3.10: Super Admin Security & Audit Endpoints
	mux.HandleFunc("GET /api/admin/security/overview", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.GetOverview))
	mux.HandleFunc("GET /api/admin/security/audit-logs", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.ListAuditLogs))
	mux.HandleFunc("GET /api/admin/security/audit-logs/export", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.ExportAuditLogs))
	mux.HandleFunc("GET /api/admin/security/login-logs", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.ListLoginLogs))
	mux.HandleFunc("GET /api/admin/security/login-logs/export", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.ExportLoginLogs))
	mux.HandleFunc("GET /api/admin/security/error-logs", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.ListErrorLogs))
	mux.HandleFunc("PATCH /api/admin/security/error-logs/{id}/resolve", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.ResolveErrorLog))
	mux.HandleFunc("GET /api/admin/security/blacklist", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.ListBlacklistedIPs))
	mux.HandleFunc("POST /api/admin/security/blacklist", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.AddBlacklistedIP))
	mux.HandleFunc("PATCH /api/admin/security/blacklist/{id}/toggle", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.ToggleBlacklistIP))
	mux.HandleFunc("DELETE /api/admin/security/blacklist/{id}", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.DeleteBlacklistedIP))
	mux.HandleFunc("GET /api/admin/security/rate-limit", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.GetRateLimitMonitor))
	mux.HandleFunc("GET /api/admin/security/sessions", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.ListAdminSessions))
	mux.HandleFunc("POST /api/admin/security/sessions/{id}/terminate", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.TerminateAdminSession))
	mux.HandleFunc("POST /api/admin/security/sessions/terminate-others", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.TerminateAllOtherSessions))
	mux.HandleFunc("GET /api/admin/security/policy", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.GetSecurityPolicy))
	mux.HandleFunc("PUT /api/admin/security/policy", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.UpdateSecurityPolicy))
	mux.HandleFunc("POST /api/admin/security/backups/trigger", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.TriggerBackup))
	mux.HandleFunc("GET /api/admin/security/backups", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.ListBackups))
	mux.HandleFunc("GET /api/admin/security/backups/{id}/download", middlewares.RequireRole(models.RoleSuperAdmin, securityAuditController.DownloadBackup))

	// 5.9 Platform Settings Endpoints (Readme 3.9)
	mux.HandleFunc("GET /api/admin/settings", middlewares.RequireRole(models.RoleSuperAdmin, platformSettingsController.GetSettings))
	mux.HandleFunc("PUT /api/admin/settings/general", middlewares.RequireRole(models.RoleSuperAdmin, platformSettingsController.UpdateGeneral))
	mux.HandleFunc("PUT /api/admin/settings/pricing", middlewares.RequireRole(models.RoleSuperAdmin, platformSettingsController.UpdatePricing))
	mux.HandleFunc("PUT /api/admin/settings/email", middlewares.RequireRole(models.RoleSuperAdmin, platformSettingsController.UpdateEmail))
	mux.HandleFunc("POST /api/admin/settings/email/test", middlewares.RequireRole(models.RoleSuperAdmin, platformSettingsController.SendTestEmail))
	mux.HandleFunc("PUT /api/admin/settings/payment", middlewares.RequireRole(models.RoleSuperAdmin, platformSettingsController.UpdatePayment))
	mux.HandleFunc("PUT /api/admin/settings/domain", middlewares.RequireRole(models.RoleSuperAdmin, platformSettingsController.UpdateDomain))
	mux.HandleFunc("PUT /api/admin/settings/seo", middlewares.RequireRole(models.RoleSuperAdmin, platformSettingsController.UpdateSEO))

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
	mux.HandleFunc("POST /api/owner/billing/invoices/cancel", middlewares.RequireRole(models.RoleAccountOwner, billingController.CancelInvoice))
	mux.HandleFunc("POST /api/owner/billing/verify-midtrans", middlewares.RequireRole(models.RoleAccountOwner, billingController.VerifyMidtrans))

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
