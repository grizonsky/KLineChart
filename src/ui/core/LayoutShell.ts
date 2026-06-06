import type { SlotId } from '../types'

let stylesInjected = false

const CSS = `
:root{
  --underlay:#1c1c1c;
  --bg:#0f0f0f;
  --panel:#0f0f0f;
  --text:#d1d4dc;
  --border:#2a2e39;
  --accent:#2962ff;
}
.klc-layout{
  height:100%;
  display:grid;
  color:var(--text);
  background:var(--underlay);
  grid-template-columns:52px 1fr 52px;
  grid-template-rows:48px 1fr 40px;
  grid-template-areas:
    "top top top"
    "left chart right"
    "left bottom right";
}
.klc-topbar{grid-area:top;display:flex;align-items:center;gap:8px;padding:0 12px;background:var(--panel);border-bottom:1px solid var(--border);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex-shrink:0;}
.klc-topbar::-webkit-scrollbar{display:none;}
.klc-left{grid-area:left;background:var(--panel);margin-top:5px;display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:6px;}
.klc-chart{grid-area:chart;position:relative;overflow:hidden;background:var(--bg);border:1px solid rgba(255,255,255,.15);border-radius:5px;margin:5px;}
.klc-bottom{grid-area:bottom;background:var(--panel);margin:0 5px 0 5px;display:flex;align-items:center;}
.klc-right{grid-area:right;margin-top:5px;display:flex;flex-direction:row;overflow:hidden;}
.klc-right-icons{width:52px;flex-shrink:0;background:var(--panel);display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:6px;}
.klc-icon{width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text);}
.klc-icon:hover,.klc-icon.open{background:rgba(255,255,255,.06);}
.klc-float-toolbar.i-closed{display:none!important;}
.klc-cell-active{outline:1px solid rgba(255,255,255,.5);outline-offset:-1px;}
.klc-layout.watchlist-open{grid-template-columns:52px 1fr 300px;}
.klc-watchlist{display:none;flex:1;flex-direction:column;background:var(--panel);overflow:hidden;position:relative;}
.klc-watchlist.open{display:flex;border-right:2px solid #181818;border-radius:5px 0 0 0;}
.klc-watchlist-resize{position:absolute;left:-3px;top:0;bottom:0;width:6px;cursor:col-resize;z-index:10;}
.klc-watchlist-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border);font-size:14px;font-weight:600;flex-shrink:0;}
.klc-watchlist-search{padding:8px 12px;border-bottom:1px solid var(--border);flex-shrink:0;}
.klc-watchlist-search input{width:100%;height:32px;padding:0 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);font-size:12px;font-family:inherit;outline:none;}
.klc-watchlist-search input::placeholder{color:#76808F;}
.klc-watchlist-search input:focus{border-color:var(--accent);}
.klc-watchlist-items{flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#181818 transparent;}
.klc-watchlist-items::-webkit-scrollbar{width:3px;}
.klc-watchlist-items::-webkit-scrollbar-track{background:transparent;}
.klc-watchlist-items::-webkit-scrollbar-thumb{background:#181818;border-radius:2px;}
.klc-watchlist-item{display:flex;align-items:center;padding:10px 16px;cursor:pointer;gap:8px;}
.klc-watchlist-item:hover{background:rgba(255,255,255,.04);}
.klc-watchlist-item.active{background:rgba(41,98,255,.1);}
.klc-watchlist-item .name{flex:1;font-size:13px;font-weight:500;}
.klc-watchlist-item .price{text-align:right;font-size:12px;font-family:'SF Mono','Fira Code',monospace;color:#76808F;}
.klc-watchlist-item .change{width:52px;text-align:right;font-size:12px;font-weight:500;}
.klc-watchlist-item .change.up{color:#2DC08E;}
.klc-watchlist-item .change.down{color:#F92855;}
.klc-watchlist-item .remove{width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#76808F;opacity:0;cursor:pointer;}
.klc-watchlist-item:hover .remove{opacity:1;}
.klc-watchlist-item .remove:hover{background:rgba(255,80,80,.2);color:#F92855;}
`

function injectStyles (): void {
  if (stylesInjected) return
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)
  stylesInjected = true
}

export class LayoutShell {
  readonly element: HTMLElement
  private readonly slots = new Map<SlotId, HTMLElement>()

  constructor (container: HTMLElement) {
    injectStyles()

    this.element = document.createElement('div')
    this.element.className = 'klc-layout'

    const topbar = document.createElement('div')
    topbar.className = 'klc-topbar'
    this.element.appendChild(topbar)
    this.slots.set('top', topbar)

    const left = document.createElement('div')
    left.className = 'klc-left'
    this.element.appendChild(left)
    this.slots.set('left', left)

    const chart = document.createElement('div')
    chart.className = 'klc-chart'
    this.element.appendChild(chart)
    this.slots.set('chart', chart)

    const bottom = document.createElement('div')
    bottom.className = 'klc-bottom'
    this.element.appendChild(bottom)
    this.slots.set('bottom', bottom)

    // Right panel: flex-row container
    const right = document.createElement('div')
    right.className = 'klc-right'
    this.element.appendChild(right)
    this.slots.set('right', right)

    // Watchlist panel (hidden by default, managed by WatchlistWidget)
    const watchlist = document.createElement('div')
    watchlist.className = 'klc-watchlist'
    watchlist.id = 'klc-watchlist'
    right.appendChild(watchlist)
    this.slots.set('watchlist', watchlist)

    // Right icons bar (always visible, 52px)
    const rightIcons = document.createElement('div')
    rightIcons.className = 'klc-right-icons'
    right.appendChild(rightIcons)

    container.appendChild(this.element)
  }

  getSlot (id: SlotId): HTMLElement {
    const slot = this.slots.get(id)
    if (slot === undefined) throw new Error(`Slot "${id}" not found`)
    return slot
  }

  destroy (): void {
    this.element.parentElement?.removeChild(this.element)
    this.slots.clear()
  }
}
