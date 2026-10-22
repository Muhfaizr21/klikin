package middlewares

import (
	"context"
	"net/http"
	"strings"

	"klikin-backend/config"
	"klikin-backend/models"
	"klikin-backend/views"
)

type contextKey string

const UserContextKey contextKey = "authenticated_user"

// RequireAuth validates the JWT Bearer token and stores claims in request context
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
		if err != nil {
			// Dev fallback: allow demo tokens ONLY in local/development environment (strictly forbidden in production)
			// Impersonation via arbitrary X-User-ID headers is completely removed for professional security
			appEnv := config.LoadConfig().AppEnv
			if appEnv != "production" {
				if parts[1] == "demo-token-owner-kopi" {
					claims = &config.JWTClaims{
						UserID:   "usr_owner_kopi",
						Email:    "owner@klikin.id",
						Username: "kopiseduh",
						Role:     models.RoleAccountOwner,
					}
				} else if parts[1] == "demo-token-superadmin" {
					claims = &config.JWTClaims{
						UserID:   "usr_superadmin_1",
						Email:    "admin@klikin.id",
						Username: "superadmin",
						Role:     models.RoleSuperAdmin,
					}
				}
			}

			if claims == nil {
				views.RenderError(w, http.StatusUnauthorized, "Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.")
				return
			}
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
