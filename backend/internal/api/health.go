package api

import "net/http"

// handleHealth reports that the core process is alive and returns its version.
// Registered at GET /api/health by router.go.
// The version variable is injected at link time via -ldflags (see Makefile/Dockerfile).
func handleHealth(w http.ResponseWriter, r *http.Request) {
	JSONData(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"version": version,
	})
}

// handleReady reports that the core is ready to serve requests.
// Registered at GET /api/ready by router.go.
func handleReady(w http.ResponseWriter, r *http.Request) {
	JSONData(w, http.StatusOK, map[string]bool{
		"ready": true,
	})
}
