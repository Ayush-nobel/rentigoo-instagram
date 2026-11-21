/**
 * Test only: replaces fetch with a pretend Graph API, so the live publishing
 * path can be exercised without touching Instagram. Loaded with --import.
 * FAKE_SCENARIO: ok | publish-error-but-published | rate-limit-once
 */
import { appendFileSync } from 'node:fs'

const scenario = process.env.FAKE_SCENARIO || 'ok'
const calls = process.env.FAKE_CALLS
const containers = new Map(JSON.parse(process.env.FAKE_CONTAINERS || '[]'))
let n = 0
let rateLimited = false
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input))
  const method = init.method || 'GET'
  const params = method === 'GET' ? url.searchParams : new URLSearchParams(String(init.body ?? ''))
  if (!url.hostname.endsWith('facebook.com')) return new Response('', { status: 200 }) // the public media URLs
  const path = url.pathname.split('/').slice(2).join('/')
  if (calls) appendFileSync(calls, `${method} ${path} ${[...params.keys()].join(',')}\n`)
  if (scenario === 'rate-limit-once' && !rateLimited && method === 'POST') {
    rateLimited = true
    return json({ error: { message: 'Application request limit reached', code: 4 } }, 400)
  }
  if (path === 'IGUSER' && method === 'GET') return json({ username: 'rentigoo', id: 'IGUSER', followers_count: 412, media_count: 8 })
  if (path === 'IGUSER/insights') {
    const metric = params.get('metric')
    if (metric === 'follower_count') return json({ data: [{ values: [{ value: 3 }, { value: 5 }] }] })
    if (metric === 'website_clicks') return json({ error: { message: 'metric retired', code: 100 } }, 400)
    return json({ data: [{ name: metric, total_value: { value: { reach: 2100, profile_views: 140, accounts_engaged: 95, total_interactions: 230, saves: 41, shares: 17, follows_and_unfollows: 12, profile_links_taps: 9 }[metric] ?? 0 } }] })
  }
  if (path === 'IGUSER/media' && method === 'GET' && params.get('fields')?.includes('caption')) {
    const day = (d, h) => new Date(Date.UTC(2026, 10, d, h - 5, 30)).toISOString().replace('.000Z', '+0000')
    return json({ data: [
      { id: 'M1', caption: 'Ek shaadi ke liye ₹85,000 ka camera?', media_type: 'VIDEO', media_product_type: 'REELS', timestamp: day(23, 19), permalink: 'https://instagram.com/p/M1' },
      { id: 'M2', caption: 'Ghar mein shaadi hai?', media_type: 'CAROUSEL_ALBUM', media_product_type: 'FEED', timestamp: day(24, 20), permalink: 'https://instagram.com/p/M2' },
      { id: 'M3', caption: 'RentiGoo kaise kaam karta hai?', media_type: 'CAROUSEL_ALBUM', media_product_type: 'FEED', timestamp: day(26, 19), permalink: 'https://instagram.com/p/M3' },
      { id: 'M4', caption: 'Weekend party ke liye naya speaker?', media_type: 'VIDEO', media_product_type: 'REELS', timestamp: day(27, 20), permalink: 'https://instagram.com/p/M4' },
      { id: 'M5', caption: 'Item of the week: Nikon Camera', media_type: 'IMAGE', media_product_type: 'FEED', timestamp: day(29, 19), permalink: 'https://instagram.com/p/M5' },
    ], paging: {} })
  }
  if (/^M\d+\/insights$/.test(path)) {
    const k = Number(path[1])
    const v = { reach: [0, 1500, 600, 420, 980, 300][k], saved: [0, 30, 44, 21, 12, 3][k], shares: [0, 22, 9, 6, 15, 1][k], views: [0, 4100, 0, 0, 2600, 0][k], total_interactions: 50, profile_visits: 10, follows: 2 }[params.get('metric')]
    return json({ data: [{ values: [{ value: v }] }] })
  }
  if (path === 'IGUSER/content_publishing_limit') return json({ data: [{ quota_usage: 1, config: { quota_total: 100 } }] })
  if (path === 'IGUSER/media' && method === 'POST') {
    const id = `C${++n}`
    containers.set(id, 'FINISHED')
    return json({ id })
  }
  if (path === 'IGUSER/media' && method === 'GET') return json({ data: [{ id: 'M-latest', permalink: 'https://instagram.com/p/latest' }] })
  if (path === 'IGUSER/media_publish') {
    const id = params.get('creation_id')
    containers.set(id, 'PUBLISHED')
    if (scenario === 'publish-error-but-published') return json({ error: { message: 'An unexpected error has occurred', code: 2, is_transient: true } }, 500)
    return json({ id: `M-${id}` })
  }
  if (/^C\d+|^OLD/.test(path)) return json(params.get('fields') === 'id,permalink' ? { id: path } : { status_code: containers.get(path) ?? 'EXPIRED' })
  if (/^M-/.test(path)) return json({ id: path, permalink: `https://instagram.com/p/${path}` })
  return json({ error: { message: `fake: unknown ${method} ${path}`, code: 100 } }, 400)
}
// Make the retry and wait pauses instant.
const realSetTimeout = globalThis.setTimeout
globalThis.setTimeout = (fn, _ms, ...a) => realSetTimeout(fn, 0, ...a)
