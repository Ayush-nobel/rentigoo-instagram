import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dueAt, fullCaption, loadCalendar, todosIn } from '../lib/calendar.mjs'

const { posts, problems } = loadCalendar()

test('the calendar has no problems', () => assert.deepEqual(problems, []))

test('5 posts a week: 2 reels, 2 carousels, 1 local, all 7-9 pm IST', () => {
  const byWeek = {}
  for (const p of posts) {
    const d = dueAt(p)
    const hour = Number(d.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }))
    assert.ok(hour >= 19 && hour <= 21 && !(hour === 21 && p.time !== '21:00'), `${p.id} at ${p.time}`)
    const monday = new Date(d)
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
    const k = monday.toISOString().slice(0, 10)
    ;(byWeek[k] ??= []).push(p.type)
  }
  const full = Object.values(byWeek).filter((w) => w.length === 5)
  assert.ok(full.length >= 4)
  for (const w of full) {
    assert.equal(w.filter((t) => t === 'reel').length, 2)
    assert.equal(w.filter((t) => t === 'carousel').length, 2)
    assert.equal(w.filter((t) => t === 'single').length, 1)
  }
})

test('every post has 8-12 hashtags, local ones included, and the WhatsApp number or site', () => {
  for (const p of posts) {
    assert.ok(p.hashtags.length >= 8 && p.hashtags.length <= 12, `${p.id}: ${p.hashtags.length} hashtags`)
    assert.ok(p.hashtags.some((t) => /bhopal|mpnagar|pachmarhi/i.test(t)), `${p.id}: no local hashtag`)
    assert.ok(/93014 22919|rentigoo\.in/.test(p.caption), `${p.id}: no call to action contact`)
  }
})

test('only 5 hashtags are published by default', () => {
  const tags = fullCaption(posts[0]).match(/#\w+/g)
  assert.equal(tags.length, 5)
})

test('carousels end on a save/share slide', () => {
  for (const p of posts.filter((p) => p.type === 'carousel')) assert.equal(p.slides.at(-1).kind, 'cta', p.id)
})

test('TODOs are found, and posts without them have none', () => {
  assert.ok(todosIn(posts.find((p) => p.id.includes('founder'))).length > 0)
  assert.equal(todosIn(posts.find((p) => p.id.includes('wedding-checklist'))).length, 0)
})
