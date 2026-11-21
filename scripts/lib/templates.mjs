/**
 * The RentiGoo post template: every slide and cover is plain HTML, rendered
 * to PNG by chrome.mjs. Brand: page #FBF7EE, text #1C1B19, secondary #5F5E5A,
 * yellow #FFD84D for highlights only, dark #161616 for the odd bold slide,
 * Nunito 800 headings, Mukta body, the R icon in the top-left corner.
 *
 * Text markup in calendar.yaml:
 *   **words**        yellow marker highlight
 *   {{TODO: note}}   a red placeholder box (the publisher refuses anything with TODO)
 *   blank line       new paragraph
 */
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '../..')
const asset = (p) => pathToFileURL(resolve(ROOT, 'assets', p)).href

export const BRAND = {
  page: '#FBF7EE',
  text: '#1C1B19',
  muted: '#5F5E5A',
  yellow: '#FFD84D',
  dark: '#161616',
  card: '#FFFFFF',
  line: '#EDE6D6',
}

export const SIZES = { post: { width: 1080, height: 1350 }, cover: { width: 1080, height: 1920 } }

const smart = (s) => String(s ?? '').replace(/(\w)'(\w)/g, '$1’$2').replace(/'([^']*)'/g, '‘$1’')
const esc = (s) => smart(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Escape, then apply **marker** and {{TODO}} markup, and paragraphs. */
export function rich(text, { paragraphs = false } = {}) {
  const inline = (t) =>
    esc(t)
      .replace(/\{\{\s*(TODO[^}]*)\}\}/g, '<span class="todo">$1</span>')
      .replace(/\*\*(.+?)\*\*/g, '<span class="marker">$1</span>')
      .replace(/\n/g, '<br>')
  if (!paragraphs) return inline(text)
  return String(text ?? '')
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${inline(p.trim())}</p>`)
    .join('')
}

const CSS = `
@font-face { font-family: 'Nunito'; font-weight: 800; src: url('${asset('fonts/nunito-800.woff2')}') format('woff2'); }
@font-face { font-family: 'Mukta'; font-weight: 400; src: url('${asset('fonts/mukta-400.woff2')}') format('woff2'); }
@font-face { font-family: 'Mukta'; font-weight: 700; src: url('${asset('fonts/mukta-700.woff2')}') format('woff2'); }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: var(--w); height: var(--h); overflow: hidden; }
body { background: ${BRAND.page}; color: ${BRAND.text}; font-family: 'Mukta', sans-serif; font-size: 40px; line-height: 1.4; -webkit-font-smoothing: antialiased; }
.frame { position: relative; width: var(--w); height: var(--h); padding: 84px 88px 96px; display: flex; flex-direction: column; }
.top { display: flex; align-items: center; justify-content: space-between; height: 72px; flex: none; }
.icon { height: 64px; width: auto; display: block; }
.count { font: 700 30px 'Mukta'; color: ${BRAND.muted}; letter-spacing: 0.02em; }
.body { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; }
.foot { flex: none; display: flex; justify-content: space-between; align-items: baseline; font: 700 30px 'Mukta'; color: ${BRAND.muted}; }
.foot b { color: ${BRAND.text}; }
h1, h2 { font-family: 'Nunito', sans-serif; font-weight: 800; letter-spacing: -0.02em; line-height: 1.04; }
h1 { font-size: 112px; }
h2 { font-size: 76px; }
.kicker { font: 700 36px 'Mukta'; color: ${BRAND.muted}; margin-bottom: 28px; }
.sub { margin-top: 40px; font-size: 44px; color: ${BRAND.muted}; max-width: 860px; }
.text { margin-top: 32px; color: ${BRAND.muted}; font-size: 42px; }
.text p + p { margin-top: 22px; }
.marker { box-shadow: inset 0 -0.42em 0 ${BRAND.yellow}; padding: 0 0.06em; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.todo { display: inline-block; border: 4px dashed #B42318; color: #B42318; background: #FDECEA; font: 700 0.55em/1.3 'Mukta'; letter-spacing: 0; padding: 4px 14px; border-radius: 10px; vertical-align: middle; }
.num { display: inline-grid; place-items: center; width: 96px; height: 96px; border-radius: 50%; background: ${BRAND.yellow}; font: 800 52px 'Nunito'; margin-bottom: 36px; }
ul.check { list-style: none; margin-top: 56px; display: grid; gap: 34px; }
ul.check li { display: grid; grid-template-columns: 64px 1fr; gap: 28px; align-items: start; font-size: 52px; line-height: 1.25; }
ul.check li::before { content: ''; width: 56px; height: 56px; border: 5px solid ${BRAND.text}; border-radius: 12px; margin-top: 4px; }
ul.check.ticked li::before { background: ${BRAND.yellow} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231C1B19' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center/34px no-repeat; }
.compare { margin-top: 48px; display: grid; gap: 24px; }
.compare .row { border-radius: 32px; padding: 34px 40px; background: ${BRAND.card}; border: 3px solid ${BRAND.line}; }
.compare .row.win { background: ${BRAND.yellow}; border-color: ${BRAND.yellow}; }
.compare .label { font: 700 36px 'Mukta'; }
.compare .amount { font: 800 92px/1.05 'Nunito'; letter-spacing: -0.02em; margin-top: 6px; }
.compare .note { font-size: 34px; color: ${BRAND.muted}; margin-top: 6px; }
.compare .row.win .note { color: ${BRAND.text}; }
.body.top-aligned { justify-content: flex-start; padding-top: 36px; }
.photo { width: 100%; height: 500px; object-fit: cover; border-radius: 36px; display: block; background: #EFE8D8; }
.photo-todo { width: 100%; height: 500px; border-radius: 36px; display: grid; place-items: center; background: #EFE8D8; }
.chips { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 30px; }
.chip { font: 700 34px 'Mukta'; padding: 10px 26px; border-radius: 999px; background: ${BRAND.card}; border: 3px solid ${BRAND.line}; }
.chip.y { background: ${BRAND.yellow}; border-color: ${BRAND.yellow}; }
.cta-lines { margin-top: 48px; display: grid; gap: 24px; font-size: 44px; }
.cta-lines div { display: grid; grid-template-columns: 64px 1fr; gap: 20px; align-items: center; }
.cta-lines i { font-style: normal; font: 800 44px 'Nunito'; width: 64px; height: 64px; border-radius: 50%; background: ${BRAND.yellow}; display: grid; place-items: center; color: ${BRAND.text}; }
.dark { background: ${BRAND.dark}; color: #FFFFFF; }
.dark .count, .dark .foot, .dark .kicker, .dark .text, .dark .sub { color: #C9C5BB; }
.dark .foot b { color: #FFFFFF; }
.dark .marker { color: ${BRAND.yellow}; box-shadow: none; padding: 0; }
.dark .hl { color: ${BRAND.yellow}; }
.cover .frame { padding: 120px 88px 150px; }
.cover h1 { font-size: 132px; }
.cover .safe { position: absolute; left: 0; right: 0; top: 285px; height: 1350px; pointer-events: none; }
`

function page({ size, dark = false, cover = false, inner }) {
  const { width, height } = SIZES[size]
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>:root{--w:${width}px;--h:${height}px}${CSS}</style></head>
<body class="${dark ? 'dark' : ''} ${cover ? 'cover' : ''}">${inner}</body></html>`
}

function chrome({ dark, count, footRight }) {
  const top = `<div class="top"><img class="icon" src="${asset(dark ? 'r-icon-on-dark.png' : 'r-icon.png')}" alt="">${count ? `<span class="count">${esc(count)}</span>` : ''}</div>`
  const foot = `<div class="foot"><span><b>rentigoo.in</b> · Bhopal</span><span>${footRight ? esc(footRight) : ''}</span></div>`
  return { top, foot }
}

/** One 1080x1350 slide. `s` is a slide from calendar.yaml. */
export function slideHtml(s, { index, total }) {
  const dark = s.kind === 'dark' || s.dark === true
  const count = total > 1 ? `${index + 1}/${total}` : ''
  const footRight = s.kind === 'hook' && total > 1 ? 'Swipe →' : ''
  const { top, foot } = chrome({ dark, count, footRight })
  let body = ''
  switch (s.kind) {
    case 'hook':
      body = `${s.kicker ? `<div class="kicker">${rich(s.kicker)}</div>` : ''}<h1>${rich(s.title)}</h1>${s.sub ? `<div class="sub">${rich(s.sub)}</div>` : ''}`
      break
    case 'step':
      body = `${s.number != null ? `<span class="num">${esc(s.number)}</span>` : ''}<h2>${rich(s.title)}</h2>${s.text ? `<div class="text">${rich(s.text, { paragraphs: true })}</div>` : ''}`
      break
    case 'checklist':
      body = `<h2 style="font-size:88px">${rich(s.title)}</h2><ul class="check ${s.ticked ? 'ticked' : ''}">${(s.items ?? []).map((i) => `<li><span>${rich(i)}</span></li>`).join('')}</ul>${s.text ? `<div class="text">${rich(s.text, { paragraphs: true })}</div>` : ''}`
      break
    case 'compare':
      body = `<h2>${rich(s.title)}</h2><div class="compare">${(s.rows ?? [])
        .map((r) => `<div class="row ${r.win ? 'win' : ''}"><div class="label">${rich(r.label)}</div><div class="amount">${rich(r.amount)}</div>${r.note ? `<div class="note">${rich(r.note)}</div>` : ''}</div>`)
        .join('')}</div>${s.text ? `<div class="text">${rich(s.text, { paragraphs: true })}</div>` : ''}`
      break
    case 'photo': {
      const img = s.image ? `<img class="photo" src="${asset(s.image)}" alt="">` : `<div class="photo-todo"><span class="todo" style="font-size:72px">${esc(s.image_todo ?? 'TODO: add a real photo')}</span></div>`
      body = `${img}<h2 style="margin-top:40px;font-size:68px">${rich(s.title)}</h2>${s.chips ? `<div class="chips">${s.chips.map((c, i) => `<span class="chip ${i === 0 ? 'y' : ''}">${rich(c)}</span>`).join('')}</div>` : ''}${s.text ? `<div class="text" style="font-size:36px;margin-top:26px">${rich(s.text, { paragraphs: true })}</div>` : ''}`
      break
    }
    case 'cta':
      body = `<h1 style="font-size:100px">${rich(s.title ?? 'Save this, and share it with a friend')}</h1><div class="cta-lines">${(s.lines ?? [])
        .map((l, i) => `<div><i>${['↓', '↗', '✆', '→'][i] ?? '•'}</i><span>${rich(l)}</span></div>`)
        .join('')}</div>`
      break
    case 'dark':
    case 'statement':
    default:
      body = `${s.kicker ? `<div class="kicker">${rich(s.kicker)}</div>` : ''}<h1 style="font-size:${s.size ?? 104}px">${rich(s.title)}</h1>${s.text ? `<div class="text">${rich(s.text, { paragraphs: true })}</div>` : ''}`
  }
  const bodyClass = s.kind === 'photo' ? 'body top-aligned' : 'body'
  return page({ size: 'post', dark, inner: `<div class="frame">${top}<div class="${bodyClass}">${body}</div>${foot}</div>` })
}

/** A 1080x1920 reel cover. The title sits inside the middle 1080x1350, which is what the profile grid shows. */
export function coverHtml(c) {
  const dark = c.dark === true
  const { top, foot } = chrome({ dark })
  const body = `${c.kicker ? `<div class="kicker">${rich(c.kicker)}</div>` : ''}<h1>${rich(c.title)}</h1>${c.sub ? `<div class="sub">${rich(c.sub)}</div>` : ''}`
  return page({ size: 'cover', dark, cover: true, inner: `<div class="frame">${top}<div class="body">${body}</div>${foot}</div>` })
}
