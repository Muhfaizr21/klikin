package page

import (
	"crypto/subtle"
	"errors"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"klikin-backend/models"
)

var (
	ErrPageNotFound        = errors.New("Halaman bio tidak ditemukan atau belum dipublikasi")
	ErrPageTakenDown       = errors.New("Halaman ini telah dinonaktifkan oleh Tim Keamanan & Moderasi Klikin karena melanggar Ketentuan Layanan.")
	ErrOwnerSuspended      = errors.New("Halaman bio ini sedang ditangguhkan sementara karena status akun pemilik.")
	ErrDatabaseUnavailable = errors.New("Database not available")
)

// PublicPageProvider defines the contract for resolving public bio pages (DIP)
type PublicPageProvider interface {
	GetPublishedPage(slug string, providedPassword string) (*models.BioPage, error)
}

type cachedPageEntry struct {
	page        models.BioPage
	ownerStatus string
	expiresAt   time.Time
}

var (
	publicPageCacheMu sync.RWMutex
	publicPageCache   = make(map[string]cachedPageEntry)
)

const publicPageCacheTTL = 15 * time.Second

// InvalidatePublicPageCache clears the in-memory public bio page cache when owner or admin mutates page state
func InvalidatePublicPageCache() {
	publicPageCacheMu.Lock()
	publicPageCache = make(map[string]cachedPageEntry)
	publicPageCacheMu.Unlock()
}

type PublicPageService struct {
	db *gorm.DB
}

func NewPublicPageService(db *gorm.DB) *PublicPageService {
	return &PublicPageService{db: db}
}

func cloneBioPage(src models.BioPage) models.BioPage {
	dst := src
	if src.Blocks != nil {
		dst.Blocks = make([]models.BioBlock, len(src.Blocks))
		copy(dst.Blocks, src.Blocks)
	}
	if src.Links != nil {
		dst.Links = make([]models.Link, len(src.Links))
		copy(dst.Links, src.Links)
	}
	if src.EmailCapture != nil {
		capCopy := *src.EmailCapture
		dst.EmailCapture = &capCopy
	}
	return dst
}

// GetPublishedPage retrieves a published bio page with short TTL caching and password gate evaluation
func (s *PublicPageService) GetPublishedPage(slug string, providedPassword string) (*models.BioPage, error) {
	cleanSlug := strings.TrimSpace(slug)
	if cleanSlug == "" {
		return nil, ErrPageNotFound
	}
	if s.db == nil {
		return nil, ErrDatabaseUnavailable
	}

	now := time.Now()
	publicPageCacheMu.RLock()
	if entry, ok := publicPageCache[cleanSlug]; ok && now.Before(entry.expiresAt) {
		publicPageCacheMu.RUnlock()
		return evaluatePageAccess(cloneBioPage(entry.page), entry.ownerStatus, providedPassword)
	}
	publicPageCacheMu.RUnlock()

	var page models.BioPage
	err := s.db.Where("slug = ? AND is_published = ?", cleanSlug, true).First(&page).Error
	if err != nil {
		var cd models.CustomDomain
		if errCd := s.db.Where("domain = ? AND status = ?", cleanSlug, models.DomainStatusActive).First(&cd).Error; errCd == nil {
			err = s.db.Where("id = ? AND is_published = ?", cd.PageID, true).First(&page).Error
		}
	}

	if err != nil {
		var checkPage models.BioPage
		if errTd := s.db.Select("moderation_status", "takedown_reason").Where("slug = ?", cleanSlug).First(&checkPage).Error; errTd == nil && checkPage.ModerationStatus == "taken_down" {
			return nil, ErrPageTakenDown
		}
		return nil, ErrPageNotFound
	}

	if page.ModerationStatus == "taken_down" {
		return nil, ErrPageTakenDown
	}

	var (
		blocks       []models.BioBlock
		links        []models.Link
		emailCapture models.EmailCaptureConfig
		hasEmailCap  bool
		owner        models.User
		errOwner     error
		wg           sync.WaitGroup
	)

	wg.Add(4)
	go func() {
		defer wg.Done()
		_ = s.db.Where("page_id = ? AND is_active = ?", page.ID, true).
			Order("bio_blocks.order asc, bio_blocks.created_at asc").
			Find(&blocks).Error
	}()
	go func() {
		defer wg.Done()
		_ = s.db.Where("page_id = ? AND is_active = ?", page.ID, true).
			Order("links.order asc, links.created_at asc").
			Find(&links).Error
	}()
	go func() {
		defer wg.Done()
		if errCap := s.db.Where("page_id = ?", page.ID).First(&emailCapture).Error; errCap == nil {
			hasEmailCap = true
		}
	}()
	go func() {
		defer wg.Done()
		errOwner = s.db.Select("is_pro", "status").Where("id = ?", page.UserID).First(&owner).Error
	}()
	wg.Wait()

	ownerStatus := "active"
	if errOwner == nil {
		ownerStatus = owner.Status
		page.IsPro = owner.IsPro
	}

	page.Blocks = blocks
	page.Links = links
	if hasEmailCap {
		page.EmailCapture = &emailCapture
	}

	publicPageCacheMu.Lock()
	publicPageCache[cleanSlug] = cachedPageEntry{
		page:        cloneBioPage(page),
		ownerStatus: ownerStatus,
		expiresAt:   now.Add(publicPageCacheTTL),
	}
	publicPageCacheMu.Unlock()

	return evaluatePageAccess(page, ownerStatus, providedPassword)
}

func evaluatePageAccess(page models.BioPage, ownerStatus string, reqPass string) (*models.BioPage, error) {
	if ownerStatus == "suspended" || ownerStatus == "banned" {
		return nil, ErrOwnerSuspended
	}
	if page.ModerationStatus == "taken_down" {
		return nil, ErrPageTakenDown
	}

	if page.IsPasswordProtected && page.PagePassword != "" {
		isMatch := false
		if reqPass != "" {
			if errCheck := bcrypt.CompareHashAndPassword([]byte(page.PagePassword), []byte(reqPass)); errCheck == nil {
				isMatch = true
			} else if subtle.ConstantTimeCompare([]byte(reqPass), []byte(page.PagePassword)) == 1 {
				isMatch = true
			}
		}

		if !isMatch {
			page.IsLocked = true
			page.Blocks = nil
			page.Links = nil
			page.EmailCapture = nil
			page.CustomCSS = ""
		}
	}
	page.PagePassword = ""

	return &page, nil
}
