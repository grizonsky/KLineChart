import type Nullable from '../../common/Nullable'
import type { LayoutShell } from '../core/LayoutShell'
import { Icons } from '../core/Icons'
import type { FloatingToolbar, PropertyChangeCallback } from './FloatingToolbar'
import { createLinePropertyGroup, createPointPropertyGroup } from '../../component/OverlayProperty'

interface ToolDef {
  name: string
  icon: string
  overlay: string
}

const TOOLS: ToolDef[] = [
  { name: 'Cursor', icon: Icons.cursor, overlay: '' },
  { name: 'Trend Line', icon: Icons.trendLine, overlay: 'straightLine' },
  { name: 'Segment', icon: Icons.trendLine, overlay: 'segment' },
  { name: 'Fibonacci', icon: Icons.fibonacci, overlay: 'fibonacciLine' },
  { name: 'Horizontal', icon: Icons.trendLine, overlay: 'horizontalStraightLine' },
  { name: 'Text', icon: Icons.text, overlay: 'simpleAnnotation' }
]

export class DrawingToolsWidget {
  private readonly _shell: LayoutShell
  private readonly _createOverlay: (create: string | object) => void
  private readonly _btns: HTMLElement[] = []
  private readonly _floatingToolbar: FloatingToolbar | null
  private readonly _onPropertyChange: Nullable<PropertyChangeCallback>
  private _activeIdx = 0

  constructor (
    shell: LayoutShell,
    createOverlay: (create: string | object) => void,
    floatingToolbar?: FloatingToolbar,
    onPropertyChange?: PropertyChangeCallback
  ) {
    this._shell = shell
    this._createOverlay = createOverlay
    this._floatingToolbar = floatingToolbar ?? null
    this._onPropertyChange = onPropertyChange ?? null
  }

  mount (): void {
    const slot = this._shell.getSlot('left')
    slot.innerHTML = ''

    TOOLS.forEach((tool, idx) => {
      const btn = document.createElement('div')
      btn.className = 'klc-icon' + (idx === this._activeIdx ? ' active' : '')
      btn.title = tool.name
      btn.innerHTML = tool.icon
      btn.addEventListener('click', () => { this._select(idx, tool.overlay) })
      slot.appendChild(btn)
      this._btns.push(btn)
    })

    const spacer = document.createElement('div')
    spacer.style.flex = '1'
    slot.appendChild(spacer)

    const objectsBtn = document.createElement('div')
    objectsBtn.className = 'klc-icon'
    objectsBtn.title = 'Objects'
    objectsBtn.innerHTML = Icons.objects
    slot.appendChild(objectsBtn)
  }

  private _select (idx: number, overlayName: string): void {
    if (this._activeIdx === idx) {
      this._btns.forEach(b => { b.classList.remove('active') })
      this._activeIdx = -1
      this._floatingToolbar?.hide()
      return
    }
    this._btns.forEach(b => { b.classList.remove('active') })
    this._btns[idx].classList.add('active')
    this._activeIdx = idx
    if (overlayName !== '') {
      this._floatingToolbar?.show()
      if (this._floatingToolbar !== null) {
        this._createOverlay({ name: overlayName })
        this._floatingToolbar.bindProperties(
          {
            line: createLinePropertyGroup(),
            point: createPointPropertyGroup()
          },
          this._onPropertyChange
        )
      } else {
        this._createOverlay(overlayName)
      }
    } else {
      this._floatingToolbar?.hide()
    }
  }
}
