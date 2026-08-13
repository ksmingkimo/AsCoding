<#
.SYNOPSIS
    Sunlike ERP Report System - One-Click Deploy Tool
.DESCRIPTION
    Automatically detects environment, starts HTTP server, opens browser.
    Also supports IIS deployment for production use.
.PARAMETER Mode
    quick   - (Default) Auto-start HTTP server + open browser
    iis     - Deploy to IIS
    package - Generate ZIP package only
.NOTES
    Double-click 启动.bat for the easiest experience.
    Or run: .\install.ps1 -Mode quick
#>

param(
    [ValidateSet("quick", "iis", "package")]
    [string]$Mode = "quick"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = 8080
$SiteName = "SunlikeReport"

# ================================================================
# Utility Functions
# ================================================================

function Write-Step { param($n, $text) Write-Host "  [$n/4] $text" -ForegroundColor Yellow }
function Write-OK   { param($t) Write-Host "         [OK] $t" -ForegroundColor Green }
function Write-ERR  { param($t) Write-Host "         [FAIL] $t" -ForegroundColor Red }
function Write-WARN { param($t) Write-Host "         [WARN] $t" -ForegroundColor DarkYellow }
function Write-TIP  { param($t) Write-Host "         > $t" -ForegroundColor Gray }

# ================================================================
# Banner
# ================================================================

function Show-Banner {
    Write-Host ""
    Write-Host "  ============================================" -ForegroundColor Cyan
    Write-Host "    Sunlike ERP Report System                  " -ForegroundColor Cyan
    Write-Host "    One-Click Deploy Tool v1.2                  " -ForegroundColor Cyan
    Write-Host "  ============================================" -ForegroundColor Cyan
    Write-Host ""
}

# ================================================================
# Preflight Checks
# ================================================================

function Test-Python {
    $py = $null
    foreach ($cmd in @("python3", "python")) {
        try {
            $v = & $cmd --version 2>&1
            if ($LASTEXITCODE -eq 0) { return $cmd }
        } catch {}
    }
    return $null
}

function Test-ERPConnection {
    param($url)
    try {
        $body = '{"COMPNO":"AT01","USR":"SAN","PWD":"","LANG_ID":"zh-cn","SYS_TYPE":"ERP"}'
        $apiUrl = "$url/user/login"
        $r = Invoke-WebRequest -Uri $apiUrl -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5 -UseBasicParsing
        $data = $r.Content | ConvertFrom-Json
        if ($data.code -eq 0) {
            return $true
        }
        Write-WARN "ERP API returned code=$($data.code), msg=$($data.message)"
        return $false
    } catch {
        Write-WARN "Cannot reach ERP API at $url"
        Write-TIP "Error: $($_.Exception.Message)"
        return $false
    }
}

# ================================================================
# Mode: Quick Start (one-click run)
# ================================================================

function Start-QuickMode {
    Write-Step 1 "Checking environment..."

    # -- Check project files --
    if (-not (Test-Path (Join-Path $ScriptDir "index.html"))) {
        Write-ERR "index.html not found. Run this script from the project root."
        return
    }
    Write-OK "Project files found"

    # -- Find HTTP Server --
    Write-Step 2 "Finding available HTTP server..."

    $python = Test-Python
    if ($python) {
        Write-OK "Found: $python ($(& $python --version 2>&1))"
        Write-TIP "Will start HTTP server on port $Port"
    } else {
        Write-ERR "Python not found."
        Write-Host ""
        Write-Host "  Please install Python 3 first:" -ForegroundColor Yellow
        Write-Host "    1. Open Microsoft Store, search 'Python 3.13'" -ForegroundColor White
        Write-Host "    2. Or download from: https://www.python.org/downloads/" -ForegroundColor White
        Write-Host "    3. During install, CHECK 'Add Python to PATH'" -ForegroundColor White
        Write-Host "    4. After install, re-run this script" -ForegroundColor White
        Write-Host ""
        Write-Host "  Or use IIS mode instead:" -ForegroundColor Yellow
        Write-Host "    .\install.ps1 -Mode iis" -ForegroundColor White
        Write-Host ""
        return
    }

    # -- ERP Connection Check --
    Write-Step 3 "Checking ERP API connection..."

    $settings = @{}
    try {
        $raw = Get-Content (Join-Path $ScriptDir "js\settings-store.js") -Raw
    } catch { $raw = "" }

    # Default ERP server from settings-store.js
    $serverUrl = "http://localhost/SUNFUSION/API"
    Write-TIP "Testing: $serverUrl"

    $erpOk = Test-ERPConnection $serverUrl
    if ($erpOk) {
        Write-OK "ERP API is reachable!"
    } else {
        Write-WARN "ERP API not reachable at default (http://localhost)"
        Write-TIP "The app can still start. Configure the correct server address in the Settings panel after login."
        Write-TIP "Settings icon (gear) is in the top-right corner after login."
    }

    # -- Start Server --
    Write-Step 4 "Starting HTTP server..."

    $url = "http://localhost:$Port"
    Write-Host ""
    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host "    Server starting at: $url" -ForegroundColor Green
    Write-Host "    Press Ctrl+C to stop the server" -ForegroundColor Green
    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host ""

    # Open browser
    Start-Process $url

    # Start Python HTTP server
    Set-Location $ScriptDir
    & $python -m http.server $Port
}

# ================================================================
# Mode: IIS Deploy
# ================================================================

function Start-IISMode {
    Write-Step 1 "Checking IIS..."

    $iis = Get-Service W3SVC -ErrorAction SilentlyContinue
    if (-not $iis) {
        Write-ERR "IIS is not installed on this machine."
        Write-Host ""
        Write-Host "  To install IIS:" -ForegroundColor Yellow
        Write-Host "    1. Open 'Turn Windows features on or off'" -ForegroundColor White
        Write-Host "    2. Check 'Internet Information Services'" -ForegroundColor White
        Write-Host "    3. Expand 'World Wide Web Services' -> Check all sub-items" -ForegroundColor White
        Write-Host "    4. Click OK, wait for install, then re-run this script" -ForegroundColor White
        Write-Host ""
        Write-Host "  Or use Quick Start mode instead:" -ForegroundColor Yellow
        Write-Host "    .\install.ps1 -Mode quick" -ForegroundColor White
        Write-Host ""
        return
    }
    Write-OK "IIS is installed"

    # Ensure IIS is running
    if ($iis.Status -ne "Running") {
        Write-WARN "IIS is not running. Starting..."
        Start-Service W3SVC
        Write-OK "IIS started"
    }

    Write-Step 2 "Copying files to IIS..."

    $wwwroot = "$env:SystemDrive\inetpub\wwwroot"
    $targetDir = Join-Path $wwwroot $SiteName

    # Check if target already exists
    if (Test-Path $targetDir) {
        Write-WARN "Target directory already exists: $targetDir"
        $answer = Read-Host "  Overwrite? (y/n)"
        if ($answer -ne "y") {
            Write-Host "  Aborted." -ForegroundColor Gray
            return
        }
        Remove-Item -Recurse -Force $targetDir
    }

    # Create directories and copy files
    New-Item -ItemType Directory -Path (Join-Path $targetDir "css") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $targetDir "js") -Force | Out-Null

    Copy-Item (Join-Path $ScriptDir "index.html") $targetDir
    Copy-Item (Join-Path $ScriptDir "css\*.css") (Join-Path $targetDir "css\")
    Copy-Item (Join-Path $ScriptDir "js\*.js") (Join-Path $targetDir "js\")
    Write-OK "Files copied to $targetDir"

    Write-Step 3 "Configuring IIS..."

    # Check if site already exists
    $existingSite = Get-IISSite -Name $SiteName -ErrorAction SilentlyContinue
    $existingAppPool = Get-IISAppPool -Name $SiteName -ErrorAction SilentlyContinue

    if ($existingSite) {
        Write-WARN "IIS Site '$SiteName' already exists. Removing..."
        Remove-IISSite -Name $SiteName -Confirm:$false
    }
    if ($existingAppPool) {
        Remove-IISAppPool -Name $SiteName -Confirm:$false
    }

    # Create App Pool
    New-IISAppPool -Name $SiteName | Out-Null
    Write-OK "App Pool '$SiteName' created"

    # Check if port 8080 is in use
    $portInUse = netstat -ano | Select-String ":$Port "
    if ($portInUse) {
        Write-WARN "Port $Port is in use. Trying port 8081..."
        $Port = 8081
        $portInUse = netstat -ano | Select-String ":$Port "
        if ($portInUse) {
            Write-WARN "Port $Port also in use. Trying port 8088..."
            $Port = 8088
        }
    }

    # Create Site
    New-IISSite -Name $SiteName -PhysicalPath $targetDir -BindingInformation "*:$($Port):" -ApplicationPool $SiteName | Out-Null
    Write-OK "IIS Site '$SiteName' created on port $Port"

    # Start site
    Start-IISSite -Name $SiteName
    Write-OK "Site started"

    Write-Step 4 "Opening browser..."

    $url = "http://localhost:$Port"
    Start-Process $url

    Write-Host ""
    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host "    Deploy Complete!" -ForegroundColor Green
    Write-Host "    URL: $url" -ForegroundColor Green
    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host ""

    Write-Host "  Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Open $url in your browser" -ForegroundColor White
    Write-Host "  2. Login with your ERP credentials" -ForegroundColor White
    Write-Host "  3. If API connection fails, click the gear icon to configure server address" -ForegroundColor White
    Write-Host ""

    # Firewall check
    $fwRule = Get-NetFirewallRule -DisplayName "SunlikeReport*" -ErrorAction SilentlyContinue
    if (-not $fwRule) {
        Write-Host "  Opening firewall port $Port for external access..." -ForegroundColor Yellow
        try {
            New-NetFirewallRule -DisplayName "SunlikeReport $Port" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow | Out-Null
            Write-OK "Firewall rule added for port $Port"
        } catch {
            Write-WARN "Could not add firewall rule (may need admin rights)"
            Write-TIP "Other computers on the network won't be able to access this server"
        }
    }
}

# ================================================================
# Mode: Package (ZIP only)
# ================================================================

function Start-PackageMode {
    Write-Step 1 "Preparing package..."
    $packageScript = Join-Path $ScriptDir "deploy.ps1"
    if (Test-Path $packageScript) {
        & $packageScript
    } else {
        Write-ERR "deploy.ps1 not found"
    }
}

# ================================================================
# Main
# ================================================================

Show-Banner

if ($Mode -eq "quick") {
    Start-QuickMode
} elseif ($Mode -eq "iis") {
    Start-IISMode
} elseif ($Mode -eq "package") {
    Start-PackageMode
} else {
    Write-Host "  Choose a mode:" -ForegroundColor Yellow
    Write-Host "    1. Quick Start  - Auto-detect HTTP server + Open browser (default)" -ForegroundColor White
    Write-Host "    2. IIS Deploy   - Deploy to IIS for production use" -ForegroundColor White
    Write-Host "    3. Package      - Generate ZIP file only" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "  Enter choice (1/2/3)"
    switch ($choice) {
        "1" { Start-QuickMode }
        "2" { Start-IISMode }
        "3" { Start-PackageMode }
        default { Write-Host "Invalid choice." -ForegroundColor Red }
    }
}
