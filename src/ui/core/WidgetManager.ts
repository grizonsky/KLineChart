import type Nullable from '../../common/Nullable'
import type { Widget } from '../types'
import type { LayoutShell } from './LayoutShell'

export type WidgetToggleCallback = (id: string) => void

export class WidgetManager {
  private readonly widgets: Map<string, Widget> = new Map<string, Widget>()
  private readonly elements: Map<string, HTMLElement> = new Map<string, HTMLElement>()
  private readonly shell: LayoutShell
  private readonly onToggle: Nullable<WidgetToggleCallback>

  constructor (shell: LayoutShell, onToggle?: WidgetToggleCallback) {
    this.shell = shell
    this.onToggle = onToggle ?? null
  }

  register (widget: Widget): void {
    if (this.widgets.has(widget.id)) return
    this.widgets.set(widget.id, widget)
    const slot = this.shell.getSlot(widget.slot)
    const el = document.createElement('div')
    el.dataset.widgetId = widget.id
    slot.appendChild(el)
    this.elements.set(widget.id, el)
    widget.mount(el)
  }

  unregister (id: string): void {
    const widget = this.widgets.get(id)
    if (widget === undefined) return
    widget.unmount()
    const el = this.elements.get(id)
    if (el !== undefined) {
      el.parentElement?.removeChild(el)
      this.elements.delete(id)
    }
    this.widgets.delete(id)
  }

  getWidget (id: string): Widget | undefined {
    return this.widgets.get(id)
  }

  togglePanel (id: string): void {
    const el = this.elements.get(id)
    if (el === undefined) return
    el.style.display = el.style.display === 'none' ? '' : 'none'
    if (this.onToggle !== null) {
      this.onToggle(id)
    }
  }

  dispose (): void {
    this.widgets.forEach((w, id) => {
      w.unmount()
      const el = this.elements.get(id)
      if (el !== undefined) el.parentElement?.removeChild(el)
    })
    this.widgets.clear()
    this.elements.clear()
  }
}
