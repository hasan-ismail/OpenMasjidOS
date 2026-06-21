# App catalog contract (platform side)

> **Where to build an app:** the authoritative, hands-on guide lives in the **OpenMasjidAPPS** repo
> — its [`CLAUDE.md`](https://github.com/hasan-ismail/OpenMasjidAPPS/blob/main/CLAUDE.md) and
> `docs/BUILDING_AN_APP.md`. **This document is the platform side of the contract** — the exact
> `catalog.json` shape and install behaviour that OpenMasjidOS guarantees. The two must agree; if
> they ever diverge, this file and OpenMasjidAPPS's `CLAUDE.md §2` are the things to reconcile.

## The model

Apps do **not** live in this repo, and they are **not** folders inside OpenMasjidAPPS either:

```
app repos (one per app) ──listed in──▶ OpenMasjidAPPS/registry.yaml ──build──▶ catalog.json ──fetched by──▶ OpenMasjidOS
```

- **Each app** is its own public GitHub repo (`openmasjid-<id>`): a `manifest.yaml`, a
  `docker-compose.yml`, an icon, screenshots, and a **public multi-arch** image.
- **OpenMasjidAPPS** is a catalog: a `registry.yaml` of app repos + a build script that fetches each
  one and assembles a single **`catalog.json`** at its repo root.
- **OpenMasjidOS** only ever fetches that one file, from (default, `packages/core/src/config.ts`):
  ```
  https://raw.githubusercontent.com/hasan-ismail/OpenMasjidAPPS/main/catalog.json
  ```
  Overridable with `OPENMASJID_CATALOG_URL`. The catalog is cached briefly and fails soft (an
  unreachable catalog never breaks the dashboard).

## `catalog.json` shape

`{ "apps": [ CatalogApp, … ] }` — a bare top-level array is also accepted, and any extra top-level
fields are ignored. Each entry is a `CatalogApp` (`packages/core/src/apps/types.ts`):

| Field | Required | Notes |
|-------|----------|-------|
| `id` | ✅ | Unique, kebab-case, must match `^[a-z0-9][a-z0-9-]{0,79}$`. The platform **drops** any entry whose id is invalid (it's used as a path segment + compose project name). |
| `name` | ✅ | Display name. |
| `version` | ✅ | Semver string. Drives the app's "Check for update". |
| `compose` | ✅ | The app's **entire `docker-compose.yml` as a string**. This is what runs. |
| `tagline` | – | One short line on the card. |
| `category` | – | `displays` \| `donations` \| `community` \| `quran` \| `admin` \| `utilities`. |
| `author` | – | |
| `license` | – | The app author's choice (apps run at arm's length — see `CLAUDE.md §3`). |
| `icon` | – | Absolute URL. |
| `screenshots` | – | Array of absolute URLs. |
| `description` | – | Markdown, shown on the app detail page. |
| `settings` | – | Fields collected from the user before install (below). |
| `ports` | – | `{ container: number, label?: string }[]` — informational only. |

### `settings` fields (`SettingField`)

```yaml
- key: LATITUDE          # env var name; referenced as ${LATITUDE} in the compose
  label: Latitude        # shown in the install dialog
  type: text             # text | select | number | password | boolean
  options: [A, B, C]     # required only for type: select
  default: ""            # optional pre-filled value
```

The platform collects **everything masjid-specific here** (location, calc method, madhab, timezone,
masjid name). **No platform profile is ever injected** — the platform holds no masjid data.

## Install & lifecycle behaviour (what the core guarantees)

- **Install** — writes `compose` to `compose.yml`, writes the user's `settings` answers to a `.env`,
  then `docker compose -p omos-<id> --env-file .env up -d --remove-orphans`. The compose references
  settings as `${KEY}`. Per-app files + data live under `/opt/openmasjid/apps/<id>/`.
- **Open URL** — derived from the container's **published host port**, so a compose must publish its
  web-UI port (e.g. `ports: ["8080:80"]`). The platform detects host-port conflicts before install
  and lets the user remap.
- **Discovery** — by the compose **project name** `omos-<id>` (Docker's automatic
  `com.docker.compose.project` label). Apps add **no** special labels; the platform records each
  app's kind/version in `apps/<id>/meta.json`.
- **Update** — re-fetch the catalog entry, rewrite `compose.yml` (keeping the user's `.env`), then
  `compose pull` + `up -d`. Settings and data are preserved.
- **Remove** — `compose down` (with `--rmi all -v` when the user also chooses to delete data).

## Requirements an app's compose must meet

- **Pin the image tag** (`image: ghcr.io/<owner>/<repo>:1.2.3`), to a **public, multi-arch**
  (`amd64`+`arm64`) image — the masjid's host pulls it without authentication.
- **Publish the web-UI port** with a non-privileged default host port (≥ 1024).
- **Reference settings as `${KEY}`** via an `environment:` block; use **named volumes** for data.
- **Least privilege** — no `privileged: true`, `network_mode: host`, `pid/ipc: host`, `cap_add`,
  host devices, or Docker-socket / sensitive host-path mounts. The platform risk-checks composes and
  the catalog build refuses dangerous ones.

The full per-app repo layout, image-publishing, and `registry.yaml` steps are documented in
**OpenMasjidAPPS** — start there.
