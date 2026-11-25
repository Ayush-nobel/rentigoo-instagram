/**
 * Renders HTML files to PNGs with the Chrome already on this computer, over
 * the DevTools protocol. No extra packages: Node's built-in WebSocket talks to it.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean)

export function findChrome() {
  const found = CANDIDATES.find((p) => existsSync(p))
  if (!found) throw new Error('Chrome not found. Install Google Chrome, or set CHROME_PATH to its program file.')
  return found
}

export async function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), 'rg-chrome-'))
  const proc = spawn(findChrome(), ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = ''
    const timer = setTimeout(() => reject(new Error('Chrome did not start in time')), 20000)
    proc.stderr.on('data', (d) => {
      buf += d
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/)
      if (m) {
        clearTimeout(timer)
        resolve(m[1])
      }
    })
    proc.on('exit', (code) => reject(new Error(`Chrome exited (${code})`)))
  })
  const browser = new WebSocket(wsUrl)
  await new Promise((r, j) => {
    browser.onopen = r
    browser.onerror = j
  })
  let nextId = 0
  const pending = new Map()
  const listeners = new Set()
  browser.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    } else for (const l of listeners) l(msg)
  }
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++nextId
      pending.set(id, { resolve, reject })
      browser.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    })

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)

  async function screenshot(htmlPath, pngPath, width, height) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId)
    const loaded = new Promise((r) => {
      const l = (m) => {
        if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') {
          listeners.delete(l)
          r()
        }
      }
      listeners.add(l)
    })
    await send('Page.navigate', { url: pathToFileURL(htmlPath).href }, sessionId)
    await loaded
    // Wait for web fonts and images before taking the picture.
    await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r }))))', awaitPromise: true }, sessionId)
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height, scale: 1 }, captureBeyondViewport: false }, sessionId)
    writeFileSync(pngPath, Buffer.from(data, 'base64'))
  }

  /**
   * Plays an HTML page's CSS animations frame by frame (not in real time, so
   * every frame is exact) and hands each frame to onFrame as a JPEG buffer.
   * Animations must not loop forever; use fill-mode both so delayed ones show their start.
   * stills: [{ at: seconds, path }] PNG snapshots (e.g. the reel cover) taken first.
   */
  async function record(htmlPath, { width, height, fps, duration, stills = [] }, onFrame) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId)
    const loaded = new Promise((r) => {
      const l = (m) => {
        if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') {
          listeners.delete(l)
          r()
        }
      }
      listeners.add(l)
    })
    await send('Page.navigate', { url: pathToFileURL(htmlPath).href }, sessionId)
    await loaded
    await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r }))))', awaitPromise: true }, sessionId)
    const seek = (ms) => send('Runtime.evaluate', { expression: `(() => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = ${ms} } return 0 })()`, returnByValue: true }, sessionId)
    const grab = async (format) => Buffer.from((await send('Page.captureScreenshot', { format, ...(format === 'jpeg' ? { quality: 94 } : {}), clip: { x: 0, y: 0, width, height, scale: 1 } }, sessionId)).data, 'base64')
    for (const { at, path } of stills) {
      await seek(at * 1000)
      writeFileSync(path, await grab('png'))
    }
    const frames = Math.round(duration * fps)
    for (let i = 0; i < frames; i++) {
      await seek((i * 1000) / fps)
      await onFrame(await grab('jpeg'), i, frames)
    }
    return { frames }
  }

  async function close() {
    try {
      await send('Browser.close')
    } catch {}
    // Let Chrome finish writing its profile before deleting it.
    const exited = proc.exitCode !== null ? Promise.resolve() : new Promise((r) => proc.once('exit', r))
    proc.kill()
    await Promise.race([exited, new Promise((r) => setTimeout(r, 5000))])
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
  return { screenshot, record, close }
}
