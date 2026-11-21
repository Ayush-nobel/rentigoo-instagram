#!/usr/bin/env node
/**
 * Publishes due posts from content/calendar.yaml with the official Instagram
 * Graph API content publishing flow (images, carousels, reels).
 *
 *   node scripts/publish.mjs --dry-run           show what would go out now, publish nothing
 *   node scripts/publish.mjs                     publish what's due
 *   node scripts/publish.mjs --now 2026-11-23T19:45+05:30 --dry-run   pretend it's that time
 *   node scripts/publish.mjs --only <id>         just that post (still only if due, unless --force-time)
 *   node scripts/publish.mjs --mark-manual <id>  you posted it in the app: never publish it here
 *
 * Safety: a post is published at most once (state/published.json, checked
 * before and saved after every step). Posts with any TODO are skipped. Posts
 * more than --late-hours late (default 36) are reported as missed, never
 * published out of the blue. At most --max posts per run (default 2), and never
 * more than Instagram's live publishing quota.
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { dueAt, fullCaption, loadCalendar, mediaFiles, ROOT, todosIn } from './lib/calendar.mjs'
import { loadEnv } from './lib/env.mjs'
import { config, graph, publishingQuota, waitForContainer } from './lib/graph.mjs'
import { openState } from './lib/state.mjs'

loadEnv(ROOT)
const args = process.argv.slice(2)
const flag = (n) => args.includes(n)
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
const dryRun = flag('--dry-run') || process.env.DRY_RUN === 'true'
const now = opt('--now') ? new Date(opt('--now')) : new Date()
const only = opt('--only')
const forceTime = flag('--force-time')
const maxPerRun = Number(opt('--max', 2))
const lateHours = Number(opt('--late-hours', 36))
const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')

const state = openState(ROOT)
const { posts, problems } = loadCalendar()
if (problems.length) {
  console.error('calendar.yaml has problems, nothing published:\n  ' + problems.join('\n  '))
  process.exit(1)
}

if (flag('--mark-manual')) {
  const id = opt('--mark-manual')
  if (!posts.some((p) => p.id === id)) throw new Error(`No post with id ${id}`)
  state.set(id, { status: 'manual' })
  state.log({ id, action: 'marked-manual' })
  process.exit(0)
}

const ist = (d) => d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
console.log(`${dryRun ? 'DRY RUN: nothing will be published.' : 'LIVE RUN.'} Now: ${ist(now)} IST`)

const due = posts
  .filter((p) => !only || p.id === only)
  .filter((p) => !state.isDone(p.id))
  .filter((p) => forceTime || dueAt(p) <= now)
  .sort((a, b) => dueAt(a) - dueAt(b))

const upcoming = posts.filter((p) => !state.isDone(p.id) && dueAt(p) > now).sort((a, b) => dueAt(a) - dueAt(b))
if (!due.length) {
  console.log(`Nothing due. Next: ${upcoming[0] ? `${upcoming[0].id} at ${ist(dueAt(upcoming[0]))} IST` : 'none in the calendar'}.`)
}

// Read-only checks that the token works and how much quota is left (also in a dry run, if a token is set).
let quota = null
const haveCreds = Boolean(process.env.IG_ACCESS_TOKEN && process.env.IG_USER_ID)
if (due.length && haveCreds) {
  const { userId } = config()
  const me = await graph('GET', userId, { fields: 'username' })
  quota = await publishingQuota()
  console.log(`Account @${me.username}. Publishing quota: ${quota.used}/${quota.total} used in the last 24 hours.`)
} else if (due.length) {
  console.log('No IG_ACCESS_TOKEN / IG_USER_ID set: skipping the account and quota check.')
}

let published = 0
let failures = 0
for (const p of due) {
  const late = (now - dueAt(p)) / 3_600_000
  const skip = (why) => state.log({ id: p.id, action: 'skipped', why }, { dryRun })
  if (late > lateHours && !forceTime) {
    skip(`missed: due ${ist(dueAt(p))} IST, ${Math.round(late)} hours ago (over --late-hours ${lateHours}). Reschedule it or run with --only ${p.id} --force-time.`)
    continue
  }
  const todos = todosIn(p)
  if (todos.length) {
    skip(`has ${todos.length} TODO: ${todos[0]}`)
    continue
  }
  const files = mediaFiles(p)
  const needed = p.type === 'reel' ? [files.video, files.cover] : files.images
  const missing = needed.filter((f) => !existsSync(resolve(ROOT, f)))
  if (missing.length) {
    skip(p.type === 'reel' && missing.includes(files.video) ? `waiting for the video: drop it at ${files.video} (or post in the app and --mark-manual ${p.id})` : `missing files: ${missing.join(', ')} (run npm run generate)`)
    continue
  }
  if (!base) {
    skip('PUBLIC_BASE_URL is not set, so Instagram has no public URL to fetch the media from')
    continue
  }
  const urls = Object.fromEntries(needed.map((f) => [f, `${base}/${f}`]))
  const unreachable = []
  for (const u of Object.values(urls)) {
    const r = await fetch(u, { method: 'HEAD' }).catch(() => null)
    if (!r?.ok) unreachable.push(`${u} (${r ? r.status : 'no response'})`)
  }
  if (unreachable.length) {
    skip(`not on the public site yet (GitHub Pages may still be deploying): ${unreachable.join(', ')}`)
    continue
  }
  if (published >= maxPerRun) {
    skip(`over --max ${maxPerRun} for this run; next run`)
    continue
  }
  if (quota && published >= quota.left) {
    skip(`Instagram publishing quota used up (${quota.used}/${quota.total}); next run`)
    continue
  }

  const caption = fullCaption(p)
  if (dryRun) {
    state.log({ id: p.id, action: 'would-publish', type: p.type, due: ist(dueAt(p)), media: Object.values(urls), caption: caption.slice(0, 120) + (caption.length > 120 ? '…' : '') }, { dryRun })
    published++
    continue
  }

  try {
    const result = await publishOne(p, urls, caption)
    state.set(p.id, { status: 'published', mediaId: result.id, permalink: result.permalink, publishedAt: new Date().toISOString() })
    state.log({ id: p.id, action: 'published', mediaId: result.id, permalink: result.permalink })
    published++
  } catch (e) {
    failures++
    state.log({ id: p.id, action: 'failed', error: e.message })
  }
}

console.log(`${dryRun ? 'Would publish' : 'Published'} ${published}${failures ? `, ${failures} failed (see logs/publish.log)` : ''}.`)
if (failures) process.exitCode = 1

async function publishOne(p, urls, caption) {
  const { userId } = config()
  const prev = state.get(p.id)
  let creation = prev?.status === 'in_progress' && prev.containerId && Date.now() - Date.parse(prev.containerAt) < 23 * 3_600_000 ? prev.containerId : null

  // A container from an earlier, interrupted run: if it already went out, just record that.
  if (creation) {
    const st = await graph('GET', creation, { fields: 'status_code' }).catch(() => null)
    if (st?.status_code === 'PUBLISHED') return findPublished(creation)
    if (!st || ['ERROR', 'EXPIRED'].includes(st.status_code)) creation = null
  }

  if (!creation) {
    const files = mediaFiles(p)
    if (p.type === 'single') {
      creation = (await graph('POST', `${userId}/media`, { image_url: urls[files.images[0]], caption })).id
    } else if (p.type === 'carousel') {
      const children = []
      for (const f of files.images) {
        const c = await graph('POST', `${userId}/media`, { image_url: urls[f], is_carousel_item: true })
        await waitForContainer(c.id, { timeoutMs: 120_000, everyMs: 3000 })
        children.push(c.id)
      }
      creation = (await graph('POST', `${userId}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption })).id
    } else {
      creation = (await graph('POST', `${userId}/media`, { media_type: 'REELS', video_url: urls[files.video], cover_url: urls[files.cover], caption, share_to_feed: true })).id
    }
    state.set(p.id, { status: 'in_progress', containerId: creation, containerAt: new Date().toISOString() })
  }

  await waitForContainer(creation, p.type === 'reel' ? { timeoutMs: 15 * 60_000, everyMs: 15_000 } : { timeoutMs: 180_000, everyMs: 3000 })

  // media_publish is never blindly repeated: after an error, look at the container first.
  try {
    const r = await graph('POST', `${userId}/media_publish`, { creation_id: creation }, { retry: false })
    return findPublished(creation, r.id)
  } catch (e) {
    await new Promise((r) => setTimeout(r, 15_000))
    const st = await graph('GET', creation, { fields: 'status_code' }).catch(() => null)
    if (st?.status_code === 'PUBLISHED') return findPublished(creation)
    if (!e.transient || st?.status_code !== 'FINISHED') throw e
    const r = await graph('POST', `${userId}/media_publish`, { creation_id: creation }, { retry: false })
    return findPublished(creation, r.id)
  }
}

async function findPublished(creation, mediaId) {
  if (!mediaId) {
    // The container doesn't say which media it became; the newest post on the account is it.
    const { userId } = config()
    const r = await graph('GET', `${userId}/media`, { fields: 'id,permalink,timestamp', limit: 1 })
    mediaId = r.data?.[0]?.id
  }
  const m = mediaId ? await graph('GET', mediaId, { fields: 'id,permalink' }).catch(() => ({ id: mediaId })) : { id: null }
  return { id: m.id, permalink: m.permalink ?? null, container: creation }
}
