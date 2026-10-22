package middlewares

import (
	"net/http"
	"strings"

	"klikin-backend/config"
)

func EnableCORS(clientOrigin string) func(http.Handler) http.Handler {
	allowedMap := make(map[string]bool)
	for _, raw := range strings.Split(clientOrigin, ",") {
		trimmed := strings.TrimRight(strings.TrimSpace(raw), "/")
		if trimmed != "" {
			allowedMap[trimmed] = true
		}
	}
	primaryOrigin := strings.TrimRight(strings.TrimSpace(strings.Split(clientOrigin, ",")[0]), "/")
	if primaryOrigin == "" {
		primaryOrigin = "http://localhost:5173"
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := strings.TrimRight(strings.TrimSpace(r.Header.Get("Origin")), "/")
			isDev := config.GetAppEnv() != "production"

			if origin != "" {
				if allowedMap[origin] || allowedMap["*"] || (isDev && (strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:"))) {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Vary", "Origin")
				} else {
					w.Header().Set("Access-Control-Allow-Origin", primaryOrigin)
				}
			} else {
				w.Header().Set("Access-Control-Allow-Origin", primaryOrigin)
			}

			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Page-Password")
			w.Header().Set("Access-Control-Allow-Credentials", "true")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
