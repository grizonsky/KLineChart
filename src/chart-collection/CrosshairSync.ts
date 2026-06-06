import type { Chart } from '../Chart'

export class CrosshairSync {
  private isSyncing = false
  private readonly charts: Chart[] = []

  add (chart: Chart): void {
    if (this.charts.includes(chart)) return
    this.charts.push(chart)

    chart.subscribeAction('onCrosshairChange', (data: unknown) => {
      if (this.isSyncing) return
      this.isSyncing = true
      try {
        this.charts.forEach(c => {
          if (c !== chart) c.executeAction('onCrosshairChange', data as never)
        })
      } finally {
        this.isSyncing = false
      }
    })
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
