package middlewares

import (
	"context"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"klikin-backend/config"
	"klikin-backend/models"
	"klikin-backend/views"
)

type contextKey string

const UserContextKey contextKey = "authenticated_user"

// securityGuardCache provides sub-millisecond TTL caching for IP Blacklist, Maintenance Mode, and User Status
type userStatusCacheEntry struct {
	Status    string
	Role      models.UserRole
	ExpiresAt time.Time
}

var (
	guardMu              sync.RWMutex
	globalGuardExpiresAt time.Time
	maintenanceActive    bool
	maintenanceMessage   string
	blockedIPSet         = make(map[string]string)
	userStatusCache      = make(map[string]userStatusCacheEntry)
)

const guardCacheTTL = 30 * time.Second

// InvalidateSecurityCache immediately clears the in-memory security cache when Super Admin updates security/settings/user status
func InvalidateSecurityCache() {
	guardMu.Lock()
	globalGuardExpiresAt = time.Time{}
	userStatusCache = make(map[string]userStatusCacheEntry)
	guardMu.Unlock()
}

func extractClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xri := strings.TrimSpace(r.Header.Get("X-Real-IP")); xri != "" {
		return xri
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && host != "" {
		return host
	}
	return r.RemoteAddr
}

func refreshGlobalGuardIfNeeded() (bool, string, map[string]string) {
	now := time.Now()
	guardMu.RLock()
	if now.Before(globalGuardExpiresAt) {
		mActive := maintenanceActive
		mMsg := maintenanceMessage
		ips := blockedIPSet
		guardMu.RUnlock()
		return mActive, mMsg, ips
	}
	guardMu.RUnlock()

	if config.DB == nil {
		return false, "", nil
	}

	var setting models.PlatformSetting
	mActive := false
	mMsg := "Sistem sedang dalam pemeliharaan terjadwal. Silakan coba beberapa saat lagi."
	if err := config.DB.Select("maintenance_mode", "maintenance_notice").First(&setting).Error; err == nil {
		mActive = setting.MaintenanceMode
		if strings.TrimSpace(setting.MaintenanceNotice) != "" {
			mMsg = setting.MaintenanceNotice
		}
	}

	var activeBlocks []models.BlacklistedIP
	newIPMap := make(map[string]string)
	if err := config.DB.Where("is_active = ?", true).Find(&activeBlocks).Error; err == nil {
		for _, b := range activeBlocks {
			if b.ExpiresAt != nil && now.After(*b.ExpiresAt) {
				continue
			}
			newIPMap[strings.TrimSpace(b.IPAddress)] = b.Reason
		}
	}

	guardMu.Lock()
	maintenanceActive = mActive
	maintenanceMessage = mMsg
	blockedIPSet = newIPMap
	globalGuardExpiresAt = now.Add(guardCacheTTL)
	guardMu.Unlock()

	return mActive, mMsg, newIPMap
}

func checkUserAccountStatus(userID string) (string, models.UserRole) {
	now := time.Now()
	guardMu.RLock()
	if entry, ok := userStatusCache[userID]; ok && now.Before(entry.ExpiresAt) {
		guardMu.RUnlock()
		return entry.Status, entry.Role
	}
	guardMu.RUnlock()

	if config.DB == nil {
		return "active", ""
	}

	var user models.User
	if err := config.DB.Select("status", "role").Where("id = ?", userID).First(&user).Error; err != nil {
		return "active", ""
	}

	status := user.Status
	if status == "" {
		status = "active"
	}

	guardMu.Lock()
	userStatusCache[userID] = userStatusCacheEntry{
		Status:    status,
		Role:      user.Role,
		ExpiresAt: now.Add(guardCacheTTL),
	}
	guardMu.Unlock()

	return status, user.Role
}

// RequireAuth validates the JWT Bearer token, enforces IP Blacklist, User Account Status, and Maintenance Mode
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		mActive, mMsg, ipMap := refreshGlobalGuardIfNeeded()
		clientIP := extractClientIP(r)
		if reason, blocked := ipMap[clientIP]; blocked {
			views.RenderError(w, http.StatusForbidden, "Akses ditolak: alamat IP Anda diblokir oleh sistem keamanan Klikin ("+reason+")")
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			views.RenderError(w, http.StatusUnauthorized, "Authorization header required")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			views.RenderError(w, http.StatusUnauthorized, "Invalid authorization format. Use 'Bearer <token>'")
			return
		}

		claims, err := config.ValidateToken(parts[1])
		if err != nil || claims == nil {
			views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.")
			return
		}

		// Verify live account status & role from cache/DB
		liveStatus, liveRole := checkUserAccountStatus(claims.UserID)
		if liveRole != "" {
			claims.Role = liveRole
		}

		if liveStatus == "banned" {
			views.RenderError(w, http.StatusForbidden, "Akun Anda telah diblokir secara permanen karena pelanggaran berat Ketentuan Layanan.")
			return
		}
		if liveStatus == "suspended" {
			views.RenderError(w, http.StatusForbidden, "Akun Anda sedang ditangguhkan sementara oleh Tim Moderasi & Keamanan Klikin.")
			return
		}

		// Enforce Maintenance Mode for non-SuperAdmin accounts
		if mActive && claims.Role != models.RoleSuperAdmin {
			views.RenderError(w, http.StatusServiceUnavailable, mMsg)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next(w, r.WithContext(ctx))
	}
}

// RequireRole ensures that the authenticated user possesses the required role
func RequireRole(role models.UserRole, next http.HandlerFunc) http.HandlerFunc {
	return RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(UserContextKey).(*config.JWTClaims)
		if !ok || claims == nil {
			views.RenderError(w, http.StatusUnauthorized, "Unauthorized request")
			return
		}

		if claims.Role != role {
			views.RenderError(w, http.StatusForbidden, "Akses ditolak: endpoint ini memerlukan hak akses "+string(role))
			return
		}

		next(w, r)
	})
}

// GetUserFromContext retrieves authenticated user claims from context
func GetUserFromContext(r *http.Request) *config.JWTClaims {
	claims, ok := r.Context().Value(UserContextKey).(*config.JWTClaims)
	if !ok {
		return nil
	}
	return claims
}
