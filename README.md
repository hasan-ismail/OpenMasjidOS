# OpenMasjidOS

> **Free, open-source software platform for masjids.**
> Install in one command. Manage everything from a beautiful web dashboard. No technical knowledge required.

---

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/hasan-ismail/OpenMasjidOS/master/install.sh | bash
```

When it finishes, open **`http://openmasjidos.local`** (or **`http://<your-server-ip>`**) in any browser on the same network and create your admin account.

---

## Table of Contents

- [What is OpenMasjidOS?](#what-is-openmasjidos)
- [What it does](#what-it-does)
- [Installation Guide](#installation-guide)
  - [Option A — Raspberry Pi (Ubuntu Server 22.04 LTS)](#option-a--raspberry-pi-ubuntu-server-2204-lts)
  - [Option B — Proxmox VE (LXC Container)](#option-b--proxmox-ve-lxc-container)
  - [Option C — Bare Metal Linux](#option-c--bare-metal-linux)
- [First Run & Setup](#first-run--setup)
- [Managing Your Install](#managing-your-install)
- [Resetting the Admin Password](#resetting-the-admin-password)
- [Data & Backups](#data--backups)
- [App Store & Apps](#app-store--apps)
- [Development](#development)
- [License](#license)

---

## What is OpenMasjidOS?

OpenMasjidOS is a self-hosted platform that runs on your masjid's **own hardware** — a Raspberry Pi, a spare mini-PC, or a Proxmox server. It gives your masjid a central, login-protected dashboard to install and manage apps, with no technical knowledge required.

**Think of it as: umbrelOS — but built for masjids.**

Everything runs on **your hardware**, under **your control**. No subscriptions. No cloud lock-in. No data sharing.

**How it works:**
1. You install OpenMasjidOS once (takes ~2 minutes).
2. It runs as a Docker service that survives reboots automatically.
3. You sign in, browse the App Store, click **Install**, and the app is running in seconds.
4. Each app collects the details it needs (location, prayer-calculation method, etc.) when you install it — the platform itself stays generic.

---

## What it does

The dashboard is the heart of OpenMasjidOS. After you create an admin account on first run, everything lives behind a login.

- **Live system status.** The home screen shows CPU, memory, storage, temperature, uptime, and how many apps are running, all updating in real time.
- **An App Store.** Browse the OpenMasjidAPPS catalog and install an app with one click. (The catalog is on its way.)
- **Your apps, your way.** Every installed app gets a tile you can open, restart, shut down, or remove, and a card you can drag onto the dock to pin it.
- **A built-in file manager.** Browse, upload, download, rename, and delete the files that belong to OpenMasjidOS and its apps, without leaving the dashboard.
- **A polished, themeable interface.** Dark or light, a handful of accent colours, several wallpapers (or point it at your own image), gentle animation, and full right-to-left support for Arabic and Urdu down the line.

For the more technical volunteer, there are a few opt-in tools under Settings → Advanced, all off by default:

- Add **community app stores** that follow the CasaOS format, and install apps from them.
- Install anything by pasting a **Docker Compose** file, with the platform checking it for risky settings first.
- Open a **terminal** into any app, or a root terminal into OpenMasjidOS itself.
- Add an **SSH key** so you can log in to the machine from your own computer.

Each app runs as its own isolated Docker container, so updating OpenMasjidOS never touches the apps you have installed or their data.

---

## Installation Guide

### Requirements (all options)

| | Minimum | Recommended |
|---|---|---|
| **RAM** | 1 GB | 2 GB |
| **Storage** | 8 GB free | 32 GB |
| **Architecture** | amd64 or arm64 | — |
| **Internet** | Required (for install + app downloads) | — |

Docker is installed automatically if it is not already present.

---

### Option A — Raspberry Pi (Ubuntu Server 22.04 LTS)

The recommended setup for most masjids. A Raspberry Pi 4 or 5 with Ubuntu Server 22.04 LTS runs silently 24/7 on less power than a phone charger.

#### What you need

- **Raspberry Pi 4** (2 GB RAM minimum, 4 GB recommended) or **Raspberry Pi 5**
- MicroSD card — 32 GB or larger, Class 10 / A1 rated (a USB SSD is even more reliable)
- Official Raspberry Pi USB-C power supply
- Ethernet cable (recommended — Wi-Fi can drop and interrupt the dashboard)
- A computer to flash the SD card from

#### Step 1 — Flash Ubuntu Server 22.04 LTS

1. Install **Raspberry Pi Imager** from [raspberrypi.com/software](https://www.raspberrypi.com/software/).
2. In Imager:
   - **Choose Device** → your Pi model
   - **Choose OS** → *Other general-purpose OS* → *Ubuntu* → **Ubuntu Server 22.04.x LTS (64-bit)**
   - **Choose Storage** → your SD card / USB SSD
3. Click the **gear icon** (Ctrl+Shift+X) to open Advanced Settings **before** writing:
   - **Set hostname** → `openmasjid`
   - **Enable SSH** → *Use password authentication*
   - **Set username and password** → username `openmasjid`, a strong password
   - **Configure wireless LAN** (only if you have no ethernet) + set your **Wireless LAN country**
   - **Set locale settings** → your timezone
4. **Save**, then **Write**. Flashing takes 2–5 minutes.

#### Step 2 — First boot

Insert the card, connect ethernet, and power on the Pi. Wait **60–90 seconds** for the first boot to finish.

#### Step 3 — Find your Pi and SSH in

```bash
ssh openmasjid@openmasjid.local
# or, using the IP from your router's device list:
ssh openmasjid@192.168.1.45
```

#### Step 4 — Update, then install

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://raw.githubusercontent.com/hasan-ismail/OpenMasjidOS/master/install.sh | bash
```

The installer sets up Docker, pulls the OpenMasjidOS image, starts the service, and prints your access URL. The whole process takes **2–4 minutes**.

#### Step 5 — Open the dashboard

On any device on the same network, open `http://openmasjidos.local` (or `http://<your-pi-ip>`).

#### Step 6 — Pin the address (recommended)

So the dashboard is always at the same address, add a **DHCP reservation** in your router for the Pi's MAC address (e.g. `192.168.1.10`), then reboot the Pi.

---

### Option B — Proxmox VE (LXC Container)

If your masjid already runs Proxmox VE, create a clean Ubuntu 22.04 LXC with the **Proxmox VE Community Helper Scripts**, then run the installer inside it.

#### Step 1 — Open the Proxmox Shell

In the Proxmox web UI, click your **node name** (e.g. `pve`) → **Shell**.

#### Step 2 — Create an Ubuntu 22.04 LXC

```bash
bash -c "$(wget -qLO - https://github.com/community-scripts/ProxmoxVE/raw/main/ct/ubuntu2204.sh)"
```

Suggested answers:

| Prompt | Value |
|---|---|
| **Settings** | Advanced |
| **CT Type** | Unprivileged |
| **Hostname** | `openmasjid` |
| **Disk Size** | `16` GB |
| **CPU Cores** | `2` |
| **RAM** | `2048` MiB (2 GB) |
| **IP Address** | `dhcp` or a static `192.168.1.10/24` |
| **Start after created** | Yes |

> **Enable Docker in the LXC:** in the Proxmox web UI go to the container → **Options → Features** and tick **Nesting** and **keyctl**, then restart the container. Without these, Docker can't run inside the LXC.

#### Step 3 — Open the container console and install

In the web UI, select the container → **Console** (or `pct enter <id>` from the host shell), then:

```bash
apt update && apt upgrade -y
curl -fsSL https://raw.githubusercontent.com/hasan-ismail/OpenMasjidOS/master/install.sh | bash
```

#### Step 4 — Open the dashboard

`http://openmasjid.local` or `http://<container-ip>`. Set a static IP for the container in **Network** if you used DHCP.

---

### Option C — Bare Metal Linux

Run directly on any Linux machine — a mini-PC, an old laptop, or a dedicated server.

#### Supported operating systems

| OS | Versions |
|---|---|
| **Ubuntu Server** | 20.04 / 22.04 / 24.04 LTS |
| **Debian** | 11 (Bullseye), 12 (Bookworm) |
| **Raspberry Pi OS** | Bullseye / Bookworm (64-bit) |
| **Fedora** | 36+ |
| **Rocky Linux / AlmaLinux** | 8, 9 |

#### Install

SSH in (with a `sudo`-capable account or as root) and run:

```bash
curl -fsSL https://raw.githubusercontent.com/hasan-ismail/OpenMasjidOS/master/install.sh | bash
```

It detects your OS and architecture, installs Docker + the Compose plugin if needed, creates `/opt/openmasjid/` for all data, starts the core service (set to restart on boot), and prints your access URL. Then open `http://<machine-ip>`.

To verify it's running:

```bash
sudo docker ps   # look for the "openmasjid-core" container, status "Up ..."
```

---

## First Run & Setup

The first time you open the dashboard you create your **admin account** — a username and a password (at least 8 characters). This is the only account that can access the dashboard, and it's protected by a login from then on.

That's the whole setup. You go straight to the dashboard, where you can browse the App Store and install your first app.

> **Where do prayer times and location go?** Each app that needs them collects its own details (prayer-calculation method, location, etc.) when you install it. The platform stays generic, so different apps can use different settings.

---

## Managing Your Install

Run the **same install command** again at any time. If OpenMasjidOS is already installed, it shows a menu:

- **Update** — pull the latest version (your apps and data are left untouched).
- **Repair** — re-apply config, re-pull, and restart the core.
- **Remove** — uninstall the core. Your apps keep running and your data is kept unless you explicitly confirm deletion.

> Updating and repairing **only** ever touch the OpenMasjidOS core — never your installed app containers or their data.

---

## Resetting the Admin Password

Forgot the admin password? Reset it from the server's terminal — no data is lost. You need terminal access to the machine (sitting at it, or over **SSH**):

```bash
# Connect first if you're remote, e.g.:  ssh youruser@192.168.1.18
docker exec -it openmasjid-core node packages/core/dist/reset-password.js
```

Follow the prompt to set a new password, then return to the dashboard and sign in. The **"Forgot your password?"** link on the login screen shows these same instructions.

---

## Data & Backups

All data lives under `/opt/openmasjid/`:

```
/opt/openmasjid/
├── docker-compose.yml   # core service definition (managed by the installer)
├── config/              # platform settings + admin account (hashed)
└── apps/
    └── <app-id>/        # per-app compose, env, and persistent data
```

The easiest way to back up is **Settings → Advanced → Download a backup** in the dashboard, which saves your settings and app data as a single file.

From the terminal you can also back up everything with:

```bash
sudo tar -czf openmasjid-backup-$(date +%Y%m%d).tar.gz -C /opt openmasjid
```

---

## App Store & Apps

Apps live in a separate repository: **[OpenMasjidAPPS](https://github.com/hasan-ismail/OpenMasjidAPPS)** (coming soon).

Each app is a self-contained Docker container described by a manifest. OpenMasjidOS fetches the catalog and handles installation, updates, and removal. Advanced users can also add **CasaOS-compatible community app stores** or paste a **Docker Compose** file directly (enable *Allow custom apps* in Settings → Advanced).

To build an app, see [`docs/APP_MANIFEST_SPEC.md`](docs/APP_MANIFEST_SPEC.md).

---

## Development

**Requirements:** Node.js 20+, Docker

OpenMasjidOS is a TypeScript monorepo (npm workspaces): a Node + Fastify + tRPC daemon (`packages/core`) and a React + Vite + Tailwind dashboard (`packages/ui`).

```bash
git clone https://github.com/hasan-ismail/OpenMasjidOS.git
cd OpenMasjidOS

npm install        # install all workspaces
npm run dev        # run daemon + UI with hot reload
npm run lint       # type-check both packages
npm run build      # build the UI + bundle the daemon
npm run image      # build & tag the runtime Docker image
```

In production the daemon listens on **port 80** (set by the installer/compose). In dev it defaults to **8723** (no root needed); the Vite dev server runs on `http://localhost:5173` and proxies `/trpc` (HTTP + WebSocket) and `/api` to the daemon — open `http://localhost:5173`.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the system is structured.

---

## License

GNU Affero General Public License v3.0 (AGPL-3.0) — see [LICENSE](LICENSE).

In short: you are free to use, modify, and distribute this software. If you deploy a modified version as a network service, you must also publish your modified source under the same license — so improvements made by one masjid benefit all masjids.
