import { create } from 'zustand'
import type { CoolantId } from '@/content/coolants'

/**
 * Which pack is in focus (the single source for both the 3D scene and the information), which one the pointer is
 * over, and the last one shown — the information keeps showing it while it fades out after a return to the family.
 */
interface CoolantState {
  selected: CoolantId | null
  hovered: CoolantId | null
  shown: CoolantId | null
  select: (id: CoolantId | null) => void
  toggle: (id: CoolantId) => void
  hover: (id: CoolantId | null) => void
}

export const useCoolantStore = create<CoolantState>((set, get) => ({
  selected: null,
  hovered: null,
  shown: null,
  select: (id) => set({ selected: id, shown: id ?? get().shown }),
  toggle: (id) => {
    const next = get().selected === id ? null : id
    set({ selected: next, shown: next ?? get().shown })
  },
  hover: (id) => set({ hovered: id }),
}))

/** per-frame state shared by the section (DOM) and its canvas, kept out of React so scrolling never re-renders */
export const coolantRuntime = {
  section: null as HTMLElement | null,
  /** the section is on screen: the canvas renders (on demand) only then */
  visible: false,
  reducedMotion: false,
  /** one render while still off screen (shader compile / upload ahead of time) */
  warm: false,
  /** something other than scroll changed (selection, hover, resize): render even if s did not move */
  dirty: true,
  animating: false,
  lastS: Number.NaN,
  lastNow: 0,
  /** cached geometry: the section's document top and the stage height (100vh), refreshed on resize */
  top: 0,
  vh: 1,
}

/** cache the section's position, so the per-frame scroll position needs no layout read */
export function measureSection() {
  const el = coolantRuntime.section
  if (!el) return
  coolantRuntime.top = el.getBoundingClientRect().top + window.scrollY
  coolantRuntime.vh = el.querySelector<HTMLElement>('.cx-stage')?.offsetHeight || window.innerHeight
}

/** section scroll in viewport heights (0 = the bag story has just completed and the stage is pinned) */
export function sectionScroll(): number {
  if (!coolantRuntime.section) return -1
  return (window.scrollY - coolantRuntime.top) / coolantRuntime.vh
}
