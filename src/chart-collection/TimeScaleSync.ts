import type { Chart } from '../Chart'

export class TimeScaleSync {
  private isSyncing = false
  private readonly charts: Chart[] = []

  add (chart: Chart): void {
    if (this.charts.includes(chart)) return
    this.charts.push(chart)

    const update = (): void => {
      if (this.isSyncing) return
      this.isSyncing = true
      try {
        const barSpace = chart.getBarSpace()
        this.charts.forEach(c => {
          if (c !== chart) {
            c.setBarSpace(barSpace.bar)
          }
        })
      } finally {
        this.isSyncing = false
      }
    }

    chart.subscribeAction('onZoom', update)
  }

  remove (chart: Chart): void {
    const idx = this.charts.indexOf(chart)
    if (idx !== -1) this.charts.splice(idx, 1)
  }

  dispose (): void {
    this.charts.length = 0
    this.isSyncing = false
  }
}
