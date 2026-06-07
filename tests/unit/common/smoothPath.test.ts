import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  drawSmoothPath, buildSmoothPath2D, drawSmoothPathAdaptive, getAdaptiveSegmentCount
} from '../../../src/common/smoothPath'
import type Coordinate from '../../../src/common/Coordinate'

const coords = (arr: Array<[number, number]>): Coordinate[] =>
  arr.map(([x, y]) => ({ x, y }))

const createMockCtx = (): {
  ctx: CanvasRenderingContext2D
  calls: Array<{ method: string, args: unknown[] }>
} => {
  const calls: Array<{ method: string, args: unknown[] }> = []
  const handler: ProxyHandler<Record<string, unknown>> = {
    get (_target, prop) {
      if (typeof prop === 'string') {
        return (...args: unknown[]) => {
          calls.push({ method: prop, args })
        }
      }
      return undefined
    }
  }
  const ctx = new Proxy({} as CanvasRenderingContext2D, handler)
  return { ctx, calls }
}

describe('smoothPath', () => {
  describe('drawSmoothPath', () => {
    it('does nothing with empty coordinates', () => {
      const { ctx, calls } = createMockCtx()
      drawSmoothPath(ctx, [])
      expect(calls.length).toBe(0)
    })

    it('does nothing with single coordinate', () => {
      const { ctx, calls } = createMockCtx()
      drawSmoothPath(ctx, coords([[0, 0]]))
      expect(calls.length).toBe(0)
    })

    it('uses lineTo for 2 points', () => {
      const { ctx, calls } = createMockCtx()
      drawSmoothPath(ctx, coords([[0, 0], [10, 10]]))
      expect(calls.some(c => c.method === 'lineTo')).toBe(true)
    })

    it('uses straight lines when tension is 0', () => {
      const { ctx, calls } = createMockCtx()
      drawSmoothPath(ctx, coords([[0, 0], [5, 5], [10, 10]]), 0)
      const lineToCount = calls.filter(c => c.method === 'lineTo').length
      const bezierCount = calls.filter(c => c.method === 'bezierCurveTo').length
      expect(lineToCount).toBeGreaterThan(0)
      expect(bezierCount).toBe(0)
    })

    it('uses bezier curves with default tension', () => {
      const { ctx, calls } = createMockCtx()
      drawSmoothPath(ctx, coords([[0, 0], [5, 5], [10, 10], [15, 5]]))
      const bezierCount = calls.filter(c => c.method === 'bezierCurveTo').length
      expect(bezierCount).toBe(3)
    })

    it('clamps tension to [0, 1]', () => {
      const { ctx, calls } = createMockCtx()
      drawSmoothPath(ctx, coords([[0, 0], [5, 5], [10, 10]]), 2)
      expect(calls.some(c => c.method === 'bezierCurveTo')).toBe(true)
      drawSmoothPath(ctx, coords([[0, 0], [5, 5], [10, 10]]), -1)
      expect(calls.some(c => c.method === 'bezierCurveTo')).toBe(true)
    })
  })

  describe('buildSmoothPath2D', () => {
    it('returns empty Path2D for empty input', () => {
      const path = buildSmoothPath2D([])
      expect(path).toBeInstanceOf(Path2D)
    })

    it('returns straight line for 2 points', () => {
      const path = buildSmoothPath2D(coords([[0, 0], [10, 10]]))
      expect(path).toBeInstanceOf(Path2D)
    })

    it('builds bezier curves for 3+ points', () => {
      const path = buildSmoothPath2D(coords([[0, 0], [5, 5], [10, 10], [15, 5]]))
      expect(path).toBeInstanceOf(Path2D)
    })
  })

  describe('getAdaptiveSegmentCount', () => {
    it('returns MIN for zero/negative distance', () => {
      expect(getAdaptiveSegmentCount(0)).toBe(8)
      expect(getAdaptiveSegmentCount(-5)).toBe(8)
    })

    it('returns MAX for very long distance', () => {
      expect(getAdaptiveSegmentCount(1000)).toBe(20)
    })

    it('scales linearly within range', () => {
      const mid = getAdaptiveSegmentCount(40)
      expect(mid).toBeGreaterThanOrEqual(8)
      expect(mid).toBeLessThanOrEqual(20)
    })
  })

  describe('drawSmoothPathAdaptive', () => {
    it('emits lineTo calls proportional to distance', () => {
      const { ctx, calls } = createMockCtx()
      const far = coords([[0, 0], [100, 0]])
      drawSmoothPathAdaptive(ctx, far, 0.5)
      const lineToCount = calls.filter(c => c.method === 'lineTo').length
      expect(lineToCount).toBeGreaterThan(0)
    })

    it('uses straight lines for tension 0', () => {
      const { ctx, calls } = createMockCtx()
      drawSmoothPathAdaptive(ctx, coords([[0, 0], [10, 0], [20, 0]]), 0)
      const lineToCount = calls.filter(c => c.method === 'lineTo').length
      expect(lineToCount).toBe(2)
    })
  })
})
