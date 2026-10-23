package middlewares

import (
	"net/http"
	"strings"
)

// SecurityHeaders applies industry-standard HTTP defensive security response headers (SEC-10)
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()

		// 1. Prevent MIME-sniffing
		h.Set("X-Content-Type-Options", "nosniff")

		// 2. Prevent Clickjacking
		h.Set("X-Frame-Options", "SAMEORIGIN")

		// 3. Prevent XSS filter vulnerabilities in legacy browsers
		h.Set("X-XSS-Protection", "1; mode=block")

		// 4. Strict referrer information control
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// 5. Explicit device permissions policy
		h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)")

		// 6. Cross-Origin Opener Policy (allows OAuth popups to communicate while isolating process)
		h.Set("Cross-Origin-Opener-Policy", "same-origin-allow-popups")

		// 7. Enforce HSTS if request was made via TLS or behind a TLS-terminating reverse proxy
		proto := strings.ToLower(r.Header.Get("X-Forwarded-Proto"))
		if r.TLS != nil || proto == "https" {
			h.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}

		next.ServeHTTP(w, r)
	})
}
