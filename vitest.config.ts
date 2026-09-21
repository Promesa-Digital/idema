import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Configuración aparte de vite.config.ts para no cargar tailwind ni el proxy del dev
// server al correr pruebas: son irrelevantes aquí y hacen el arranque más lento.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
