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
import { isNumber } from '../common/utils/typeChecks'

const DEFAULT_TENSION = 0.5
const MIN_SEGMENTS_PER_BEZIER = 8
const MAX_SEGMENTS_PER_BEZIER = 20

export function drawSmoothPath (
  ctx: CanvasRenderingContext2D,
  coordinates: Coordinate[],
  tension?: number
): void {
  const t = isNumber(tension) ? Math.max(0, Math.min(1, tension)) : DEFAULT_TENSION
  const length = coordinates.length
  if (length < 2) {
    return
  }
  if (length === 2) {
    ctx.lineTo(coordinates[1].x, coordinates[1].y)
    return
  }
  ctx.moveTo(coordinates[0].x, coordinates[0].y)
  if (t === 0) {
    for (let i = 1; i < length; i++) {
      ctx.lineTo(coordinates[i].x, coordinates[i].y)
    }
    return
  }
  for (let i = 0; i < length - 1; i++) {
    const p0 = i === 0 ? coordinates[0] : coordinates[i - 1]
    const p1 = coordinates[i]
    const p2 = coordinates[i + 1]
    const p3 = i + 2 < length ? coordinates[i + 2] : p2
    const cp1x = p1.x + (p2.x - p0.x) * (t / 3)
    const cp1y = p1.y + (p2.y - p0.y) * (t / 3)
    const cp2x = p2.x - (p3.x - p1.x) * (t / 3)
    const cp2y = p2.y - (p3.y - p1.y) * (t / 3)
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
  }
}

export function buildSmoothPath2D (coordinates: Coordinate[], tension?: number): Path2D {
  const path = new Path2D()
  const t = isNumber(tension) ? Math.max(0, Math.min(1, tension)) : DEFAULT_TENSION
  const length = coordinates.length
  if (length < 2) {
    return path
  }
  if (length === 2) {
    path.moveTo(coordinates[0].x, coordinates[0].y)
    path.lineTo(coordinates[1].x, coordinates[1].y)
    return path
  }
  path.moveTo(coordinates[0].x, coordinates[0].y)
  if (t === 0) {
    for (let i = 1; i < length; i++) {
      path.lineTo(coordinates[i].x, coordinates[i].y)
    }
    return path
  }
  for (let i = 0; i < length - 1; i++) {
    const p0 = i === 0 ? coordinates[0] : coordinates[i - 1]
    const p1 = coordinates[i]
    const p2 = coordinates[i + 1]
    const p3 = i + 2 < length ? coordinates[i + 2] : p2
    const cp1x = p1.x + (p2.x - p0.x) * (t / 3)
    const cp1y = p1.y + (p2.y - p0.y) * (t / 3)
    const cp2x = p2.x - (p3.x - p1.x) * (t / 3)
    const cp2y = p2.y - (p3.y - p1.y) * (t / 3)
    path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
  }
  return path
}

export function getAdaptiveSegmentCount (distance: number): number {
  if (distance <= 0) { return MIN_SEGMENTS_PER_BEZIER }
  const segments = Math.round(distance / 4)
  if (segments < MIN_SEGMENTS_PER_BEZIER) { return MIN_SEGMENTS_PER_BEZIER }
  if (segments > MAX_SEGMENTS_PER_BEZIER) { return MAX_SEGMENTS_PER_BEZIER }
  return segments
}

export function drawSmoothPathAdaptive (
  ctx: CanvasRenderingContext2D,
  coordinates: Coordinate[],
  tension?: number
): void {
  const t = isNumber(tension) ? Math.max(0, Math.min(1, tension)) : DEFAULT_TENSION
  const length = coordinates.length
  if (length < 2) {
    return
  }
  if (length === 2 || t === 0) {
    ctx.moveTo(coordinates[0].x, coordinates[0].y)
    for (let i = 1; i < length; i++) {
      ctx.lineTo(coordinates[i].x, coordinates[i].y)
    }
    return
  }
  ctx.moveTo(coordinates[0].x, coordinates[0].y)
  for (let i = 0; i < length - 1; i++) {
    const p0 = i === 0 ? coordinates[0] : coordinates[i - 1]
    const p1 = coordinates[i]
    const p2 = coordinates[i + 1]
    const p3 = i + 2 < length ? coordinates[i + 2] : p2
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const segCount = getAdaptiveSegmentCount(Math.sqrt(dx * dx + dy * dy))
    const cp1x = p1.x + (p2.x - p0.x) * (t / 3)
    const cp1y = p1.y + (p2.y - p0.y) * (t / 3)
    const cp2x = p2.x - (p3.x - p1.x) * (t / 3)
    const cp2y = p2.y - (p3.y - p1.y) * (t / 3)
    for (let j = 1; j <= segCount; j++) {
      const u = j / segCount
      const u1 = 1 - u
      const b0 = u1 * u1 * u1
      const b1 = 3 * u * u1 * u1
      const b2 = 3 * u * u * u1
      const b3 = u * u * u
      const x = b0 * p1.x + b1 * cp1x + b2 * cp2x + b3 * p2.x
      const y = b0 * p1.y + b1 * cp1y + b2 * cp2y + b3 * p2.y
      ctx.lineTo(x, y)
    }
  }
}
