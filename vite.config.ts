import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  server: {
    // Needed for the Arena live-preview proxy host.
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        studio: resolve(root, 'studio.html'),
      },
    },
  },
})
