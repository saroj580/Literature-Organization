# Offline Literature & Code Organizer

A privacy-focused, fully offline desktop application designed for students, researchers, and developers. This tool allows you to organize research papers, system architecture diagrams, and code snippets in one unified workspace. 

It leverages a modern web-stack UI wrapped in a native desktop shell, powered by a lightweight Python backend for data processing and an embedded SQLite database for flexible document storage.

## 🚀 Features

* **100% Offline:** No cloud syncing, no internet required. Your data lives strictly on your local machine.
* **Flexible Data Storage:** Uses SQLite's JSON1 extension to store unstructured NoSQL-like metadata (handling everything from code syntax types to PDF author names in the same table).
* **Master-Worker Architecture:** The Electron frontend manages the lifecycle of the FastAPI backend, ensuring the Python server only runs when the application is open.
* **Single Click Installer:** Includes a Nullsoft Scriptable Install System (NSIS) script and PowerShell orchestrator to bundle the frontend, backend, and database into a single, professional `Setup.exe`.

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite, TailwindCSS
* **Desktop Wrapper:** Electron (packaging the React web app into a Windows executable)
* **Backend:** Python, FastAPI (handles local file automation and API endpoints)
* **Database:** SQLite3 (embedded locally, using JSON columns for document metadata)
* **Build/Deployment:** PyInstaller (freezes Python), `electron-builder`, PowerShell, NSIS

## 📂 Project Structure

```text
Literature-Organizer/
│
├── backend/                 # Python/FastAPI environment
│   ├── app/main.py          # Server and database logic
│   └── requirements.txt     # Python dependencies
│
├── frontend/                # React/Electron environment
│   ├── src/                 # React UI components
│   ├── main.js              # Electron lifecycle & Python spawner
│   └── package.json         # npm dependencies
│
├── build.ps1                # Master build script (compiles everything)
├── setup.nsi                # NSIS script (creates Setup.exe)
└── README.md                # Project documentation
```

## 💻 Getting Started (Development)

To run this project in development mode, you will need two terminal windows to run the frontend and backend simultaneously.

### 1. Start the Python Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # On Windows
pip install -r requirements.txt
uvicorn main:app --reload
```
*The backend will now be running on http://127.0.0.1:8000*

### 2. Start the React Frontend
Open a new terminal window.
```bash
cd frontend
npm install
npm run dev
```
*The React UI will now be running on http://localhost:5173*

## 📦 Building for Production

When you are ready to distribute your application as a standalone Windows installer, run the master PowerShell script from the root directory.

```powershell
.\build.ps1
```

**What this script does:**
1. Triggers `PyInstaller` to freeze `backend/main.py` into a hidden, standalone `backend.exe`.
2. Triggers Vite to build the optimized React files.
3. Triggers `electron-builder` to package the UI into an unpacked executable directory.
4. Moves the Python `backend.exe` into Electron's `resources` folder.
5. Triggers `makensis` to compress everything into a final `Setup.exe` installer.

## 📝 License
MIT License