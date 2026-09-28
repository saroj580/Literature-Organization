// ─────────────────────────────────────────────────────────────
// main.cjs — Electron Main Process & Python Lifecycle Manager
// ─────────────────────────────────────────────────────────────

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let pythonProcess = null;

// Determine environment
const isDev = !app.isPackaged;

/**
 * Starts the Python FastAPI backend as a child background process.
 * In production: launches backend.exe packaged inside process.resourcesPath.
 * In development: connects to local dev server.
 */
function startPythonBackend() {
  if (isDev) {
    console.log('[Electron] Development mode: connect to local FastAPI server on port 8000');
    return;
  }

  // Path to backend.exe inside Electron's resources folder
  const backendExecutable = path.join(process.resourcesPath, 'backend.exe');

  console.log('[Electron] Spawning Python backend at:', backendExecutable);

  try {
    pythonProcess = spawn(backendExecutable, [], {
      windowsHide: true, // Hide command prompt console window on Windows
      stdio: 'ignore',
    });

    pythonProcess.on('error', (err) => {
      console.error('[Electron] Failed to start Python backend executable:', err);
    });

    pythonProcess.on('exit', (code, signal) => {
      console.log(`[Electron] Python backend exited with code ${code}, signal ${signal}`);
    });
  } catch (err) {
    console.error('[Electron] Error spawning backend process:', err);
  }
}

/**
 * Creates the main native application window.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0f1117',
    title: 'Literature Organizer',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Application Lifecycle ────────────────────────────────────

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Kill the Python backend process when all windows close
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (pythonProcess && pythonProcess.pid) {
    console.log('[Electron] Terminating Python backend process...');
    try {
      // Windows force-kill process tree to immediately free port 8000
      spawn('taskkill', ['/pid', pythonProcess.pid.toString(), '/f', '/t']);
    } catch {
      pythonProcess.kill();
    }
  }
});
