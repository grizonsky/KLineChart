/**
 * Vitest setup: polyfill browser-only APIs that klinecharts uses.
 * happy-dom does not implement Path2D, but klinecharts code paths reference it.
 */

class Path2DShim {
  private readonly _commands: Array<{ op: string, args: number[] }> = []

  moveTo (x: number, y: number): void { this._commands.push({ op: 'moveTo', args: [x, y] }) }

  lineTo (x: number, y: number): void { this._commands.push({ op: 'lineTo', args: [x, y] }) }

  bezierCurveTo (cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    this._commands.push({ op: 'bezierCurveTo', args: [cp1x, cp1y, cp2x, cp2y, x, y] })
  }

  quadraticCurveTo (cpx: number, cpy: number, x: number, y: number): void {
    this._commands.push({ op: 'quadraticCurveTo', args: [cpx, cpy, x, y] })
  }

  arc (x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
    this._commands.push({ op: 'arc', args: [x, y, radius, startAngle, endAngle, anticlockwise ? 1 : 0] })
  }

  closePath (): void { this._commands.push({ op: 'closePath', args: [] }) }

  get commands (): Array<{ op: string, args: number[] }> { return this._commands }
}

if (typeof globalThis.Path2D === 'undefined') {
  ;(globalThis as unknown as { Path2D: typeof Path2DShim }).Path2D = Path2DShim as unknown as typeof globalThis.Path2D
}
