package config

import (
	"testing"

	"klikin-backend/models"
)

func TestGenerateAndValidateToken(t *testing.T) {
	SetJWTSecret("test-super-secret-jwt-key-32-chars-minimum!!")

	user := &models.User{
		ID:       "usr_test_1",
		Email:    "creator@klikin.id",
		Username: "creator",
		Role:     models.RoleAccountOwner,
	}

	token, err := GenerateToken(user)
	if err != nil || token == "" {
		t.Fatalf("expected valid token, got err=%v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("expected token validation to succeed, got err=%v", err)
	}
	if claims.UserID != user.ID || claims.Role != models.RoleAccountOwner {
		t.Fatalf("unexpected claims: %+v", claims)
	}
}

func TestChallengeTokenRejectedByRegularValidateToken(t *testing.T) {
	SetJWTSecret("test-super-secret-jwt-key-32-chars-minimum!!")

	user := &models.User{
		ID:    "usr_admin_1",
		Email: "admin@klikin.id",
		Role:  models.RoleSuperAdmin,
	}

	challengeToken, err := Generate2FAChallengeToken(user)
	if err != nil || challengeToken == "" {
		t.Fatalf("expected valid 2FA challenge token, got err=%v", err)
	}

	// Must succeed on 2FA validator
	chClaims, err := Validate2FAChallengeToken(challengeToken)
	if err != nil || chClaims.Purpose != "2fa_challenge" {
		t.Fatalf("expected 2FA challenge validation to succeed, got err=%v", err)
	}

	// Must fail on regular auth validator (prevents 2FA bypass)
	if _, err := ValidateToken(challengeToken); err == nil {
		t.Fatalf("security violation: 2FA challenge token must be rejected by ValidateToken")
	}
}
