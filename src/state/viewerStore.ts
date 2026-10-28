import { create } from 'zustand'

export type ViewName = 'front' | 'rear' | 'left' | 'right' | 'top'
export type ViewerCommand =
  | { type: 'rotate'; by: number }
  | { type: 'zoom'; factor: number }
  | { type: 'reset' }
  | { type: 'view'; view: ViewName }

/** UI <-> canvas bridge for the 360° viewer (kept separate from the scroll narrative's store). */
interface ViewerState {
  autoRotate: boolean
  /** current heading of the camera around the product, 0..359° (0 = front) */
  heading: number
  /** latest command; `id` changes on every request so repeated clicks are seen */
  command: (ViewerCommand & { id: number }) | null
  send: (c: ViewerCommand) => void
  setAutoRotate: (on: boolean) => void
  setHeading: (deg: number) => void
}

let nextId = 1
export const useViewerStore = create<ViewerState>((set) => ({
  autoRotate: false,
  heading: 0,
  command: null,
  send: (c) => set({ command: { ...c, id: nextId++ } }),
  setAutoRotate: (on) => set({ autoRotate: on }),
  setHeading: (deg) => set({ heading: deg }),
}))
