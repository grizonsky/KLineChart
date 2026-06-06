import type { LayoutShell } from '../core/LayoutShell'

const COLORS = ['#2DC08E', '#F92855', '#1677FF', '#FFD54F', '#9c9c9c', '#FFFFFF']
const SIZES = [1, 2, 3, 4, 6]
const LINE_STYLES: Array<'solid' | 'dashed'> = ['solid', 'dashed']

export interface FloatingToolbarOptions {
  color: string
  size: number
  lineStyle: 'solid' | 'dashed'
}

export class FloatingToolbar {
  private readonly _shell: LayoutShell
  private readonly _onChange: (opts: FloatingToolbarOptions) => void
  private _element: HTMLElement | null = null
  private _color = '#1677FF'
  private _size = 2
  private _lineStyle: 'solid' | 'dashed' = 'solid'
  private _savedLeft = 0
  private _savedTop = 8
  private _isDragging = false
  private _dragOffsetX = 0
  private _dragOffsetY = 0
  private readonly _onMouseMove: (e: MouseEvent) => void
  private readonly _onMouseUp: () => void

  constructor (shell: LayoutShell, onChange: (opts: FloatingToolbarOptions) => void) {
    this._shell = shell
    this._onChange = onChange

    this._onMouseMove = (e: MouseEvent) => {
      if (!this._isDragging || this._element === null) return
      const parentRect = this._element.parentElement!.getBoundingClientRect()
      this._savedLeft = e.clientX - this._dragOffsetX - parentRect.left
      this._savedTop = e.clientY - this._dragOffsetY - parentRect.top
      this._element.style.left = `${this._savedLeft}px`
      this._element.style.top = `${this._savedTop}px`
    }

    this._onMouseUp = () => {
      this._isDragging = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }

  get options (): FloatingToolbarOptions {
    return { color: this._color, size: this._size, lineStyle: this._lineStyle }
  }

  show (): void {
    if (this._element === null) return
    this._element.classList.remove('i-closed')
  }

  hide (): void {
    if (this._element === null) return
    this._element.classList.add('i-closed')
  }

  mount (): void {
    const slot = this._shell.getSlot('chart')
    const el = document.createElement('div')
    el.style.cssText = `
      display:inline-flex;position:absolute;z-index:50;height:38px;
      background:var(--panel,#0f0f0f);border:1px solid var(--border,#2a2e39);
      border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.4);
      align-items:stretch;overflow:hidden;
    `.replace(/\s+/g, ' ')
    el.className = 'klc-float-toolbar i-closed'
    // Immediate append to measure
    slot.appendChild(el)
    // Center in parent
    const parentW = el.parentElement!.clientWidth
    if (this._savedLeft === 0 && this._savedTop === 8) {
      el.style.left = `${Math.round(parentW / 2 - el.offsetWidth / 2)}px`
      el.style.top = '8px'
    } else {
      el.style.left = `${this._savedLeft}px`
      el.style.top = `${this._savedTop}px`
    }

    // Drag handle
    const drag = document.createElement('div')
    drag.style.cssText = `
      width:16px;flex-shrink:0;cursor:grab;display:flex;align-items:center;
      justify-content:center;color:var(--muted,#76808F);font-size:10px;
      border-right:1px solid var(--border,#2a2e39);
    `
    drag.textContent = '⣿'
    drag.addEventListener('mousedown', (e) => {
      const vpRect = el.getBoundingClientRect()
      this._dragOffsetX = e.clientX - vpRect.left
      this._dragOffsetY = e.clientY - vpRect.top
      this._isDragging = true
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
      e.preventDefault()
    })
    el.appendChild(drag)

    // Colors
    COLORS.forEach(clr => {
      const btn = document.createElement('div')
      btn.style.cssText = `
        width:22px;flex-shrink:0;cursor:pointer;display:flex;align-items:center;
        justify-content:center;
      `
      const dot = document.createElement('div')
      dot.style.cssText = `
        width:14px;height:14px;border-radius:50%;pointer-events:none;
        background:${clr};
        ${clr === this._color ? '' : 'background-clip:content-box;'}
      `
      if (clr === this._color) dot.style.outline = '2px solid #fff'
      btn.appendChild(dot)
      btn.addEventListener('click', () => {
        this._color = clr
        el.querySelectorAll('.klc-ft-dot').forEach(d => {
          (d as HTMLElement).style.outline = ''
        })
        dot.style.outline = '2px solid #fff'
        this._onChange(this.options)
      })
      btn.className = 'klc-ft-dot'
      el.appendChild(btn)
    })

    // Sep
    el.appendChild(s())

    // Sizes
    SIZES.forEach(sz => {
      const btn = document.createElement('div')
      btn.style.cssText = `
        width:22px;flex-shrink:0;display:flex;align-items:center;
        justify-content:center;cursor:pointer;
      `
      const line = document.createElement('div')
      line.style.cssText = `width:12px;height:${sz}px;background:${this._color};pointer-events:none;border-radius:1px;`
      btn.appendChild(line)
      btn.addEventListener('click', () => {
        this._size = sz
        this._onChange(this.options)
      })
      el.appendChild(btn)
    })

    // Sep
    el.appendChild(s())

    // Line style
    LINE_STYLES.forEach(ls => {
      const btn = document.createElement('div')
      btn.style.cssText = `
        width:22px;flex-shrink:0;display:flex;align-items:center;
        justify-content:center;cursor:pointer;font-size:9px;
        color:var(--text,#d1d4dc);opacity:${ls === this._lineStyle ? '1' : '.4'};
      `
      btn.textContent = ls === 'solid' ? '──' : '- -'
      btn.addEventListener('click', () => {
        this._lineStyle = ls
        el.querySelectorAll('.klc-ft-sty').forEach(b => {
          (b as HTMLElement).style.opacity = '.4'
        })
        btn.style.opacity = '1'
        this._onChange(this.options)
      })
      btn.className = 'klc-ft-sty'
      el.appendChild(btn)
    })

    slot.appendChild(el)
    this._element = el

    document.addEventListener('mousemove', this._onMouseMove)
    document.addEventListener('mouseup', this._onMouseUp)
  }

  dispose (): void {
    document.removeEventListener('mousemove', this._onMouseMove)
    document.removeEventListener('mouseup', this._onMouseUp)
    this._element = null
  }
}

function s (): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = 'width:1px;height:20px;background:var(--border,#2a2e39);margin:0 2px;flex-shrink:0;align-self:center;'
  return el
}
