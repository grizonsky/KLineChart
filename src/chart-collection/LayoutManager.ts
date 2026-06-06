export class LayoutManager {
  readonly element: HTMLElement
  private cols = 1
  private rows = 1

  constructor (chartContainer: HTMLElement) {
    this.element = document.createElement('div')
    this.element.className = 'klc-chart-grid'
    this.element.style.cssText = `
      width:100%;height:100%;display:grid;gap:1px;
      grid-template-columns:1fr;grid-template-rows:1fr;
    `
    chartContainer.appendChild(this.element)
  }

  setLayout (cols: number, rows: number): void {
    this.cols = cols
    this.rows = rows
    this.element.style.gridTemplateColumns = `repeat(${cols}, 1fr)`
    this.element.style.gridTemplateRows = `repeat(${rows}, 1fr)`
  }

  getCols (): number { return this.cols }
  getRows (): number { return this.rows }

  addCell (chartContainer: HTMLElement): HTMLElement {
    const cell = document.createElement('div')
    cell.style.cssText = 'position:relative;overflow:hidden;min-width:0;min-height:0;'
    cell.appendChild(chartContainer)
    this.element.appendChild(cell)
    return cell
  }

  clear (): void {
    this.element.innerHTML = ''
  }

  destroy (): void {
    this.element.parentElement?.removeChild(this.element)
  }
}
