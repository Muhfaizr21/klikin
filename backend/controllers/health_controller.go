package controllers

import (
	"net/http"

	"klikin-backend/views"
)

type HealthController struct{}

func NewHealthController() *HealthController {
	return &HealthController{}
}

func (c *HealthController) Check(w http.ResponseWriter, r *http.Request) {
	data := map[string]string{
		"service": "klikin-backend",
		"status":  "running",
		"version": "1.0.0",
	}

	views.RenderSuccess(w, http.StatusOK, "System is healthy", data)
}
