import { describe, it, expect } from 'vitest'
import { isNumber, isValid, isString, isBoolean, isArray, isObject, isFunction, clone, merge } from '../../../src/common/utils/typeChecks'

describe('typeChecks', () => {
  describe('isNumber', () => {
    it('returns true for finite numbers', () => {
      expect(isNumber(0)).toBe(true)
      expect(isNumber(1)).toBe(true)
      expect(isNumber(-1)).toBe(true)
      expect(isNumber(1.5)).toBe(true)
      expect(isNumber(Infinity)).toBe(false)
      expect(isNumber(NaN)).toBe(false)
    })

    it('returns false for non-numbers', () => {
      expect(isNumber(null)).toBe(false)
      expect(isNumber(undefined)).toBe(false)
      expect(isNumber('')).toBe(false)
      expect(isNumber('123')).toBe(false)
      expect(isNumber({})).toBe(false)
      expect(isNumber([])).toBe(false)
    })
  })

  describe('isValid', () => {
    it('returns true for non-null non-undefined', () => {
      expect(isValid(0)).toBe(true)
      expect(isValid('')).toBe(true)
      expect(isValid(false)).toBe(true)
      expect(isValid({})).toBe(true)
      expect(isValid([])).toBe(true)
    })

    it('returns false for null and undefined', () => {
      expect(isValid(null)).toBe(false)
      expect(isValid(undefined)).toBe(false)
    })
  })

  describe('isString', () => {
    it('returns true for strings', () => {
      expect(isString('')).toBe(true)
      expect(isString('abc')).toBe(true)
    })

    it('returns false for non-strings', () => {
      expect(isString(123)).toBe(false)
      expect(isString(null)).toBe(false)
      expect(isString(undefined)).toBe(false)
      expect(isString({})).toBe(false)
    })
  })

  describe('isBoolean', () => {
    it('returns true for booleans', () => {
      expect(isBoolean(true)).toBe(true)
      expect(isBoolean(false)).toBe(true)
    })

    it('returns false for non-booleans', () => {
      expect(isBoolean(1)).toBe(false)
      expect(isBoolean('true')).toBe(false)
    })
  })

  describe('isArray', () => {
    it('returns true for arrays', () => {
      expect(isArray([])).toBe(true)
      expect(isArray([1, 2, 3])).toBe(true)
    })

    it('returns false for non-arrays', () => {
      expect(isArray({})).toBe(false)
      expect(isArray('[]')).toBe(false)
    })
  })

  describe('isObject', () => {
    it('returns true for objects', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ a: 1 })).toBe(true)
    })

    it('returns false for null, undefined, primitives', () => {
      expect(isObject(null)).toBe(false)
      expect(isObject(undefined)).toBe(false)
      expect(isObject(42)).toBe(false)
      expect(isObject('str')).toBe(false)
    })

    it('returns true for arrays (typeof [] === "object")', () => {
      expect(isObject([])).toBe(true)
    })
  })

  describe('isFunction', () => {
    it('returns true for functions', () => {
      expect(isFunction(() => { })).toBe(true)
      expect(isFunction(function () { })).toBe(true)
    })

    it('returns false for non-functions', () => {
      expect(isFunction({})).toBe(false)
      expect(isFunction(null)).toBe(false)
    })
  })

  describe('clone', () => {
    it('clones a plain object', () => {
      const obj = { a: 1, b: { c: 2 } }
      const cloned = clone(obj)
      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect((cloned as Record<string, unknown>).b).not.toBe(obj.b)
    })

    it('clones an array', () => {
      const arr = [1, [2, 3]]
      const cloned = clone(arr)
      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
    })

    it('returns primitives as-is', () => {
      expect(clone(42)).toBe(42)
      expect(clone('hello')).toBe('hello')
      expect(clone(null)).toBe(null)
    })
  })

  describe('merge', () => {
    it('merges source into target', () => {
      const target = { a: 1, b: 2 }
      merge(target, { b: 3, c: 4 })
      expect(target).toEqual({ a: 1, b: 3, c: 4 })
    })

    it('deep merges nested objects', () => {
      const target = { a: { x: 1, y: 2 } }
      merge(target, { a: { y: 3, z: 4 } })
      expect(target).toEqual({ a: { x: 1, y: 3, z: 4 } })
    })

    it('returns early when both target and source are not objects', () => {
      expect(() => merge(null as unknown as Record<string, unknown>, null as unknown as Record<string, unknown>)).not.toThrow()
    })
  })
})
