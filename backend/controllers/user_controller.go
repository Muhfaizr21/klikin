package controllers

import (
	"net/http"
	"time"

	"klikin-backend/models"
	"klikin-backend/views"
)

type UserController struct{}

func NewUserController() *UserController {
	return &UserController{}
}

// GetProfile returns sample authenticated account profile
func (c *UserController) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Sample data for initial setup
	dummyUser := models.User{
		ID:        "usr_101",
		Email:     "kreator@klikin.id",
		Username:  "kreator",
		Role:      models.RoleAccountOwner,
		IsPro:     true,
		CreatedAt: time.Now().Add(-24 * time.Hour * 30),
		UpdatedAt: time.Now(),
	}

	views.RenderSuccess(w, http.StatusOK, "User profile retrieved successfully", dummyUser)
}
