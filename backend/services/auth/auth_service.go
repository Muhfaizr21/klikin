package auth

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"klikin-backend/config"
	"klikin-backend/models"
)

type AuthService struct {
	db *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

type RegisterDTO struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

type AuthResult struct {
	Token          string      `json:"token,omitempty"`
	User           models.User `json:"user,omitempty"`
	Role           string      `json:"role,omitempty"`
	Require2FA     bool        `json:"require_2fa,omitempty"`
	ChallengeToken string      `json:"challenge_token,omitempty"`
}

// Register registers a new account owner and automatically scaffolds their isolated workspace & bio page
func (s *AuthService) Register(dto RegisterDTO) (*AuthResult, error) {
	if s.db == nil {
		return nil, errors.New("database connection is unavailable")
	}

	email := strings.TrimSpace(strings.ToLower(dto.Email))
	username := strings.TrimSpace(strings.ToLower(dto.Username))

	if email == "" || dto.Password == "" {
		return nil, errors.New("email dan kata sandi wajib diisi")
	}

	if len(dto.Password) < 8 {
		return nil, errors.New("kata sandi minimal 8 karakter")
	}

	// Check PlatformSetting for reserved subdomains
	var setting models.PlatformSetting
	hasSetting := s.db.First(&setting).Error == nil

	if username == "" {
		parts := strings.Split(email, "@")
		username = strings.ToLower(parts[0])
	}
	username = strings.ReplaceAll(username, " ", "-")

	if hasSetting && setting.ReservedSubdomains != "" {
		for _, rSlug := range strings.Split(setting.ReservedSubdomains, ",") {
			if strings.EqualFold(strings.TrimSpace(rSlug), username) {
				username = fmt.Sprintf("%s-%d", username, time.Now().Unix()%1000)
				break
			}
		}
	}

	// Check for duplicate email
	var existing models.User
	if err := s.db.Where("email = ?", email).First(&existing).Error; err == nil {
		return nil, errors.New("email sudah terdaftar. Silakan login.")
	}

	// Check if username or bio slug is already taken; if so, ensure unique slug by adding counter
	baseUsername := username
	counter := 1
	for {
		var userCount int64
		var pageCount int64
		s.db.Model(&models.User{}).Where("username = ?", username).Count(&userCount)
		s.db.Model(&models.BioPage{}).Where("slug = ?", username).Count(&pageCount)
		if userCount == 0 && pageCount == 0 {
			break
		}
		username = fmt.Sprintf("%s-%d", baseUsername, counter)
		counter++
	}

	newUser := models.User{
		ID:        fmt.Sprintf("usr_%d", time.Now().UnixNano()),
		Email:     email,
		Username:  username,
		FullName:  dto.FullName,
		Role:      models.RoleAccountOwner,
		IsPro:     false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := newUser.HashPassword(dto.Password); err != nil {
		return nil, errors.New("gagal mengenkripsi kata sandi")
	}

	// Persist user
	if err := s.db.Create(&newUser).Error; err != nil {
		return nil, fmt.Errorf("gagal membuat user: %w", err)
	}

	// Scaffold initial bio page for this Owner (Isolated tenant workspace)
	pageTitle := newUser.FullName
	if pageTitle == "" {
		pageTitle = newUser.Username
	}

	bioPage := models.BioPage{
		ID:          fmt.Sprintf("page_%d", time.Now().UnixNano()),
		UserID:      newUser.ID,
		Slug:        newUser.Username,
		Title:       pageTitle,
		Bio:         "Selamat datang di bio link resmi saya. Temukan tautan produk dan kontak di bawah ini.",
		Theme:       "midnight",
		IsPublished: true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	_ = s.db.Create(&bioPage)

	token, err := config.GenerateToken(&newUser)
	if err != nil {
		return nil, errors.New("gagal menerbitkan token otentikasi")
	}

	return &AuthResult{
		Token: token,
		User:  newUser,
		Role:  string(newUser.Role),
	}, nil
}

// Login authenticates both SuperAdmin and AccountOwner
func (s *AuthService) Login(email, password string) (*AuthResult, error) {
	if s.db == nil {
		return nil, errors.New("database connection is unavailable")
	}

	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" {
		return nil, errors.New("email dan kata sandi wajib diisi")
	}

	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, errors.New("email atau kata sandi tidak cocok")
	}

	if !user.CheckPassword(password) {
		return nil, errors.New("email atau kata sandi tidak cocok")
	}

	if user.Status == "banned" {
		return nil, errors.New("akun Anda telah diblokir permanen karena pelanggaran berat Ketentuan Layanan")
	}
	if user.Status == "suspended" {
		reason := strings.TrimSpace(user.StatusReason)
		if reason != "" {
			return nil, fmt.Errorf("akun Anda sedang ditangguhkan sementara: %s", reason)
		}
		return nil, errors.New("akun Anda sedang ditangguhkan sementara oleh Tim Keamanan Klikin")
	}

	now := time.Now()
	_ = s.db.Model(&models.User{}).Where("id = ?", user.ID).Update("updated_at", now)

	// SEC-07: If TwoFactorEnabled is active, do not issue full session JWT immediately.
	// Instead, issue a 5-minute ephemeral 2FA challenge token.
	if user.TwoFactorEnabled {
		challengeToken, err := config.Generate2FAChallengeToken(&user)
		if err != nil {
			return nil, errors.New("gagal menerbitkan tantangan autentikasi dua faktor")
		}
		return &AuthResult{
			Require2FA:     true,
			ChallengeToken: challengeToken,
			User: models.User{
				ID:       user.ID,
				Email:    user.Email,
				Username: user.Username,
				Role:     user.Role,
			},
			Role: string(user.Role),
		}, nil
	}

	token, err := config.GenerateToken(&user)
	if err != nil {
		return nil, errors.New("gagal menerbitkan token otentikasi")
	}

	return &AuthResult{
		Token: token,
		User:  user,
		Role:  string(user.Role),
	}, nil
}

// Verify2FA validates the TOTP 6-digit code or backup code and delivers authenticated JWT
func (s *AuthService) Verify2FA(challengeToken, code string) (*AuthResult, error) {
	if s.db == nil {
		return nil, errors.New("database connection is unavailable")
	}

	claims, err := config.Validate2FAChallengeToken(challengeToken)
	if err != nil {
		return nil, errors.New("sesi 2FA kedaluwarsa atau tidak valid, silakan masuk kembali")
	}

	var user models.User
	if err := s.db.Where("id = ?", claims.UserID).First(&user).Error; err != nil {
		return nil, errors.New("pengguna tidak ditemukan")
	}

	cleanCode := strings.TrimSpace(code)
	if cleanCode == "" {
		return nil, errors.New("kode 2FA atau kode cadangan wajib diisi")
	}

	valid := false
	// 1. Validate 6-digit TOTP
	if len(cleanCode) == 6 && user.TwoFactorSecret != "" {
		if ValidateTOTPCode(user.TwoFactorSecret, cleanCode) {
			valid = true
		}
	}

	// 2. Validate one-time backup recovery codes
	if !valid && strings.HasPrefix(strings.ToUpper(cleanCode), "KLIK-") && user.TwoFactorBackupCodes != "" {
		storedCodes := strings.Split(user.TwoFactorBackupCodes, ",")
		var remainingCodes []string
		for _, bc := range storedCodes {
			trimmed := strings.TrimSpace(bc)
			if strings.EqualFold(trimmed, cleanCode) && !valid {
				valid = true
				continue // consume used code
			}
			if trimmed != "" {
				remainingCodes = append(remainingCodes, trimmed)
			}
		}
		if valid {
			user.TwoFactorBackupCodes = strings.Join(remainingCodes, ",")
			_ = s.db.Model(&user).Update("two_factor_backup_codes", user.TwoFactorBackupCodes)
		}
	}

	if !valid {
		return nil, errors.New("kode autentikasi 2FA atau kode cadangan tidak valid")
	}

	now := time.Now()
	_ = s.db.Model(&models.User{}).Where("id = ?", user.ID).Update("updated_at", now)

	token, err := config.GenerateToken(&user)
	if err != nil {
		return nil, errors.New("gagal menerbitkan token otentikasi")
	}

	return &AuthResult{
		Token: token,
		User:  user,
		Role:  string(user.Role),
	}, nil
}

// GetUserProfile retrieves full user profile by user ID
func (s *AuthService) GetUserProfile(userID string) (*models.User, error) {
	if s.db == nil {
		return nil, errors.New("database connection is unavailable")
	}

	var user models.User
	if err := s.db.Preload("Pages").Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, errors.New("user tidak ditemukan")
	}

	return &user, nil
}
