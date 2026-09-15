import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { parseEnv } from 'node:util'

const rootEnvPath = resolve(import.meta.dirname, '../../..', '.env')

if (existsSync(rootEnvPath)) {
  Object.assign(process.env, parseEnv(readFileSync(rootEnvPath, 'utf8')))
}
