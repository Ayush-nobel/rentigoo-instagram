/**
 * The official Instagram Graph API (Facebook Login flavour, graph.facebook.com),
 * used only for our own account: publishing our own media and reading our own
 * insights. Nothing here follows, likes, comments, messages or reads other accounts.
 */
const VERSION = () => process.env.GRAPH_VERSION || 'v27.0'
const BASE = () => `https://graph.facebook.com/${VERSION()}`

export class GraphError extends Error {
  constructor(message, { status, code, subcode, transient } = {}) {
    super(message)
    Object.assign(this, { status, code, subcode, transient })
  }
}

export function config() {
  const token = process.env.IG_ACCESS_TOKEN
  const userId = process.env.IG_USER_ID
  if (!token || !userId) throw new Error('IG_ACCESS_TOKEN and IG_USER_ID must be set (in .env locally, or as GitHub Secrets).')
  return { token, userId }
}

/** Never let the token reach a log. */
export const redact = (s) => String(s).replace(/access_token=[^&\s"]+/g, 'access_token=***').replace(/EAA[A-Za-z0-9]{20,}/g, 'EAA***')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * One Graph call with safe retries: only network errors, 5xx and rate limits
 * are retried, with backoff. `retry: false` for calls that must never repeat
 * blindly (media_publish: the caller checks the container instead).
 */
export async function graph(method, path, params = {}, { retry = true, attempts = 4 } = {}) {
  const { token } = config()
  const url = new URL(`${BASE()}/${path.replace(/^\//, '')}`)
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) (method === 'GET' ? url.searchParams : body).set(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
  let last
  for (let i = 1; i <= (retry ? attempts : 1); i++) {
    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, ...(method === 'GET' ? {} : { 'Content-Type': 'application/x-www-form-urlencoded' }) },
        body: method === 'GET' ? undefined : body,
        signal: AbortSignal.timeout(60_000),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && !json.error) return json
      const e = json.error ?? {}
      // 1, 2: temporary; 4, 17, 32, 613: rate limits; 9: publishing limit reached (not worth retrying now).
      const transient = res.status >= 500 || [1, 2, 4, 17, 32, 613].includes(e.code) || e.is_transient === true
      last = new GraphError(redact(`${e.type ?? 'GraphError'} ${e.code ?? res.status}${e.error_subcode ? '/' + e.error_subcode : ''}: ${e.error_user_msg ?? e.message ?? res.statusText}`), { status: res.status, code: e.code, subcode: e.error_subcode, transient })
      if (!transient) throw last
    } catch (err) {
      if (err instanceof GraphError && !err.transient) throw err
      last = err instanceof GraphError ? err : new GraphError(redact(`Network error: ${err.message}`), { transient: true })
    }
    if (retry && i < attempts) await sleep(2000 * 2 ** (i - 1))
  }
  throw last
}

/** How many API posts are left in Instagram's rolling 24-hour window (read live; Meta has quoted 25, 50 and 100). */
export async function publishingQuota() {
  const { userId } = config()
  const r = await graph('GET', `${userId}/content_publishing_limit`, { fields: 'config,quota_usage' })
  const d = r.data?.[0] ?? {}
  const total = d.config?.quota_total ?? 25
  return { used: d.quota_usage ?? 0, total, left: Math.max(0, total - (d.quota_usage ?? 0)) }
}

/** Wait for a container to finish processing (videos take a while). */
export async function waitForContainer(id, { timeoutMs = 10 * 60_000, everyMs = 10_000 } = {}) {
  const until = Date.now() + timeoutMs
  for (;;) {
    const r = await graph('GET', id, { fields: 'status_code,status' })
    if (r.status_code === 'FINISHED' || r.status_code === 'PUBLISHED') return r.status_code
    if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') throw new GraphError(`Container ${id} is ${r.status_code}: ${r.status ?? ''}`)
    if (Date.now() > until) throw new GraphError(`Container ${id} still ${r.status_code} after ${timeoutMs / 60000} minutes`, { transient: true })
    await sleep(everyMs)
  }
}
