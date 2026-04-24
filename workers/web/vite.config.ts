import { execSync } from 'node:child_process'
import { cpSync } from 'node:fs'
import { resolve } from 'node:path'
import devServer, { defaultOptions } from '@hono/vite-dev-server'
import nodeAdapter from '@hono/vite-dev-server/node'
import tailwindcss from '@tailwindcss/vite'
import tanstackRouter from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const serverBundle = (): Plugin => ({
  name: 'server-bundle',
  apply: 'build',
  closeBundle() {
    execSync('bun build src/index.ts --outdir=dist/server --target=bun --minify', { stdio: 'inherit' })
    cpSync(resolve(__dirname, 'src/api/templates'), resolve(__dirname, 'dist/server/templates'), { recursive: true })
  }
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  return {
    server: {
      host: '0.0.0.0',
      port: 3000
    },
    plugins: [
      devServer({
        entry: 'src/app.ts',
        adapter: nodeAdapter,
        exclude: [/^(?!\/api).*/, ...defaultOptions.exclude]
      }) as Plugin,
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
  }
})
