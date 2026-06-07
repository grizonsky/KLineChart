import { describe, it, expect } from 'vitest'
import {
  validateOverlayDTO,
  validateDrawingStateDTO,
  migrateOverlayDTO,
  createOverlayDTO,
  DTO_CURRENT_VERSION,
  type OverlayDTO,
  type DrawingStateDTO
} from '../../../src/component/OverlayDTO'

function validMinimalDTO (): OverlayDTO {
  return {
    version: 1,
    id: 'test-id',
    name: 'test-name',
    points: [{ timestamp: 1000, value: 10 }],
    styles: null,
    visible: true,
    lock: false,
    zLevel: 0,
    mode: 'normal',
    modeSensitivity: 8,
    drawingMode: 'step',
    totalStep: 1
  }
}

function validStateDTO (): DrawingStateDTO {
  return {
    version: 1,
    overlays: [validMinimalDTO()]
  }
}

describe('validateOverlayDTO', () => {
  it('returns false for null', () => {
    expect(validateOverlayDTO(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(validateOverlayDTO(undefined)).toBe(false)
  })

  it('returns false for non-object value', () => {
    expect(validateOverlayDTO('string')).toBe(false)
    expect(validateOverlayDTO(42)).toBe(false)
    expect(validateOverlayDTO(true)).toBe(false)
  })

  it('returns false when version is missing', () => {
    const { version: _, ...rest } = validMinimalDTO()
    expect(validateOverlayDTO(rest)).toBe(false)
  })

  it('returns false when version is 0', () => {
    const dto = { ...validMinimalDTO(), version: 0 }
    expect(validateOverlayDTO(dto)).toBe(false)
  })

  it('returns false when id is empty', () => {
    const dto = { ...validMinimalDTO(), id: '' }
    expect(validateOverlayDTO(dto)).toBe(false)
  })

  it('returns false when name is empty', () => {
    const dto = { ...validMinimalDTO(), name: '' }
    expect(validateOverlayDTO(dto)).toBe(false)
  })

  it('returns false when points is not an array', () => {
    const dto = { ...validMinimalDTO(), points: 'not-array' }
    expect(validateOverlayDTO(dto)).toBe(false)
  })

  it('returns true for a valid minimal DTO', () => {
    expect(validateOverlayDTO(validMinimalDTO())).toBe(true)
  })
})

describe('validateDrawingStateDTO', () => {
  it('returns false for null', () => {
    expect(validateDrawingStateDTO(null)).toBe(false)
  })

  it('returns false when version is missing', () => {
    const { version: _, ...rest } = validStateDTO()
    expect(validateDrawingStateDTO(rest)).toBe(false)
  })

  it('returns false when overlays is not an array', () => {
    const dto = { ...validStateDTO(), overlays: 'not-array' }
    expect(validateDrawingStateDTO(dto)).toBe(false)
  })

  it('returns true for a valid state with one overlay', () => {
    expect(validateDrawingStateDTO(validStateDTO())).toBe(true)
  })
})

describe('migrateOverlayDTO', () => {
  it('same version returns a shallow copy (not same reference)', () => {
    const dto = validMinimalDTO()
    const result = migrateOverlayDTO(dto, 1, 1)
    expect(result).not.toBe(dto)
    expect(result).toEqual(dto)
  })

  it('forward migration preserves fields', () => {
    const dto = validMinimalDTO()
    const result = migrateOverlayDTO(dto, 1, 1)
    expect(result.id).toBe('test-id')
    expect(result.name).toBe('test-name')
    expect(result.points).toEqual([{ timestamp: 1000, value: 10 }])
    expect(result.visible).toBe(true)
  })

  it('backward migration throws Error with version numbers', () => {
    expect(() => migrateOverlayDTO(validMinimalDTO(), 2, 1)).toThrow(
      /version 2.*1/
    )
  })
})

describe('createOverlayDTO', () => {
  it('returns correct defaults', () => {
    const dto = createOverlayDTO()
    expect(dto.version).toBe(DTO_CURRENT_VERSION)
    expect(dto.version).toBe(1)
    expect(dto.id).toBe('')
    expect(dto.name).toBe('')
    expect(dto.points).toEqual([])
    expect(dto.styles).toBeNull()
    expect(dto.visible).toBe(true)
    expect(dto.lock).toBe(false)
    expect(dto.zLevel).toBe(0)
    expect(dto.mode).toBe('normal')
    expect(dto.modeSensitivity).toBe(8)
    expect(dto.drawingMode).toBe('step')
    expect(dto.totalStep).toBe(1)
  })
})

describe('Integration: JSON round-trip', () => {
  it('full DTO survives JSON.stringify + JSON.parse', () => {
    const dto: OverlayDTO = {
      version: 1,
      id: 'overlay-1',
      name: 'Trend Line',
      groupId: 'group-a',
      paneId: 'pane-main',
      points: [
        { timestamp: 1000, value: 10 },
        { timestamp: 2000, value: 15 }
      ],
      properties: { color: '#ff0000' },
      styles: null,
      extendData: { note: 'test' },
      visible: false,
      lock: true,
      zLevel: 5,
      mode: 'weak_magnet',
      modeSensitivity: 12,
      drawingMode: 'continuous',
      totalStep: 2
    }
    const json = JSON.stringify(dto)
    const parsed = JSON.parse(json)
    expect(validateOverlayDTO(parsed)).toBe(true)
  })
})

describe('DrawingStateDTO JSON round-trip', () => {
  it('state with 2 overlays survives round-trip', () => {
    const state: DrawingStateDTO = {
      version: 1,
      overlays: [
        {
          version: 1,
          id: 'o1',
          name: 'Line',
          points: [{ timestamp: 100, value: 50 }],
          styles: null,
          visible: true,
          lock: false,
          zLevel: 0,
          mode: 'normal',
          modeSensitivity: 8,
          drawingMode: 'step',
          totalStep: 1
        },
        {
          version: 1,
          id: 'o2',
          name: 'Ray',
          points: [{ timestamp: 200, value: 60 }],
          styles: null,
          visible: true,
          lock: false,
          zLevel: 1,
          mode: 'weak_magnet',
          modeSensitivity: 8,
          drawingMode: 'step',
          totalStep: 1
        }
      ]
    }
    const json = JSON.stringify(state)
    const parsed: DrawingStateDTO = JSON.parse(json)
    expect(validateDrawingStateDTO(parsed)).toBe(true)
    expect(parsed.overlays.length).toBe(2)
  })
})
