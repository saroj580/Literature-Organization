import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Ensures assets are loaded with relative paths for Electron (file:// protocol)
  plugins: [react(), tailwindcss()],
})
