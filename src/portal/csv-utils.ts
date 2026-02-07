import type { CSVFieldDef } from './types'

/** Parse a CSV string into an array of objects keyed by field definitions. */
export function parseCSV(text: string, fields: CSVFieldDef[]): Record<string, string>[] {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const fieldLabels = fields.map(f => f.label.toLowerCase())

  // Validate headers match expected fields
  const headerMap: number[] = []
  for (const field of fields) {
    const idx = headers.findIndex(h => h.toLowerCase() === field.label.toLowerCase())
    if (idx === -1 && field.required) {
      throw new Error(`Missing required column: "${field.label}". Expected columns: ${fields.map(f => f.label).join(', ')}`)
    }
    headerMap.push(idx)
  }

  // Check for unexpected columns
  for (const header of headers) {
    if (!fieldLabels.includes(header.toLowerCase())) {
      throw new Error(`Unexpected column: "${header}". Expected: ${fields.map(f => f.label).join(', ')}`)
    }
  }

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    for (let j = 0; j < fields.length; j++) {
      const colIdx = headerMap[j]
      const value = colIdx >= 0 ? (values[colIdx] ?? '') : ''
      if (fields[j].required && !value) {
        throw new Error(`Row ${i}: Missing required value for "${fields[j].label}"`)
      }
      row[fields[j].key] = value
    }
    rows.push(row)
  }
  return rows
}

/** Generate a CSV sample string from field definitions. */
export function generateCSVSample(fields: CSVFieldDef[]): string {
  const header = fields.map(f => f.label).join(',')
  const sample = fields.map(f => f.example).join(',')
  return `${header}\n${sample}`
}

/** Export data array to CSV and trigger download. */
export function exportToCSV(data: Record<string, unknown>[], columns: { key: string; label: string }[], filename: string): void {
  const header = columns.map(c => c.label).join(',')
  const rows = data.map(row =>
    columns.map(c => {
      const val = String(row[c.key] ?? '')
      return val.includes(',') ? `"${val}"` : val
    }).join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
