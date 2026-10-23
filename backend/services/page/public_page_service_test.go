package page

import (
	"errors"
	"testing"

	"golang.org/x/crypto/bcrypt"
	"klikin-backend/models"
)

func TestEvaluatePageAccessPasswordAndStatus(t *testing.T) {
	hashed, err := bcrypt.GenerateFromPassword([]byte("rahasia123"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	basePage := models.BioPage{
		ID:                  "page_1",
		Slug:                "tokokopi",
		IsPublished:         true,
		IsPasswordProtected: true,
		PagePassword:        string(hashed),
		CustomCSS:           "body { background: #000; }",
		Links:               []models.Link{{ID: "lnk_1", Title: "Order"}},
	}

	// 1. Suspended owner must be blocked
	if _, err := evaluatePageAccess(cloneBioPage(basePage), "suspended", "rahasia123"); !errors.Is(err, ErrOwnerSuspended) {
		t.Fatalf("expected ErrOwnerSuspended, got %v", err)
	}

	// 2. Wrong password must lock page and strip links & custom CSS
	lockedPage, err := evaluatePageAccess(cloneBioPage(basePage), "active", "salah")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !lockedPage.IsLocked || len(lockedPage.Links) != 0 || lockedPage.CustomCSS != "" {
		t.Fatalf("expected locked page to strip sensitive content, got %+v", lockedPage)
	}

	// 3. Correct password must unlock page and preserve links while stripping password hash
	unlockedPage, err := evaluatePageAccess(cloneBioPage(basePage), "active", "rahasia123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if unlockedPage.IsLocked || len(unlockedPage.Links) != 1 || unlockedPage.PagePassword != "" {
		t.Fatalf("expected unlocked page with 1 link and empty password hash, got %+v", unlockedPage)
	}
}
