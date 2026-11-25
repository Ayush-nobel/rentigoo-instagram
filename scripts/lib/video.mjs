/**
 * Renders a post's `motion:` block to an Instagram-ready reel:
 *   reels/ready/<id>.mp4   H.264 + AAC, 1080x1920, 30 fps
 *   output/<id>/cover.png  a still from the settled moment (motion.coverAt)
 * ffmpeg comes from the ffmpeg-static dev dependency (only needed where you
 * run `npm run generate`, not in the publishing workflow).
 * Sound: motion.audio (a file under assets/audio/ that you have the rights to)
 * is mixed in and faded out; without one the reel has a silent AAC track.
 */
import { spawn } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { MOTION_SIZE, motionScene } from './motion.mjs'

const ROOT = resolve(import.meta.dirname, '../..')

async function ffmpegPath() {
  try {
    return (await import('ffmpeg-static')).default
  } catch {
    throw new Error('ffmpeg is not installed. Run npm install (it adds ffmpeg-static).')
  }
}

export async function renderMotion(chrome, p, { tmpDir, coverPath, videoPath }) {
  const scene = motionScene(p.motion)
  const html = join(tmpDir, `${p.id}-motion.html`)
  writeFileSync(html, scene.html)
  const { width, height, fps } = MOTION_SIZE
  const duration = scene.duration
  const audio = p.motion.audio ? resolve(ROOT, 'assets', p.motion.audio) : null
  if (audio && !existsSync(audio)) throw new Error(`${p.id}: motion.audio ${p.motion.audio} not found in assets/`)

  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-']
  if (audio) args.push('-i', audio)
  else args.push('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo')
  args.push(
    '-map', '0:v', '-map', '1:a',
    '-t', String(duration),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
    ...(audio ? ['-af', `afade=t=out:st=${Math.max(0, duration - 1.2)}:d=1.2`] : []),
    '-movflags', '+faststart',
    videoPath,
  )
  const ff = spawn(await ffmpegPath(), args, { stdio: ['pipe', 'inherit', 'pipe'] })
  let err = ''
  ff.stderr.on('data', (d) => (err += d))
  const done = new Promise((res, rej) => ff.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg failed (${code}): ${err.trim()}`)))))

  await chrome.record(html, { width, height, fps, duration, stills: [{ at: scene.coverAt, path: coverPath }] }, async (jpeg) => {
    if (!ff.stdin.write(jpeg)) await new Promise((r) => ff.stdin.once('drain', r))
  })
  ff.stdin.end()
  await done
  return { duration }
}
