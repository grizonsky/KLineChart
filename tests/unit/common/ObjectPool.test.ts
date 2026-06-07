import { describe, it, expect } from 'vitest'
import {
  ObjectPool, createCoordinateArrayPool, createFigureArrayPool, createPath2DPool
} from '../../../src/common/ObjectPool'
import type Coordinate from '../../../src/common/Coordinate'

const coord = (x: number, y: number): Coordinate => ({ x, y })

describe('ObjectPool', () => {
  it('creates new objects when pool is empty', () => {
    let count = 0
    const pool = new ObjectPool<number[]>(
      () => { count++; return [] },
      (arr) => { arr.length = 0 },
      5
    )
    const a = pool.acquire()
    expect(count).toBe(1)
    expect(a).toEqual([])
  })

  it('reuses released objects', () => {
    let count = 0
    const pool = new ObjectPool<number[]>(
      () => { count++; return [] },
      (arr) => { arr.length = 0 },
      5
    )
    const a = pool.acquire()
    a.push(1, 2, 3)
    pool.release(a)
    const b = pool.acquire()
    expect(b).toBe(a)
    expect(b).toEqual([])
    expect(count).toBe(1)
  })

  it('respects maxSize cap', () => {
    const pool = new ObjectPool<number[]>(
      () => [],
      (arr) => { arr.length = 0 },
      2
    )
    const items = [pool.acquire(), pool.acquire(), pool.acquire()]
    items.forEach(i => { pool.release(i) })
    expect(pool.size).toBe(2)
  })

  it('releaseAll drains and clears array', () => {
    const pool = new ObjectPool<number[]>(
      () => [1],
      (arr) => { arr.length = 0 },
      5
    )
    const arr = [pool.acquire(), pool.acquire(), pool.acquire()]
    expect(arr.length).toBe(3)
    pool.releaseAll(arr)
    expect(arr.length).toBe(0)
    expect(pool.size).toBe(3)
  })

  it('ignores null/undefined in release', () => {
    const pool = new ObjectPool<number[]>(
      () => [],
      (arr) => { arr.length = 0 },
      5
    )
    pool.release(null as unknown as number[])
    pool.release(undefined as unknown as number[])
    expect(pool.size).toBe(0)
  })

  it('tracks alive count', () => {
    const pool = new ObjectPool<number[]>(
      () => [],
      (arr) => { arr.length = 0 },
      5
    )
    const a = pool.acquire()
    const b = pool.acquire()
    expect(pool.aliveCount).toBe(2)
    pool.release(a)
    expect(pool.aliveCount).toBe(1)
    pool.release(b)
    expect(pool.aliveCount).toBe(0)
  })

  it('drain empties the pool', () => {
    const pool = createFigureArrayPool()
    const a = pool.acquire()
    const b = pool.acquire()
    pool.release(a)
    pool.release(b)
    expect(pool.size).toBe(2)
    pool.drain()
    expect(pool.size).toBe(0)
  })

  it('createCoordinateArrayPool resets to length 0', () => {
    const pool = createCoordinateArrayPool()
    const a = pool.acquire()
    a.push(coord(1, 2), coord(3, 4))
    expect(a.length).toBe(2)
    pool.release(a)
    const b = pool.acquire()
    expect(b).toBe(a)
    expect(b.length).toBe(0)
  })

  it('createPath2DPool creates real Path2D', () => {
    const pool = createPath2DPool()
    const path = pool.acquire()
    expect(path).toBeInstanceOf(Path2D)
    path.moveTo(0, 0)
    path.lineTo(10, 10)
    pool.release(path)
    const reused = pool.acquire()
    expect(reused).toBe(path)
  })
})
