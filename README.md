# CRM Desktop

**Standalone customer relationship management software** — install once, run offline, no Java or database setup required. Ships for **Windows** (NSIS installer) and **macOS** (DMG, Intel + Apple Silicon).

[![Release](https://img.shields.io/github/v/release/Adithya726/CRM?label=latest%20release)](https://github.com/Adithya726/CRM/releases)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS-blue)](https://github.com/Adithya726/CRM/releases)

> **Download installers:** [GitHub Releases](https://github.com/Adithya726/CRM/releases) — Windows: `CRM-Desktop-Setup-x.y.z.exe` · macOS: `CRM-Desktop-x.y.z-arm64.dmg` / `CRM-Desktop-x.y.z-x64.dmg`

Mac packaging, Gatekeeper, and notarization: **[docs/MACOS_BUILD.md](docs/MACOS_BUILD.md)**

---

## Overview

CRM Desktop is a full-stack CRM packaged as a professional **Electron** desktop application for **Windows** and **macOS**. It combines a React UI with a Spring Boot API, embedded **SQLite** database, and a **bundled Java runtime**.

| Mode | Description |
|------|-------------|
| **End users** | Download installer → install → open app |
| **Developers** | Clone repo → build backend + frontend → run or package |

---

## Features

- **Zero-setup installation** — no Java, MySQL, or manual database configuration
- **Offline-first** — SQLite database stored locally in user app data
- **Role-based access** — Admin and Operator workflows
- **Customer & contract management** — CRUD, search, export
- **Complaint lifecycle** — raise, assign engineers, close, reopen
- **Auto backend** — Spring Boot starts hidden when the app opens
- **Automatic backups** — rolling SQLite snapshots in user data folder
- **First-run setup** — default admin account created automatically

---

## Screenshots

_Add PNGs under [`docs/screenshots/`](docs/screenshots/) and embed them here for the GitHub release page._

| Splash | Admin dashboard | Customer management |
|--------|-----------------|---------------------|
| *Coming soon* | *Coming soon* | *Coming soon* |

---

## Architecture

```mermaid
flowchart TB
  subgraph installer["CRM-Desktop-Setup.exe"]
    EXE[CRM Desktop.exe]
    subgraph resources["resources/"]
      JRE[jre/bin/java.exe]
      JAR[backend/crm-backend.jar]
    end
    ASAR[app.asar - React UI + Electron]
  end

  subgraph userdata["%APPDATA%/crm-desktop/"]
    DB[(crm-desktop.db)]
    BK[backups/]
    LOG[logs/]
  end

  EXE --> ASAR
  EXE --> JRE
  JRE --> JAR
  JAR --> DB
  ASAR -->|HTTP 127.0.0.1:5771| JAR
  JAR --> BK
  JAR --> LOG
```

**Startup flow**

1. User launches **CRM Desktop**
2. Electron shows splash screen
3. Bundled JRE runs Spring Boot JAR (`desktop` profile → SQLite)
4. Health check passes → React UI loads
5. On exit → backend process stops gracefully

---

## Technologies

| Layer | Stack |
|-------|--------|
| Desktop shell | [Electron](https://www.electronjs.org/) 35 |
| Frontend | [React](https://react.dev/) 19, [Vite](https://vitejs.dev/) 7, React Router |
| Backend | [Spring Boot](https://spring.io/projects/spring-boot) 3.3, Spring Security, Spring Data JPA |
| Database (desktop) | [SQLite](https://www.sqlite.org/) via Hibernate Community Dialects |
| Database (web dev) | MySQL 8 (optional local dev) |
| Packaging | [electron-builder](https://www.electron.build/) — NSIS (Windows), DMG + `.app` (macOS) |
| Runtime | Eclipse Temurin 17 JRE (bundled) |

---

## Repository structure

```
CRM/
├── CRM_BACKEND/                 # Spring Boot REST API
│   ├── src/main/java/com/crm/
│   └── src/main/resources/
│       ├── application.properties          # Web dev (MySQL)
│       └── application-desktop.properties  # Desktop (SQLite)
│
├── CRM_FRONTEND/                # React + Electron + installer build
│   ├── electron/                # Main process, backend manager, preload
│   ├── resources/
│   │   ├── backend/             # crm-backend.jar (generated, not in git)
│   │   └── jre/                 # Bundled Java (generated, not in git)
│   ├── scripts/                 # build-backend, download-jre, icons
│   ├── build/                   # icon.svg (source); .png/.ico generated
│   ├── src/                     # React application
│   └── release/                 # Installer output (not in git)
│
├── docs/
│   ├── RELEASE.md
│   ├── RELEASE_NOTES_TEMPLATE.md
│   └── MACOS_BUILD.md           # macOS DMG, signing, Gatekeeper
│
└── README.md
```

---

## Installation (end users)

### Windows

1. Open **[Releases](https://github.com/Adithya726/CRM/releases)**
2. Download **`CRM-Desktop-Setup-x.y.z.exe`**
3. Run the installer (Windows 10/11 x64)
4. Launch **CRM Desktop** from Start Menu or desktop shortcut

### macOS

1. Download **`CRM-Desktop-x.y.z-arm64.dmg`** (Apple Silicon) or **`CRM-Desktop-x.y.z-x64.dmg`** (Intel), then open the DMG and drag **CRM Desktop** to **Applications**.
2. On first launch, if macOS blocks the app (**Gatekeeper**), use **System Settings → Privacy & Security** → **Open Anyway**, or right-click → **Open**. For publicly distributed builds, use a **signed and notarized** installer (see [docs/MACOS_BUILD.md](docs/MACOS_BUILD.md)).

**Default login (first launch only)**

| Field | Value |
|-------|--------|
| Username | `admin` |
| Password | `admin123` |

Change the password after first login in production deployments.

**User data location**

| OS | Path |
|----|------|
| Windows | `%APPDATA%\crm-desktop\` |
| macOS | `~/Library/Application Support/crm-desktop/` |

Under that folder: `data/crm-desktop.db`, `backups/`, `logs/`.

---

## Development setup

### Prerequisites

- **Node.js** 20+
- **JDK 17+** (build backend; end users do not need this)
- **Git**

Optional for web-only API dev: **MySQL 8** with database `crm_db`

### Clone and install

```bash
git clone https://github.com/Adithya726/CRM.git
cd CRM/CRM_FRONTEND
npm install
```

### Run desktop app (development)

```bash
cd CRM_FRONTEND
npm run electron
```

This builds the backend JAR and downloads the JRE if missing, then starts Vite + Electron with SQLite under the OS app data directory.

### Run backend only (MySQL — web dev)

```bash
cd CRM_BACKEND
./mvnw spring-boot:run          # Linux/macOS
mvnw.cmd spring-boot:run        # Windows
```

Uses `application.properties` (MySQL on `localhost:3306/crm_db`).

### Run frontend only (browser)

```bash
cd CRM_FRONTEND
npm run dev
```

Requires API on `http://localhost:5771` (proxy configured in Vite).

---

## Building installers

Production builds package the React app, Electron shell, Spring Boot JAR, and bundled JRE (platform-specific).

### Build Windows installer

From `CRM_FRONTEND`:

```bash
npm run dist
```

**Output:** `CRM_FRONTEND/release/CRM-Desktop-Setup-1.0.0.exe`

### Build macOS installers (.dmg + .app)

On a **Mac**, from `CRM_FRONTEND`:

```bash
npm run predist:mac
npm run dist:mac
```

**Outputs:** `release/CRM-Desktop-*-arm64.dmg`, `release/CRM-Desktop-*-x64.dmg`, and unpacked `.app` bundles. See [docs/MACOS_BUILD.md](docs/MACOS_BUILD.md).

### Pipeline summary

**Windows (`npm run dist` / `predist`):**

1. `npm run build:backend` — fat JAR → `resources/backend/crm-backend.jar`
2. `npm run download:jre` — Temurin JRE for **current** OS
3. `npm run icons` — `icon.png`, `icon.ico`, `icon.icns`
4. Vite + electron-builder

**macOS (`npm run dist:mac` / `predist:mac`):**

1. Same backend + `npm run download:jre:mac-cache` (Intel **and** Apple Silicon JREs into `resources/jre-cache/`)
2. `beforePack` selects the correct JRE per architecture into `resources/jre`
3. electron-builder → DMG + `dir`

Do **not** commit installers or generated JREs to git. Upload assets to [GitHub Releases](https://github.com/Adithya726/CRM/releases).

See **[docs/RELEASE.md](docs/RELEASE.md)** for tagging, versioning, and publishing.

---

## Versioning

This project follows **[Semantic Versioning](https://semver.org/)**:

| Tag | When to use |
|-----|-------------|
| `v1.0.1` | Patch — bug fixes, small fixes |
| `v1.1.0` | Minor — new features, backward compatible |
| `v2.0.0` | Major — breaking API/UI or installer changes |

Keep `version` in `CRM_FRONTEND/package.json` aligned with release tags.

---

## Roadmap

- [ ] Code-signed Windows installer (SmartScreen trust)
- [ ] Apple Developer ID sign + notarize macOS DMGs
- [ ] Auto-update via `electron-updater`
- [ ] In-app backup/restore UI
- [ ] Custom branding & installer themes
- [ ] CI/CD GitHub Actions for automated releases

---

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/RELEASE.md](docs/RELEASE.md) | GitHub Releases workflow & deployment |
| [docs/RELEASE_NOTES_TEMPLATE.md](docs/RELEASE_NOTES_TEMPLATE.md) | Copy-paste release notes |
| [docs/MACOS_BUILD.md](docs/MACOS_BUILD.md) | macOS DMG, Gatekeeper, notarization |
| [CRM_FRONTEND/DESKTOP.md](CRM_FRONTEND/DESKTOP.md) | Desktop packaging technical details |

---

## Author

**Adithya** — [github.com/Adithya726](https://github.com/Adithya726)

---

## Support

For bugs and feature requests, use [GitHub Issues](https://github.com/Adithya726/CRM/issues).

For installers and changelog, see [Releases](https://github.com/Adithya726/CRM/releases).
