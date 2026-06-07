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

import { isString, isNumber, isBoolean } from '../common/utils/typeChecks'

export type PropertySubscriber<T> = (value: T) => void

export type PropertyUnsubscribe = () => void

export abstract class OverlayProperty<T> {
  private _value: T
  private readonly _defaultValue: T
  private readonly _subscribers: Array<PropertySubscriber<T>> = []

  protected constructor (value: T, defaultValue: T) {
    this._value = value
    this._defaultValue = defaultValue
  }

  get value (): T { return this._value }

  set value (v: T) { this.setValue(v) }

  get defaultValue (): T { return this._defaultValue }

  abstract validate (value: T): boolean

  toJSON (): T { return this._value }

  subscribe (callback: PropertySubscriber<T>): PropertyUnsubscribe {
    this._subscribers.push(callback)
    return () => {
      const idx = this._subscribers.indexOf(callback)
      if (idx >= 0) {
        this._subscribers.splice(idx, 1)
      }
    }
  }

  setValue (value: T): boolean {
    if (!this.validate(value)) {
      return false
    }
    if (!this._equals(this._value, value)) {
      this._value = value
      this._subscribers.forEach(cb => { cb(value) })
      return true
    }
    return false
  }

  reset (): boolean { return this.setValue(this._defaultValue) }

  protected _equals (a: T, b: T): boolean { return a === b }
}

export class NumberProperty extends OverlayProperty<number> {
  min: number
  max: number
  step: number

  constructor (value: number, options?: { min?: number, max?: number, step?: number, defaultValue?: number }) {
    super(value, options?.defaultValue ?? value)
    this.min = options?.min ?? Number.NEGATIVE_INFINITY
    this.max = options?.max ?? Number.POSITIVE_INFINITY
    this.step = options?.step ?? 1
  }

  validate (value: number): boolean {
    return isNumber(value) && !isNaN(value) && value >= this.min && value <= this.max
  }

  static fromJSON (json: number): NumberProperty {
    return new NumberProperty(json)
  }
}

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{4})$/
const RGB_COLOR_REGEX = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/
const RGBA_COLOR_REGEX = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/
const NAMED_COLOR_TRANSPARENT = 'transparent'
const NAMED_COLOR_CURRENT = 'currentColor'

export class ColorProperty extends OverlayProperty<string> {
  constructor (value: string, defaultValue?: string) {
    super(value, defaultValue ?? value)
  }

  validate (value: string): boolean {
    if (!isString(value)) { return false }
    const trimmed = value.trim()
    if (trimmed === NAMED_COLOR_TRANSPARENT || trimmed === NAMED_COLOR_CURRENT) {
      return true
    }
    return HEX_COLOR_REGEX.test(trimmed) || RGB_COLOR_REGEX.test(trimmed) || RGBA_COLOR_REGEX.test(trimmed)
  }

  static fromJSON (json: string): ColorProperty {
    return new ColorProperty(json)
  }
}

export class EnumProperty<T extends string> extends OverlayProperty<T> {
  private readonly _allowedValues: readonly T[]

  constructor (value: T, allowedValues: readonly T[], defaultValue?: T) {
    super(value, defaultValue ?? value)
    this._allowedValues = allowedValues
  }

  get allowedValues (): readonly T[] { return this._allowedValues }

  validate (value: T): boolean {
    return isString(value) && this._allowedValues.includes(value)
  }

  static fromJSON<V extends string> (json: V, allowedValues: readonly V[]): EnumProperty<V> {
    return new EnumProperty<V>(json, allowedValues)
  }
}

export class BooleanProperty extends OverlayProperty<boolean> {
  constructor (value: boolean) {
    super(value, value)
  }

  validate (value: boolean): boolean { return isBoolean(value) }

  static fromJSON (json: boolean): BooleanProperty {
    return new BooleanProperty(json)
  }
}

export type AnyOverlayProperty = OverlayProperty<unknown>

export class PropertyGroup<T extends Record<string, AnyOverlayProperty>> {
  private readonly _properties: T
  private readonly _keySubscribers: Map<string, Array<PropertySubscriber<unknown>>> = new Map<string, Array<PropertySubscriber<unknown>>>()

  constructor (properties: T) {
    this._properties = properties
    Object.keys(properties).forEach(key => {
      const prop = (properties as Record<string, AnyOverlayProperty>)[key]
      prop.subscribe((value: unknown) => {
        const subs = this._keySubscribers.get(key)
        if (subs !== undefined) {
          subs.forEach(cb => { cb(value) })
        }
      })
    })
  }

  get properties (): T { return this._properties }

  getProperty (key: string): AnyOverlayProperty {
    return (this._properties as Record<string, AnyOverlayProperty>)[key]
  }

  subscribeKey (key: string, callback: PropertySubscriber<unknown>): PropertyUnsubscribe {
    let subs = this._keySubscribers.get(key)
    if (subs === undefined) {
      subs = []
      this._keySubscribers.set(key, subs)
    }
    subs.push(callback)
    return () => {
      const arr = this._keySubscribers.get(key)
      if (arr !== undefined) {
        const idx = arr.indexOf(callback)
        if (idx >= 0) {
          arr.splice(idx, 1)
        }
      }
    }
  }

  toJSON (): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    Object.keys(this._properties).forEach(key => {
      const prop = (this._properties as Record<string, AnyOverlayProperty>)[key]
      result[key] = prop.toJSON()
    })
    return result
  }

  fromJSON (json: Record<string, unknown>): void {
    Object.keys(json).forEach(key => {
      const prop = (this._properties as Record<string, AnyOverlayProperty>)[key]
      const value = json[key]
      if (value !== undefined) {
        prop.setValue(value)
      }
    })
  }

  keys (): Array<keyof T> {
    return Object.keys(this._properties) as Array<keyof T>
  }

  entries (): Array<[keyof T, AnyOverlayProperty]> {
    const keys = Object.keys(this._properties) as Array<keyof T>
    return keys.map(key => [key, (this._properties as Record<string, AnyOverlayProperty>)[key as string]])
  }
}

export type LineStyleValue = 'solid' | 'dashed'

export type LinePropertiesShape = Record<'width' | 'color' | 'style' | 'smooth', AnyOverlayProperty>

export class LinePropertyGroup extends PropertyGroup<LinePropertiesShape> {
  constructor (config?: { width?: number, color?: string, style?: LineStyleValue, smooth?: boolean }) {
    super({
      width: new NumberProperty(config?.width ?? 1, { min: 0.5, max: 10, step: 0.5 }),
      color: new ColorProperty(config?.color ?? '#1677FF'),
      style: new EnumProperty<LineStyleValue>(config?.style ?? 'solid', ['solid', 'dashed']),
      smooth: new BooleanProperty(config?.smooth ?? false)
    })
  }

  static fromJSON (json: Record<string, unknown>): LinePropertyGroup {
    const group = new LinePropertyGroup()
    group.fromJSON(json)
    return group
  }
}

export type PointPropertiesShape = Record<'radius' | 'color' | 'borderColor' | 'activeRadius', AnyOverlayProperty>

export class PointPropertyGroup extends PropertyGroup<PointPropertiesShape> {
  constructor (config?: { radius?: number, color?: string, borderColor?: string, activeRadius?: number }) {
    super({
      radius: new NumberProperty(config?.radius ?? 5, { min: 1, max: 20, step: 1 }),
      color: new ColorProperty(config?.color ?? '#1677FF'),
      borderColor: new ColorProperty(config?.borderColor ?? '#1677FF'),
      activeRadius: new NumberProperty(config?.activeRadius ?? 7, { min: 1, max: 30, step: 1 })
    })
  }

  static fromJSON (json: Record<string, unknown>): PointPropertyGroup {
    const group = new PointPropertyGroup()
    group.fromJSON(json)
    return group
  }
}

export type FillPropertiesShape = Record<'color' | 'opacity', AnyOverlayProperty>

export class FillPropertyGroup extends PropertyGroup<FillPropertiesShape> {
  constructor (config?: { color?: string, opacity?: number }) {
    super({
      color: new ColorProperty(config?.color ?? '#1677FF'),
      opacity: new NumberProperty(config?.opacity ?? 0.25, { min: 0, max: 1, step: 0.01 })
    })
  }

  static fromJSON (json: Record<string, unknown>): FillPropertyGroup {
    const group = new FillPropertyGroup()
    group.fromJSON(json)
    return group
  }
}

export function createLinePropertyGroup (): LinePropertyGroup {
  return new LinePropertyGroup()
}

export function createPointPropertyGroup (): PointPropertyGroup {
  return new PointPropertyGroup()
}

export function createFillPropertyGroup (): FillPropertyGroup {
  return new FillPropertyGroup()
}
