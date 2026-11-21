import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '../..')
const AT = '2026-11-24T20:05:00+05:30' // the wedding checklist carousel is due
const ID = '2026-11-24-carousel-wedding-checklist'

function run(scenario, { seed = {}, containers = [], extra = [] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rg-pub-'))
  const stateFile = join(dir, 'published.json')
  writeFileSync(stateFile, JSON.stringify(seed))
  const callsFile = join(dir, 'calls.txt')
  writeFileSync(callsFile, '')
  writeFileSync(join(dir, 'log.txt'), '')
  let out = ''
  let code = 0
  try {
    out = execFileSync(process.execPath, ['--import', resolve(ROOT, 'scripts/test/fake-graph.mjs'), resolve(ROOT, 'scripts/publish.mjs'), '--now', AT, '--only', ID, ...extra], {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, IG_ACCESS_TOKEN: 'EAAtesttesttesttesttesttest', IG_USER_ID: 'IGUSER', PUBLIC_BASE_URL: 'https://example.test/rg', FAKE_SCENARIO: scenario, FAKE_CALLS: callsFile, FAKE_CONTAINERS: JSON.stringify(containers), RG_STATE_FILE: stateFile, RG_LOG_FILE: join(dir, 'log.txt'), DRY_RUN: '' },
    })
  } catch (e) {
    out = e.stdout + e.stderr
    code = e.status
  }
  return { out, code, state: JSON.parse(readFileSync(stateFile, 'utf8')), calls: readFileSync(callsFile, 'utf8').trim().split('\n').filter(Boolean), log: readFileSync(join(dir, 'log.txt'), 'utf8') }
}

test('publishes a due carousel once: children, parent, publish', () => {
  const r = run('ok')
  assert.equal(r.code, 0, r.out)
  assert.equal(r.state[ID].status, 'published')
  assert.equal(r.calls.filter((c) => c.startsWith('POST IGUSER/media ')).length, 7) // 6 slides + the carousel
  assert.equal(r.calls.filter((c) => c.startsWith('POST IGUSER/media_publish')).length, 1)
  assert.ok(!r.log.includes('EAAtest'), 'token must never be logged')
})

test('never publishes twice: an already published post is left alone', () => {
  const r = run('ok', { seed: { [ID]: { status: 'published', mediaId: 'M1' } } })
  assert.equal(r.calls.length, 0)
})

test('an error after Instagram actually published is recorded as published, not retried', () => {
  const r = run('publish-error-but-published')
  assert.equal(r.state[ID].status, 'published', r.out)
  assert.equal(r.calls.filter((c) => c.startsWith('POST IGUSER/media_publish')).length, 1)
})

test('a rate limit is retried safely', () => {
  const r = run('rate-limit-once')
  assert.equal(r.state[ID].status, 'published', r.out)
})

test('an interrupted run resumes from its container instead of creating a new post', () => {
  const r = run('ok', { seed: { [ID]: { status: 'in_progress', containerId: 'OLD1', containerAt: new Date().toISOString() } }, containers: [['OLD1', 'PUBLISHED']] })
  assert.equal(r.state[ID].status, 'published', r.out)
  assert.equal(r.calls.filter((c) => c.startsWith('POST')).length, 0)
})

test('dry run calls nothing that writes', () => {
  const r = run('ok', { extra: ['--dry-run'] })
  assert.equal(r.calls.filter((c) => c.startsWith('POST')).length, 0)
  assert.equal(r.state[ID], undefined)
})

test('weekly report: numbers, top/bottom posts, and retired metrics skipped', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rg-rep-'))
  const out = execFileSync(process.execPath, ['--import', resolve(ROOT, 'scripts/test/fake-graph.mjs'), resolve(ROOT, 'scripts/report.mjs'), '--week-of', '2026-11-23'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, IG_ACCESS_TOKEN: 'EAAtesttesttesttesttesttest', IG_USER_ID: 'IGUSER', RG_REPORTS_DIR: dir, RG_STATE_FILE: join(dir, 'none.json') },
  })
  assert.match(out, /2026-W48/)
  const md = readFileSync(join(dir, '2026-W48.md'), 'utf8')
  assert.match(md, /Accounts reached \| 2,100/)
  assert.match(md, /Top posts[\s\S]*85,000/)
  assert.match(md, /website_clicks: .*retired/)
  assert.ok(!md.includes('EAAtest'))
  writeFileSync('/tmp/rg-sample-report.md', md)
})
