/** Loads .env (if there is one) into process.env, without overriding real environment variables. No package needed. */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function loadEnv(root) {
  const file = resolve(root, '.env')
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(#.*)?$/)
    if (m && process.env[m[1]] === undefined && m[2] !== '') process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
