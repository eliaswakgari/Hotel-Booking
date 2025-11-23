import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
   optimizeDeps: {
    exclude: ['core-js'] // exclude core-js from dependency optimization
  },
  build: {
    rollupOptions: {
      external: ['core-js'] // mark core-js as external
    }
  },
   server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // your backend server
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
    },
  },
})
