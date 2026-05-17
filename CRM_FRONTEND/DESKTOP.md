# CRM Desktop — zero-setup standalone

## End-user experience

1. Download `CRM-Desktop-Setup-1.0.0.exe`
2. Install
3. Open **CRM Desktop**

No Java install. No MySQL. No database configuration.

## What is bundled

| Component | Location (installed) |
|-----------|----------------------|
| Electron + React UI | `app.asar` |
| Spring Boot API | `resources/backend/crm-backend.jar` |
| Java 17 JRE | `resources/jre/bin/java.exe` |
| SQLite database | `%APPDATA%/crm-desktop/data/crm-desktop.db` (created on first run) |

## First login

Default admin (created automatically if none exists):

- **Username:** `admin`
- **Password:** `admin123`

Change this password after first login.

## User data

```
%APPDATA%/crm-desktop/
  data/crm-desktop.db
  backups/           ← rolling SQLite backups
  logs/desktop.log
  logs/backend.log
```

## Build installer (developers)

```powershell
cd CRM_FRONTEND
npm install
npm run dist
```

`predist` runs:

1. `build:backend` — Maven JAR → `resources/backend/crm-backend.jar`
2. `download:jre` — Temurin 17 JRE → `resources/jre/`
3. `icons` — app icons
4. Vite + electron-builder → `release/CRM-Desktop-Setup-1.0.0.exe`

## Development

```powershell
cd CRM_FRONTEND
npm run electron
```

Downloads JAR + JRE if missing, then starts Electron with SQLite in `%APPDATA%/crm-desktop/`.

## Web dev (MySQL)

```powershell
cd CRM_BACKEND
mvnw spring-boot:run
```

Uses `application.properties` (MySQL). Desktop profile is **not** active.

## Architecture

```
Electron main
  → prepare userData folders + DB validation
  → spawn bundled java -jar crm-backend.jar (profile: desktop)
  → SQLite at CRM_DB_PATH
  → React UI when /api/health reports UP
```

## MySQL vs SQLite

| Mode | Database |
|------|----------|
| Web (`mvn spring-boot:run`) | MySQL `crm_db` |
| Desktop (installer / electron) | SQLite embedded |

## Recovery

- Corrupt/empty DB: app renames file and recreates schema on next start
- Restore: copy a file from `%APPDATA%/crm-desktop/backups/` to `data/crm-desktop.db` (app closed)
