import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron =
    process.env.VITE_ELECTRON === 'true' || mode === 'electron'

  return {
    base: isElectron ? './' : '/',
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5771',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
