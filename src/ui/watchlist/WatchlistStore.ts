export interface WatchlistSymbol {
  name: string
  price: number
  change: number
}

type Listener = () => void

export class WatchlistStore {
  private readonly _symbols: WatchlistSymbol[] = []
  private readonly _listeners: Set<Listener> = new Set<Listener>()

  constructor (initial?: WatchlistSymbol[]) {
    if (initial !== undefined) {
      this._symbols.push(...initial)
    }
  }

  get symbols (): WatchlistSymbol[] {
    return [...this._symbols]
  }

  add (symbol: WatchlistSymbol): void {
    if (this._symbols.some(s => s.name === symbol.name)) return
    this._symbols.push(symbol)
    this._notify()
  }

  remove (name: string): void {
    const idx = this._symbols.findIndex(s => s.name === name)
    if (idx !== -1) {
      this._symbols.splice(idx, 1)
      this._notify()
    }
  }

  updatePrice (name: string, price: number, change: number): void {
    const symbol = this._symbols.find(s => s.name === name)
    if (symbol !== undefined) {
      symbol.price = price
      symbol.change = change
      this._notify()
    }
  }

  subscribe (fn: Listener): () => void {
    this._listeners.add(fn)
    return () => { this._listeners.delete(fn) }
  }

  private _notify (): void {
    this._listeners.forEach(fn => { fn() })
  }
}
