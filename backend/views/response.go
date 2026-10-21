package views

import (
	"encoding/json"
	"net/http"
	"time"
)

// Response represents a standard JSON API response structure (View layer)
type Response struct {
	Success   bool      `json:"success"`
	Message   string    `json:"message,omitempty"`
	Data      any       `json:"data,omitempty"`
	Error     string    `json:"error,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// JSON renders a raw JSON response with given HTTP status code
func JSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

// RenderSuccess formats and renders a successful response view
func RenderSuccess(w http.ResponseWriter, statusCode int, message string, data any) {
	resp := Response{
		Success:   true,
		Message:   message,
		Data:      data,
		Timestamp: time.Now().UTC(),
	}
	JSON(w, statusCode, resp)
}

// RenderError formats and renders an error response view
func RenderError(w http.ResponseWriter, statusCode int, errorMessage string) {
	resp := Response{
		Success:   false,
		Error:     errorMessage,
		Timestamp: time.Now().UTC(),
	}
	JSON(w, statusCode, resp)
}
