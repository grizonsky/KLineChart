export type Breakpoint = 'desktop' | 'tablet' | 'mobile'

export type SlotId = 'top' | 'left' | 'chart' | 'right' | 'bottom' | 'watchlist'

export interface Widget {
  id: string
  slot: SlotId
  mount: (container: HTMLElement) => void
  unmount: () => void
}
