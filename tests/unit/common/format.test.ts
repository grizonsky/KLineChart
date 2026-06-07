import { describe, it, expect } from 'vitest'
import {
  formatValue, formatPrecision, formatBigNumber,
  formatThousands, formatFoldDecimal, formatTemplateString
} from '../../../src/common/utils/format'

describe('format', () => {
  describe('formatValue', () => {
    it('returns defaultValue for null/undefined data', () => {
      expect(formatValue(null, 'a', '-')).toBe('-')
      expect(formatValue(undefined, 'a', '-')).toBe('-')
    })

    it('returns defaultValue for missing key', () => {
      expect(formatValue({ a: 1 }, 'b', 'N/A')).toBe('N/A')
    })

    it('returns value by key path', () => {
      expect(formatValue({ a: { b: 42 } }, 'a.b')).toBe(42)
    })

    it('returns -- as default defaultValue', () => {
      expect(formatValue(null, 'a')).toBe('--')
    })
  })

  describe('formatPrecision', () => {
    it('formats number with given precision', () => {
      expect(formatPrecision(1.23456, 2)).toBe('1.23')
      expect(formatPrecision(1.235, 2)).toBe('1.24')
    })

    it('defaults precision to 2', () => {
      expect(formatPrecision(1.2)).toBe('1.20')
    })

    it('handles string input', () => {
      expect(formatPrecision('1.234', 2)).toBe('1.23')
    })

    it('returns original value for invalid input', () => {
      expect(formatPrecision('abc', 2)).toBe('abc')
      expect(formatPrecision(NaN, 2)).toBe('NaN')
    })
  })

  describe('formatBigNumber', () => {
    it('formats billions', () => {
      expect(formatBigNumber(1500000000)).toBe('1.5B')
      expect(formatBigNumber(100000000000)).toBe('100B')
    })

    it('formats millions', () => {
      expect(formatBigNumber(2500000)).toBe('2.5M')
    })

    it('uses > not >= — exact boundaries fall through', () => {
      expect(formatBigNumber(1000)).toBe('1000')
      expect(formatBigNumber(1000000)).toBe('1000K')
      expect(formatBigNumber(1000000000)).toBe('1000M')
    })

    it('returns value directly for small numbers', () => {
      expect(formatBigNumber(999)).toBe('999')
      expect(formatBigNumber(0)).toBe('0')
      expect(formatBigNumber(-100)).toBe('-100')
    })

    it('handles string input', () => {
      expect(formatBigNumber('2500000')).toBe('2.5M')
    })

    it('returns original for invalid values', () => {
      expect(formatBigNumber(NaN)).toBe('NaN')
    })
  })

  describe('formatThousands', () => {
    it('formats with separator', () => {
      expect(formatThousands(1234567, ',')).toBe('1,234,567')
      expect(formatThousands(1234, ' ')).toBe('1 234')
    })

    it('handles decimal values', () => {
      expect(formatThousands(1234.56, ',')).toBe('1,234.56')
    })

    it('returns value as-is when sign is empty', () => {
      expect(formatThousands(1234, '')).toBe('1234')
    })
  })

  describe('formatFoldDecimal', () => {
    it('folds long zero sequences after decimal', () => {
      const result = formatFoldDecimal('0.0000123', 3)
      expect(result).not.toBe('0.0000123')
      expect(result).toContain('{')
    })

    it('returns value unchanged for short decimals', () => {
      expect(formatFoldDecimal('0.123', 3)).toBe('0.123')
    })
  })

  describe('formatTemplateString', () => {
    it('replaces template placeholders', () => {
      const result = formatTemplateString('Hello {name}', { name: 'Alex' })
      expect(result).toBe('Hello Alex')
    })

    it('keeps missing keys as-is', () => {
      const result = formatTemplateString('Hello {name}', {})
      expect(result).toBe('Hello {name}')
    })
  })
})
