package middlewares

import (
	"encoding/json"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

type ipBucket struct {
	requests []time.Time
}

type RateLimiter struct {
	mu      sync.RWMutex
	buckets map[string]*ipBucket
	window  time.Duration
}

var globalLimiter *RateLimiter
var onceLimiter sync.Once

// GetRateLimiter initializes and returns the global RateLimiter singleton with auto-cleanup
func GetRateLimiter() *RateLimiter {
	onceLimiter.Do(func() {
		globalLimiter = &RateLimiter{
			buckets: make(map[string]*ipBucket),
			window:  time.Minute,
		}
		// Periodically clean up stale buckets to prevent memory accumulation
		go globalLimiter.cleanupLoop()
	})
	return globalLimiter
}

func (rl *RateLimiter) cleanupLoop() {
	ticker := time.NewTicker(2 * time.Minute)
	for range ticker.C {
		rl.mu.Lock()
		cutoff := time.Now().Add(-rl.window)
		for ip, b := range rl.buckets {
			validIdx := 0
			for _, t := range b.requests {
				if t.After(cutoff) {
					break
				}
				validIdx++
			}
			if validIdx >= len(b.requests) {
				delete(rl.buckets, ip)
			} else if validIdx > 0 {
				b.requests = b.requests[validIdx:]
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) allow(ip string, maxRequests int) (bool, int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	b, exists := rl.buckets[ip]
	if !exists {
		b = &ipBucket{requests: make([]time.Time, 0, maxRequests)}
		rl.buckets[ip] = b
	}

	// Filter timestamps outside current window
	valid := b.requests[:0]
	for _, t := range b.requests {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}
	b.requests = valid

	if len(b.requests) >= maxRequests {
		return false, 0
	}

	b.requests = append(b.requests, now)
	return true, maxRequests - len(b.requests)
}

// getClientIP extracts real client IP even behind proxies/load balancers
func getClientIP(r *http.Request) string {
	if cfIP := strings.TrimSpace(r.Header.Get("CF-Connecting-IP")); cfIP != "" {
		return cfIP
	}
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			ip := strings.TrimSpace(parts[0])
			if ip != "" {
				return ip
			}
		}
	}
	if xri := strings.TrimSpace(r.Header.Get("X-Real-IP")); xri != "" {
		return xri
	}
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return ip
	}
	return r.RemoteAddr
}

// RateLimit is a global middleware enforcing tiered sliding-window rate limiting per IP
func RateLimit(next http.Handler) http.Handler {
	limiter := GetRateLimiter()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Whitelist OPTIONS preflight requests
		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		path := r.URL.Path
		clientIP := getClientIP(r)

		// Tiered rate limit per endpoint type
		maxRequests := 120 // Default: 120 req/min
		switch {
		case strings.HasPrefix(path, "/api/auth/"):
			maxRequests = 25 // 25 req/min for auth to stop brute force
		case strings.HasPrefix(path, "/api/track/"):
			maxRequests = 300 // Higher limit for high-frequency tracking
		case strings.HasPrefix(path, "/api/webhooks/"):
			maxRequests = 100 // Webhook callbacks
		case strings.HasPrefix(path, "/api/health"):
			next.ServeHTTP(w, r)
			return
		}

		bucketKey := clientIP + ":" + pathScope(path)
		allowed, remaining := limiter.allow(bucketKey, maxRequests)

		w.Header().Set("X-RateLimit-Limit", strconv.Itoa(maxRequests))
		w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
		if !allowed {
			w.Header().Set("Retry-After", "60")
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"error":   "Terlalu banyak permintaan (Rate limit terlampaui). Silakan coba lagi beberapa saat.",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}

func pathScope(path string) string {
	switch {
	case strings.HasPrefix(path, "/api/auth/"):
		return "auth"
	case strings.HasPrefix(path, "/api/track/"):
		return "track"
	case strings.HasPrefix(path, "/api/webhooks/"):
		return "webhook"
	default:
		return "api"
	}
}
