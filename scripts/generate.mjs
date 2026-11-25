#!/usr/bin/env node
/**
 * Turns content/calendar.yaml into:
 *   output/<id>/01.png …    1080x1350 carousel slides and single posts
 *   output/<id>/cover.png   1080x1920 reel covers
 *   reels/<date>-<slug>.md  one-page shot list per filmed reel
 *   reels/ready/<id>.mp4    animated reels (posts with a motion: block), via ffmpeg
 *   output/previews.html    everything on one page, to review
 * Usage: node scripts/generate.mjs [--only <id>]
 */
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { launchChrome } from './lib/chrome.mjs'
import { coverHtml, SIZES, slideHtml } from './lib/templates.mjs'
import { dueAt, fullCaption, loadCalendar, mediaFiles, ROOT, todosIn } from './lib/calendar.mjs'
import { renderMotion } from './lib/video.mjs'

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null
const { posts, problems } = loadCalendar()
if (problems.length) {
  console.error('calendar.yaml has problems:\n  ' + problems.join('\n  '))
  process.exit(1)
}

const tmp = resolve(ROOT, '.render-tmp')
mkdirSync(tmp, { recursive: true })
const chrome = await launchChrome()
let count = 0
try {
  for (const p of posts) {
    if (only && p.id !== only) continue
    const dir = resolve(ROOT, 'output', p.id)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    if (p.type === 'reel' && p.motion) {
      // Animated reel made here: video + cover, no filming, so no shot list.
      const files = mediaFiles(p)
      mkdirSync(resolve(ROOT, 'reels/ready'), { recursive: true })
      const { duration } = await renderMotion(chrome, p, { tmpDir: tmp, coverPath: resolve(ROOT, files.cover), videoPath: resolve(ROOT, files.video) })
      rmSync(resolve(ROOT, 'reels', `${p.id}.md`), { force: true })
      process.stdout.write(`\n  ${p.id}: ${duration}s ${p.motion.style} reel `)
      count++
    } else if (p.type === 'reel') {
      const html = join(tmp, `${p.id}-cover.html`)
      writeFileSync(html, coverHtml(p.cover))
      await chrome.screenshot(html, join(dir, 'cover.png'), SIZES.cover.width, SIZES.cover.height)
      writeFileSync(resolve(ROOT, 'reels', `${p.id}.md`), shotList(p))
      count++
    } else {
      const files = mediaFiles(p).images
      for (const [i, s] of p.slides.entries()) {
        const html = join(tmp, `${p.id}-${i + 1}.html`)
        writeFileSync(html, slideHtml(s, { index: i, total: p.slides.length }))
        await chrome.screenshot(html, resolve(ROOT, files[i]), SIZES.post.width, SIZES.post.height)
        count++
      }
    }
    process.stdout.write('.')
  }
} finally {
  await chrome.close()
  rmSync(tmp, { recursive: true, force: true })
}
writeFileSync(resolve(ROOT, 'output/previews.html'), previews(posts))
console.log(`\nRendered ${count} images. Open output/previews.html to review.`)

function shotList(p) {
  const total = p.shots.reduce((s, x) => s + (x.seconds ?? 0), 0)
  const ist = dueAt(p).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
  return `# Reel: ${p.hook}

**Post:** ${ist} IST · **Length:** about ${total} seconds · **Cover:** \`output/${p.id}/cover.png\`

## Hook (first 2 seconds)
> ${p.hook}

Put the on-screen text up from the very first frame. Start mid-action, no intro.

## Shots (film on your phone, vertical, 1080x1920)
| # | Sec | What to film | On-screen text |
|---|-----|--------------|----------------|
${p.shots.map((s) => `| ${s.n} | ${s.seconds} | ${s.film} | ${s.on_screen} |`).join('\n')}

Filming tips: daylight by a window, phone at eye level, hold each shot a beat longer than you think (easier to cut). Keep text out of the bottom 20% and the right edge, where Instagram's buttons sit. Blur any names, numbers or faces of people who haven't agreed to be in it.

## Audio
${p.audio}

## Caption
\`\`\`
${fullCaption(p)}
\`\`\`
${p.hashtags.length > 5 ? `\nOther hashtags (not published while HASHTAG_LIMIT is 5): ${p.hashtags.slice(5).map((t) => '#' + t).join(' ')}\n` : ''}
## Publishing
- **In the app (best for trending audio):** post it yourself, pick the sound there, and use the cover above. Then mark it done: \`node scripts/publish.mjs --mark-manual ${p.id}\`.
- **Through the API:** export the finished video as \`reels/ready/${p.id}.mp4\` (MP4, H.264, AAC audio, 9:16, under 100 MB so GitHub can hold it). It goes out at the time above with the video's own sound (the API can't add Instagram's library music).
${p.notes ? `\n## Notes\n${p.notes}\n` : ''}${todosIn(p).length ? `\n## Still to fill in (this blocks publishing)\n${todosIn(p).map((t) => `- ${t}`).join('\n')}\n` : ''}`
}

function previews(posts) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const v = Date.now()
  const cards = posts
    .map((p) => {
      const when = dueAt(p).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
      const imgs = p.type === 'reel' ? [mediaFiles(p).cover] : mediaFiles(p).images
      const video = p.type === 'reel' && existsSync(resolve(ROOT, mediaFiles(p).video))
      const todos = todosIn(p)
      return `<article id="${p.id}">
  <header><span class="type ${p.type}">${p.type}</span><time>${when} IST</time><code>${p.id}</code>
  ${todos.length ? `<span class="blocked">Blocked: ${todos.length} TODO</span>` : '<span class="ok">Ready</span>'}${p.type === 'reel' ? (video ? '<span class="ok">Video in reels/ready</span>' : '<span class="warn">Film it: no video yet</span>') : ''}</header>
  <div class="strip">${imgs.map((src) => `<img loading="lazy" src="${relative(resolve(ROOT, 'output'), resolve(ROOT, src))}?v=${v}" alt="">`).join('')}</div>
  ${p.type === 'reel' && p.motion ? `<p class="hook"><b>Animated (${esc(p.motion.style)}):</b> <a href="../reels/ready/${p.id}.mp4">watch the video</a></p>` : ''}${p.type === 'reel' && !p.motion ? `<p class="hook"><b>Hook:</b> ${esc(p.hook)} · <a href="../reels/${p.id}.md">shot list</a></p>` : ''}
  <pre>${esc(fullCaption(p))}</pre>
  ${todos.length ? `<ul class="todos">${todos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
</article>`
    })
    .join('\n')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RentiGoo Instagram previews</title><style>
body{margin:0;background:#FBF7EE;color:#1C1B19;font:16px/1.5 system-ui,sans-serif}
main{max-width:1200px;margin:0 auto;padding:32px 20px}
h1{font-size:28px;margin:0 0 4px}.lead{color:#5F5E5A;margin:0 0 28px}
article{background:#fff;border:1px solid #EDE6D6;border-radius:20px;padding:18px;margin-bottom:22px}
header{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px}
code{color:#5F5E5A;font-size:13px}.type{font-weight:700;border-radius:99px;padding:2px 12px;background:#FFD84D}
.type.reel{background:#1C1B19;color:#fff}.type.single{background:#EDE6D6}
.ok,.warn,.blocked{font-size:13px;font-weight:700;border-radius:99px;padding:2px 10px}.ok{background:#E3F4E8;color:#1F7A3D}.warn{background:#FFF3CD;color:#7A5A00}.blocked{background:#FDECEA;color:#B42318}
.strip{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px}.strip img{height:340px;border-radius:10px;border:1px solid #EDE6D6;flex:none}
pre{white-space:pre-wrap;background:#FBF7EE;border-radius:12px;padding:12px;font:14px/1.5 system-ui,sans-serif;margin:12px 0 0}
.todos{color:#B42318;font-size:14px}.hook{margin:10px 0 0}
</style></head><body><main>
<h1>RentiGoo Instagram: ${posts.length} posts</h1>
<p class="lead">Generated ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST. Captions show exactly what would be published (${process.env.HASHTAG_LIMIT || 5} hashtags). Posts marked Blocked won't publish until their TODOs are filled.</p>
${cards}
</main></body></html>`
}
