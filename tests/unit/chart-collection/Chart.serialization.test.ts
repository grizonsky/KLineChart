import { describe, it, expect, vi } from 'vitest'
import { DTO_CURRENT_VERSION, validateDrawingStateDTO } from '../../../src/component/OverlayDTO'
import type { OverlayDTO } from '../../../src/component/OverlayDTO'

function createMockChart () {
  return {
    _chartStore: {
      getOverlaysByFilter: vi.fn()
    },
    createOverlay: vi.fn(),
    exportOverlays (this: any, filter?: any): string {
      const overlays = this._chartStore.getOverlaysByFilter(filter ?? {})
      const overlayDTOs = overlays.map((o: any) => o.toDTO())
      const state = {
        version: DTO_CURRENT_VERSION,
        overlays: overlayDTOs
      }
      return JSON.stringify(state)
    },
    importOverlays (this: any, json: string): boolean {
      try {
        const parsed: unknown = JSON.parse(json)
        if (!validateDrawingStateDTO(parsed)) return false
        const state = parsed as any
        const creates: any[] = []
        state.overlays.forEach((dto: any) => {
          creates.push({
            name: dto.name,
            id: dto.id,
            groupId: dto.groupId,
            paneId: dto.paneId,
            points: dto.points,
            styles: dto.styles,
            visible: dto.visible,
            lock: dto.lock,
            zLevel: dto.zLevel,
            mode: dto.mode,
            modeSensitivity: dto.modeSensitivity
          })
        })
        if (creates.length > 0) this.createOverlay(creates)
        return true
      } catch {
        return false
      }
    },
    exportDrawingState (this: any): string {
      return this.exportOverlays()
    },
    importDrawingState (this: any, json: string): boolean {
      return this.importOverlays(json)
    }
  }
}

describe('Chart serialization', () => {
  it('exportOverlays returns valid JSON with version and overlays', () => {
    const chart = createMockChart()
    const mockOverlay1 = {
      toDTO: (): OverlayDTO => ({
        version: DTO_CURRENT_VERSION,
        id: 'ov1',
        name: 'trend_line',
        points: [{ timestamp: 1000, value: 100 }],
        styles: null,
        visible: true,
        lock: false,
        zLevel: 0,
        mode: 'normal',
        modeSensitivity: 8,
        drawingMode: 'step',
        totalStep: 2
      })
    }
    const mockOverlay2 = {
      toDTO: (): OverlayDTO => ({
        version: DTO_CURRENT_VERSION,
        id: 'ov2',
        name: 'fib_retrace',
        points: [{ timestamp: 2000, value: 50 }],
        styles: null,
        visible: false,
        lock: true,
        zLevel: 1,
        mode: 'normal',
        modeSensitivity: 8,
        drawingMode: 'step',
        totalStep: 1
      })
    }
    chart._chartStore.getOverlaysByFilter.mockReturnValue([mockOverlay1, mockOverlay2])

    const result = chart.exportOverlays()
    const parsed = JSON.parse(result)

    expect(parsed).toHaveProperty('version', DTO_CURRENT_VERSION)
    expect(parsed).toHaveProperty('overlays')
    expect(parsed.overlays).toHaveLength(2)
    expect(parsed.overlays[0].id).toBe('ov1')
    expect(parsed.overlays[1].id).toBe('ov2')
    expect(parsed.overlays[1].visible).toBe(false)
    expect(parsed.overlays[1].lock).toBe(true)
  })

  it('importOverlays with valid JSON returns true and calls createOverlay', () => {
    const chart = createMockChart()
    const validJson = JSON.stringify({
      version: DTO_CURRENT_VERSION,
      overlays: [{
        version: DTO_CURRENT_VERSION,
        id: 'ov1',
        name: 'trend_line',
        points: [{ timestamp: 1000, value: 100 }],
        styles: null,
        visible: true,
        lock: false,
        zLevel: 0,
        mode: 'normal',
        modeSensitivity: 8,
        drawingMode: 'step',
        totalStep: 2
      }]
    })

    const result = chart.importOverlays(validJson)

    expect(result).toBe(true)
    expect(chart.createOverlay).toHaveBeenCalledTimes(1)
    const created = chart.createOverlay.mock.calls[0][0]
    expect(created).toHaveLength(1)
    expect(created[0].name).toBe('trend_line')
    expect(created[0].id).toBe('ov1')
  })

  it('importOverlays with invalid JSON returns false', () => {
    const chart = createMockChart()

    const result = chart.importOverlays('not json at all')

    expect(result).toBe(false)
    expect(chart.createOverlay).not.toHaveBeenCalled()
  })

  it('importOverlays with missing version returns false', () => {
    const chart = createMockChart()
    const noVersionJson = JSON.stringify({
      overlays: [{
        id: 'ov1',
        name: 'trend_line',
        points: []
      }]
    })

    const result = chart.importOverlays(noVersionJson)

    expect(result).toBe(false)
    expect(chart.createOverlay).not.toHaveBeenCalled()
  })

  it('importDrawingState delegates to importOverlays and returns true', () => {
    const chart = createMockChart()
    const importSpy = vi.spyOn(chart, 'importOverlays')
    const validJson = JSON.stringify({
      version: DTO_CURRENT_VERSION,
      overlays: []
    })

    const result = chart.importDrawingState(validJson)

    expect(result).toBe(true)
    expect(importSpy).toHaveBeenCalledWith(validJson)
  })

  it('exportDrawingState delegates to exportOverlays', () => {
    const chart = createMockChart()
    chart._chartStore.getOverlaysByFilter.mockReturnValue([])
    const exportSpy = vi.spyOn(chart, 'exportOverlays')

    chart.exportDrawingState()

    expect(exportSpy).toHaveBeenCalledTimes(1)
  })
})
