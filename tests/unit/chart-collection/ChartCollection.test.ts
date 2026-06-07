import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../src/Chart', () => {
  const MockChart = vi.fn(function () {
    this.id = ''
    this.destroy = vi.fn()
    this.setStyle = vi.fn()
    this.subscribeAction = vi.fn()
    this.executeAction = vi.fn()
    this.getBarSpace = vi.fn().mockReturnValue({ bar: 10, barRange: 20 })
    this.setBarSpace = vi.fn()
  })
  return { default: MockChart }
})

import { ChartCollection } from '../../../src/chart-collection/ChartCollection'

describe('ChartCollection', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.style.width = '1000px'
    container.style.height = '800px'
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('creates charts for each pane', () => {
    const collection = new ChartCollection(container, {
      panes: [{ id: 'a' }, { id: 'b' }]
    })
    expect(collection.length).toBe(2)
    collection.destroy()
  })

  it('sets first pane as active', () => {
    const collection = new ChartCollection(container, {
      panes: [{ id: 'a' }, { id: 'b' }]
    })
    expect(collection.getActiveId()).toBe('a')
    collection.destroy()
  })

  it('getById returns correct chart', () => {
    const collection = new ChartCollection(container, {
      panes: [{ id: 'foo' }, { id: 'bar' }]
    })
    expect(collection.getById('foo')).toBeDefined()
    expect(collection.getById('bar')).toBeDefined()
    expect(collection.getById('nonexistent')).toBeUndefined()
    collection.destroy()
  })

  it('setActiveChart changes active chart', () => {
    const collection = new ChartCollection(container, {
      panes: [{ id: 'a' }, { id: 'b' }]
    })
    collection.setActiveChart('b')
    expect(collection.getActiveId()).toBe('b')
    collection.destroy()
  })

  it('getActiveChart returns undefined when no active chart', () => {
    const collection = new ChartCollection(container, {
      panes: []
    })
    expect(collection.getActiveChart()).toBeUndefined()
    collection.destroy()
  })

  it('destroy cleans up all charts', () => {
    const collection = new ChartCollection(container, {
      panes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    })
    collection.destroy()
    expect(collection.length).toBe(0)
  })

  it('setCrosshairSync enables and disables sync', () => {
    const collection = new ChartCollection(container, {
      panes: [{ id: 'a' }, { id: 'b' }]
    })
    expect(() => collection.setCrosshairSync(false)).not.toThrow()
    expect(() => collection.setCrosshairSync(true)).not.toThrow()
    collection.destroy()
  })

  it('setLayoutPreset changes layout', () => {
    const collection = new ChartCollection(container, {
      panes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    })
    expect(() => collection.setLayoutPreset('2x2')).not.toThrow()
    collection.destroy()
  })
})
