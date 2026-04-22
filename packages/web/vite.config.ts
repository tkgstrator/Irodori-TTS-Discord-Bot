import tailwindcss from '@tailwindcss/vite'
import tanstackRouter from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5175,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  plugins: [
    tanstackRouter({
      quoteStyle: 'single',
      routesDirectory: './routes',
      generatedRouteTree: './routeTree.gen.ts'
    }),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname
    }
  }
})
