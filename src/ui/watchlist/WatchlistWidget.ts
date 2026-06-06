import type { LayoutShell } from '../core/LayoutShell'
import { Icons } from '../core/Icons'
import { WatchlistStore, type WatchlistSymbol } from './WatchlistStore'

const DEFAULT_SYMBOLS: WatchlistSymbol[] = [
  { name: 'BTCUSDT', price: 89452.30, change: 1.23 },
  { name: 'ETHUSDT', price: 3125.80, change: 2.04 },
  { name: 'SOLUSDT', price: 142.15, change: -0.42 },
  { name: 'BNBUSDT', price: 587.40, change: 0.85 },
  { name: 'DOGEUSDT', price: 0.1245, change: -1.56 }
]

export class WatchlistWidget {
  private readonly _shell: LayoutShell
  private readonly _store: WatchlistStore
  private readonly _onToggle: (id: string) => void
  private _panel: HTMLElement | null = null
  private _itemsEl: HTMLElement | null = null
  private _toggleBtn: HTMLElement | null = null
  private _open = false
  private _width = 248
  private readonly _onMouseMove: (e: MouseEvent) => void
  private readonly _onMouseUp: () => void
  private _resizing = false

  constructor (shell: LayoutShell, onToggle: (id: string) => void, initialSymbols?: WatchlistSymbol[]) {
    this._shell = shell
    this._store = new WatchlistStore(initialSymbols ?? DEFAULT_SYMBOLS)
    this._onToggle = onToggle

    this._onMouseMove = (e: MouseEvent) => {
      if (!this._resizing) return
      const rect = this._shell.element.getBoundingClientRect()
      this._width = Math.min(Math.max(rect.right - e.clientX - 52, 150), 500)
      this._shell.element.style.gridTemplateColumns = `52px 1fr ${52 + this._width}px`
    }

    this._onMouseUp = () => {
      if (this._resizing) {
        this._resizing = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    this._store.subscribe(() => { this._renderItems() })
  }

  mount (): void {
    const slot = this._shell.getSlot('watchlist')
    if (this._panel !== null) return
    this._panel = slot

    const resize = document.createElement('div')
    resize.className = 'klc-watchlist-resize'
    slot.appendChild(resize)

    const header = document.createElement('div')
    header.className = 'klc-watchlist-header'
    header.innerHTML = '<span>Watchlist</span>'
    slot.appendChild(header)

    const items = document.createElement('div')
    items.className = 'klc-watchlist-items'
    slot.appendChild(items)
    this._itemsEl = items

    this._renderItems()
    this._initResize(resize)
  }

  mountToggle (iconsContainer: HTMLElement): void {
    const btn = document.createElement('div')
    btn.className = 'klc-icon active'
    btn.title = 'Toggle Watchlist'
    btn.innerHTML = Icons.watchlist
    iconsContainer.prepend(btn)
    this._toggleBtn = btn
    btn.addEventListener('click', () => { this.toggle() })
  }

  toggle (): void {
    this._open = !this._open
    const layout = this._shell.element
    if (this._panel === null) return

    if (this._open) {
      layout.style.gridTemplateColumns = `52px 1fr ${52 + this._width}px`
      this._panel.classList.add('open')
      this._toggleBtn?.classList.add('open')
    } else {
      this._panel.classList.remove('open')
      this._toggleBtn?.classList.remove('open')
      layout.style.gridTemplateColumns = ''
    }
    this._onToggle('watchlist')
  }

  dispose (): void {
    document.removeEventListener('mousemove', this._onMouseMove)
    document.removeEventListener('mouseup', this._onMouseUp)
    this._panel = null
    this._itemsEl = null
    this._toggleBtn = null
  }

  private _renderItems (): void {
    const el = this._itemsEl
    if (el === null) return
    el.innerHTML = ''
    this._store.symbols.forEach(sym => {
      const item = document.createElement('div')
      item.className = 'klc-watchlist-item'
      const cls = sym.change >= 0 ? 'up' : 'down'
      const sign = sym.change >= 0 ? '+' : ''
      item.innerHTML = `
        <span class="name">${sym.name}</span>
        <span class="price" style="color:${sym.change >= 0 ? '#2DC08E' : '#F92855'}">${sym.price.toFixed(2)}</span>
        <span class="change ${cls}">${sign}${sym.change.toFixed(2)}%</span>
        <span class="remove" data-id="${sym.name}">${Icons.remove}</span>
      `
      item.addEventListener('click', () => {
        el.querySelectorAll('.klc-watchlist-item').forEach(i => { i.classList.remove('active') })
        item.classList.add('active')
      })
      item.querySelector('.remove')?.addEventListener('click', (e) => {
        e.stopPropagation()
        this._store.remove(sym.name)
      })
      el.appendChild(item)
    })
  }

  private _initResize (handle: HTMLElement): void {
    handle.addEventListener('mousedown', (e) => {
      this._resizing = true
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      e.preventDefault()
    })

    document.addEventListener('mousemove', this._onMouseMove)
    document.addEventListener('mouseup', this._onMouseUp)
  }
}
