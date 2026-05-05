import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api/noticias': {
        target: 'https://idema.edu.pe',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/noticias/, '/php/noticias_proxy.php'),
      },
      '/php/lead_intake_proxy.php': {
        target: 'https://idema.edu.pe',
        changeOrigin: true,
      },
    },
  },
})
