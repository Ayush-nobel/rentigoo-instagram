#!/usr/bin/env node
/**
 * One-time token setup, run in your own Terminal:  node scripts/setup-token.mjs
 *
 * Asks (typing stays hidden) for your App ID, App Secret and the short-lived
 * token from the Graph API Explorer, then:
 *   1. swaps it for a long-lived user token (60 days),
 *   2. gets the RentiGoo Page's token (doesn't expire) and the Instagram user ID,
 *   3. checks it with Meta's token debugger,
 *   4. saves both as GitHub Secrets (via gh) and in .env (git-ignored).
 * It never prints a token.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

const ROOT = resolve(import.meta.dirname, '..')
const V = process.env.GRAPH_VERSION || 'v27.0'
const REPO = process.env.REPO || 'Ayush-nobel/rentigoo-instagram'

function ask(question, hidden = false) {
  return new Promise((done) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    if (hidden) {
      const write = rl._writeToOutput.bind(rl)
      rl._writeToOutput = (s) => (s.includes(question) ? write(s) : write(s.replace(/[^\r\n]/g, '•')))
    }
    rl.question(question, (a) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      done(a.trim())
    })
  })
}
async function get(path, params) {
  const url = new URL(`https://graph.facebook.com/${V}/${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const r = await fetch(url)
  const j = await r.json()
  if (j.error) throw new Error(`${j.error.type ?? 'Error'}: ${j.error.message}`.replace(/EAA\w+/g, 'EAA***'))
  return j
}

console.log('RentiGoo token setup. Nothing you type is shown or printed.\n')
const appId = await ask('App ID (Meta app → App settings → Basic): ')
const appSecret = await ask('App Secret (same page, click Show): ', true)
const shortToken = await ask('Token from the Graph API Explorer: ', true)

const long = await get('oauth/access_token', { grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: shortToken })
console.log('✓ Long-lived user token received')

const pages = (await get('me/accounts', { fields: 'id,name,access_token,instagram_business_account{id,username}', access_token: long.access_token })).data ?? []
if (!pages.length) throw new Error('No Facebook Pages found. When generating the token, allow access to your RentiGoo Page.')
let page = pages.find((p) => p.instagram_business_account) ?? pages[0]
if (pages.length > 1) {
  pages.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}${p.instagram_business_account ? ` (Instagram @${p.instagram_business_account.username})` : ' (no Instagram linked)'}`))
  const pick = Number(await ask(`Which Page? [${pages.indexOf(page) + 1}]: `)) || pages.indexOf(page) + 1
  page = pages[pick - 1]
}
const ig = page.instagram_business_account
if (!ig) throw new Error(`The Page "${page.name}" has no Instagram professional account linked. Link it in Meta Business Suite, then run this again.`)
console.log(`✓ Page "${page.name}" → Instagram @${ig.username} (ID ${ig.id})`)

const dbg = (await get('debug_token', { input_token: page.access_token, access_token: `${appId}|${appSecret}` })).data
const expires = dbg.expires_at ? new Date(dbg.expires_at * 1000).toLocaleDateString('en-IN') : 'never'
const scopes = dbg.scopes ?? []
const need = ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights']
const missing = need.filter((s) => !scopes.includes(s))
console.log(`✓ Page token is ${dbg.is_valid ? 'valid' : 'NOT valid'}, expires: ${expires}`)
if (missing.length) console.log(`⚠ Missing permissions: ${missing.join(', ')}. Tick them in the Explorer, generate a new token and run this again.`)
if (!dbg.is_valid || missing.length) process.exit(1)

// GitHub Secrets (value passed on stdin, never on the command line).
for (const [name, value] of [['IG_ACCESS_TOKEN', page.access_token], ['IG_USER_ID', ig.id]]) {
  execFileSync('gh', ['secret', 'set', name, '-R', REPO], { input: value, stdio: ['pipe', 'ignore', 'inherit'] })
  console.log(`✓ GitHub Secret ${name} saved`)
}

// .env for running on this computer (git-ignored).
const envFile = resolve(ROOT, '.env')
let env = existsSync(envFile) ? readFileSync(envFile, 'utf8') : readFileSync(resolve(ROOT, '.env.example'), 'utf8')
const setLine = (k, v) => (env = new RegExp(`^${k}=.*$`, 'm').test(env) ? env.replace(new RegExp(`^${k}=.*$`, 'm'), `${k}=${v}`) : env + `\n${k}=${v}\n`)
setLine('IG_ACCESS_TOKEN', page.access_token)
setLine('IG_USER_ID', ig.id)
setLine('PUBLIC_BASE_URL', 'https://ayush-nobel.github.io/rentigoo-instagram')
writeFileSync(envFile, env, { mode: 0o600 })
console.log('✓ Saved to .env on this computer (not committed)\n\nDone. Tell Claude "token set" for a dry run.')
