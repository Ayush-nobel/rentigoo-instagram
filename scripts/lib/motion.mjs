/**
 * Animated reels, rendered frame by frame by chrome.mjs `record` and encoded
 * by ffmpeg (scripts/lib/video.mjs). A post opts in with a `motion:` block in
 * calendar.yaml; `motion.style` picks one of three looks:
 *
 *   hero       Product hero: the real item photo, big, on yellow, price sticker.
 *   app        App in hand: real rentigoo.in screens in a phone, tap highlights.
 *   scrapbook  Scrapbook: drawn cupboard, sticky notes, ticks that draw themselves.
 *
 * Every frame is 1080x1920. Text stays inside the middle 1080x1350 where it
 * can (that is what the profile grid shows) and clear of the bottom ~340 px
 * and the right edge, where Instagram's buttons sit.
 * Only real photos and real screenshots from assets/ are used.
 */
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { BRAND, rich } from './templates.mjs'

const ROOT = resolve(import.meta.dirname, '../..')
const asset = (p) => pathToFileURL(resolve(ROOT, 'assets', p)).href
const W = 1080
const H = 1920

/** `animation` value: name, start (s), duration (s). Enter animations fill both ways; exits only forwards. */
const a = (name, start, dur, ease = 'cubic-bezier(.2,.8,.2,1)', fill = 'both') => `${name} ${dur}s ${ease} ${start}s 1 ${fill}`
const anim = (...xs) => `animation:${xs.join(',')};`
const exit = (start) => a('leave', start, 0.45, 'ease-in', 'forwards')

const CSS = `
@font-face { font-family: 'Nunito'; font-weight: 800; src: url('${asset('fonts/nunito-800.woff2')}') format('woff2'); }
@font-face { font-family: 'Mukta'; font-weight: 400; src: url('${asset('fonts/mukta-400.woff2')}') format('woff2'); }
@font-face { font-family: 'Mukta'; font-weight: 700; src: url('${asset('fonts/mukta-700.woff2')}') format('woff2'); }
@font-face { font-family: 'Caveat'; font-weight: 700; src: url('${asset('fonts/caveat-700.woff2')}') format('woff2'); }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { position: relative; font-family: 'Mukta', sans-serif; color: ${BRAND.text}; -webkit-font-smoothing: antialiased; }
.abs { position: absolute; }
.scene { position: absolute; inset: 0; }
h1, h2, .big { font-family: 'Nunito', sans-serif; font-weight: 800; letter-spacing: -0.03em; line-height: 1.0; }
.hand { font-family: 'Caveat', cursive; font-weight: 700; }
.marker { box-shadow: inset 0 -0.38em 0 ${BRAND.yellow}; padding: 0 0.05em; }
.pill { display: inline-flex; align-items: center; gap: 14px; border-radius: 999px; font: 700 34px/1 'Mukta'; padding: 18px 30px; }
@keyframes rise { from { opacity: 0; transform: translateY(70px) rotate(var(--rot, 0deg)); } to { opacity: 1; transform: rotate(var(--rot, 0deg)); } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes leave { from { opacity: 1; } to { opacity: 0; transform: translateY(-60px); } }
@keyframes pop { 0% { opacity: 0; transform: scale(0) rotate(-35deg); } 65% { opacity: 1; transform: scale(1.14) rotate(calc(var(--rot, 0deg) + 4deg)); } 100% { opacity: 1; transform: scale(1) rotate(var(--rot, 0deg)); } }
@keyframes drop { 0% { opacity: 0; transform: translateY(-1100px) rotate(-16deg); } 70% { opacity: 1; transform: translateY(24px) rotate(calc(var(--rot, 0deg) + 2deg)); } 100% { opacity: 1; transform: rotate(var(--rot, 0deg)); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(520px) rotate(var(--rot, 0deg)); } to { opacity: 1; transform: rotate(var(--rot, 0deg)); } }
@keyframes slideIn { from { opacity: 0; transform: translateX(-120px) rotate(var(--rot, 0deg)); } to { opacity: 1; transform: rotate(var(--rot, 0deg)); } }
@keyframes draw { from { stroke-dashoffset: var(--len, 1200); } to { stroke-dashoffset: 0; } }
@keyframes ripple { 0% { opacity: 0; transform: scale(.3); } 25% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(2.3); } }
@keyframes shine { from { transform: translateX(-160%) skewX(-18deg); } to { transform: translateX(320%) skewX(-18deg); } }
@keyframes doorL { from { transform: perspective(1400px) rotateY(0); } to { transform: perspective(1400px) rotateY(-78deg); } }
@keyframes doorR { from { transform: perspective(1400px) rotateY(0); } to { transform: perspective(1400px) rotateY(78deg); } }
@keyframes thump { 0%, 100% { transform: scale(1) rotate(var(--rot, 0deg)); } 30% { transform: scale(1.08) rotate(var(--rot, 0deg)); } }
@keyframes wave { 0% { opacity: 0; transform: scale(.6); } 30% { opacity: 1; } 100% { opacity: 0; transform: scale(1.35); } }
@keyframes floatUp { 0% { opacity: 0; transform: translateY(0) scale(.5); } 25% { opacity: 1; transform: translateY(-60px) scale(1); } 100% { opacity: 0; transform: translateY(-300px) scale(1); } }
.dash { stroke-dasharray: var(--len, 1200); }
`

function page(bg, inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${CSS}</style></head><body style="background:${bg}">${inner}</body></html>`
}

const logoPill = (dark = false) =>
  `<div class="abs pill" style="left:72px;top:190px;padding:12px 28px 12px 16px;background:${dark ? 'transparent' : BRAND.page};${dark ? 'padding-left:0;' : ''}">
    <img src="${asset(dark ? 'r-icon-on-dark.png' : 'r-icon.png')}" alt="" style="height:52px;display:block">
    <span style="font:800 38px/1 'Nunito';letter-spacing:-0.01em;color:${dark ? '#FFFFFF' : BRAND.text}">RentiGoo</span>
  </div>`

// Line icons drawn for these posts (stroke only, so they read as drawings, not photos).
const ICONS = {
  camera: '<rect x="14" y="34" width="132" height="92" rx="16"/><path d="M52 34l12-18h32l12 18"/><circle cx="80" cy="80" r="28"/><circle cx="80" cy="80" r="12"/>',
  speaker: '<rect x="34" y="10" width="92" height="140" rx="16"/><circle cx="80" cy="98" r="30"/><circle cx="80" cy="98" r="8"/><circle cx="80" cy="40" r="12"/>',
  drill: '<path d="M18 46h86a14 14 0 0 1 14 14v8a14 14 0 0 1-14 14H18z"/><path d="M118 58h30"/><path d="M58 82l-10 56h34l6-56"/><path d="M30 46V30"/>',
  tent: '<path d="M80 18L10 140h140z"/><path d="M80 18v122"/><path d="M80 140l-26-52M80 140l26-52"/>',
  calendar: '<rect x="18" y="30" width="124" height="112" rx="14"/><path d="M18 64h124M52 16v28M108 16v28"/><path d="M52 104l20 20 38-42"/>',
  handover: '<path d="M10 104l34-30 30 8 34-14"/><path d="M150 104l-34-30-30 8"/><rect x="52" y="22" width="56" height="40" rx="8"/><circle cx="80" cy="42" r="10"/><path d="M40 120h80"/>',
  returnit: '<path d="M40 60h70a34 34 0 0 1 0 68H50"/><path d="M60 36L36 60l24 24"/><text x="96" y="110" font-size="44" font-family="Nunito" font-weight="800" stroke="none" fill="#1C1B19">₹</text>',
}
const icon = (name, size, stroke = BRAND.text, width = 7) =>
  `<svg viewBox="0 0 160 160" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`

// ───────────────────────────── A · Product hero ─────────────────────────────
function hero(m) {
  const photos = m.photos ?? []
  const facts = m.facts ?? []
  const html = page(
    BRAND.yellow,
    `${logoPill()}
  <div class="abs pill" style="right:72px;top:198px;background:${BRAND.dark};color:#fff;${anim(a('pop', 0.1, 0.6))}">${rich(m.badge ?? 'Item of the week')}</div>

  <div class="scene" style="${anim(exit(5.6))}">
    <h1 class="abs" style="left:72px;top:320px;width:940px;font-size:128px;line-height:.98">
      <span style="display:block;${anim(a('rise', 0.15, 0.6))}">${rich(m.title)}</span>
      <span style="display:block;${anim(a('rise', 0.4, 0.6))}">${rich(m.title2)}</span>
    </h1>
    <div class="abs" style="--rot:-4deg;left:150px;top:640px;width:640px;height:780px;background:#fff;border-radius:52px;padding:22px;box-shadow:0 40px 70px rgba(60,45,0,.25);${anim(a('drop', 0.6, 0.95))}">
      <div style="position:relative;width:100%;height:100%;border-radius:34px;overflow:hidden;background:#EFE8D8">
        <img src="${asset(photos[0])}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">
        <div style="position:absolute;top:0;bottom:0;width:38%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.5),rgba(255,255,255,0));${anim(a('shine', 1.9, 1.1, 'ease-in-out'))}"></div>
      </div>
    </div>
    <div class="abs" style="--rot:8deg;left:700px;top:600px;width:310px;height:310px;border-radius:50%;background:${BRAND.dark};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 20px 40px rgba(0,0,0,.28);${anim(a('pop', 1.35, 0.6, 'cubic-bezier(.3,1.4,.5,1)'))}">
      <span class="big" style="font-size:96px;color:${BRAND.yellow}">${rich(m.price)}</span>
      <span style="font:700 36px/1.1 'Mukta'">${rich(m.per ?? 'per day')}</span>
    </div>
    <div class="abs" style="left:72px;right:72px;top:1470px;display:flex;flex-wrap:wrap;gap:16px">
      ${(m.chips ?? []).map((c, i) => `<span class="pill" style="background:${BRAND.page};${anim(a('rise', 2.0 + i * 0.15, 0.5))}">${rich(c)}</span>`).join('')}
    </div>
  </div>

  <div class="scene" style="${anim(exit(9.6))}">
    <h2 class="abs" style="left:72px;top:330px;width:940px;font-size:92px;${anim(a('rise', 5.9, 0.55))}">${rich(m.detailTitle ?? 'What you get')}</h2>
    <div class="abs" style="left:72px;right:72px;top:470px;height:560px;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);grid-template-rows:repeat(2,minmax(0,1fr));gap:16px">
      ${photos
        .slice(0, 3)
        .map((p, i) => `<img src="${asset(p)}" alt="" style="width:100%;height:100%;min-height:0;object-fit:cover;border-radius:36px;display:block;${i === 0 ? 'grid-row:span 2;' : ''}${anim(a('slideUp', 6.0 + i * 0.15, 0.7))}">`)
        .join('')}
    </div>
    <div class="abs" style="left:72px;right:72px;top:1070px;display:flex;flex-direction:column;gap:18px">
      ${facts
        .map(
          (f, i) => `<div style="display:flex;align-items:center;gap:24px;background:#fff;border-radius:30px;padding:22px 28px;${anim(a('slideIn', 6.6 + i * 0.25, 0.55))}">
        <span style="flex:none;width:64px;height:64px;border-radius:50%;background:${BRAND.dark};color:${BRAND.yellow};display:grid;place-items:center;font:800 34px/1 'Nunito'">✓</span>
        <span style="font:700 40px/1.2 'Mukta'">${rich(f)}</span></div>`,
        )
        .join('')}
    </div>
  </div>

  <div class="scene">
    <h2 class="abs" style="left:72px;top:520px;width:940px;font-size:120px;${anim(a('rise', 9.9, 0.6))}">${rich(m.outro ?? 'Book it on rentigoo.in')}</h2>
    <p class="abs" style="left:72px;top:820px;width:900px;font:400 46px/1.35 'Mukta';${anim(a('rise', 10.2, 0.6))}">${rich(m.outroSub ?? '')}</p>
    <div class="abs pill" style="left:72px;top:1040px;background:${BRAND.dark};color:#fff;font-size:44px;padding:26px 40px;${anim(a('pop', 10.5, 0.55))}">rentigoo.in</div>
  </div>`,
  )
  return { html, duration: 12.5, coverAt: 3.4 }
}

// ───────────────────────────── B · App in hand ─────────────────────────────
function app(m) {
  const steps = m.steps ?? []
  const PHONE = { x: 310, y: 600, w: 460 }
  const scale = (PHONE.w - 32) / 390
  const screenH = Math.round(844 * scale)
  const t0 = 2.6 // first step starts
  const step = 2.7 // seconds per step
  const end = t0 + steps.length * step
  const screened = steps.filter((s) => s.screen)
  const phoneOut = t0 + screened.length * step - 0.2
  const label = (s, i) => {
    const start = t0 + i * step
    return `<div class="scene" style="${anim(exit(start + step - 0.35))}">
      <div class="abs" style="left:72px;top:300px;width:940px;display:flex;gap:30px;align-items:flex-start">
        <span class="big" style="flex:none;width:120px;height:120px;border-radius:50%;background:${BRAND.yellow};color:${BRAND.text};display:grid;place-items:center;font-size:72px;${anim(a('pop', start, 0.5))}">${i + 1}</span>
        <div>
          <h2 style="font-size:80px;color:#fff;${anim(a('rise', start + 0.08, 0.5))}">${rich(s.title)}</h2>
          <p style="margin-top:14px;font:400 40px/1.3 'Mukta';color:#C9C5BB;${anim(a('rise', start + 0.18, 0.5))}">${rich(s.text)}</p>
        </div>
      </div>
      ${
        s.screen
          ? ''
          : `<div class="abs" style="left:${(W - 560) / 2}px;top:760px;width:560px;height:560px;border-radius:50%;background:${BRAND.yellow};display:grid;place-items:center;${anim(a('pop', start + 0.15, 0.6))}">${icon(s.icon ?? 'calendar', 300)}</div>`
      }
    </div>`
  }
  const screens = screened
    .map((s, i) => {
      const start = t0 + i * step
      const tap = s.tap ? `<span style="position:absolute;left:${s.tap[0] * scale - 46}px;top:${s.tap[1] * scale - 46}px;width:92px;height:92px;border-radius:50%;border:6px solid ${BRAND.dark};background:rgba(255,216,77,.65);${anim(a('ripple', start + 1.3, 0.9, 'ease-out'))}"></span>` : ''
      return `<div style="position:absolute;inset:0;${i ? anim(a('fade', start, 0.35, 'ease')) : ''}"><img src="${asset(s.screen)}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:top;display:block">${tap}</div>`
    })
    .join('')
  const html = page(
    BRAND.dark,
    `<div class="abs" style="right:-260px;top:520px;width:900px;height:900px;border-radius:50%;background:${BRAND.yellow};opacity:.1"></div>
  ${logoPill(true)}
  <div class="scene" style="${anim(exit(t0 - 0.35))}">
    <p class="abs" style="left:72px;top:300px;font:700 42px/1 'Mukta';color:#C9C5BB;${anim(a('rise', 0.1, 0.5))}">${rich(m.kicker ?? '')}</p>
    <h1 class="abs" style="left:72px;top:360px;width:940px;font-size:104px;color:#fff;${anim(a('rise', 0.25, 0.6))}">${rich(m.title)}</h1>
  </div>
  ${steps.map(label).join('')}
  <div class="abs" style="left:${PHONE.x}px;top:${PHONE.y}px;width:${PHONE.w}px;height:${screenH + 32}px;border-radius:70px;background:#2A2926;padding:16px;box-shadow:0 50px 90px rgba(0,0,0,.55);${anim(a('slideUp', 0.35, 0.9), exit(phoneOut))}">
    <div style="position:relative;width:100%;height:100%;border-radius:56px;overflow:hidden;background:${BRAND.page}">${screens}</div>
  </div>
  <div class="scene">
    <h2 class="abs" style="left:72px;top:480px;width:940px;font-size:112px;color:#fff;${anim(a('rise', end + 0.15, 0.6))}">${rich(m.outro ?? 'Save this for your first rental')}</h2>
    <div class="abs pill" style="left:72px;top:860px;background:${BRAND.yellow};color:${BRAND.text};font-size:46px;padding:26px 40px;${anim(a('pop', end + 0.5, 0.55))}">rentigoo.in</div>
    <p class="abs" style="left:72px;top:1010px;width:900px;font:400 42px/1.35 'Mukta';color:#C9C5BB;${anim(a('rise', end + 0.75, 0.5))}">${rich(m.outroSub ?? '')}</p>
  </div>`,
  )
  return { html, duration: end + 3, coverAt: 2.2 }
}

// ───────────────────────────── C · Scrapbook ─────────────────────────────
function scrapbook(m) {
  const items = (m.items ?? ['camera', 'speaker', 'drill', 'tent']).slice(0, 4)
  const notes = m.notes ?? []
  const slots = [
    [70, 70],
    [300, 70],
    [70, 330],
    [300, 330],
  ]
  const tick = (start) =>
    `<svg viewBox="0 0 60 60" width="76" height="76" fill="none" stroke-linecap="round" stroke-linejoin="round" style="flex:none" aria-hidden="true"><rect x="4" y="4" width="52" height="52" rx="12" stroke="${BRAND.text}" stroke-width="4"/><path class="dash" d="M15 31l10 10 21-24" stroke="${BRAND.text}" stroke-width="7" style="--len:60;${anim(a('draw', start, 0.45, 'ease-out'))}"/></svg>`
  const notesStart = 6.6
  // Scene 1 centrepiece: a cupboard full of drawn items (default), or one big drawn item that comes alive (feature: <icon>).
  const confetti = [[-40, 40, 0], [600, 10, 1], [-10, 470, 2], [620, 430, 1], [280, -60, 0], [140, 600, 2], [460, 590, 0]]
  const stage = m.feature
    ? `<div class="abs" style="left:230px;top:770px;width:620px;height:620px;${anim(a('rise', 0.6, 0.6))}">
      <div style="position:absolute;inset:0;border-radius:50%;background:${BRAND.yellow};border:8px solid ${BRAND.text}"></div>
      ${[0, 1, 2].map((i) => `<div style="position:absolute;inset:-40px;border-radius:50%;border:8px solid ${BRAND.text};animation:wave 1s ease-out ${1.4 + i * 0.33}s 4 both"></div>`).join('')}
      <div style="position:absolute;inset:0;display:grid;place-items:center;--rot:-4deg;${anim(a('pop', 1.0, 0.55))}"><div style="--rot:-4deg;animation:thump .5s ease-in-out 1.6s 8 both">${icon(m.feature, 420)}</div></div>
      ${confetti.map(([x, y, c], i) => `<span style="position:absolute;left:${x}px;top:${y}px;width:${i % 2 ? 26 : 40}px;height:${i % 2 ? 40 : 18}px;border-radius:6px;background:${[BRAND.text, '#FFFFFF', BRAND.yellow][c]};border:4px solid ${BRAND.text};transform:rotate(${i * 37}deg);${anim(a('floatUp', 1.8 + i * 0.35, 1.8, 'ease-out'))}"></span>`).join('')}
    </div>`
    : `    <div class="abs" style="left:250px;top:760px;width:580px;height:680px;${anim(a('rise', 0.6, 0.6))}">
      <div style="position:absolute;inset:0;border:8px solid ${BRAND.text};border-radius:24px;background:#fff"></div>
      <div style="position:absolute;left:8px;right:8px;top:330px;border-top:7px solid ${BRAND.text}"></div>
      ${items.map((it, i) => `<div style="position:absolute;left:${slots[i][0]}px;top:${slots[i][1]}px;width:210px;height:210px;display:grid;place-items:center;--rot:${[-6, 5, 4, -5][i]}deg;${anim(a('pop', 1.9 + i * 0.25, 0.5))}">${icon(it, 190)}</div>`).join('')}
      ${items.map((_, i) => `<span class="big" style="position:absolute;left:${slots[i][0] + 120}px;top:${slots[i][1] + 10}px;width:76px;height:76px;border-radius:50%;background:${BRAND.yellow};border:5px solid ${BRAND.text};display:grid;place-items:center;font-size:42px;${anim(a('floatUp', 3.2 + i * 0.3, 1.6, 'ease-out'))}">₹</span>`).join('')}
      <div style="position:absolute;left:0;top:0;width:50%;height:100%;background:${BRAND.yellow};border:8px solid ${BRAND.text};border-radius:24px 0 0 24px;transform-origin:left center;${anim(a('doorL', 1.2, 0.8, 'cubic-bezier(.5,0,.3,1)'))}"><span style="position:absolute;right:26px;top:300px;width:16px;height:80px;border-radius:8px;background:${BRAND.text}"></span></div>
      <div style="position:absolute;right:0;top:0;width:50%;height:100%;background:${BRAND.yellow};border:8px solid ${BRAND.text};border-radius:0 24px 24px 0;transform-origin:right center;${anim(a('doorR', 1.2, 0.8, 'cubic-bezier(.5,0,.3,1)'))}"><span style="position:absolute;left:26px;top:300px;width:16px;height:80px;border-radius:8px;background:${BRAND.text}"></span></div>
    </div>`
  const html = page(
    BRAND.page,
    `${logoPill()}
  <div class="scene" style="${anim(exit(6.1))}">
    <p class="abs hand" style="--rot:-3deg;left:80px;top:300px;font-size:64px;color:${BRAND.muted};${anim(a('rise', 0.1, 0.5))}">${rich(m.scribble ?? '')}</p>
    <h1 class="abs" style="left:72px;top:380px;width:940px;font-size:${m.titleSize ?? 124}px;${anim(a('rise', 0.3, 0.6))}">${rich(m.title)}</h1>
    <svg class="abs" viewBox="0 0 400 40" width="420" height="42" style="left:${m.underlineX ?? 560}px;top:${m.underlineY ?? 616}px" fill="none" stroke="${BRAND.yellow}" stroke-width="16" stroke-linecap="round" aria-hidden="true"><path class="dash" d="M6 24 C 100 6, 250 36, 394 14" style="--len:420;${anim(a('draw', 0.9, 0.5, 'ease-out'))}"/></svg>
    ${stage}
  </div>

  <div class="scene" style="${anim(exit(11.6))}">
    <h2 class="abs" style="left:72px;top:330px;width:940px;font-size:104px;${anim(a('rise', notesStart, 0.55))}">${rich(m.notesTitle ?? 'List it on RentiGoo')}</h2>
    <div class="abs" style="left:72px;right:100px;top:${m.notesTop ?? 600}px;display:flex;flex-direction:column;gap:28px">
      ${notes
        .map(
          (n, i) => `<div style="--rot:${[-1.6, 1.2, -0.8, 1.4][i % 4]}deg;display:flex;align-items:center;gap:28px;background:${i % 2 ? BRAND.yellow : '#fff'};padding:32px 36px;box-shadow:0 14px 30px rgba(28,27,25,.10);${anim(a('slideIn', notesStart + 0.4 + i * 0.5, 0.5))}">
        ${tick(notesStart + 0.8 + i * 0.5)}<span style="font:700 48px/1.2 'Mukta'">${rich(n)}</span></div>`,
        )
        .join('')}
    </div>
  </div>

  <div class="scene">
    <p class="abs hand" style="--rot:-3deg;left:80px;top:520px;width:920px;font-size:104px;line-height:1.0;${anim(a('rise', 11.9, 0.6))}">${rich(m.outro ?? '')}</p>
    <div class="abs pill" style="left:72px;top:950px;background:${BRAND.dark};color:#fff;font-size:52px;padding:30px 46px;${anim(a('pop', 12.4, 0.55))}">${rich(m.link ?? 'rentigoo.in')}</div>
    <p class="abs" style="left:72px;top:1120px;width:900px;font:400 42px/1.35 'Mukta';color:${BRAND.muted};${anim(a('rise', 12.7, 0.5))}">${rich(m.outroSub ?? '')}</p>
  </div>`,
  )
  return { html, duration: 15, coverAt: 4.6 }
}

const STYLES = { hero, app, scrapbook }
export const MOTION_STYLES = Object.keys(STYLES)
export const MOTION_SIZE = { width: W, height: H, fps: 30 }

/** { html, duration, coverAt } for a post's motion block. */
export function motionScene(m) {
  const fn = STYLES[m?.style]
  if (!fn) throw new Error(`unknown motion style "${m?.style}" (use ${MOTION_STYLES.join(', ')})`)
  return fn(m)
}
