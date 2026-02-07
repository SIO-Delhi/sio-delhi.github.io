import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ALL_PERMISSIONS, PERMISSION_LABELS } from '../constants'
import type { EditField } from '../types'

interface EditDialogProps {
  open: boolean
  title: string
  fields: EditField[]
  initialValues: Record<string, string>
  onSave: (values: Record<string, string>) => Promise<void>
  onCancel: () => void
}

export function EditDialog({ open, title, fields, initialValues, onSave, onCancel }: EditDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (open) { setValues(initialValues); setError(null) } }, [open, initialValues])

  function setPermission(key: string, perm: string, checked: boolean) {
    try {
      const obj = JSON.parse(values[key] || '{}') as Record<string, boolean>
      setValues(prev => ({ ...prev, [key]: JSON.stringify({ ...obj, [perm]: checked }) }))
    } catch {
      setValues(prev => ({ ...prev, [key]: JSON.stringify({ [perm]: checked }) }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    for (const field of fields) {
      if (field.required && field.type !== 'permissions' && !values[field.key]?.trim()) { setError(`${field.label} is required.`); return }
    }
    setSaving(true)
    try { await onSave(values) }
    catch (err) { setError(err instanceof Error ? err.message : 'Save failed.') }
    finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <div className="portal-overlay">
      <div className="portal-overlay-bg" onClick={onCancel} />
      <div className="portal-dialog portal-dialog-md portal-card-body">
        <button onClick={onCancel} className="portal-dialog-close" aria-label="Close"><X size={18} /></button>
        <h3 className="portal-dialog-title">{title}</h3>

        {error && <div className="portal-alert portal-alert-error portal-mb-4"><span>{error}</span></div>}

        <form onSubmit={handleSubmit} className="portal-form-stack">
          {fields.map(field => (
            <div key={field.key}>
              {field.type === 'permissions' ? (
                <>
                  <label className="portal-label">{field.label}</label>
                  <div className="portal-permissions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 4 }}>
                    {ALL_PERMISSIONS.map(p => {
                      const obj = (() => { try { return JSON.parse(values[field.key] || '{}') } catch { return {} } })() as Record<string, boolean>
                      const checked = obj[p] ?? false
                      return (
                        <label key={p} className="portal-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
                          <input type="checkbox" checked={checked} onChange={e => setPermission(field.key, p, e.target.checked)} />
                          {PERMISSION_LABELS[p]}
                        </label>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  <label className={`portal-label ${field.required ? 'portal-label-required' : ''}`}>{field.label}</label>
                  {field.type === 'select' && field.options ? (
                    <select value={values[field.key] ?? ''} onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))} className="portal-input portal-select">
                      <option value="">Select…</option>
                      {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  ) : (
                    <input type={field.type === 'tel' ? 'tel' : 'text'} value={values[field.key] ?? ''} onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))} placeholder={field.placeholder} className="portal-input" />
                  )}
                </>
              )}
            </div>
          ))}
          <div className="portal-dialog-actions">
            <button type="button" onClick={onCancel} disabled={saving} className="portal-btn portal-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="portal-btn portal-btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
