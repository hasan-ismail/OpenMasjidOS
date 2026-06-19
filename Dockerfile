# Stage 1: Build the SvelteKit frontend
FROM node:20-alpine AS ui-builder

WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Go backend binary
FROM golang:1.22-alpine AS go-builder

WORKDIR /app

# Copy VERSION so the build can stamp it into the binary via ldflags.
COPY VERSION ./

COPY backend/go.mod ./
RUN go mod download

COPY backend/ ./

# Copy the built UI assets into the exact path expected by go:embed in
# internal/api/embed.go:  //go:embed all:ui/build
COPY --from=ui-builder /app/frontend/build ./internal/api/ui/build

RUN go mod tidy

# Stamp the version from the VERSION file into the binary at link time.
# The api.version variable is declared in internal/api/router.go and defaults
# to "0.1.0"; the -X flag overrides it with whatever is in VERSION.
RUN VERSION=$(cat /app/VERSION) && \
    CGO_ENABLED=0 GOOS=linux go build \
      -ldflags="-w -s -X github.com/OpenMasjidOS/OpenMasjidOS/internal/api.version=${VERSION}" \
      -o openmasjid ./cmd/openmasjid

# Stage 3: Production image — Alpine + the Docker CLI and Compose plugin.
#
# We need a base WITH the docker CLI + `docker compose` (not distroless) because
# the core installs/removes apps by shelling out to `docker compose` against the
# mounted host socket. The Go binary is statically linked (CGO disabled) so it
# runs fine on Alpine/musl.
FROM alpine:3.20

RUN apk add --no-cache docker-cli docker-cli-compose ca-certificates

COPY --from=go-builder /app/openmasjid /openmasjid

EXPOSE 80

# Runs as root. The core is the control plane: it must read the root-owned
# Docker socket (/var/run/docker.sock), write config/state to /data, and run
# `docker compose`. Least-privilege still applies to the APP containers it launches.

# The binary self-checks via the -healthcheck flag (works without curl/wget).
HEALTHCHECK --interval=10s --timeout=5s --retries=6 --start-period=15s \
  CMD ["/openmasjid", "-healthcheck"]

ENTRYPOINT ["/openmasjid"]
