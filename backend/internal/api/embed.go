package api

import "embed"

// uiAssets holds the compiled SvelteKit static build.
// The Dockerfile copies the frontend build output to internal/api/ui/build
// so that this directive resolves correctly relative to this file.
//
//go:embed ui/build
var uiAssets embed.FS
