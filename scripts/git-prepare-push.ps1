# Optional helper: stage desktop source, exclude binaries and IDE metadata.
# Usage: .\scripts\git-prepare-push.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Removing Eclipse metadata from git index (if tracked)..."
git rm -r --cached .metadata 2>$null

Write-Host "`nStaging changes..."
git add .
git add -f CRM_FRONTEND/build/icon.svg 2>$null
git add -f CRM_FRONTEND/resources/backend/.gitkeep 2>$null
git add -f CRM_FRONTEND/resources/jre/.gitkeep 2>$null
git add -f CRM_FRONTEND/release/.gitkeep 2>$null

Write-Host "`n--- Files that should NOT appear below ---"
Write-Host "  release/*.exe, crm-backend.jar, resources/jre/, node_modules/, dist/`n"

git status

Write-Host "`nNext steps:"
Write-Host "  git commit -m 'Your message'"
Write-Host "  git push origin main"
Write-Host "  git tag -a v1.0.0 -m 'CRM Desktop v1.0.0'"
Write-Host "  git push origin v1.0.0"
Write-Host "  gh release create v1.0.0 CRM_FRONTEND/release/CRM-Desktop-Setup-1.0.0.exe --title 'CRM Desktop v1.0.0' --notes-file docs/RELEASE_NOTES_TEMPLATE.md"
