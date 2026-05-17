# GitHub Releases — workflow & deployment

This guide explains how to publish **CRM Desktop** installers professionally using [GitHub Releases](https://github.com/Adithya726/CRM/releases).

---

## What goes where

| Artifact | Git | GitHub Release |
|----------|-----|----------------|
| Source code | ✅ Yes | — |
| `crm-backend.jar`, `jre/` | ❌ No (generated) | — |
| `CRM-Desktop-Setup-x.y.z.exe` | ❌ No | ✅ Upload here |
| `*.exe.blockmap` (optional) | ❌ No | Optional upload |

**Rule:** Source in git. Binaries on Releases only.

---

## Semantic versioning

Format: **`vMAJOR.MINOR.PATCH`** (e.g. `v1.0.0`)

| Bump | Example | When |
|------|---------|------|
| **PATCH** | `v1.0.0` → `v1.0.1` | Bug fixes, security patches, no new features |
| **MINOR** | `v1.0.0` → `v1.1.0` | New features, backward compatible |
| **MAJOR** | `v1.x` → `v2.0.0` | Breaking changes (DB schema migration required, API breaks, unsupported old installers) |

**Before each release:**

1. Update `CRM_FRONTEND/package.json` → `"version": "1.0.0"`
2. Tag git with the same version: `v1.0.0`
3. Name installer: `CRM-Desktop-Setup-1.0.0.exe` (from electron-builder `artifactName`)

---

## Final deployment flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Finish & test features locally                           │
│ 2. Bump version in package.json                             │
│ 3. npm run dist  →  release/CRM-Desktop-Setup-x.y.z.exe     │
│ 4. Test installer on a clean Windows machine                │
│ 5. Commit & push source to main                             │
│ 6. Create git tag vX.Y.Z and push tag                       │
│ 7. Create GitHub Release from tag                             │
│ 8. Upload .exe (+ optional blockmap) as release assets        │
│ 9. Publish release                                            │
│ 10. Share: https://github.com/Adithya726/CRM/releases/latest │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-step commands

### 1. Build the installer

```powershell
cd CRM_FRONTEND
npm install
npm run dist
```

Verify:

```
CRM_FRONTEND\release\CRM-Desktop-Setup-1.0.0.exe
```

### 2. Commit source changes (not the installer)

```powershell
cd D:\CRM_FULLSTACK
git add .
git status
# Confirm: NO release/*.exe, NO crm-backend.jar, NO resources/jre/
git commit -m "Release v1.0.0: standalone desktop CRM with SQLite"
git push origin main
```

### 3. Create and push a version tag

```powershell
git tag -a v1.0.0 -m "CRM Desktop v1.0.0 - first standalone release"
git push origin v1.0.0
```

Tags should match `package.json` version with a `v` prefix.

### 4. Create a GitHub Release (web UI)

1. Open https://github.com/Adithya726/CRM/releases
2. Click **Draft a new release**
3. **Choose a tag:** `v1.0.0` (create from `main` if new)
4. **Release title:** `CRM Desktop v1.0.0`
5. Paste release notes (from `docs/RELEASE_NOTES_TEMPLATE.md`)
6. **Attach binaries:** drag `CRM-Desktop-Setup-1.0.0.exe`
7. Click **Publish release**

### 5. Create a GitHub Release (CLI)

```powershell
gh release create v1.0.0 `
  "CRM_FRONTEND\release\CRM-Desktop-Setup-1.0.0.exe" `
  --title "CRM Desktop v1.0.0" `
  --notes-file docs\RELEASE_NOTES_TEMPLATE.md
```

Edit the notes file with version-specific content before running.

---

## How users download

| Link | URL |
|------|-----|
| All releases | https://github.com/Adithya726/CRM/releases |
| Latest release page | https://github.com/Adithya726/CRM/releases/latest |
| Latest asset (redirect) | https://github.com/Adithya726/CRM/releases/latest/download/CRM-Desktop-Setup-1.0.0.exe |

GitHub generates **direct download URLs** for each uploaded asset:

```
https://github.com/Adithya726/CRM/releases/download/v1.0.0/CRM-Desktop-Setup-1.0.0.exe
```

Pattern:

```
https://github.com/Adithya726/CRM/releases/download/<TAG>/<FILENAME>
```

The `/releases/latest/download/...` URL always points to the **latest published** release’s asset with that exact filename — rename carefully when bumping versions.

---

## Release checklist

- [ ] Version bumped in `package.json`
- [ ] `npm run dist` succeeds
- [ ] Installer tested (install, login, core flows, quit)
- [ ] Default admin password documented in release notes
- [ ] Source pushed to `main`
- [ ] Tag `vX.Y.Z` pushed
- [ ] Release notes written
- [ ] `.exe` uploaded to GitHub Release (not committed to git)
- [ ] README badge/links still valid

---

## Cleaning the repository (one-time)

If Eclipse `.metadata/` was previously committed:

```powershell
git rm -r --cached .metadata
git commit -m "Remove Eclipse metadata from version control"
git push origin main
```

Root `.gitignore` now excludes `.metadata/`.

---

## Optional: pre-release / beta

Use tags like `v1.1.0-beta.1` and check **This is a pre-release** on GitHub. Users on stable should use non-prerelease assets only.

---

## Optional: GitHub Actions (future)

Automate `npm run dist` on tag push and attach artifacts with `softprops/action-gh-release`. Not required for manual releases.
