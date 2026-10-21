package auth

import (
	"encoding/json"
	"net/http"

	"klikin-backend/middlewares"
	authService "klikin-backend/services/auth"
	"klikin-backend/views"
)

type AuthController struct {
	service *authService.AuthService
}

func NewAuthController(service *authService.AuthService) *AuthController {
	return &AuthController{service: service}
}

// Register handles user registration
func (c *AuthController) Register(w http.ResponseWriter, r *http.Request) {
	var dto authService.RegisterDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	result, err := c.service.Register(dto)
	if err != nil {
		views.RenderError(w, http.StatusBadRequest, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusCreated, "Pendaftaran berhasil", result)
}

type LoginPayload struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Login handles login for SuperAdmin and AccountOwner
func (c *AuthController) Login(w http.ResponseWriter, r *http.Request) {
	var payload LoginPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		views.RenderError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	result, err := c.service.Login(payload.Email, payload.Password)
	if err != nil {
		views.RenderError(w, http.StatusUnauthorized, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Login berhasil", result)
}

// GetMe returns authenticated user session info
func (c *AuthController) GetMe(w http.ResponseWriter, r *http.Request) {
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		views.RenderError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	user, err := c.service.GetUserProfile(claims.UserID)
	if err != nil {
		views.RenderError(w, http.StatusNotFound, err.Error())
		return
	}

	views.RenderSuccess(w, http.StatusOK, "Sesi pengguna valid", user)
}
