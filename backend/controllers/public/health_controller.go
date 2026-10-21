package public

import (
	"net/http"

	"klikin-backend/config"
	"klikin-backend/views"
)

type HealthController struct {
	cfg *config.Config
}

func NewHealthController(cfg *config.Config) *HealthController {
	return &HealthController{cfg: cfg}
}

func (c *HealthController) Check(w http.ResponseWriter, r *http.Request) {
	dbStatus := "disconnected"
	if config.DB != nil {
		if sqlDB, err := config.DB.DB(); err == nil && sqlDB.Ping() == nil {
			dbStatus = "connected"
		}
	}

	data := map[string]interface{}{
		"status":      "ok",
		"environment": c.cfg.AppEnv,
		"database":    dbStatus,
	}

	views.RenderSuccess(w, http.StatusOK, "Klikin API operational", data)
}
