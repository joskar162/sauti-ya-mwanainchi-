import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@firebase/auth/')) return 'firebase-auth';
          if (id.includes('/node_modules/@firebase/firestore/')) return 'firebase-firestore';
          if (id.includes('/node_modules/@firebase/')) return 'firebase-shared';
          if (id.includes('/node_modules/firebase/')) return 'firebase-core';
        }
      }
    }
  }
})