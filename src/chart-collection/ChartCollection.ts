import ChartImp from '../Chart'
import { LayoutManager } from './LayoutManager'
import { CrosshairSync } from './CrosshairSync'
import { TimeScaleSync } from './TimeScaleSync'
import type { MultiChartOptions, MultiChartLayout } from './types'

type DestroyFn = () => void

const LAYOUT_MAP: Record<string, [number, number]> = {
  '2x2': [2, 2],
  '2x3': [2, 3],
  '3x2': [3, 2],
  '3x3': [3, 3],
  '2x1': [2, 1],
  '1x2': [1, 2]
}

function resolveLayout (count: number, layout?: MultiChartLayout, cols?: number, rows?: number): [number, number] {
  if (cols !== undefined && rows !== undefined) return [cols, rows]
  if (layout !== undefined && layout in LAYOUT_MAP) return LAYOUT_MAP[layout]
  if (layout === 'vertical') return [1, count]
  if (layout === 'single') return [1, 1]
  if (layout === 'grid') {
    const c = Math.ceil(Math.sqrt(count))
    const r = Math.ceil(count / c)
    return [c, r]
  }
  // horizontal / default
  return [count, 1]
}

export class ChartCollection {
  private readonly charts: ChartImp[] = []
  private readonly cells: HTMLElement[] = []
  private readonly layoutManager: LayoutManager
  private readonly crosshairSync: CrosshairSync
  private readonly timeScaleSync: TimeScaleSync
  private readonly ids: string[] = []
  private readonly destroyShell: DestroyFn | null
  private activeId: string | null = null

  constructor (dom: HTMLElement, options: MultiChartOptions, destroyShell?: DestroyFn) {
    this.destroyShell = destroyShell ?? null
    const [cols, rows] = resolveLayout(options.panes.length, options.layout, options.cols, options.rows)

    this.layoutManager = new LayoutManager(dom)
    this.crosshairSync = new CrosshairSync()
    this.timeScaleSync = new TimeScaleSync()

    this.layoutManager.setLayout(cols, rows)

    options.panes.forEach((pane) => {
      const cell = this.layoutManager.addCell(
        document.createElement('div')
      )
      const chart = new ChartImp(cell, pane.styles !== undefined ? { styles: pane.styles } : undefined)
      const id = `k_chart_${pane.id}`
      chart.id = id
      cell.setAttribute('k-line-chart-id', id)
      this.charts.push(chart)
      this.cells.push(cell)
      this.ids.push(pane.id)

      cell.addEventListener('click', () => { this._setActive(pane.id) })

      if (options.crosshairSync === undefined || options.crosshairSync) {
        this.crosshairSync.add(chart)
      }
      if (options.timeScaleSync === true) {
        this.timeScaleSync.add(chart)
      }
    })

    this._syncVisibility(cols * rows)
    if (options.panes.length > 0) this._setActive(options.panes[0].id)
  }

  get length (): number { return this.charts.length }

  [index: number]: ChartImp | undefined

  getById (id: string): ChartImp | undefined {
    const idx = this.ids.indexOf(id)
    return idx !== -1 ? this.charts[idx] : undefined
  }

  setActiveChart (id: string): void {
    this._setActive(id)
  }

  getActiveChart (): ChartImp | undefined {
    if (this.activeId === null) return undefined
    return this.getById(this.activeId)
  }

  getActiveId (): string | null { return this.activeId }

  private _setActive (id: string): void {
    this.activeId = id
    const visibleCells = this.cells.filter(c => c.style.display !== 'none').length
    this.cells.forEach((cell, i) => {
      cell.classList.toggle('klc-cell-active', visibleCells > 1 && this.ids[i] === id)
    })
  }

  setCrosshairSync (enabled: boolean): void {
    if (enabled) {
      this.charts.forEach(c => { this.crosshairSync.add(c) })
    } else {
      this.charts.forEach(c => { this.crosshairSync.remove(c) })
    }
  }

  setTimeScaleSync (enabled: boolean): void {
    if (enabled) {
      this.charts.forEach(c => { this.timeScaleSync.add(c) })
    } else {
      this.charts.forEach(c => { this.timeScaleSync.remove(c) })
    }
  }

  setLayout (cols: number, rows: number): void {
    this.layoutManager.setLayout(cols, rows)
    this._syncVisibility(cols * rows)
  }

  setLayoutPreset (layout: MultiChartLayout): void {
    const [cols, rows] = resolveLayout(this.charts.length, layout)
    this.layoutManager.setLayout(cols, rows)
    this._syncVisibility(cols * rows)
  }

  private _syncVisibility (visibleCount: number): void {
    this.cells.forEach((cell, i) => {
      cell.style.display = i < visibleCount ? '' : 'none'
    })
  }

  destroy (): void {
    this.charts.forEach(c => { c.destroy() })
    this.charts.length = 0
    this.ids.length = 0
    this.crosshairSync.dispose()
    this.timeScaleSync.dispose()
    this.layoutManager.destroy()
    if (this.destroyShell !== null) this.destroyShell()
  }
}
