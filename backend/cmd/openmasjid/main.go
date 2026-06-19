package main

import (
	"bufio"
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"golang.org/x/term"

	"github.com/OpenMasjidOS/OpenMasjidOS/internal/api"
	"github.com/OpenMasjidOS/OpenMasjidOS/internal/auth"
	"github.com/OpenMasjidOS/OpenMasjidOS/internal/config"
)

func main() {
	// Load configuration from environment variables with sensible defaults.
	cfg := config.Load()

	// Healthcheck mode: the container HEALTHCHECK invokes the binary with
	// -healthcheck. The final image is distroless (no shell, no wget/curl), so
	// the binary checks itself by hitting its own /api/health and exiting 0/1.
	if len(os.Args) > 1 && (os.Args[1] == "-healthcheck" || os.Args[1] == "--healthcheck") {
		os.Exit(healthcheck(cfg.Port))
	}

	// Password reset: `openmasjid -passwd [newpassword]`. Run inside the
	// container (docker exec -it openmasjid-core /openmasjid -passwd) to recover
	// a forgotten admin password without losing any data.
	if len(os.Args) > 1 && (os.Args[1] == "-passwd" || os.Args[1] == "--passwd") {
		os.Exit(resetPassword(cfg.DataDir, os.Args[2:]))
	}

	// Structured JSON logging so log aggregators (e.g. Docker log drivers) can
	// parse fields without brittle regex. Level is INFO by default.
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Build the HTTP router. All route registration, middleware, and handler
	// wiring live in the api package — main stays thin.
	router, err := api.NewRouter(cfg)
	if err != nil {
		slog.Error("failed to initialise router", "err", err)
		os.Exit(1)
	}

	addr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:    addr,
		Handler: router,
		// Conservative timeouts to protect against slow clients.
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Capture SIGINT (Ctrl-C) and SIGTERM (Docker / systemd stop) so we can
	// drain in-flight requests before exiting.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Start serving in a goroutine so the main goroutine can block on the
	// signal channel below.
	go func() {
		slog.Info("OpenMasjidOS core is ready", "address", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	// Block until a shutdown signal arrives.
	sig := <-quit
	slog.Info("shutting down", "signal", sig.String())

	// Give in-flight requests up to 5 seconds to finish before forcibly closing.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("graceful shutdown failed; forcing close", "err", err)
		os.Exit(1)
	}

	slog.Info("server stopped cleanly")
}

// resetPassword sets a new admin password from the terminal (or from an
// argument, for scripting). Returns a process exit code. It preserves the
// existing username and only rewrites the password hash in auth.json.
func resetPassword(dataDir string, args []string) int {
	store, err := auth.NewStore(dataDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Could not open the credential store: %v\n", err)
		return 1
	}

	username := store.Username()
	if username == "" {
		username = "admin"
	}

	var pw string
	if len(args) > 0 && args[0] != "" {
		// Non-interactive: password passed as an argument.
		pw = args[0]
	} else {
		first, err := readSecret(fmt.Sprintf("New password for %q: ", username))
		if err != nil {
			fmt.Fprintf(os.Stderr, "Could not read input: %v\n", err)
			return 1
		}
		second, err := readSecret("Confirm password: ")
		if err != nil {
			fmt.Fprintf(os.Stderr, "Could not read input: %v\n", err)
			return 1
		}
		if first != second {
			fmt.Fprintln(os.Stderr, "Those passwords didn't match. Nothing was changed.")
			return 1
		}
		pw = first
	}

	if len(pw) < 8 {
		fmt.Fprintln(os.Stderr, "Password must be at least 8 characters. Nothing was changed.")
		return 1
	}

	if err := store.SetCredentials(username, pw); err != nil {
		fmt.Fprintf(os.Stderr, "Could not save the new password: %v\n", err)
		return 1
	}

	fmt.Fprintf(os.Stderr, "Password updated for %q. You can sign in now.\n", username)
	return 0
}

// readSecret prompts on stderr and reads a line from stdin. When stdin is a
// terminal the input is not echoed; otherwise (piped) it falls back to a plain
// read so the command still works non-interactively.
func readSecret(prompt string) (string, error) {
	fmt.Fprint(os.Stderr, prompt)
	fd := int(os.Stdin.Fd())
	if term.IsTerminal(fd) {
		b, err := term.ReadPassword(fd)
		fmt.Fprintln(os.Stderr)
		return strings.TrimSpace(string(b)), err
	}
	line, err := bufio.NewReader(os.Stdin).ReadString('\n')
	return strings.TrimSpace(line), err
}

// healthcheck performs a single GET against the local /api/health endpoint and
// returns a process exit code (0 = healthy, 1 = not). Used by the container
// HEALTHCHECK; kept dependency-free so it works in the distroless image.
func healthcheck(port string) int {
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("http://127.0.0.1:" + port + "/api/health")
	if err != nil {
		return 1
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 1
	}
	return 0
}
