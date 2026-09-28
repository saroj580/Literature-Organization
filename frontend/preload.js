// ─────────────────────────────────────────────────────────────
// preload.js — Secure bridge between Electron and React
// ─────────────────────────────────────────────────────────────

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});
