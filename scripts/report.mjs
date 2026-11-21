#!/usr/bin/env node
/**
 * Weekly growth report for our own account, from the Graph API insights endpoints.
 * Covers the last full week (Monday-Sunday, IST) and writes reports/<year>-W<week>.md.
 *
 *   node scripts/report.mjs                 last full week
 *   node scripts/report.mjs --week-of 2026-11-23   the week starting that Monday
 *
 * Reads only our own account and our own posts. Metrics Instagram has renamed
 * or retired are skipped one by one rather than failing the whole report.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadCalendar, ROOT } from './lib/calendar.mjs'
import { loadEnv } from './lib/env.mjs'
import { config, graph } from './lib/graph.mjs'

loadEnv(ROOT)
const args = process.argv.slice(2)
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)
const REPORTS = process.env.RG_REPORTS_DIR || resolve(ROOT, 'reports')
const STATE = process.env.RG_STATE_FILE || resolve(ROOT, 'state/published.json')
const IST = 5.5 * 3600_000

// The week: Monday 00:00 to next Monday 00:00, IST.
function weekStart(d) {
  const ist = new Date(d.getTime() + IST)
  ist.setUTCHours(0, 0, 0, 0)
  ist.setUTCDate(ist.getUTCDate() - ((ist.getUTCDay() + 6) % 7))
  return new Date(ist.getTime() - IST)
}
const start = opt('--week-of') ? new Date(`${opt('--week-of')}T00:00:00+05:30`) : new Date(weekStart(new Date()).getTime() - 7 * 86400_000)
const end = new Date(start.getTime() + 7 * 86400_000)
const isoWeek = (() => {
  const d = new Date(start.getTime() + IST + 3 * 86400_000) // Thursday decides the ISO week
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  return `${d.getUTCFullYear()}-W${String(1 + Math.round((d - jan4) / 604800_000 + ((jan4.getUTCDay() + 6) % 7 - 3) / 7)).padStart(2, '0')}`
})()
const fmtDay = (d) => d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })
const unix = (d) => Math.floor(d.getTime() / 1000)
const n = (v) => (typeof v === 'number' ? v.toLocaleString('en-IN') : '–')

const { userId } = config()
const notes = []
const tryGraph = async (label, ...a) => {
  try {
    return await graph(...a)
  } catch (e) {
    notes.push(`${label}: ${e.message}`)
    return null
  }
}

// ---- account ----
const account = await graph('GET', userId, { fields: 'username,followers_count,media_count' })
const accountMetrics = {}
for (const metric of ['reach', 'profile_views', 'accounts_engaged', 'total_interactions', 'saves', 'shares', 'follows_and_unfollows', 'website_clicks', 'profile_links_taps']) {
  const r = await tryGraph(`account ${metric}`, 'GET', `${userId}/insights`, { metric, period: 'day', metric_type: 'total_value', since: unix(start), until: unix(end) })
  const v = r?.data?.[0]?.total_value
  if (v) accountMetrics[metric] = v.value ?? v.breakdowns?.[0]?.results?.reduce((s, x) => s + (x.value ?? 0), 0)
  if (metric === 'follows_and_unfollows' && v?.breakdowns) accountMetrics.follows_breakdown = v.breakdowns[0].results
}
const followerSeries = await tryGraph('follower_count', 'GET', `${userId}/insights`, { metric: 'follower_count', period: 'day', since: unix(start), until: unix(end) })
const gainedFromSeries = followerSeries?.data?.[0]?.values?.reduce((s, x) => s + (x.value ?? 0), 0)

// Our own snapshot of followers, week by week (Instagram only keeps 30 days of follower_count).
const snapFile = resolve(REPORTS, 'followers.json')
const snaps = existsSync(snapFile) ? JSON.parse(readFileSync(snapFile, 'utf8')) : {}
const prevWeek = Object.keys(snaps).sort().filter((k) => k < isoWeek).at(-1)
snaps[isoWeek] = account.followers_count
const gainedFromSnap = prevWeek ? account.followers_count - snaps[prevWeek] : undefined

// ---- posts ----
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {}
const { posts: calendar } = loadCalendar()
const byMediaId = Object.fromEntries(Object.entries(state).filter(([, v]) => v.mediaId).map(([id, v]) => [v.mediaId, calendar.find((p) => p.id === id)]))

const since90 = new Date(end.getTime() - 90 * 86400_000)
const media = []
let page = await graph('GET', `${userId}/media`, { fields: 'id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count', limit: 50 })
while (page) {
  media.push(...(page.data ?? []))
  const last = page.data?.at(-1)
  if (!page.paging?.cursors?.after || !last || new Date(last.timestamp) < since90) break
  page = await graph('GET', `${userId}/media`, { fields: 'id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count', limit: 50, after: page.paging.cursors.after })
}
const recent = media.filter((m) => new Date(m.timestamp) >= since90)
for (const m of recent) {
  m.stats = {}
  for (const metric of ['reach', 'saved', 'shares', 'total_interactions', 'views', 'profile_visits', 'follows']) {
    const r = await tryGraph(`media ${metric}`, 'GET', `${m.id}/insights`, { metric })
    const v = r?.data?.[0]?.values?.[0]?.value ?? r?.data?.[0]?.total_value?.value
    if (typeof v === 'number') m.stats[metric] = v
  }
  const post = byMediaId[m.id]
  m.kind = post?.type ?? (m.media_product_type === 'REELS' ? 'reel' : m.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'single')
  m.pillar = post?.pillar ?? 'not in the calendar'
  m.reach = m.stats.reach ?? 0
  m.saveShareRate = m.reach ? ((m.stats.saved ?? 0) + (m.stats.shares ?? 0)) / m.reach : 0
}
const week = recent.filter((m) => new Date(m.timestamp) >= start && new Date(m.timestamp) < end).sort((a, b) => b.reach - a.reach)

// ---- what worked ----
const avg = (xs, f) => (xs.length ? xs.reduce((s, x) => s + f(x), 0) / xs.length : 0)
const groupBy = (xs, k) => xs.reduce((g, x) => ((g[x[k]] ??= []).push(x), g), {})
const rank = (groups) =>
  Object.entries(groups)
    .map(([k, xs]) => ({ k, count: xs.length, reach: avg(xs, (x) => x.reach), ss: avg(xs, (x) => x.saveShareRate) }))
    .sort((a, b) => b.reach - a.reach)
const byKind = rank(groupBy(recent, 'kind'))
const byPillar = rank(groupBy(recent, 'pillar'))
const slots = rank(
  groupBy(
    recent.map((m) => {
      const d = new Date(new Date(m.timestamp).getTime() + IST)
      const h = d.getUTCHours()
      return { ...m, slot: `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]} ${h}:00-${h + 1}:00` }
    }),
    'slot',
  ),
).filter((s) => s.count >= 2)

const line = (m) => {
  const title = (m.caption ?? '').split('\n')[0].slice(0, 70)
  return `| [${fmtDay(new Date(m.timestamp))}](${m.permalink}) | ${m.kind} | ${title.replace(/\|/g, '/')} | ${n(m.stats.reach)} | ${n(m.stats.saved)} | ${n(m.stats.shares)} | ${n(m.stats.views)} |`
}
const pct = (x) => `${(x * 100).toFixed(1)}%`
const enough = recent.length >= 6

const md = `# Weekly growth report: ${isoWeek} (${fmtDay(start)} - ${fmtDay(new Date(end.getTime() - 1))})

@${account.username} · ${n(account.followers_count)} followers · generated ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

## The week in numbers
| | |
|---|---|
| Followers gained | ${gainedFromSnap !== undefined ? `${gainedFromSnap >= 0 ? '+' : ''}${gainedFromSnap} (vs last report)` : typeof gainedFromSeries === 'number' ? `+${gainedFromSeries} (Instagram's daily count)` : 'first report: next week shows the change'} |
| Accounts reached | ${n(accountMetrics.reach)} |
| Profile visits | ${n(accountMetrics.profile_views)} |
| Accounts engaged | ${n(accountMetrics.accounts_engaged)} |
| Saves | ${n(accountMetrics.saves)} |
| Shares | ${n(accountMetrics.shares)} |
| Website / link taps | ${n(accountMetrics.website_clicks ?? accountMetrics.profile_links_taps)} |
| Posts this week | ${week.length} |

## Top posts
${week.length ? `| Date | Type | Post | Reach | Saves | Shares | Views |\n|---|---|---|---|---|---|---|\n${week.slice(0, 3).map(line).join('\n')}` : 'No posts this week.'}

## Bottom posts
${week.length > 3 ? `| Date | Type | Post | Reach | Saves | Shares | Views |\n|---|---|---|---|---|---|---|\n${week.slice(-2).map(line).join('\n')}` : 'Not enough posts this week to compare.'}

## What worked (last 90 days, ${recent.length} posts)
${
  enough
    ? `- **Format:** ${byKind.map((g) => `${g.k} ${n(Math.round(g.reach))} avg reach, ${pct(g.ss)} saved or shared (${g.count})`).join('; ')}.
- **Topic:** ${byPillar.slice(0, 4).map((g) => `${g.k} ${n(Math.round(g.reach))} avg reach (${g.count})`).join('; ')}.`
    : `Only ${recent.length} posts so far. Patterns need at least 6, so this section fills in after a few weeks.`
}

## Post more of
${
  enough
    ? `- More **${byKind[0].k}s**: the format with the best reach right now.
- More **${byPillar[0].k}** posts: the topic with the best reach.
- Saves and shares are what push posts to new people: the best save/share rate was **${[...byKind].sort((a, b) => b.ss - a.ss)[0].k}** (${pct([...byKind].sort((a, b) => b.ss - a.ss)[0].ss)}). Copy its hooks and end slides.`
    : '- Keep to the calendar: 2 reels, 2 carousels and 1 local post a week, so there is enough to compare.'
}

## Best posting times (IST)
${slots.length ? slots.slice(0, 3).map((s) => `- **${s.k}**: ${n(Math.round(s.reach))} avg reach over ${s.count} posts`).join('\n') : '- Not enough posts in the same time slot yet. Keep posting 7-9 pm and this will fill in.'}

## Next week
- Do the 20-minute routine daily (growth/daily-checklist.md).
- Send 5 outreach messages (growth/outreach.md) and log them in growth/accounts.csv.
${notes.length ? `\n<details><summary>Metrics Instagram didn't return (${notes.length})</summary>\n\n${notes.map((x) => `- ${x}`).join('\n')}\n</details>\n` : ''}`

mkdirSync(REPORTS, { recursive: true })
writeFileSync(resolve(REPORTS, `${isoWeek}.md`), md)
writeFileSync(snapFile, JSON.stringify(snaps, null, 2) + '\n')
console.log(`Wrote reports/${isoWeek}.md`)
