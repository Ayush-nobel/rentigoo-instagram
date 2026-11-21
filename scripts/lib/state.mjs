/** state/published.json: what has gone out, so nothing is ever posted twice. Plus the publish log. */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { redact } from './graph.mjs'

export function openState(root) {
  // Tests point these somewhere else so they never touch the real record.
  const file = process.env.RG_STATE_FILE || resolve(root, 'state/published.json')
  const logFile = process.env.RG_LOG_FILE || resolve(root, 'logs/publish.log')
  let data = {}
  try {
    data = JSON.parse(readFileSync(file, 'utf8'))
  } catch {}
  const save = () => {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
  }
  const log = (entry, { dryRun = false } = {}) => {
    const line = JSON.stringify({ at: new Date().toISOString(), ...(dryRun ? { dryRun: true } : {}), ...entry })
    console.log(redact(line))
    mkdirSync(dirname(logFile), { recursive: true })
    appendFileSync(logFile, redact(line) + '\n')
  }
  return {
    get: (id) => data[id],
    isDone: (id) => ['published', 'manual'].includes(data[id]?.status),
    set(id, patch) {
      data[id] = { ...data[id], ...patch, updatedAt: new Date().toISOString() }
      save()
    },
    log,
  }
}
