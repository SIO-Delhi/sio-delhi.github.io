import { describe, it, expect } from 'vitest'
import { parseCSV, generateCSVSample } from '../csv-utils'
import type { CSVFieldDef } from '../types'

const sampleFields: CSVFieldDef[] = [
  { key: 'name', label: 'Name', required: true, example: 'John' },
  { key: 'phone', label: 'Phone', required: true, example: '9876543210' },
  { key: 'email', label: 'Email', required: false, example: 'john@example.com' },
]

describe('parseCSV', () => {
  it('parses valid CSV with all columns', () => {
    const csv = 'Name,Phone,Email\nAlice,9876543210,alice@test.com\nBob,1234567890,bob@test.com'
    const result = parseCSV(csv, sampleFields)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'Alice', phone: '9876543210', email: 'alice@test.com' })
    expect(result[1]).toEqual({ name: 'Bob', phone: '1234567890', email: 'bob@test.com' })
  })

  it('handles missing optional columns', () => {
    const csv = 'Name,Phone\nAlice,9876543210'
    // Optional column Email is missing — should not throw
    expect(() => parseCSV(csv, sampleFields)).not.toThrow()
  })

  it('throws on missing required column', () => {
    const csv = 'Email\nalice@test.com'
    expect(() => parseCSV(csv, sampleFields)).toThrow(/Missing required column/)
  })

  it('throws on unexpected column', () => {
    const csv = 'Name,Phone,Email,ExtraCol\nAlice,123,a@b.com,extra'
    expect(() => parseCSV(csv, sampleFields)).toThrow(/Unexpected column/)
  })

  it('throws on missing required value in a row', () => {
    const csv = 'Name,Phone,Email\n,9876543210,alice@test.com'
    expect(() => parseCSV(csv, sampleFields)).toThrow(/Missing required value/)
  })

  it('returns empty array for single header line', () => {
    const csv = 'Name,Phone,Email'
    const result = parseCSV(csv, sampleFields)
    expect(result).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(parseCSV('', sampleFields)).toHaveLength(0)
  })

  it('trims whitespace from values', () => {
    const csv = 'Name, Phone , Email\n  Alice  , 9876543210 , alice@test.com  '
    const result = parseCSV(csv, sampleFields)
    expect(result[0].name).toBe('Alice')
    expect(result[0].phone).toBe('9876543210')
  })

  it('handles case-insensitive header matching', () => {
    const csv = 'name,PHONE,Email\nAlice,123,a@b.com'
    const result = parseCSV(csv, sampleFields)
    expect(result[0].name).toBe('Alice')
  })
})

describe('generateCSVSample', () => {
  it('generates header and example row', () => {
    const result = generateCSVSample(sampleFields)
    const lines = result.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe('Name,Phone,Email')
    expect(lines[1]).toBe('John,9876543210,john@example.com')
  })

  it('handles empty fields array', () => {
    const result = generateCSVSample([])
    expect(result).toBe('\n')
  })
})
