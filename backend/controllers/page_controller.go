package controllers

import (
	"net/http"
	"strings"
	"time"

	"klikin-backend/models"
	"klikin-backend/views"
)

type PageController struct{}

func NewPageController() *PageController {
	return &PageController{}
}

// BioPageDetailsView combines BioPage with its Links
type BioPageDetailsView struct {
	Page  models.BioPage `json:"page"`
	Links []models.Link  `json:"links"`
}

// GetBySlug handles GET /api/pages/{slug}
func (c *PageController) GetBySlug(w http.ResponseWriter, r *http.Request) {
	// Extract slug from URL path, e.g. /api/pages/demo
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	slug := ""
	if len(parts) >= 3 {
		slug = parts[2]
	}

	if slug == "" {
		views.RenderError(w, http.StatusBadRequest, "Page slug is required")
		return
	}

	// Sample mock data representing a Klikin link-in-bio page
	page := models.BioPage{
		ID:          "pg_001",
		UserID:      "usr_101",
		Slug:        slug,
		Title:       "Official Link " + strings.ToUpper(slug),
		Bio:         "Welcome to my official links page! Powered by Klikin 🚀",
		Theme:       "modern-dark",
		IsPublished: true,
		CreatedAt:   time.Now().Add(-24 * time.Hour * 14),
		UpdatedAt:   time.Now(),
	}

	links := []models.Link{
		{
			ID:         "lnk_01",
			PageID:     page.ID,
			Title:      "🛍️ Toko Online Official",
			URL:        "https://tokopedia.com",
			Order:      1,
			IsActive:   true,
			ClickCount: 1420,
			CreatedAt:  time.Now().Add(-24 * time.Hour * 10),
			UpdatedAt:  time.Now(),
		},
		{
			ID:         "lnk_02",
			PageID:     page.ID,
			Title:      "💬 WhatsApp Customer Service",
			URL:        "https://wa.me/628123456789",
			Order:      2,
			IsActive:   true,
			ClickCount: 980,
			CreatedAt:  time.Now().Add(-24 * time.Hour * 10),
			UpdatedAt:  time.Now(),
		},
		{
			ID:         "lnk_03",
			PageID:     page.ID,
			Title:      "🎬 YouTube Channel",
			URL:        "https://youtube.com",
			Order:      3,
			IsActive:   true,
			ClickCount: 654,
			CreatedAt:  time.Now().Add(-24 * time.Hour * 5),
			UpdatedAt:  time.Now(),
		},
	}

	views.RenderSuccess(w, http.StatusOK, "Page fetched successfully", BioPageDetailsView{
		Page:  page,
		Links: links,
	})
}
