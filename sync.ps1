# ChromaDash — Sync script
# Run this after any code change to push updates to Android Studio
# Usage: .\sync.ps1

Write-Host "ChromaDash Sync" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

# 1. Copy web assets to www/
Write-Host "`nCopying web assets to www/..." -ForegroundColor Yellow

if (-not (Test-Path "www")) { New-Item -ItemType Directory -Path "www" | Out-Null }
if (-not (Test-Path "www\css")) { New-Item -ItemType Directory -Path "www\css" | Out-Null }
if (-not (Test-Path "www\js")) { New-Item -ItemType Directory -Path "www\js" | Out-Null }

Copy-Item "index.html" "www\" -Force
Copy-Item "css\style.css" "www\css\" -Force

# Copy all JS files (preserving subfolders)
$jsItems = Get-ChildItem "js" -Recurse
foreach ($item in $jsItems) {
    $dest = "www\js\" + $item.FullName.Substring((Resolve-Path "js").Path.Length + 1)
    if ($item.PSIsContainer) {
        New-Item -ItemType Directory -Path $dest -Force | Out-Null
    } else {
        Copy-Item $item.FullName $dest -Force
    }
}

Write-Host "  Assets copied." -ForegroundColor Green

# 2. Capacitor sync
Write-Host "`nRunning cap sync android..." -ForegroundColor Yellow
npx cap sync android 2>&1 | Where-Object { $_ -notmatch '\[warn\]' } | Write-Host

Write-Host "`nSync complete!" -ForegroundColor Green
Write-Host "Open Android Studio and press Run to deploy." -ForegroundColor Cyan
