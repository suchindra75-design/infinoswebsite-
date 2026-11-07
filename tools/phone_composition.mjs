// Phone composition data: where the WHOLE product lands in the 16:10 film at every point of the story
// (src/content/phoneComposition.json). src/motion/composition.ts fits that rectangle into the phone's product zone at
// run time, for the actual screen, so the bag is never cropped and never runs under the navigation or the chapter text.
//
//   npm run dev -- --port 3100      (development build: it exposes the test hooks this tool reads)
//   node tools/phone_composition.mjs [http://localhost:3100]
//
// The extent comes from the live model itself (every visible mesh's bounding box, posed for that moment and projected
// through the story camera), so the raised flap, the opened lids, the inner box and the exploded layers are included.
// Re-run it whenever the camera track (cameraTrack.ts), the opening stages or the model change.
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:3100'
const OUT = new URL('../src/content/phoneComposition.json', import.meta.url)
const STEP = 0.002

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const port = 9400 + Math.floor(Math.random() * 400)
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/phone-comp-${port}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' })
let ws
for (let i = 0; i < 60; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
    ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl)
    break
  } catch {
    await sleep(250)
  }
}
await new Promise((r) => ws.addEventListener('open', r))
let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
})
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400))
  return r.result?.result?.value
}

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
await send('Page.enable')
await send('Page.navigate', { url })
for (let i = 0; i < 240; i++) {
  await sleep(500)
  const ok = await ev(`!!(window.__infinos && window.__infinosParts && window.__infinos.store.getState().introPhase === 'ready' && window.__infinos.store.getState().modelReady)`).catch(() => false)
  if (ok) break
  if (i === 239) throw new Error('the page never became ready')
}

const measure = `async (p) => {
  const I = window.__infinos
  // the real path: scroll the page there (the scroll controller owns the progress) and wait until it has settled
  const el = document.querySelector('.narrative-spacer')
  const y = el.getBoundingClientRect().top + scrollY + p * (el.offsetHeight - innerHeight)
  window.scrollTo(0, Math.round(y))
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => requestAnimationFrame(r))
    if (Math.abs(I.store.getState().progress - p) < 0.0004) break
  }
  I.requestFrame()
  for (let i = 0; i < 4; i++) await new Promise((r) => requestAnimationFrame(r))
  const st = I.store.getState()
  const ch = I.chapterAt(st.progress)
  const pose = I.cameraAt(ch.phase, st.chapterProgress)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const part of window.__infinosParts()) part.traverse((o) => {
    if (!o.isMesh || !o.visible) return
    const g = o.geometry
    if (!g.boundingBox) g.computeBoundingBox()
    const b = g.boundingBox, e = o.matrixWorld.elements
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
      const w = [e[0]*x + e[4]*y + e[8]*z + e[12], e[1]*x + e[5]*y + e[9]*z + e[13], e[2]*x + e[6]*y + e[10]*z + e[14]]
      const [fx, fy] = I.projectToFilm(pose, w)
      x0 = Math.min(x0, fx); x1 = Math.max(x1, fx); y0 = Math.min(y0, fy); y1 = Math.max(y1, fy)
    }
  })
  const [sx, sy] = I.projectToFilm(pose, pose.subject)
  return { p, at: st.progress, phase: ch.phase, x0, y0, x1, y1, sx, sy }
}`
await ev(`window.__measure = ${measure}`)
const raw = []
for (let p = 0; p <= 1.0000001; p += STEP) raw.push(await ev(`window.__measure(${p.toFixed(4)})`))
ws.close()
chrome.kill()

// ── smoothing: the rectangle is widened to its extremes within ±0.006 of progress, then Gaussian-smoothed (σ = 0.004),
// so the fitted composition moves fluidly and still contains the product at every moment ──
const n = raw.length
const win = Math.round(0.006 / STEP)
const sig = 0.004 / STEP
const ext = (key, f) => raw.map((_, i) => f(...raw.slice(Math.max(0, i - win), i + win + 1).map((r) => r[key])))
const gauss = (arr) => {
  const k = Math.ceil(3 * sig)
  return arr.map((_, i) => {
    let a = 0, wsum = 0
    for (let j = -k; j <= k; j++) {
      const v = arr[Math.min(n - 1, Math.max(0, i + j))]
      const w = Math.exp(-(j * j) / (2 * sig * sig))
      a += v * w
      wsum += w
    }
    return a / wsum
  })
}
const cols = [gauss(ext('x0', Math.min)), gauss(ext('y0', Math.min)), gauss(ext('x1', Math.max)), gauss(ext('y1', Math.max)), raw.map((r) => r.sx), raw.map((r) => r.sy)]
const rects = raw.map((_, i) => cols.map((c) => +c[i].toFixed(4)))
fs.writeFileSync(OUT, JSON.stringify({ _: 'product extent in the film per progress step: [x0, y0, x1, y1, subjectX, subjectY] (tools/phone_composition.mjs)', step: STEP, rects }) + '\n')
if (process.env.RAW_OUT) fs.writeFileSync(process.env.RAW_OUT, JSON.stringify(raw))
console.log('wrote', OUT.pathname, rects.length, 'steps')
