package billing

import (
	"crypto/sha512"
	"encoding/hex"
	"testing"

	"klikin-backend/config"
)

func TestMidtransVerifySignature(t *testing.T) {
	cfg := &config.Config{
		MidtransMerchantID:   "G123456789",
		MidtransClientKey:    "SB-Mid-client-test",
		MidtransServerKey:    "SB-Mid-server-secret123",
		MidtransIsProduction: false,
		ClientOrigin:         "https://klikin.id",
	}

	svc := NewMidtransService(nil, cfg)

	orderID := "INV-2026-1001"
	statusCode := "200"
	grossAmount := "32190.00"

	hasher := sha512.New()
	hasher.Write([]byte(orderID + statusCode + grossAmount + cfg.MidtransServerKey))
	validSig := hex.EncodeToString(hasher.Sum(nil))

	if !svc.VerifySignature(orderID, statusCode, grossAmount, validSig) {
		t.Fatalf("expected valid signature to pass verification")
	}

	if svc.VerifySignature(orderID, statusCode, "0.00", validSig) {
		t.Fatalf("expected tampered gross_amount to fail signature verification")
	}
}
