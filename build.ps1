# Bundles Python backend + React frontend + Electron into Setup.exe

$ErrorActionPreference = "Stop" 


Write-Host "" #outputs a blank line
Write-Host "========================================================" -ForegroundColor Cyan #part makes the text light blue
Write-Host "   Literature Organizer - Master Build Orchestrator     " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$RootDir = $PSScriptRoot #built-in shortcut that means "the folder where this script is currently saved." We saved that location in $RootDir variable. This allows us to easily reference the backend, frontend, and dist-installer folders. 
if (-not $RootDir) { # if, for some reason, $PSScriptRoot is empty, just use Get-Location to figure out where we are
    $RootDir = (Get-Location).Path
}

$BackendDir = Join-Path $RootDir "backend" #Join-Path is the safe way to glue folder names together, regardless of whether the operating system uses backslashes(\) or forward slashes(/).
$FrontendDir = Join-Path $RootDir "frontend" #We do the same thing for the frontend folder.
$DistInstallerDir = Join-Path $RootDir "dist-installer" #And the same thing for the output directory where the final installer will be saved.

# Ensure output directory exists
if (-not (Test-Path $DistInstallerDir)) { # Test-Path checks if the installer folder actually exists in our system. (-not) means if it doesn't exist
    New-Item -ItemType Directory -Path $DistInstallerDir -Force | Out-Null # New-Item creates a new Folder (Directory) there. | Out-Null just means "do this quietly, don't print the result to the screen"
}

# -- 1. Build Python Backend with PyInstaller 
Write-Host "[1/5] Freezing Python backend with PyInstaller..." -ForegroundColor Yellow

$PythonExe = Join-Path $BackendDir "venv\Scripts\python.exe" #path to the python interpreter inside the virtual environment
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python" #if the path is not found, it will use the global python interpreter
}

Push-Location $BackendDir # Push-Location temporarily moves you into the backend folder so that PyInstaller knows where to look for your files. Think of this as double-clicking a folder to go inside it.
try {
    & $PythonExe -m PyInstaller --noconfirm --onefile --windowed --name "backend" --hidden-import "app" --hidden-import "app.database" --hidden-import "app.security" --hidden-import "app.schemas" --hidden-import "app.controllers.auth_controller" --hidden-import "app.controllers.document_controller" --hidden-import "app.routes.auth" --hidden-import "app.routes.documents" --clean main.py
    # take my pyhton backend code and freeze it into a single .exe file that window can run - even if python is not installed. That's what PyInstaller does. It bundles your python code + all its dependencies into one standalone executable
    # --noconfirm: It tells PyInstaller "Don't ask for confirmation before building."
    # --onefile: Create a single executable file instead of a folder.
    # --windowed: Create a GUI application (no black terminal window).
    # --name "backend": Name the output file "backend.exe".
    # --hidden-import ...: Explicitly include all necessary modules (since PyInstaller sometimes misses them).
    # --clean: Clean up temporary files from previous builds.
    # main.py: The entry point of your application.
}
finally {
    Pop-Location # Changes your location back to the previous folder, so the script can continue running from the root directory.
    # the try-finally combo ensures that even if the build process crashes, we still return to the original directory.
    #  Pop-Location is PowerShell's way of saying "go back to where I was before". This is like cd .. but smarter — it remembers exactly where you came from.
}

$BackendExe = Join-Path $BackendDir "dist\backend.exe" # Checks if backend.exe was generated successfully.
if (-not (Test-Path $BackendExe)) { # If not throw an error message, that tells you that backend.exe was not generated at $BackendExe
    throw "Failed to generate backend.exe at $BackendExe" # throw crashes the script entirely and yells the error message. 
}
Write-Host "[OK] backend.exe generated successfully." -ForegroundColor Green # If it worked, it prints a green success message

# -- 2. Build React UI with Vite 
Write-Host "" # outputs a blank line
Write-Host "[2/5] Building React frontend with Vite..." -ForegroundColor Yellow # outputs a yellow progress message

Push-Location $FrontendDir # move to the frontend folder
try { #start the try block
    npm run build # run the build command (it takes all the React code and turns it into optimized HTML, CSS, and JavaScript files)
}
finally {
    Pop-Location # return to the root directory
}
Write-Host "[OK] React production build created in frontend/dist." -ForegroundColor Green # If it worked, it prints a green success message

# -- 3. Package Electron Application 
Write-Host ""
Write-Host "[3/5] Packaging Electron application (unpacked)..." -ForegroundColor Yellow # outputs a yellow progress message

Push-Location $FrontendDir # move to the frontend folder
try { #start the try block
    npx electron-builder --dir # run the build command. The --dir tag means "just build the raw folders and files, do not zip it up into an installer yet." 
}
finally {
    Pop-Location # return to the root directory
}
Write-Host "[OK] Electron unpacked directory created." -ForegroundColor Green # If it worked, it prints a green success message

# -- 4. Inject backend.exe into Electron Resources 
Write-Host ""
Write-Host "[4/5] Injecting backend.exe into Electron resources..." -ForegroundColor Yellow # outputs a yellow progress message

$ResourcesDir = Join-Path $FrontendDir "dist-electron\win-unpacked\resources" # Define the path where the resources will be stored. Think of this as defining the folder where the backend.exe file will be placed.
if (-not (Test-Path $ResourcesDir)) { # Checks if the resources folder actually exists in our system. 
    New-Item -ItemType Directory -Path $ResourcesDir -Force | Out-Null # creates the folder if it doesn't exist, -Force means it will overwrite existing folders if needed and - |Out-Null means "do this quietly, don't print the result to the screen"
}

Copy-Item -Path $BackendExe -Destination (Join-Path $ResourcesDir "backend.exe") -Force # Copies backend.exe into that folder. Copy-Item takes the backend.exe we made in Step 1 and drops a copy of it inside the Electron app. Now, the visual app(Electron/React) and brain(python) are living in the same folder. -Force means it will overwrite the file if one is already there.
Write-Host "[OK] backend.exe placed in Electron resources." -ForegroundColor Green

# -- 5. Compile Installer with NSIS
Write-Host ""
Write-Host "[5/5] Compiling Setup.exe with NSIS (makensis)..." -ForegroundColor Yellow

$NsisExe = "makensis.exe" # This is the command-line tool for NSIS (Nullsoft Scriptable Install System), which is used to create Windows installers.
if (-not (Get-Command $NsisExe -ErrorAction SilentlyContinue)) { # Get-Command checks if the command-line tool for NSIS exists in the system's PATH. -ErrorAction SilentlyContinue tells the system not to show an error if the command is not found.
    $NsisPath = "C:\Program Files (x86)\NSIS\Bin\makensis.exe" # Checks if the command-line tool for NSIS exists in the standard directory "C:\Program Files (x86)\NSIS\Bin". If not, it throws an error message.
    if (Test-Path $NsisPath) {
        $NsisExe = $NsisPath # If the tool is found, it assigns the full path to $NsisExe. If not, it throws an error message.
    } else {
        throw "makensis.exe not found on PATH or in standard directory." # "throw" is like yelling "STOP! I can't continue because something is missing!" It stops the script immediately.
    }
}

& $NsisExe (Join-Path $RootDir "setup.nsi") # This runs NSIS and feeds it a file called setup.nsi. That .nsi file(which sits next to this script) holds the specific instructions on how to zip up the final app, create desktop shortcuts, and builds the literature-Organization-Setup.exe file.

$SetupExe = Join-Path $DistInstallerDir "Literature-Organizer-Setup.exe" # Define the path where the literature-Organization-Setup.exe file will be located
if (Test-Path $SetupExe) { # If it is, it prints a big screen success banner showing you exactly where to find your brand-new installer. If it's missing, it throws a final error.
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green 
    Write-Host "   BUILD COMPLETE! Setup.exe is ready:                  " -ForegroundColor Green
    Write-Host "   $SetupExe" -ForegroundColor White
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
} else {
    throw "NSIS finished but installer not found at $SetupExe"
}
