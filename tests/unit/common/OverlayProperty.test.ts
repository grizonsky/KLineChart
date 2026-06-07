import { describe, it, expect, vi } from 'vitest'
import {
  OverlayProperty, NumberProperty, ColorProperty, EnumProperty, BooleanProperty,
  PropertyGroup, LinePropertyGroup, PointPropertyGroup, FillPropertyGroup
} from '../../../src/component/OverlayProperty'

describe('OverlayProperty', () => {
  describe('NumberProperty', () => {
    it('validates value within range', () => {
      const p = new NumberProperty(5, { min: 0, max: 10 })
      expect(p.validate(5)).toBe(true)
      expect(p.validate(0)).toBe(true)
      expect(p.validate(10)).toBe(true)
      expect(p.validate(-1)).toBe(false)
      expect(p.validate(11)).toBe(false)
      expect(p.validate(NaN)).toBe(false)
    })

    it('stores defaultValue separately', () => {
      const p = new NumberProperty(5, { defaultValue: 3, min: 0, max: 10 })
      expect(p.value).toBe(5)
      expect(p.defaultValue).toBe(3)
      p.reset()
      expect(p.value).toBe(3)
    })

    it('rejects invalid values in setValue', () => {
      const p = new NumberProperty(5, { min: 0, max: 10 })
      expect(p.setValue(100)).toBe(false)
      expect(p.value).toBe(5)
    })

    it('notifies subscribers on change', () => {
      const p = new NumberProperty(1, { min: 0, max: 10 })
      const cb = vi.fn()
      p.subscribe(cb)
      p.setValue(5)
      expect(cb).toHaveBeenCalledWith(5)
      p.setValue(5)
      expect(cb).toHaveBeenCalledTimes(1)
    })

    it('unsubscribes correctly', () => {
      const p = new NumberProperty(1, { min: 0, max: 10 })
      const cb = vi.fn()
      const unsub = p.subscribe(cb)
      unsub()
      p.setValue(2)
      expect(cb).not.toHaveBeenCalled()
    })
  })

  describe('ColorProperty', () => {
    it('accepts hex colors', () => {
      const p = new ColorProperty('#1677FF')
      expect(p.validate('#fff')).toBe(true)
      expect(p.validate('#1677FF')).toBe(true)
      expect(p.validate('#FFFFFFFF')).toBe(true)
    })

    it('accepts rgb/rgba', () => {
      const p = new ColorProperty('red')
      expect(p.validate('rgb(255,0,0)')).toBe(true)
      expect(p.validate('rgba(255,0,0,0.5)')).toBe(true)
    })

    it('accepts named transparent and currentColor', () => {
      const p = new ColorProperty('transparent')
      expect(p.validate('transparent')).toBe(true)
      expect(p.validate('currentColor')).toBe(true)
    })

    it('rejects invalid colors', () => {
      const p = new ColorProperty('red')
      expect(p.validate('notacolor')).toBe(false)
      expect(p.validate('#xyz')).toBe(false)
    })
  })

  describe('EnumProperty', () => {
    it('accepts values in allowed set', () => {
      const p = new EnumProperty<'solid' | 'dashed'>('solid', ['solid', 'dashed'])
      expect(p.validate('solid')).toBe(true)
      expect(p.validate('dashed')).toBe(true)
    })

    it('rejects values outside allowed set', () => {
      const p = new EnumProperty<'solid' | 'dashed'>('solid', ['solid', 'dashed'])
      expect(p.validate('dotted')).toBe(false)
    })

    it('exposes allowedValues', () => {
      const p = new EnumProperty<'a' | 'b'>('a', ['a', 'b'])
      expect(p.allowedValues).toEqual(['a', 'b'])
    })
  })

  describe('BooleanProperty', () => {
    it('accepts boolean values', () => {
      const p = new BooleanProperty(true)
      expect(p.validate(true)).toBe(true)
      expect(p.validate(false)).toBe(true)
      expect(p.validate('true')).toBe(false)
    })
  })
})

describe('PropertyGroup', () => {
  it('exposes all properties', () => {
    const group = new LinePropertyGroup()
    const keys = group.keys()
    expect(keys).toContain('width')
    expect(keys).toContain('color')
    expect(keys).toContain('style')
    expect(keys).toContain('smooth')
  })

  it('notifies per-key subscribers', () => {
    const group = new LinePropertyGroup()
    const cb = vi.fn()
    group.subscribeKey('color', cb)
    group.getProperty('color').setValue('#FF0000')
    expect(cb).toHaveBeenCalledWith('#FF0000')
  })

  it('round-trips through toJSON/fromJSON', () => {
    const group = new LinePropertyGroup({ width: 3, color: '#00FF00' })
    const json = group.toJSON()
    const restored = LinePropertyGroup.fromJSON(json)
    expect(restored.getProperty('width').value).toBe(3)
    expect(restored.getProperty('color').value).toBe('#00FF00')
  })

  it('PointPropertyGroup has all 4 point props', () => {
    const group = new PointPropertyGroup()
    expect(group.keys().sort()).toEqual(['activeRadius', 'borderColor', 'color', 'radius'])
  })

  it('FillPropertyGroup has color and opacity', () => {
    const group = new FillPropertyGroup()
    expect(group.keys().sort()).toEqual(['color', 'opacity'])
    expect(group.getProperty('opacity').validate(0.5)).toBe(true)
  })
})
