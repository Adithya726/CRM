import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Avoid CORS in dev by proxying API requests
      '/api': {
        target: 'http://localhost:5771',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
