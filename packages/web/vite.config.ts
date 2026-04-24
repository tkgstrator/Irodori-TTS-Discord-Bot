import { execSync } from 'node:child_process'
import { cpSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import tanstackRouter from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const serverBundle = (): Plugin => ({
  name: 'server-bundle',
  apply: 'build',
  closeBundle() {
    execSync('bun build src/index.ts --outdir=dist/server --target=bun --packages=external', { stdio: 'inherit' })
    cpSync(resolve(__dirname, 'src/api/templates'), resolve(__dirname, 'dist/server/templates'), { recursive: true })
  }
})

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
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts'
    }),
    react(),
    tailwindcss(),
    serverBundle()
  ],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
})
