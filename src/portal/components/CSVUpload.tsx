import { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, Download } from 'lucide-react'
import type { CSVFieldDef } from '../types'
import { parseCSV, generateCSVSample } from '../csv-utils'

interface CSVUploadProps {
  fields: CSVFieldDef[]
  onUpload: (rows: Record<string, string>[]) => Promise<void>
  entityLabel: string
}

export function CSVUpload({ fields, onUpload, entityLabel }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<Record<string, string>[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null); setSuccess(false); setParsedRows(null)
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.name.endsWith('.csv')) { setError('Please select a CSV file.'); return }
    setFile(selected)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseCSV(ev.target?.result as string, fields)
        if (rows.length === 0) { setError('CSV file is empty or contains only headers.'); return }
        setParsedRows(rows)
      } catch (err) { setError(err instanceof Error ? err.message : 'Failed to parse CSV.') }
    }
    reader.readAsText(selected)
  }

  async function handleUpload() {
    if (!parsedRows) return
    setUploading(true); setError(null)
    try {
      await onUpload(parsedRows)
      setSuccess(true); setParsedRows(null); setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) { setError(err instanceof Error ? err.message : 'Upload failed.') }
    finally { setUploading(false) }
  }

  function handleReset() {
    setFile(null); setParsedRows(null); setError(null); setSuccess(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function downloadSample() {
    const csv = generateCSVSample(fields)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${entityLabel.toLowerCase().replace(/\s+/g, '-')}-sample.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="portal-page">
      {/* Format example */}
      <div className="portal-card portal-card-body-sm">
        <div className="portal-csv-format-header">
          <h3 className="portal-csv-format-title">Expected CSV Format</h3>
          <button onClick={downloadSample} className="portal-btn portal-btn-ghost portal-btn-sm portal-text-gold">
            <Download size={14} /> Download Sample
          </button>
        </div>
        <div className="portal-overflow-x">
          <table className="portal-table portal-table-sm">
            <thead>
              <tr>
                {fields.map(f => <th key={f.key}>{f.label}{f.required && <span className="portal-text-red"> *</span>}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                {fields.map(f => <td key={f.key} className="portal-font-mono portal-text-sec">{f.example}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload area */}
      <div className="portal-card portal-card-body-sm">
        {!file ? (
          <label className="portal-dropzone">
            <Upload size={28} className="portal-dropzone-icon" />
            <p className="portal-dropzone-text">Click to upload CSV file</p>
            <p className="portal-dropzone-hint">or drag and drop</p>
            <input ref={inputRef} type="file" accept=".csv" onChange={handleFileSelect} hidden />
          </label>
        ) : (
          <div className="portal-form-stack">
            {/* File info */}
            <div className="portal-card-inset portal-file-info">
              <FileText size={20} className="portal-file-icon" />
              <div className="portal-file-meta">
                <p className="portal-file-name">{file.name}</p>
                <p className="portal-file-size">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={handleReset} className="portal-file-remove" aria-label="Remove file"><X size={16} /></button>
            </div>

            {/* Preview */}
            {parsedRows && (
              <div>
                <p className="portal-csv-count">
                  <strong>{parsedRows.length}</strong> {entityLabel.toLowerCase()} found in file
                </p>
                <div className="portal-table-wrap portal-csv-preview">
                  <table className="portal-table portal-table-sm">
                    <thead className="portal-table-sticky-head">
                      <tr>
                        <th>#</th>
                        {fields.map(f => <th key={f.key}>{f.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 10).map((row, i) => (
                        <tr key={i}>
                          <td className="portal-text-muted">{i + 1}</td>
                          {fields.map(f => <td key={f.key}>{row[f.key]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 10 && <p className="portal-csv-more">…and {parsedRows.length - 10} more</p>}
                </div>
              </div>
            )}

            {/* Upload button */}
            {parsedRows && (
              <button onClick={handleUpload} disabled={uploading} className="portal-btn portal-btn-primary portal-btn-full">
                {uploading ? 'Uploading…' : `Upload ${parsedRows.length} ${entityLabel}`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status messages */}
      {error && <div className="portal-alert portal-alert-error"><AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
      {success && <div className="portal-alert portal-alert-success"><CheckCircle size={18} className="shrink-0 mt-0.5" /><span>{entityLabel} uploaded successfully!</span></div>}
    </div>
  )
}
