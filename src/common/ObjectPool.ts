/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type Coordinate from '../common/Coordinate'

export type PoolFactory<T> = () => T
export type PoolResetter<T> = (obj: T) => void

const DEFAULT_MAX_SIZE = 100

export class ObjectPool<T> {
  private readonly _pool: T[] = []
  private readonly _factory: PoolFactory<T>
  private readonly _resetter: PoolResetter<T>
  private readonly _maxSize: number
  private _aliveCount = 0

  constructor (factory: PoolFactory<T>, resetter: PoolResetter<T>, maxSize?: number) {
    this._factory = factory
    this._resetter = resetter
    this._maxSize = maxSize ?? DEFAULT_MAX_SIZE
  }

  acquire (): T {
    const obj: T = this._pool.length > 0
      ? (this._pool.pop() as T)
      : this._factory()
    this._aliveCount++
    return obj
  }

  release (obj: T): void {
    if (obj === undefined || obj === null) {
      return
    }
    this._resetter(obj)
    if (this._pool.length < this._maxSize) {
      this._pool.push(obj)
    }
    if (this._aliveCount > 0) {
      this._aliveCount--
    }
  }

  releaseAll (objects: T[]): void {
    objects.forEach(obj => { this.release(obj) })
    objects.length = 0
  }

  get size (): number { return this._pool.length }

  get aliveCount (): number { return this._aliveCount }

  drain (): void {
    this._pool.length = 0
  }
}

export function createCoordinateArrayPool (maxSize?: number): ObjectPool<Coordinate[]> {
  return new ObjectPool<Coordinate[]>(
    () => [],
    (arr) => { arr.length = 0 },
    maxSize ?? 20
  )
}

export function createFigureArrayPool (maxSize?: number): ObjectPool<unknown[]> {
  return new ObjectPool<unknown[]>(
    () => [],
    (arr) => { arr.length = 0 },
    maxSize ?? 20
  )
}

export function createPath2DPool (maxSize?: number): ObjectPool<Path2D> {
  return new ObjectPool<Path2D>(
    () => new Path2D(),
    () => { /* Path2D has no reset method, will be replaced */ },
    maxSize ?? 10
  )
}
