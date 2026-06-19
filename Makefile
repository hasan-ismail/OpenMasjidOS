.PHONY: dev build build-ui build-go lint test image clean

# Read the canonical version from the VERSION file.
# Bump this file when releasing — see CLAUDE.md §14 for the versioning policy.
VERSION := $(shell cat VERSION)
LDFLAGS := -w -s -X github.com/OpenMasjidOS/OpenMasjidOS/internal/api.version=$(VERSION)

# Run backend + frontend in development mode with hot reload
dev:
	@echo "Starting OpenMasjidOS $(VERSION) in development mode..."
	@cd frontend && npm install --silent
	@cd backend && go mod download
	@(cd frontend && npm run dev &) && (cd backend && OPENMASJID_PORT=8080 OPENMASJID_DEV=true go run ./cmd/openmasjid)

# Build production: UI → embed into Go binary → Docker image
build: build-ui build-go

build-ui:
	@echo "Building frontend..."
	cd frontend && npm ci && npm run build

build-go: build-ui
	@echo "Building backend binary (v$(VERSION))..."
	cd backend && CGO_ENABLED=0 go build \
		-ldflags="$(LDFLAGS)" \
		-o ../dist/openmasjid ./cmd/openmasjid

# Build and tag the Docker image
image:
	@echo "Building Docker image openmasjid/core:$(VERSION)..."
	docker build \
		--label "org.opencontainers.image.version=$(VERSION)" \
		-t openmasjid/core:$(VERSION) \
		-t openmasjid/core:latest \
		.

# Run all linters
lint:
	@echo "Linting backend..."
	cd backend && golangci-lint run ./...
	@echo "Linting frontend..."
	cd frontend && npm run check && npm run lint

# Run all tests
test:
	@echo "Testing backend..."
	cd backend && go test ./...
	@echo "Testing frontend..."
	cd frontend && npm run test

# Remove build artifacts
clean:
	rm -rf dist/
	rm -rf frontend/build
	rm -rf frontend/.svelte-kit
