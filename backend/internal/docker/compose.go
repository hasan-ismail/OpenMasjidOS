// Package docker wraps all interaction with the Docker engine. Per the project
// conventions, `docker compose` is the one place we shell out — every compose
// invocation goes through here against the mounted host socket.
package docker

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

const composeFileName = "docker-compose.yml"

// ComposeUp writes composeYAML to <projectDir>/docker-compose.yml and starts it
// as a detached compose project. It returns the combined stdout+stderr so the
// caller can surface diagnostics (e.g. an invalid compose file) to the user.
func ComposeUp(ctx context.Context, projectDir, project, composeYAML string) (string, error) {
	if err := os.MkdirAll(projectDir, 0o755); err != nil {
		return "", fmt.Errorf("creating project dir: %w", err)
	}
	file := filepath.Join(projectDir, composeFileName)
	if err := os.WriteFile(file, []byte(composeYAML), 0o644); err != nil {
		return "", fmt.Errorf("writing compose file: %w", err)
	}
	return run(ctx, "compose", "-p", project, "-f", file, "up", "-d", "--remove-orphans")
}

// ComposeDown stops and removes a compose project. When removeData is true,
// named volumes are deleted as well.
func ComposeDown(ctx context.Context, projectDir, project string, removeData bool) (string, error) {
	file := filepath.Join(projectDir, composeFileName)
	args := []string{"compose", "-p", project, "-f", file, "down", "--remove-orphans"}
	if removeData {
		args = append(args, "-v")
	}
	return run(ctx, args...)
}

// ComposeRunning reports whether a project currently has any running container.
func ComposeRunning(ctx context.Context, project string) bool {
	out, err := run(ctx, "compose", "-p", project, "ps", "--status", "running", "-q")
	if err != nil {
		return false
	}
	return strings.TrimSpace(out) != ""
}

// run executes the docker CLI with the given arguments and returns combined output.
func run(ctx context.Context, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, "docker", args...)
	out, err := cmd.CombinedOutput()
	return string(out), err
}
