/** Reading and checking content/calendar.yaml. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import YAML from 'yaml'

export const ROOT = resolve(import.meta.dirname, '../..')
export const TYPES = ['reel', 'carousel', 'single']
const CAPTION_MAX = 2200
const CAROUSEL_MAX = 10

export function loadCalendar(file = resolve(ROOT, 'content/calendar.yaml')) {
  const doc = YAML.parse(readFileSync(file, 'utf8'))
  const posts = doc?.posts ?? []
  const problems = []
  const ids = new Set()
  for (const p of posts) {
    const where = p.id ?? '(no id)'
    if (!p.id || !/^[a-z0-9-]+$/.test(p.id)) problems.push(`${where}: id must be lowercase letters, numbers and dashes`)
    if (ids.has(p.id)) problems.push(`${where}: duplicate id`)
    ids.add(p.id)
    if (!TYPES.includes(p.type)) problems.push(`${where}: type must be one of ${TYPES.join(', ')}`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.date))) problems.push(`${where}: date must be YYYY-MM-DD`)
    if (!/^\d{2}:\d{2}$/.test(String(p.time))) problems.push(`${where}: time must be HH:MM (IST)`)
    if (!p.caption) problems.push(`${where}: caption missing`)
    if (p.type === 'carousel' && !(p.slides?.length >= 2 && p.slides.length <= CAROUSEL_MAX)) problems.push(`${where}: a carousel needs 2 to ${CAROUSEL_MAX} slides`)
    if (p.type === 'single' && p.slides?.length !== 1) problems.push(`${where}: a single post needs exactly 1 slide`)
    if (p.type === 'reel' && !p.cover) problems.push(`${where}: a reel needs a cover`)
    const caption = fullCaption(p, Infinity)
    if (caption.length > CAPTION_MAX) problems.push(`${where}: caption is ${caption.length} characters (max ${CAPTION_MAX})`)
  }
  return { posts, problems, settings: doc?.settings ?? {} }
}

/** When a post is due, as a real instant: the calendar's date and time are India time (UTC+5:30). */
export const dueAt = (p) => new Date(`${p.date}T${p.time}:00+05:30`)

/** Caption + the first `limit` hashtags (Instagram allows 5 per post since December 2025). */
export function fullCaption(p, limit = Number(process.env.HASHTAG_LIMIT || 5)) {
  const tags = (p.hashtags ?? []).slice(0, limit).map((t) => (t.startsWith('#') ? t : `#${t}`))
  return [String(p.caption).trim(), tags.length ? tags.join(' ') : ''].filter(Boolean).join('\n\n')
}

/** Every TODO left in a post: anything with one is never published. */
export function todosIn(p) {
  const found = []
  const walk = (v, path) => {
    if (typeof v === 'string') {
      for (const m of v.matchAll(/TODO[^}\n]*/g)) found.push(`${path}: ${m[0].trim()}`)
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`))
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== 'notes' && k !== 'shots') walk(x, path ? `${path}.${k}` : k)
  }
  walk(p, '')
  return found
}

/** The image files a post publishes, relative to the repo root (and so to the public site). */
export function mediaFiles(p) {
  if (p.type === 'reel') return { cover: `output/${p.id}/cover.png`, video: `reels/ready/${p.id}.mp4` }
  return { images: (p.slides ?? []).map((_, i) => `output/${p.id}/${String(i + 1).padStart(2, '0')}.png`) }
}
