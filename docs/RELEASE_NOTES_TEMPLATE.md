# CRM Desktop vX.Y.Z

**Release date:** YYYY-MM-DD  
**Platform:** Windows 10/11 (x64)

---

## Highlights

- Standalone desktop CRM — no Java or MySQL installation required
- Offline SQLite database with automatic schema setup
- Bundled Java 17 runtime and Spring Boot API
- One-click NSIS installer

---

## Download

| File | Description |
|------|-------------|
| **CRM-Desktop-Setup-X.Y.Z.exe** | Full installer (~175 MB) |

Install, then launch **CRM Desktop** from the Start Menu.

---

## First-time login

| Field | Value |
|-------|--------|
| Username | `admin` |
| Password | `admin123` |

**Important:** Change the default password after your first login.

---

## What's new

<!-- Replace with version-specific bullets -->

- Initial standalone desktop release
- Electron shell with splash screen and auto backend start
- Customer, contract, complaint, and engineer management
- Admin and Operator roles
- Local SQLite database with automatic backups

---

## System requirements

- Windows 10 or 11 (64-bit)
- ~500 MB disk space after install
- No Java or database prerequisites

---

## Upgrading from a previous version

1. Close CRM Desktop if running
2. Run the new installer (settings/data in `%APPDATA%\crm-desktop\` are preserved)
3. Launch the updated app

---

## Known issues

<!-- List any known limitations -->

- Windows SmartScreen may warn on unsigned installers — click *More info* → *Run anyway*, or wait for a signed build in a future release.

---

## For developers

Source code for this release: https://github.com/Adithya726/CRM/tree/vX.Y.Z

Build instructions: see [README.md](../README.md#building-the-windows-installer)

---

**Full changelog:** https://github.com/Adithya726/CRM/compare/vPREVIOUS...vX.Y.Z
