package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"fmt"
	"strings"
	"time"
)

// GenerateRandomBase32Secret creates a 160-bit (20 bytes) base32 encoded secret for TOTP apps
func GenerateRandomBase32Secret() string {
	bytes := make([]byte, 20)
	_, _ = rand.Read(bytes)
	return base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(bytes)
}

// GenerateBackupCodes produces 8 unique human-readable backup recovery codes
func GenerateBackupCodes() []string {
	codes := make([]string, 8)
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	for i := 0; i < 8; i++ {
		bytes := make([]byte, 8)
		_, _ = rand.Read(bytes)
		var sb strings.Builder
		sb.WriteString("KLIK-")
		for j := 0; j < 4; j++ {
			sb.WriteByte(chars[int(bytes[j])%len(chars)])
		}
		sb.WriteRune('-')
		for j := 4; j < 8; j++ {
			sb.WriteByte(chars[int(bytes[j])%len(chars)])
		}
		codes[i] = sb.String()
	}
	return codes
}

// ValidateTOTPCode verifies a 6-digit TOTP code against a base32 secret with +/- 1 time step drift
func ValidateTOTPCode(secretBase32 string, userCode string) bool {
	cleanCode := strings.TrimSpace(userCode)
	if len(cleanCode) != 6 {
		return false
	}

	secretBytes, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(strings.TrimSpace(secretBase32)))
	if err != nil {
		// Try standard padding decoding if unpadded fails
		secretBytes, err = base32.StdEncoding.DecodeString(strings.ToUpper(strings.TrimSpace(secretBase32)))
		if err != nil {
			return false
		}
	}

	currentStep := time.Now().Unix() / 30
	// Check windows: current step, previous step (-30s), next step (+30s)
	for drift := int64(-1); drift <= 1; drift++ {
		step := currentStep + drift
		expectedCode := calculateCode(secretBytes, step)
		if expectedCode == cleanCode {
			return true
		}
	}

	return false
}

func calculateCode(key []byte, step int64) string {
	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, uint64(step))

	mac := hmac.New(sha1.New, key)
	mac.Write(buf)
	h := mac.Sum(nil)

	offset := h[len(h)-1] & 0x0f
	binaryCode := binary.BigEndian.Uint32(h[offset:offset+4]) & 0x7fffffff
	code := binaryCode % 1000000

	return fmt.Sprintf("%06d", code)
}
