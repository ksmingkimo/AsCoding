<#
.SYNOPSIS
    Sunlike ERP Report System - Deployment Package Generator
.DESCRIPTION
    Extracts deployment-required files from the project, excludes dev docs and tools,
    and generates a ZIP deployment package.
    Output: sunlike-erp-report-v1.1.zip
.NOTES
    Run from project root: .\deploy.ps1
#>

$ErrorActionPreference = "Stop"

# ============================================================
# Config
# ============================================================
$Version   = "1.2"
$OutputZip = "sunlike-erp-report-v$Version.zip"
$TempDir   = Join-Path $PSScriptRoot "deploy-package"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Sunlike ERP Report System - Deploy Packager  " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Step 1: Clean up old temp directory
# ============================================================
if (Test-Path $TempDir) {
    Write-Host "[1/4] Cleaning old temp directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $TempDir
} else {
    Write-Host "[1/4] No old temp directory, skipping." -ForegroundColor Gray
}

# ============================================================
# Step 2: Create directory structure and copy files
# ============================================================
Write-Host "[2/4] Creating deploy directory structure..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path (Join-Path $TempDir "css") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $TempDir "js")  -Force | Out-Null

# -- Entry point --
Copy-Item (Join-Path $PSScriptRoot "index.html") $TempDir
Write-Host "   [OK] index.html" -ForegroundColor Green

# -- CSS files --
$cssFiles = @("auth.css", "dashboard.css", "ai-analysis.css", "notepad.css")
foreach ($f in $cssFiles) {
    $src = Join-Path $PSScriptRoot "css\$f"
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $TempDir "css\")
        Write-Host "   [OK] css\$f" -ForegroundColor Green
    } else {
        Write-Host "   [MISSING] css\$f" -ForegroundColor Red
    }
}

# -- JS files (in dependency order) --
$jsFiles = @(
    "utils.js",
    "settings-store.js",
    "datasource-store.js",
    "auth.js",
    "api.js",
    "reports.js",
    "report-menu-store.js",
    "report-menu.js",
    "datasource-list.js",
    "tabs.js",
    "chat-ui.js",
    "deepseek-client.js",
    "ai-client.js",
    "ai-parser.js",
    "ai-chart.js",
    "export.js",
    "notepad-store.js",
    "notepad-ui.js",
    "chat-core.js",
    "ai-suggestions.js",
    "settings-ui.js",
    "app.js"
)
foreach ($f in $jsFiles) {
    $src = Join-Path $PSScriptRoot "js\$f"
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $TempDir "js\")
        Write-Host "   [OK] js\$f" -ForegroundColor Green
    } else {
        Write-Host "   [MISSING] js\$f" -ForegroundColor Red
    }
}

# ============================================================
# Step 3: Generate ZIP
# ============================================================
Write-Host "[3/4] Packaging to $OutputZip ..." -ForegroundColor Yellow

$outputPath = Join-Path $PSScriptRoot $OutputZip
if (Test-Path $outputPath) {
    Remove-Item -Force $outputPath
}

Compress-Archive -Path (Join-Path $TempDir "*") -DestinationPath $outputPath -Force

$zipSize = [math]::Round((Get-Item $outputPath).Length / 1KB, 1)
Write-Host "   [OK] $OutputZip created ($zipSize KB)" -ForegroundColor Green

# ============================================================
# Step 4: Clean up temp directory
# ============================================================
Write-Host "[4/4] Cleaning temp directory..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $TempDir

# ============================================================
# Final Report
# ============================================================
Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Package Complete!                           " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Output file :  $outputPath" -ForegroundColor White
Write-Host "  File size   :  $zipSize KB" -ForegroundColor White
Write-Host "  Contents    :  27 files (1 html + 4 css + 22 js)" -ForegroundColor White
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "  1. Extract $OutputZip to your web server directory" -ForegroundColor Yellow
Write-Host "  2. Refer to deploy-guide.md for web server setup" -ForegroundColor Yellow
Write-Host "  3. Open in browser to test" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Files excluded from package:" -ForegroundColor Gray
Write-Host "    - Dev docs: requirements-arch.md, conversation-log.md, progress.md, etc." -ForegroundColor Gray
Write-Host "    - Design prototype: ui-template.html" -ForegroundColor Gray
Write-Host "    - API docs: standard-report-api.md, api-reference.md" -ForegroundColor Gray
Write-Host "    - Dev tools: .claude/, CLAUDE.md, dev-guidelines.md" -ForegroundColor Gray
Write-Host "    - Flowcharts: flowcharts/, flowcharts.md, scripts/" -ForegroundColor Gray
Write-Host "    - Screenshots: screenshots/, *.jpg" -ForegroundColor Gray
Write-Host ""
