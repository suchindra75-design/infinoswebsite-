'use client'

import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import { Canvas, advance, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Suspense, memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { applyRenderSettings } from '@/components/product/renderSettings'
import { addRenderer, requestFrame } from '@/motion/frameLoop'
import { COOLANTS, COOLANT_CAP, type CoolantId } from '@/content/coolants'
import {
  INFO_FROM,
  MODEL_SCALE,
  cameraAt,
  direction,
  easeOutQuart,
  entryAt,
  entryStart,
  fanPose,
  selectedPose,
  settleAt,
  smooth,
  type Direction,
  type Pose,
} from '@/motion/coolantMotion'
import { coolantRuntime as rt, sectionScroll, useCoolantStore } from './coolantStore'

export const COOLANT_MODEL = '/models/coolant-pack.glb'

/** pack lying flat, front face up, cap end pointing up the screen (-z); the fan yaw is applied about +y on top */
const LIE = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
const Y_AXIS = new THREE.Vector3(0, 1, 0)

interface ShellUniforms {
  rim: { value: number }
  rimColour: { value: THREE.Color }
  dim: { value: number }
  light: { value: number }
}

/**
 * Frosted blow-moulded plastic. The fill line is drawn in the shader from the model's own `fillLevel` (glTF extra):
 * the filled body takes the coolant colour, the headspace under the shoulders stays paler, as in both photographs.
 * `rim` is the hover / selection highlight (a soft fresnel edge light in the pack's own colour), `dim` recedes the
 * packs that are not selected, `light` lifts an arriving pack into the full studio light and the selected one
 * slightly above it.
 */
function shellMaterial(liquid: string, headspace: string, fill: { y: number; soft: number } | null, u: ShellUniforms) {
  const m = new THREE.MeshPhysicalMaterial({
    color: liquid,
    roughness: 0.33,
    clearcoat: 0.5,
    clearcoatRoughness: 0.22,
    sheen: 0.3,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color('#ffffff'),
    transparent: true, // the entry dissolve (each pack has its own depth pre-pass, see DEPTH_ONLY)
  })
  const liquidC = new THREE.Color(liquid)
  const headC = new THREE.Color(headspace)
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uLiquid: { value: liquidC },
      uHead: { value: headC },
      uFill: { value: fill ? fill.y : 1e3 },
      uFillSoft: { value: fill ? fill.soft : 1 },
      uRim: u.rim,
      uRimColour: u.rimColour,
      uDim: u.dim,
      uLight: u.light,
    })
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vObjY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjY = position.y;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vObjY;\nuniform vec3 uLiquid;\nuniform vec3 uHead;\nuniform float uFill;\nuniform float uFillSoft;\nuniform float uRim;\nuniform vec3 uRimColour;\nuniform float uDim;\nuniform float uLight;',
      )
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb = mix(uLiquid, uHead, smoothstep(uFill - uFillSoft, uFill + uFillSoft, vObjY)) * uDim;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\nfloat cxFres = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.2);\ntotalEmissiveRadiance += uRimColour * uRim * (0.12 + cxFres);',
      )
      .replace('#include <opaque_fragment>', 'outgoingLight *= uLight;\n#include <opaque_fragment>')
  }
  m.customProgramCacheKey = () => (fill === null ? 'coolant-cap' : 'coolant-shell')
  return m
}

/**
 * Renders this canvas from the shared frame loop, only while the section is on screen and something changed. Before
 * the bag story completes (s < 0) nothing of the showcase is shown (the section CSS hides the canvas), so it does not
 * render either.
 */
function FrameLoopBridge() {
  const get = useThree((s) => s.get)
  useEffect(
    () =>
      addRenderer((now) => {
        if (!rt.visible && !rt.warm) return
        const s = sectionScroll()
        if (s < -0.02 && !rt.warm) return
        rt.warm = false
        if (s === rt.lastS && !rt.animating && !rt.dirty) return
        rt.lastS = s
        rt.dirty = false
        advance(now, true, get())
        return rt.animating
      }, 40),
    [get],
  )
  return null
}

const tmpM = new THREE.Matrix4()
const tmpV = new THREE.Vector3()
const tmpQ = new THREE.Quaternion()
const tmpP = new THREE.Vector3()
const tmpS = new THREE.Vector3()

function poseQuat(yaw: number, out: THREE.Quaternion) {
  return out.setFromAxisAngle(Y_AXIS, yaw).multiply(LIE)
}

function poseMatrix(p: Pose, out: THREE.Matrix4) {
  return out.compose(tmpP.set(p.x, p.y, p.z), poseQuat(p.yaw, tmpQ), tmpS.setScalar(MODEL_SCALE * p.scale))
}

/** a few hundred points on the actual pack surface (body and cap), so the framing uses the real visible outline */
function outlinePoints(body: THREE.Mesh, cap: THREE.Mesh): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []
  for (const mesh of [body, cap]) {
    mesh.updateMatrix()
    const pos = mesh.geometry.getAttribute('position')
    const step = Math.max(1, Math.floor(pos.count / (mesh === body ? 260 : 24)))
    for (let i = 0; i < pos.count; i += step) pts.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrix))
  }
  return pts
}

/** the free area of the stage: below the navigation, beside / above the selector (measured from the live layout) */
function safeArea(w: number, h: number) {
  const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 64
  const pad = Math.max(14, 0.025 * Math.min(w, h))
  const area = { top: nav + pad, bottom: pad, left: pad, right: pad }
  const stage = document.querySelector('.cx-stage')?.getBoundingClientRect()
  const el = document.querySelector<HTMLElement>('.cx-picker')
  const picker = el?.getBoundingClientRect()
  if (el && stage && picker && picker.width > 0) {
    // the selector is a row along the bottom, or (phone landscape) a column at the right
    const column = getComputedStyle(el).flexDirection === 'column'
    if (column) area.right = Math.max(area.right, w - (picker.left - stage.left) + pad)
    else area.bottom = Math.max(area.bottom, h - (picker.top - stage.top) + pad)
  }
  return { ...area, nav }
}

interface Framing {
  target: THREE.Vector3
  distance: number
  /** the composed view offset of the fan (exactly restored when the focus closes) */
  offX: number
  offY: number
  w: number
  h: number
  /**
   * focus shift in px per selected pack (0 where the layout keeps the fan in place): the layout's share of the width,
   * capped so the pulled-forward pack stays a gutter clear of the screen edge; and the light pool to move with it
   */
  shifts: [number, number, number]
  pool: HTMLElement | null
  /** last applied shift in px (to update the view offset only when it changes) */
  applied: number
}

/** the visible part of each pack's entry (it is fully transparent before), as it is actually animated */
function entryPose(slot: number, dir: Direction, e: number): Pose {
  const from = entryStart(slot, dir.fan)
  const rest = fanPose(slot, dir.fan)
  return {
    x: lerp(from.x, rest.x, easeOutQuart(e)),
    y: lerp(from.y, rest.y, smooth(clamp01((e - 0.12) / 0.88))),
    z: lerp(from.z, rest.z, easeOutQuart(e)),
    yaw: lerp(from.yaw, rest.yaw, 1 - Math.pow(1 - e, 3)),
    scale: 1,
  }
}

/**
 * Frame the resting fan inside the free area (centred, filling the layout's share of it), measured on the projected
 * pack outlines; then make sure every pulled-forward pose — and the visible part of every entry — also stays on
 * screen, pulling back slightly if not.
 */
function fitCamera(camera: THREE.PerspectiveCamera, w: number, h: number, dir: Direction, outline: THREE.Vector3[]): Framing {
  const area = safeArea(w, h)
  camera.fov = dir.fov
  camera.aspect = w / h
  camera.clearViewOffset()
  camera.updateProjectionMatrix()
  const rest: THREE.Vector3[] = []
  const sel: THREE.Vector3[] = []
  const pulled: THREE.Vector3[] = []
  const pulledBySlot: THREE.Vector3[][] = [[], [], []]
  for (let slot = 0; slot < 3; slot++) {
    poseMatrix(fanPose(slot, dir.fan), tmpM)
    for (const p of outline) rest.push(p.clone().applyMatrix4(tmpM))
    // the on-screen check needs only the silhouette's extremes: every third outline point is plenty
    for (const pose of [selectedPose(slot, dir.fan), entryPose(slot, dir, 0.3), entryPose(slot, dir, 0.6)]) {
      poseMatrix(pose, tmpM)
      for (let k = 0; k < outline.length; k += 3) {
        const q = outline[k].clone().applyMatrix4(tmpM)
        sel.push(q)
        if (pose.scale > 1) {
          pulled.push(q)
          pulledBySlot[slot].push(q)
        }
      }
    }
  }
  const target = new THREE.Box3().setFromPoints(rest).getCenter(new THREE.Vector3())
  const view = new THREE.Vector3(0, Math.sin(dir.elevation), Math.cos(dir.elevation))
  const freeW = w - area.left - area.right
  const freeH = h - area.top - area.bottom
  const place = (d: number) => {
    camera.position.copy(target).addScaledVector(view, d)
    camera.lookAt(target)
    camera.updateMatrixWorld()
  }
  const bounds = (pts: THREE.Vector3[]) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, behind = false
    for (const p of pts) {
      tmpV.copy(p).project(camera)
      if (tmpV.z < -1 || tmpV.z > 1) behind = true
      const x = (tmpV.x + 1) * 0.5 * w
      const y = (1 - tmpV.y) * 0.5 * h
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
    }
    return { x0, x1, y0, y1, behind }
  }
  let lo = 1
  let hi = 80
  // 18 halvings of 1–80 resolve the distance to ~0.0003 units (far below a pixel); this runs once per resize
  for (let it = 0; it < 18; it++) {
    const d = (lo + hi) / 2
    place(d)
    const b = bounds(rest)
    if (!b.behind && b.x1 - b.x0 <= freeW * dir.fillW && b.y1 - b.y0 <= freeH * dir.fillH) hi = d
    else lo = d
  }
  let d = hi
  // centre the resting fan in the free area (a view offset in pixels moves the picture opposite to the offset)
  const centre = () => {
    camera.clearViewOffset()
    place(d)
    const b = bounds(rest)
    camera.setViewOffset(w, h, (b.x0 + b.x1) / 2 - (area.left + freeW / 2), (b.y0 + b.y1) / 2 - (area.top + freeH / 2), w, h)
    camera.updateProjectionMatrix()
  }
  centre()
  for (let i = 0; i < 24; i++) {
    const b = bounds(sel)
    if (b.x0 >= 8 && b.x1 <= w - 8 && b.y0 >= area.nav + 6 && b.y1 <= h - 8) break
    d *= 1.035
    centre()
  }
  const offX = camera.view?.offsetX ?? 0
  const offY = camera.view?.offsetY ?? 0
  // where the fan sits on screen — the resting fan and every pulled-forward pack — for the information layout
  const r = bounds(rest)
  const p = bounds(pulled)
  const fan = { x0: Math.min(r.x0, p.x0), x1: Math.max(r.x1, p.x1), y0: Math.min(r.y0, p.y0), y1: Math.max(r.y1, p.y1) }
  // focus: glide the whole fan left by the layout's share of the width — per selected pack, never letting the fan or
  // that pack (pulled forward) come closer than a gutter to the screen edge
  const gutter = Math.max(24, 0.03 * w)
  const perSlot = pulledBySlot.map((pts) => {
    const q = bounds(pts)
    return { x0: Math.min(r.x0, q.x0), x1: Math.max(r.x1, q.x1) }
  })
  const shifts = perSlot.map((b) => (dir.focusShift > 0 ? Math.max(0, Math.min(dir.focusShift * w, b.x0 - gutter)) : 0)) as [number, number, number]
  // the information column stays put while switching: right of the widest focused fan
  const infoLeft = Math.max(...perSlot.map((b, i) => b.x1 - shifts[i])) + Math.max(32, 0.035 * w)
  const stage = document.querySelector<HTMLElement>('.cx-stage')
  if (stage) {
    const set = (k: string, v: number) => stage.style.setProperty(k, `${Math.round(v)}px`)
    stage.style.setProperty('--cx-pool-x', `${((area.left + freeW / 2) / w) * 100}%`)
    stage.style.setProperty('--cx-pool-y', `${((area.top + freeH / 2) / h) * 100}%`)
    set('--cx-fan-left', fan.x0)
    set('--cx-fan-right', fan.x1)
    set('--cx-fan-top', fan.y0)
    set('--cx-fan-bottom', fan.y1)
    set('--cx-free-bottom', h - area.bottom)
    set('--cx-info-left', infoLeft)
    stage.dataset.focusLayout = shifts.some((x) => x > 0) ? 'column' : dir.mode === 'phoneL' ? 'side' : 'bands'
  }
  return { target, distance: d, offX, offY, w, h, shifts, pool: document.querySelector<HTMLElement>('.cx-pool'), applied: -1 }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
function mixPose(a: Pose, b: Pose, t: number): Pose {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), yaw: lerp(a.yaw, b.yaw, t), scale: lerp(a.scale, b.scale, t) }
}

/**
 * Card-over-card layering. The packs lie in separate layers and the camera looks down on them, so drawing them in
 * order of their current height — clearing depth before each pack, keeping each pack's own depth test — gives the
 * true overlap of a fan of cards. A pack rising past the others changes places in that order mid-motion, so it is
 * never seen passing through a neighbour.
 *
 * Within its layer each pack first writes depth only (DEPTH_ONLY), then colour: while it dissolves in, only its front
 * surface is blended, so the recesses and cap never show through.
 */
function clearDepthBefore(renderer: THREE.WebGLRenderer) {
  renderer.state.buffers.depth.setMask(true)
  renderer.clearDepth()
}
const DEPTH_ONLY = new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true })
const noRaycast = () => null

const hitMaterial = new THREE.MeshBasicMaterial({ visible: false })
/** the shadow catcher's material (one coolant canvas per page), eased with the light settle */
const shadowCatcher: { material: THREE.ShadowMaterial | null } = { material: null }

function CoolantFan() {
  const { nodes } = useGLTF(COOLANT_MODEL) as unknown as { nodes: Record<string, THREE.Mesh> }
  const body = nodes.CoolantBody
  const cap = nodes.CoolantCap
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const scene = useThree((s) => s.scene)
  const groups = useRef<(THREE.Group | null)[]>([])
  const bodies = useRef<(THREE.Mesh | null)[]>([])
  const caps = useRef<(THREE.Mesh | null)[]>([])
  const framing = useRef<Framing | null>(null)
  const focus = useRef(0)
  const warming = useRef(false)
  const toggle = useCoolantStore((s) => s.toggle)
  const hover = useCoolantStore((s) => s.hover)

  // the optimised GLB stores quantised positions and carries the real scale in each node's transform: the fill line
  // (metres, from the model's extras) is converted into the body geometry's own space for the shader
  const fill = useMemo(() => {
    body.updateMatrix()
    const level = typeof body.userData.fillLevel === 'number' ? body.userData.fillLevel : 0.063
    const inv = body.matrix.clone().invert()
    const y = new THREE.Vector3(0, level, 0).applyMatrix4(inv).y
    const soft = Math.abs(new THREE.Vector3(0, level + 0.0015, 0).applyMatrix4(inv).y - y)
    return { y, soft }
  }, [body])
  const packs = useMemo(
    () =>
      COOLANTS.map((c) => {
        const u: ShellUniforms = {
          rim: { value: 0 },
          rimColour: { value: new THREE.Color('#ffffff').lerp(new THREE.Color(c.ui), 0.6) },
          dim: { value: 1 },
          light: { value: 0 },
        }
        return {
          coolant: c,
          u,
          shell: shellMaterial(c.liquid, c.headspace, fill, u),
          cap: shellMaterial(COOLANT_CAP, COOLANT_CAP, null, u),
          anim: { sel: 0, hov: 0, dim: 0 },
        }
      }),
    [fill],
  )
  useEffect(() => () => packs.forEach((p) => (p.shell.dispose(), p.cap.dispose())), [packs])

  const outline = useMemo(() => outlinePoints(body, cap), [body, cap])
  // pointer picking uses one box per pack (the pack's own bounds) instead of its ~30k triangles: hit-testing the full
  // meshes on every pointer move cost 7 ms per move (26–62 ms on a 4x slower CPU)
  const hit = useMemo(() => {
    body.updateMatrix()
    cap.updateMatrix()
    body.geometry.computeBoundingBox()
    cap.geometry.computeBoundingBox()
    const b = body.geometry.boundingBox!.clone().applyMatrix4(body.matrix).union(cap.geometry.boundingBox!.clone().applyMatrix4(cap.matrix))
    const size = b.getSize(new THREE.Vector3())
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z)
    const c = b.getCenter(new THREE.Vector3())
    geo.translate(c.x, c.y, c.z)
    return geo
  }, [body, cap])
  useEffect(() => () => hit.dispose(), [hit])
  const dir = useMemo(() => direction(size.width, size.height), [size.width, size.height])

  useLayoutEffect(() => {
    framing.current = fitCamera(camera, size.width, size.height, dir, outline)
    if (process.env.NODE_ENV !== 'production') Object.assign(window, { __coolant: { camera, dir, groups: groups.current, size, scene, packs, store: useCoolantStore, rt } })
    rt.dirty = true
    requestFrame()
  }, [camera, size.width, size.height, dir, outline, packs, scene])

  // Warm-up, well before the section is reached: the packs' programs are compiled asynchronously (off the main thread
  // where the browser supports it) with all three made renderable for the moment, then one hidden frame also prepares
  // the shadow pass. Without this the first pack would compile on the frame it first appears.
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    let live = true
    const run = () => {
      if (!live) return
      warming.current = true
      groups.current.forEach((g) => g && (g.visible = true))
      gl.compileAsync(scene, camera).then(() => {
        if (!live) return
        rt.warm = true
        rt.dirty = true
        requestFrame()
      })
    }
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    if (ric) ric(run, { timeout: 1500 })
    else setTimeout(run, 200)
    return () => {
      live = false
    }
  }, [gl, scene, camera])

  useFrame(() => {
    const now = performance.now()
    const dt = rt.lastNow && now - rt.lastNow < 100 ? (now - rt.lastNow) / 1000 : 1 / 60
    rt.lastNow = now
    const s = rt.lastS
    const st = useCoolantStore.getState()
    const rm = rt.reducedMotion
    const k = rm ? 1 : 1 - Math.pow(0.002, dt) // ~0.55 s to settle
    const f = dir.fan

    // camera: settles from a higher, slightly wider view into the hero angle (none with reduced motion)
    const fr = framing.current
    if (fr) {
      const c = rm ? 1 : cameraAt(s)
      const el = dir.elevation + (1 - c) * dir.startElevation
      const d = fr.distance * (1 + (1 - c) * (dir.startDistance - 1))
      camera.position.set(fr.target.x, fr.target.y + Math.sin(el) * d, fr.target.z + Math.cos(el) * d)
      camera.lookAt(fr.target)
    }
    const settle = rm ? 1 : settleAt(s)
    if (shadowCatcher.material) shadowCatcher.material.opacity = 0.42 + 0.2 * settle

    // focus (phase 2): with a coolant's information open, the whole fan glides left in screen space — a view offset
    // only; nothing in the scene moves — and returns to exactly the composed offset when the family view returns
    let focusGoal = 0
    if (fr) {
      const idx = st.selected ? packs.findIndex((p) => p.coolant.id === st.selected) : -1
      focusGoal = idx >= 0 && s >= INFO_FROM ? fr.shifts[idx] : 0
      const d = focusGoal - focus.current
      focus.current = Math.abs(d) < 0.25 ? focusGoal : focus.current + d * k
      if (focus.current !== fr.applied) {
        fr.applied = focus.current
        const px = focus.current
        camera.setViewOffset(fr.w, fr.h, fr.offX + px, fr.offY, fr.w, fr.h)
        if (fr.pool) fr.pool.style.transform = px ? `translate3d(${(-px).toFixed(1)}px, 0, 0)` : ''
      }
    }

    let animating = false
    const heights: [number, number][] = []
    packs.forEach((p, i) => {
      const g = groups.current[i]
      if (!g) return
      const id = p.coolant.id
      const goals = { sel: st.selected === id ? 1 : 0, hov: st.hovered === id && st.selected !== id ? 1 : 0, dim: st.selected && st.selected !== id ? 1 : 0 }
      for (const key of ['sel', 'hov', 'dim'] as const) {
        const d = goals[key] - p.anim[key]
        if (Math.abs(d) < 1e-3) p.anim[key] = goals[key]
        else {
          p.anim[key] += d * k
          animating = true
        }
      }
      // laid in: glides in decelerating, turns into its fan angle, and lowers last so its shadow gathers beneath it
      const e = entryAt(i, s)
      const rest = fanPose(i, f)
      const laid = rm ? rest : entryPose(i, dir, e)
      const sel = smooth(p.anim.sel)
      const pose = mixPose(laid, selectedPose(i, f), sel)
      g.position.set(pose.x, pose.y, pose.z)
      poseQuat(pose.yaw, g.quaternion)
      g.scale.setScalar(MODEL_SCALE * pose.scale)
      heights.push([pose.y, i])
      // dissolves in as it glides, and comes up into the full studio light as it lands
      const opacity = rm ? e : smooth(clamp01(e / 0.42))
      const arrive = rm ? 1 : 0.8 + 0.2 * smooth(clamp01(e / 0.8))
      p.shell.opacity = p.cap.opacity = opacity
      p.u.light.value = arrive * (0.9 + 0.1 * settle) * (1 + 0.07 * sel - 0.05 * p.anim.dim)
      // the warm-up frame draws every pack (invisibly, opacity 0) so all programs, shadow pass included, are ready
      g.visible = opacity > 0.002 || warming.current
      const castShadow = opacity > 0.6 || warming.current
      const b = bodies.current[i]
      const c = caps.current[i]
      if (b) b.castShadow = castShadow
      if (c) c.castShadow = castShadow
      p.u.rim.value = 0.26 * sel + 0.12 * p.anim.hov
      p.u.dim.value = 1 - 0.16 * p.anim.dim
    })
    // draw order follows the current height: per pack, depth (body, cap) then colour (body, cap)
    heights.sort((a, b) => a[0] - b[0]).forEach(([, i], rank) => {
      const g = groups.current[i]
      if (!g) return
      for (let n = 0; n < 4; n++) g.children[n].renderOrder = 10 + rank * 4 + n
    })
    rt.animating = animating || focus.current !== focusGoal
    warming.current = false
  })

  const onClick = (id: CoolantId) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    toggle(id)
  }
  // hover is a mouse affordance only: a tap would otherwise leave a pack "hovered" on touch screens
  const onOver = (id: CoolantId) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (e.pointerType !== 'mouse') return
    hover(id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    hover(null)
    document.body.style.cursor = ''
  }
  useEffect(() => () => void (document.body.style.cursor = ''), [])

  return (
    <>
      {packs.map((p, i) => (
        <group key={p.coolant.id} ref={(g) => void (groups.current[i] = g)}>
          {/* children order matters: depth body, depth cap, colour body, colour cap (render order is set per frame) */}
          <mesh geometry={body.geometry} position={body.position} quaternion={body.quaternion} scale={body.scale} material={DEPTH_ONLY} onBeforeRender={clearDepthBefore} raycast={noRaycast} />
          <mesh geometry={cap.geometry} position={cap.position} quaternion={cap.quaternion} scale={cap.scale} material={DEPTH_ONLY} raycast={noRaycast} />
          <mesh
            ref={(m) => void (bodies.current[i] = m)}
            geometry={body.geometry}
            position={body.position}
            quaternion={body.quaternion}
            scale={body.scale}
            material={p.shell}
            castShadow
            receiveShadow
            raycast={noRaycast}
          />
          <mesh
            ref={(m) => void (caps.current[i] = m)}
            geometry={cap.geometry}
            position={cap.position}
            quaternion={cap.quaternion}
            scale={cap.scale}
            material={p.cap}
            castShadow
            raycast={noRaycast}
          />
          {/* invisible pick box (last child: draw order is set for the four render meshes only) */}
          <mesh geometry={hit} material={hitMaterial} onClick={onClick(p.coolant.id)} onPointerOver={onOver(p.coolant.id)} onPointerOut={onOut} />
        </group>
      ))}
    </>
  )
}

/** the floor is the CSS backdrop; this plane only catches the fan's soft shadows (drawn before the packs) */
function ShadowCatcher() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]} receiveShadow renderOrder={0} raycast={noRaycast}>
      <planeGeometry args={[18, 18]} />
      <shadowMaterial ref={(m) => void (shadowCatcher.material = m)} transparent opacity={0.42} />
    </mesh>
  )
}

/**
 * Studio: a broad overhead softbox for the long, soft reflections across the frosted faces, a key from the upper left
 * (it casts the soft contact shadows), a rim from behind to draw the far edges against the dark, and a low fill.
 */
// memoised: drei's Environment re-renders its cube camera whenever it re-renders, so it must not follow the
// section's hover / selection re-renders
const Lighting = memo(function Lighting({ isMobile }: { isMobile: boolean }) {
  const key = useRef<THREE.DirectionalLight>(null)
  useLayoutEffect(() => {
    const l = key.current
    if (!l) return
    const c = l.shadow.camera
    c.left = c.bottom = -3.4
    c.right = c.top = 3.4
    c.near = 1
    c.far = 20
    c.updateProjectionMatrix()
    l.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048)
    l.shadow.radius = 9
    l.shadow.bias = -0.0004
    l.shadow.normalBias = 0.035
  }, [isMobile])
  return (
    <>
      <Environment resolution={isMobile ? 128 : 256} frames={1} environmentIntensity={0.8}>
        <Lightformer form="rect" intensity={3.2} position={[0, 8, 1]} rotation-x={Math.PI / 2} scale={[9, 5, 1]} />
        <Lightformer form="rect" intensity={4.5} color="#fff6ee" position={[-5, 5, 4]} scale={[5, 3.5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.6} color="#e8f0ff" position={[5, 1.5, 4]} scale={[5, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3.5} position={[-5, 2, -4.5]} scale={[1.2, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3.5} position={[5, 2, -4.5]} scale={[1.2, 6, 1]} target={[0, 0, 0]} />
      </Environment>
      <hemisphereLight args={['#dfe6f0', '#16171a', 0.3]} />
      {/* key: above, a little in front and to the left, so each pack's shadow falls softly behind and to the right */}
      <directionalLight ref={key} position={[-3.6, 7, 3.6]} intensity={2.2} color="#fff6ec" castShadow />
      {/* rim from behind and to the right: a fine highlight along the far edges and the caps */}
      <directionalLight position={[3.5, 2.6, -5.5]} intensity={1.5} color="#f4f6fa" />
      <directionalLight position={[3.4, 1.6, 2.6]} intensity={0.55} color="#dfe8ff" />
    </>
  )
})

const onCreated = ({ gl }: { gl: THREE.WebGLRenderer }) => {
  applyRenderSettings(gl)
  gl.setClearColor(0x000000, 0)
  rt.dirty = true
  requestFrame()
}
const onPointerMissed = () => useCoolantStore.getState().select(null)
const GL = { antialias: true, alpha: true, powerPreference: 'high-performance' } as const
const CAMERA = { fov: 22, near: 0.5, far: 120, position: [0, 6, 6] as [number, number, number] }
// R3F's container sets an inline `pointer-events: auto`, which would capture clicks over the fading story as soon as
// the canvas is visible; it inherits instead, so the section decides when the packs become clickable
const STYLE = { touchAction: 'pan-y', pointerEvents: 'inherit' } as const
/**
 * R3F measures its container before it creates the scene. By default the measurement is debounced on scroll (50 ms
 * after the last scroll event), which never fires while the visitor keeps scrolling — the scene would not start
 * until scrolling stopped. This canvas is the only one that mounts mid-scroll, so it measures immediately.
 */
const RESIZE = { scroll: false, debounce: 0 } as const

/** memoised: hover and selection re-render the section, never the canvas */
export const CoolantCanvas = memo(function CoolantCanvas({ isMobile }: { isMobile: boolean }) {
  return (
    <Canvas
      frameloop="never"
      dpr={[1, 1.75]}
      shadows="percentage"
      gl={GL}
      camera={CAMERA}
      resize={RESIZE}
      onCreated={onCreated}
      onPointerMissed={onPointerMissed}
      style={STYLE}
    >
      <FrameLoopBridge />
      <Lighting isMobile={isMobile} />
      <ShadowCatcher />
      <Suspense fallback={null}>
        <CoolantFan />
      </Suspense>
    </Canvas>
  )
})
