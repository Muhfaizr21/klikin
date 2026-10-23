package billing

import (
	"bytes"
	"crypto/sha512"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"gorm.io/gorm"
	"klikin-backend/config"
	"klikin-backend/models"
)

type MidtransService struct {
	db           *gorm.DB
	merchantID   string
	clientKey    string
	serverKey    string
	isProduction bool
	clientOrigin string
	httpClient   *http.Client
}

func NewMidtransService(db *gorm.DB, cfg *config.Config) *MidtransService {
	origin := strings.TrimRight(strings.TrimSpace(strings.Split(cfg.ClientOrigin, ",")[0]), "/")
	return &MidtransService{
		db:           db,
		merchantID:   cfg.MidtransMerchantID,
		clientKey:    cfg.MidtransClientKey,
		serverKey:    cfg.MidtransServerKey,
		isProduction: cfg.MidtransIsProduction,
		clientOrigin: origin,
		httpClient:   &http.Client{Timeout: 15 * time.Second},
	}
}

func (s *MidtransService) resolveCredentials() (merchantID string, clientKey string, serverKey string, isProd bool) {
	merchantID = s.merchantID
	clientKey = s.clientKey
	serverKey = s.serverKey
	isProd = s.isProduction

	if s.db != nil {
		var setting models.PlatformSetting
		if err := s.db.Select("midtrans_merchant_id", "midtrans_client_key", "midtrans_server_key", "payment_test_mode").First(&setting).Error; err == nil {
			if mid := strings.TrimSpace(setting.MidtransMerchantID); mid != "" {
				merchantID = mid
			}
			if ck := strings.TrimSpace(setting.MidtransClientKey); ck != "" && !strings.Contains(ck, "•") && !strings.Contains(ck, "*") {
				clientKey = ck
			}
			if sk := strings.TrimSpace(setting.MidtransServerKey); sk != "" && !strings.Contains(sk, "•") && !strings.Contains(sk, "*") {
				serverKey = sk
			}
			isProd = !setting.PaymentTestMode
		}
	}
	return merchantID, clientKey, serverKey, isProd
}

func (s *MidtransService) GetClientKey() string {
	_, ck, _, _ := s.resolveCredentials()
	return ck
}

func (s *MidtransService) IsProduction() bool {
	_, _, _, isProd := s.resolveCredentials()
	return isProd
}

func (s *MidtransService) GetMerchantID() string {
	mid, _, _, _ := s.resolveCredentials()
	return mid
}

func (s *MidtransService) GetSnapJSURL() string {
	if s.IsProduction() {
		return "https://app.midtrans.com/snap/snap.js"
	}
	return "https://app.sandbox.midtrans.com/snap/snap.js"
}

// Snap API Endpoints
func (s *MidtransService) getSnapBaseURL() string {
	if s.IsProduction() {
		return "https://app.midtrans.com/snap/v1/transactions"
	}
	return "https://app.sandbox.midtrans.com/snap/v1/transactions"
}

func (s *MidtransService) getCoreAPIBaseURL() string {
	if s.IsProduction() {
		return "https://api.midtrans.com/v2"
	}
	return "https://api.sandbox.midtrans.com/v2"
}

// Snap Transaction Request Payload
type SnapTransactionRequest struct {
	TransactionDetails SnapTransactionDetails `json:"transaction_details"`
	CustomerDetails    SnapCustomerDetails    `json:"customer_details"`
	ItemDetails        []SnapItemDetail       `json:"item_details"`
	Callbacks          *SnapCallbacks         `json:"callbacks,omitempty"`
	Expiry             *SnapExpiry            `json:"expiry,omitempty"`
}

type SnapExpiry struct {
	Unit     string `json:"unit"`
	Duration int    `json:"duration"`
}

type SnapTransactionDetails struct {
	OrderID     string `json:"order_id"`
	GrossAmount int64  `json:"gross_amount"`
}

type SnapCustomerDetails struct {
	FirstName string `json:"first_name"`
	Email     string `json:"email"`
}

type SnapItemDetail struct {
	ID       string `json:"id"`
	Price    int64  `json:"price"`
	Quantity int    `json:"quantity"`
	Name     string `json:"name"`
}

type SnapCallbacks struct {
	Finish string `json:"finish,omitempty"`
}

type SnapResponse struct {
	Token         string   `json:"token"`
	RedirectURL   string   `json:"redirect_url"`
	ErrorMessages []string `json:"error_messages,omitempty"`
}

// CreateSnapTransaction generates a Midtrans Snap payment token and redirect URL
func (s *MidtransService) CreateSnapTransaction(orderID string, amount int64, customerName, customerEmail, planName string, clientOrigin string) (string, string, error) {
	if amount <= 0 {
		return "", "", errors.New("jumlah pembayaran harus lebih dari 0")
	}

	resolvedOrigin := strings.TrimRight(strings.TrimSpace(clientOrigin), "/")
	if resolvedOrigin == "" {
		resolvedOrigin = s.clientOrigin
	}
	finishURL := fmt.Sprintf("%s/owner/billing", resolvedOrigin)

	reqPayload := SnapTransactionRequest{
		TransactionDetails: SnapTransactionDetails{
			OrderID:     orderID,
			GrossAmount: amount,
		},
		CustomerDetails: SnapCustomerDetails{
			FirstName: customerName,
			Email:     customerEmail,
		},
		ItemDetails: []SnapItemDetail{
			{
				ID:       "pro-subscription",
				Price:    amount,
				Quantity: 1,
				Name:     planName,
			},
		},
		Callbacks: &SnapCallbacks{
			Finish: finishURL,
		},
		Expiry: &SnapExpiry{
			Unit:     "hour",
			Duration: 24,
		},
	}

	reqBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return "", "", err
	}

	req, err := http.NewRequest("POST", s.getSnapBaseURL(), bytes.NewBuffer(reqBytes))
	if err != nil {
		return "", "", err
	}

	// Basic Auth with ServerKey:
	_, _, activeServerKey, _ := s.resolveCredentials()
	if activeServerKey == "" {
		return "", "", errors.New("kredensial Midtrans Server Key belum diatur di Pengaturan Platform (Super Admin > Pengaturan Platform > Gateway Pembayaran)")
	}
	authHeader := "Basic " + base64.StdEncoding.EncodeToString([]byte(activeServerKey+":"))
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		if s.IsProduction() || config.GetAppEnv() == "production" {
			return "", "", fmt.Errorf("gagal menghubungi gateway pembayaran Midtrans: %w", err)
		}
		log.Printf("⚠️ Midtrans API network call error: %v. Fallback to mock token for dev environment.", err)
		mockToken := fmt.Sprintf("mock_snap_%d", time.Now().UnixNano())
		mockRedirect := fmt.Sprintf("https://app.sandbox.midtrans.com/snap/v2/vtweb/%s", mockToken)
		return mockToken, mockRedirect, nil
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 400 {
		log.Printf("⚠️ Midtrans API returned status %d: %s", resp.StatusCode, string(bodyBytes))
		// If Midtrans rejected payload (e.g. invalid server key or order_id duplicate), return meaningful error
		var snapErr SnapResponse
		_ = json.Unmarshal(bodyBytes, &snapErr)
		if len(snapErr.ErrorMessages) > 0 {
			return "", "", fmt.Errorf("midtrans error: %s", strings.Join(snapErr.ErrorMessages, ", "))
		}
		return "", "", fmt.Errorf("midtrans server error (status %d)", resp.StatusCode)
	}

	var snapResp SnapResponse
	if err := json.Unmarshal(bodyBytes, &snapResp); err != nil {
		return "", "", err
	}

	return snapResp.Token, snapResp.RedirectURL, nil
}

// MidtransNotificationPayload represents the HTTP notification POST from Midtrans Webhook
type MidtransNotificationPayload struct {
	OrderID           string `json:"order_id"`
	TransactionStatus string `json:"transaction_status"`
	StatusCode        string `json:"status_code"`
	GrossAmount       string `json:"gross_amount"`
	PaymentType       string `json:"payment_type"`
	SignatureKey      string `json:"signature_key"`
	FraudStatus       string `json:"fraud_status,omitempty"`
	TransactionTime   string `json:"transaction_time,omitempty"`
	SettlementTime    string `json:"settlement_time,omitempty"`
	TransactionID     string `json:"transaction_id,omitempty"`
}

// VerifySignature validates that notification is authentically from Midtrans
func (s *MidtransService) VerifySignature(orderID, statusCode, grossAmount, signatureKey string) bool {
	_, _, activeServerKey, _ := s.resolveCredentials()
	if activeServerKey == "" {
		return false
	}
	raw := orderID + statusCode + grossAmount + activeServerKey
	hasher := sha512.New()
	hasher.Write([]byte(raw))
	expectedHash := hex.EncodeToString(hasher.Sum(nil))

	return strings.EqualFold(expectedHash, signatureKey)
}

// HandleNotification processes the payment result from Midtrans Webhook
func (s *MidtransService) HandleNotification(payload MidtransNotificationPayload) error {
	if s.db == nil {
		return errors.New("database not available")
	}

	// Enforce cryptographic SHA-512 signature validation on webhook notifications
	_, _, activeServerKey, _ := s.resolveCredentials()
	if activeServerKey == "" {
		return errors.New("kredensial Midtrans Server Key belum dikonfigurasi di Pengaturan Platform (akses webhook ditolak)")
	}
	if !s.VerifySignature(payload.OrderID, payload.StatusCode, payload.GrossAmount, payload.SignatureKey) {
		return errors.New("signature_key Midtrans tidak valid (akses ditolak)")
	}

	var invoice models.Invoice
	if err := s.db.Where("invoice_number = ? OR id = ?", payload.OrderID, payload.OrderID).First(&invoice).Error; err != nil {
		return fmt.Errorf("invoice dengan nomor %s tidak ditemukan", payload.OrderID)
	}

	now := time.Now()
	status := strings.ToLower(payload.TransactionStatus)

	isPaid := false
	if status == "settlement" {
		isPaid = true
	} else if status == "capture" {
		if payload.FraudStatus == "accept" || payload.FraudStatus == "" {
			isPaid = true
		}
	}

	if isPaid {
		invoice.Status = "paid"
		invoice.PaidAt = &now
		if payload.PaymentType != "" {
			invoice.PaymentChannel = payload.PaymentType
		}
		invoice.Notes = fmt.Sprintf("Pembayaran berhasil dikonfirmasi via Midtrans (%s). Trx ID: %s", payload.PaymentType, payload.TransactionID)
		_ = s.db.Save(&invoice)

		// Activate / Renew Pro Subscription & synchronize Price + BillingCycle
		var sub models.Subscription
		if err := s.db.Where("id = ? OR user_id = ?", invoice.SubscriptionID, invoice.UserID).First(&sub).Error; err == nil {
			sub.Plan = models.PlanPro
			sub.Status = models.SubscriptionStatusActive
			if invoice.BillingCycle != "" {
				sub.BillingCycle = invoice.BillingCycle
			}
			if invoice.Amount > 0 {
				sub.Price = invoice.Amount
			}
			sub.CurrentPeriodStart = now
			if invoice.BillingCycle == "yearly" {
				sub.CurrentPeriodEnd = now.AddDate(1, 0, 0)
			} else {
				sub.CurrentPeriodEnd = now.AddDate(0, 1, 0)
			}
			sub.CancelAtPeriodEnd = false
			sub.UpdatedAt = now
			_ = s.db.Save(&sub)
		}

		// Ensure User has is_pro = true
		_ = s.db.Model(&models.User{}).Where("id = ?", invoice.UserID).Update("is_pro", true)

		// Log to Financial Audit
		finLog := models.FinancialAuditLog{
			ID:        fmt.Sprintf("fin_%d", now.UnixNano()),
			AdminID:   "midtrans_webhook",
			AdminName: "Midtrans Payment Gateway",
			Action:    "PAYMENT_SETTLED",
			Target:    invoice.InvoiceNumber,
			Amount:    invoice.Total,
			Details:   fmt.Sprintf("Invoice %s lunas via Midtrans %s (Trx ID: %s)", invoice.InvoiceNumber, payload.PaymentType, payload.TransactionID),
			IPAddress: "midtrans-webhook",
			CreatedAt: now,
		}
		_ = s.db.Create(&finLog)

	} else if status == "expire" || status == "cancel" || status == "deny" {
		invoice.Status = "cancelled"
		invoice.Notes = fmt.Sprintf("Otomatis dibatalkan: pembayaran kedaluwarsa atau dibatalkan via Midtrans (%s)", status)
		_ = s.db.Save(&invoice)
	}

	return nil
}

// CheckStatus queries Midtrans Core API directly for transaction status
func (s *MidtransService) CheckStatus(orderID string) (string, error) {
	url := fmt.Sprintf("%s/%s/status", s.getCoreAPIBaseURL(), orderID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	_, _, activeServerKey, _ := s.resolveCredentials()
	if activeServerKey == "" {
		return "unknown", errors.New("kredensial Midtrans Server Key belum dikonfigurasi di Pengaturan Platform")
	}
	authHeader := "Basic " + base64.StdEncoding.EncodeToString([]byte(activeServerKey+":"))
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Accept", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == 404 {
		return "not_found", nil
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return "", err
	}

	if code, ok := result["status_code"].(string); ok && code == "404" {
		return "not_found", nil
	}

	if status, ok := result["transaction_status"].(string); ok {
		return strings.ToLower(status), nil
	}

	return "unknown", nil
}

// CancelTransaction sends cancel request to Midtrans for a pending transaction
func (s *MidtransService) CancelTransaction(orderID string) error {
	url := fmt.Sprintf("%s/%s/cancel", s.getCoreAPIBaseURL(), orderID)
	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return err
	}

	_, _, activeServerKey, _ := s.resolveCredentials()
	if activeServerKey == "" {
		return errors.New("kredensial Midtrans Server Key belum dikonfigurasi di Pengaturan Platform")
	}
	authHeader := "Basic " + base64.StdEncoding.EncodeToString([]byte(activeServerKey+":"))
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}
