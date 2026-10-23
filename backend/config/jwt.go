package config

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"log"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"klikin-backend/models"
)

var jwtSecret = []byte(resolveInitialJWTSecret())

func resolveInitialJWTSecret() string {
	if envSecret := strings.TrimSpace(os.Getenv("JWT_SECRET")); envSecret != "" {
		return envSecret
	}
	// Ephemeral cryptographic secret generated per runtime instance for dev
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		panic("failed to initialize cryptographically secure JWT secret: " + err.Error())
	}
	ephemeralSecret := hex.EncodeToString(randomBytes)
	log.Println("⚠️  SECURITY WARNING: JWT_SECRET not found in environment. Generated ephemeral 256-bit secret for this runtime instance.")
	return ephemeralSecret
}

// SetJWTSecret updates the active HMAC signing key from loaded configuration
func SetJWTSecret(secret string) {
	if trimmed := strings.TrimSpace(secret); trimmed != "" {
		jwtSecret = []byte(trimmed)
	}
}

type JWTClaims struct {
	UserID   string          `json:"user_id"`
	Email    string          `json:"email"`
	Username string          `json:"username"`
	Role     models.UserRole `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken creates a signed JWT for the authenticated user
func GenerateToken(user *models.User) (string, error) {
	claims := JWTClaims{
		UserID:   user.ID,
		Email:    user.Email,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "klikin-platform",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ValidateToken verifies and extracts claims from a raw JWT token string
func ValidateToken(tokenStr string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing algorithm")
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		// Reject 2FA challenge tokens attempting to access regular endpoints
		if claims.Role == "" {
			return nil, errors.New("token tidak memiliki hak akses penuh")
		}
		return claims, nil
	}

	return nil, errors.New("invalid token claims")
}

// TwoFAChallengeClaims is a restricted temporary token during 2FA authentication
type TwoFAChallengeClaims struct {
	UserID  string `json:"user_id"`
	Email   string `json:"email"`
	Purpose string `json:"purpose"`
	jwt.RegisteredClaims
}

// Generate2FAChallengeToken creates a strictly bounded 5-minute challenge token
func Generate2FAChallengeToken(user *models.User) (string, error) {
	claims := TwoFAChallengeClaims{
		UserID:  user.ID,
		Email:   user.Email,
		Purpose: "2fa_challenge",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "klikin-platform",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// Validate2FAChallengeToken verifies the authenticity of the 2FA challenge
func Validate2FAChallengeToken(tokenStr string) (*TwoFAChallengeClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &TwoFAChallengeClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing algorithm")
		}
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*TwoFAChallengeClaims); ok && token.Valid {
		if claims.Purpose != "2fa_challenge" {
			return nil, errors.New("invalid challenge token purpose")
		}
		return claims, nil
	}
	return nil, errors.New("challenge token tidak valid atau kedaluwarsa")
}
