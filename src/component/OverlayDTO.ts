import type Nullable from '../common/Nullable'
import type DeepPartial from '../common/DeepPartial'
import type Point from '../common/Point'
import type { OverlayStyle } from '../common/Styles'
import type { OverlayMode, OverlayDrawingMode } from './Overlay'
import { isNumber, isString, isValid, isArray } from '../common/utils/typeChecks'

export const DTO_CURRENT_VERSION = 1

export interface OverlayDTO {
  version: number
  id: string
  name: string
  groupId?: string
  paneId?: string
  points: Array<Partial<Point>>
  properties?: Record<string, unknown>
  styles: Nullable<DeepPartial<OverlayStyle>>
  extendData?: unknown
  visible: boolean
  lock: boolean
  zLevel: number
  mode: OverlayMode
  modeSensitivity: number
  drawingMode: OverlayDrawingMode
  totalStep: number
}

export interface OverlayGroupDTO {
  id: string
  syncProperties: boolean
}

export interface DrawingStateDTO {
  version: number
  overlays: OverlayDTO[]
  groups?: OverlayGroupDTO[]
}

export function migrateOverlayDTO (
  dto: OverlayDTO,
  fromVersion: number,
  toVersion: number
): OverlayDTO {
  if (fromVersion > toVersion) {
    throw new Error(
      `Cannot migrate DTO from version ${fromVersion} to ${toVersion}: target version is older`
    )
  }
  if (fromVersion === toVersion) {
    return { ...dto }
  }
  let result = { ...dto }
  for (let v = fromVersion; v < toVersion; v++) {
    result = _migrateStep(result, v)
  }
  result.version = toVersion
  return result
}

function _migrateStep (dto: OverlayDTO, fromVersion: number): OverlayDTO {
  switch (fromVersion) {
    case 1:
      return { ...dto }
    default:
      return { ...dto }
  }
}

export function validateOverlayDTO (value: unknown): value is OverlayDTO {
  if (!isValid(value) || typeof value !== 'object') { return false }
  const dto = value as Record<string, unknown>
  if (!isNumber(dto.version) || dto.version < 1) { return false }
  if (!isString(dto.id) || dto.id.length === 0) { return false }
  if (!isString(dto.name) || dto.name.length === 0) { return false }
  if (!isArray(dto.points)) { return false }
  return true
}

export function validateDrawingStateDTO (value: unknown): value is DrawingStateDTO {
  if (!isValid(value) || typeof value !== 'object') { return false }
  const dto = value as Record<string, unknown>
  if (!isNumber(dto.version) || dto.version < 1) { return false }
  if (!isArray(dto.overlays)) { return false }
  return true
}

export function createOverlayDTO (): OverlayDTO {
  return {
    version: DTO_CURRENT_VERSION,
    id: '',
    name: '',
    points: [],
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
