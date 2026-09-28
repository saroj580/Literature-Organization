
# build.ps1 — Master Build Orchestrator
# Bundles Python backend + React frontend + Electron into Setup.exe

$ErrorActionPreference = "Stop"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   Literature Organizer — Master Build Orchestrator      " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$DistInstallerDir = Join-Path $RootDir "dist-installer"

# Ensure output directory exists
if (-not (Test-Path $DistInstallerDir)) {
    New-Item -ItemType Directory -Path $DistInstallerDir | Out-Null
}

# ── 1. Build Python Backend with PyInstaller ──────────────────
Write-Host "[1/5] Freezing Python backend with PyInstaller..." -ForegroundColor Yellow

$PythonExe = Join-Path $BackendDir "venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

# Run PyInstaller
Push-Location $BackendDir
try {
    & $PythonExe -m PyInstaller `
        --noconfirm `
        --onefile `
        --windowed `
        --name "backend" `
        --hidden-import "app" `
        --hidden-import "app.database" `
        --hidden-import "app.security" `
        --hidden-import "app.schemas" `
        --hidden-import "app.controllers.auth_controller" `
        --hidden-import "app.controllers.document_controller" `
        --hidden-import "app.routes.auth" `
        --hidden-import "app.routes.documents" `
        --clean `
        main.py
}
finally {
    Pop-Location
}

$BackendExe = Join-Path $BackendDir "dist\backend.exe"
if (-not (Test-Path $BackendExe)) {
    Write-Error "Failed to generate backend.exe at $BackendExe"
}
Write-Host "✓ backend.exe generated successfully." -ForegroundColor Green

# ── 2. Build React UI with Vite 
Write-Host "`n[2/5] Building React frontend with Vite..." -ForegroundColor Yellow

Push-Location $FrontendDir
try {
    npm run build
}
finally {
    Pop-Location
}
Write-Host "✓ React production build created in frontend/dist." -ForegroundColor Green

# ── 3. Package Electron Application 
Write-Host "`n[3/5] Packaging Electron application (unpacked)..." -ForegroundColor Yellow

Push-Location $FrontendDir
try {
    npx electron-builder --dir
}
finally {
    Pop-Location
}
Write-Host "✓ Electron unpacked directory created." -ForegroundColor Green

# ── 4. Inject backend.exe into Electron Resources 
Write-Host "`n[4/5] Injecting backend.exe into Electron resources..." -ForegroundColor Yellow

$ResourcesDir = Join-Path $FrontendDir "dist-electron\win-unpacked\resources"
if (-not (Test-Path $ResourcesDir)) {
    New-Item -ItemType Directory -Path $ResourcesDir | Out-Null
}

Copy-Item -Path $BackendExe -Destination (Join-Path $ResourcesDir "backend.exe") -Force
Write-Host "✓ backend.exe placed at $ResourcesDir\backend.exe" -ForegroundColor Green

# ── 5. Compile Installer with NSIS 
Write-Host "`n[5/5] Compiling Setup.exe with NSIS (makensis)..." -ForegroundColor Yellow

$NsisExe = "makensis.exe"
if (-not (Get-Command $NsisExe -ErrorAction SilentlyContinue)) {
    $NsisPath = "C:\Program Files (x86)\NSIS\Bin\makensis.exe"
    if (Test-Path $NsisPath) {
        $NsisExe = $NsisPath
    }
    else {
        Write-Error "makensis.exe not found on PATH or in standard directory."
    }
}

& $NsisExe (Join-Path $RootDir "setup.nsi")

$SetupExe = Join-Path $DistInstallerDir "Literature-Organizer-Setup.exe"
if (Test-Path $SetupExe) {
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "   BUILD COMPLETE! Setup.exe is ready:                  " -ForegroundColor Green
    Write-Host "   $SetupExe" -ForegroundColor White
    Write-Host "========================================================`n" -ForegroundColor Green
}
else {
    Write-Error "NSIS finished but installer not found at $SetupExe"
}
