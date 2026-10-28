import EDGES from '@/content/sequenceEdges.json'

/**
 * Continue the photoreal shadow past the edge of its film.
 *
 * The frames are rendered on a transparent 16:10 film with a shadow catcher, and the film is smaller than the viewport
 * in almost every frame position (composition.ts). On the lit studio floor a shadow that reaches the film edge (up to
 * ~75 % alpha at the bottom of the open sequence) would end in a hard line. Each such edge is extended with the edge's
 * own shadow — area-averaged over its outer 8 source pixels and 48 samples across, so the stretch carries no streaks and
 * the shadow's sides stay soft — fading out over a little more than a quarter of the screen. It starts exactly at the
 * film edge: overlapping the frame's last row would double the shadow there into a dark line. An edge the product
 * touches (the pinned top of the open sequence, the first close-up's left side) is never stretched:
 * sequenceEdges.json (tools/sequence_edges.py) records each frame's edge alpha.
 */
const SHADOW_ONLY = 0.6
/** the product never reaches the film's bottom edge — only its shadow does */
const BOTTOM_SHADOW_ONLY = 0.9
const MIN_ALPHA = 0.01
const DEPTH = 8
/** samples across an edge (area averages): fine enough to meet the frame's edge row, coarse enough that the shadow's own
 *  sides soften as they continue instead of running on as hard straight edges */
const STEPS = 48

const table = EDGES as unknown as Record<string, number[][]>

/**
 * The averaged strip of each edge, kept per frame: the story redraws the frame on every scrolled frame (its composition
 * moves) while the frame itself changes far less often. The strips and their scratch copies are software canvases
 * (willReadFrequently): a tiny GPU canvas drawn into the frame canvas stalls on a GPU round trip on every draw.
 */
type Edge = 'top' | 'bottom' | 'left' | 'right'
const strips = new Map<Edge, { canvas: HTMLCanvasElement; source: CanvasImageSource | null }>()
const bands = new Map<string, HTMLCanvasElement>()
const soft = (w: number, h: number) => {
  const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h })
  canvas.getContext('2d', { willReadFrequently: true })
  return canvas
}

/** the edge's outer DEPTH source pixels, area-averaged down to STEPS samples across (once per frame and edge) */
function strip(edge: Edge, source: CanvasImageSource, sx: number, sy: number, bw: number, bh: number) {
  const horizontal = edge === 'top' || edge === 'bottom'
  let s = strips.get(edge)
  if (!s) {
    s = { canvas: soft(horizontal ? STEPS : 1, horizontal ? 1 : STEPS), source: null }
    strips.set(edge, s)
  }
  if (s.source === source) return s.canvas
  s.source = source
  // copied 1:1 first, then averaged: resampling straight from the 2560 px frame would pass over the whole frame
  const key = `${bw}x${bh}`
  let band = bands.get(key)
  if (!band) {
    band = soft(bw, bh)
    bands.set(key, band)
  }
  const b = band.getContext('2d')!
  b.clearRect(0, 0, bw, bh)
  b.drawImage(source, sx, sy, bw, bh, 0, 0, bw, bh)
  const c = s.canvas.getContext('2d')!
  c.imageSmoothingQuality = 'high'
  c.clearRect(0, 0, s.canvas.width, s.canvas.height)
  c.drawImage(band, 0, 0, bw, bh, 0, 0, s.canvas.width, s.canvas.height)
  return s.canvas
}

/** draws onto `ctx` right after the frame was drawn at (x, y, w, h) device pixels */
export function extendFilmEdges(ctx: CanvasRenderingContext2D, source: CanvasImageSource, sequenceId: string, index: number, x: number, y: number, w: number, h: number) {
  const e = table[sequenceId]?.[index]
  if (!e) return
  const [top, bottom, left, right] = e
  const W = ctx.canvas.width
  const H = ctx.canvas.height
  const sw = (source as ImageBitmap).width
  const sh = (source as ImageBitmap).height
  if (!sw || !sh) return
  const reach = Math.min(W, H) * 0.28

  const fade = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = g
    ctx.fillRect(rx, ry, rw, rh)
    ctx.globalCompositeOperation = 'source-over'
  }
  // a horizontal edge (top or bottom): its shadow profile across the film, continued sideways to the screen edges
  const horizontal = (edge: Edge, sy: number, dy: number, dh: number, toward: number) => {
    if (dh <= 0) return
    const across = strip(edge, source, 0, sy, sw, DEPTH)
    ctx.drawImage(across, 0, 0, STEPS, 1, x, dy, w, dh)
    if (x > 0) ctx.drawImage(across, 0, 0, 1, 1, 0, dy, x, dh)
    if (x + w < W) ctx.drawImage(across, STEPS - 1, 0, 1, 1, x + w, dy, W - (x + w), dh)
    const edgeY = toward > 0 ? dy : dy + dh
    fade(0, edgeY, 0, edgeY + toward * reach, 0, dy, W, dh)
    // the corners beside the film fade sideways too, exactly like the side extensions they meet
    if (x > 0) fade(x, 0, x - reach, 0, 0, dy, x, dh)
    if (x + w < W) fade(x + w, 0, x + w + reach, 0, x + w, dy, W - (x + w), dh)
  }
  const vertical = (edge: Edge, sx: number, dx: number, dw: number, toward: number) => {
    if (dw <= 0) return
    const down = strip(edge, source, sx, 0, DEPTH, sh)
    ctx.drawImage(down, 0, 0, 1, STEPS, dx, y, dw, h)
    const edgeX = toward > 0 ? dx : dx + dw
    fade(edgeX, 0, edgeX + toward * reach, 0, dx, y, dw, h)
  }

  ctx.save()
  ctx.imageSmoothingEnabled = true
  if (bottom > MIN_ALPHA && bottom < BOTTOM_SHADOW_ONLY && y + h < H) horizontal('bottom', sh - DEPTH, y + h, H - (y + h), 1)
  if (top > MIN_ALPHA && top < SHADOW_ONLY && y > 0) horizontal('top', 0, 0, y, -1)
  if (right > MIN_ALPHA && right < SHADOW_ONLY && x + w < W) vertical('right', sw - DEPTH, x + w, W - (x + w), 1)
  if (left > MIN_ALPHA && left < SHADOW_ONLY && x > 0) vertical('left', 0, 0, x, -1)
  ctx.restore()
}
