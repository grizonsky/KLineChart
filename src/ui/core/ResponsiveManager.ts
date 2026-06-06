import type { Breakpoint } from '../types'

type Listener = (bp: Breakpoint) => void

export class ResponsiveManager {
  private bp: Breakpoint = 'desktop'
  private readonly listeners: Set<Listener> = new Set<Listener>()
  private readonly mqls: MediaQueryList[] = []
  private readonly handlers: Array<(e: MediaQueryListEvent) => void> = []

  constructor () {
    const queries: Array<{ label: Breakpoint; query: string }> = [
      { label: 'mobile', query: '(max-width: 568px)' },
      { label: 'tablet', query: '(min-width: 569px) and (max-width: 1024px)' },
      { label: 'desktop', query: '(min-width: 1025px)' }
    ]

    const match = (): void => {
      for (const { label, query } of queries) {
        if (window.matchMedia(query).matches) {
          if (this.bp !== label) {
            this.bp = label
            this.listeners.forEach(fn => { fn(label) })
          }
          break
        }
      }
    }

    queries.forEach(({ query }) => {
      const mql = window.matchMedia(query)
      this.mqls.push(mql)
      const handler = (): void => { match() }
      mql.addEventListener('change', handler)
      this.handlers.push(handler)
    })

    match()
  }

  getBreakpoint (): Breakpoint { return this.bp }
  isMobile (): boolean { return this.bp === 'mobile' }
  isTablet (): boolean { return this.bp === 'tablet' }
  isDesktop (): boolean { return this.bp === 'desktop' }

  subscribe (fn: Listener): () => void {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  dispose (): void {
    this.listeners.clear()
    this.mqls.forEach((mql, i) => { mql.removeEventListener('change', this.handlers[i]) })
    this.mqls.length = 0
    this.handlers.length = 0
  }
}
