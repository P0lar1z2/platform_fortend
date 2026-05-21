import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// 默认连本地 backend;`VITE_API_TARGET=https://raventik.com npm run dev` 切到线上。
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: { '*': '' },
      },
      '/health': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
