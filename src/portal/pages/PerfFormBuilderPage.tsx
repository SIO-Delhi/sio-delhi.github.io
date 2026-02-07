import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePortalAuth } from '../context/PortalAuthContext'
import * as api from '../api'
import type { PortalUnit, PerfFieldType } from '../types'

interface FieldDraft {
  key: string
  type: PerfFieldType
  label: string
  description: string
  options: string[]
  is_required: boolean
  max_value: number
}

const FIELD_TYPES: { value: PerfFieldType; label: string; desc: string }[] = [
  { value: 'mcq', label: 'MCQ', desc: 'Single choice from options' },
  { value: 'msq', label: 'MSQ', desc: 'Multiple choices from options' },
  { value: 'subjective', label: 'Subjective', desc: 'Free text answer' },
  { value: 'checkbox', label: 'Checkbox', desc: 'Yes / No tick' },
  { value: 'number', label: 'Number', desc: 'Numeric value' },
  { value: 'rating', label: 'Rating', desc: 'Score out of max value' },
]

function newField(): FieldDraft {
  return { key: crypto.randomUUID(), type: 'subjective', label: '', description: '', options: [''], is_required: true, max_value: 10 }
}

export function PerfFormBuilderPage() {
  const { user } = usePortalAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [period, setPeriod] = useState('')
  const [scopeUnitId, setScopeUnitId] = useState<string>('')
  const [fields, setFields] = useState<FieldDraft[]>([newField()])
  const [units, setUnits] = useState<PortalUnit[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { api.fetchUnits().then(setUnits).catch(() => {}) }, [])
  if (!user) return null

  const pathPrefix = `/portal/${user.role === 'admin' ? 'admin' : user.role === 'zonal_secretary' ? 'zonal' : user.role === 'regional_president' ? 'regional' : 'unit'}`

  function updateField(key: string, updates: Partial<FieldDraft>) {
    setFields(prev => prev.map(f => f.key === key ? { ...f, ...updates } : f))
  }

  function removeField(key: string) {
    setFields(prev => prev.filter(f => f.key !== key))
  }

  function addOption(fieldKey: string) {
    setFields(prev => prev.map(f => f.key === fieldKey ? { ...f, options: [...f.options, ''] } : f))
  }

  function updateOption(fieldKey: string, idx: number, value: string) {
    setFields(prev => prev.map(f => f.key === fieldKey ? { ...f, options: f.options.map((o, i) => i === idx ? value : o) } : f))
  }

  function removeOption(fieldKey: string, idx: number) {
    setFields(prev => prev.map(f => f.key === fieldKey ? { ...f, options: f.options.filter((_, i) => i !== idx) } : f))
  }

  async function handleSave() {
    setError(null)
    if (!title.trim()) { setError('Title is required.'); return }
    if (fields.length === 0) { setError('Add at least one field.'); return }
    for (const f of fields) {
      if (!f.label.trim()) { setError('All fields must have a label.'); return }
      if ((f.type === 'mcq' || f.type === 'msq') && f.options.filter(o => o.trim()).length < 2) {
        setError(`"${f.label}" needs at least 2 options.`); return
      }
    }

    setSaving(true)
    try {
      await api.createPerfForm({
        title: title.trim(),
        description: description.trim() || undefined,
        created_by: user!.id,
        scope_unit_id: scopeUnitId || null,
        period: period.trim() || undefined,
        fields: fields.map(f => ({
          type: f.type,
          label: f.label.trim(),
          description: f.description.trim() || undefined,
          options: (f.type === 'mcq' || f.type === 'msq') ? f.options.filter(o => o.trim()) : undefined,
          is_required: f.is_required,
          max_value: (f.type === 'number' || f.type === 'rating') ? f.max_value : undefined,
        })),
      })
      navigate(`${pathPrefix}/performance`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save.') }
    finally { setSaving(false) }
  }

  return (
    <div className="portal-page portal-page-narrow">
      <div>
        <h1 className="portal-heading">Create Performance Form</h1>
        <p className="portal-subheading">Design a form with custom fields for members to fill.</p>
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      {/* Form metadata */}
      <div className="portal-card portal-card-body">
        <div className="portal-form-stack">
          <div>
            <label className="portal-label portal-label-required">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. January 2026 Evaluation" className="portal-input" />
          </div>
          <div>
            <label className="portal-label">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description for members" rows={2} className="portal-input portal-textarea" />
          </div>
          <div className="portal-form-row">
            <div className="flex-1">
              <label className="portal-label">Period</label>
              <input type="text" value={period} onChange={e => setPeriod(e.target.value)} placeholder="e.g. 2026-01, Q1-2026" className="portal-input" />
            </div>
            <div className="flex-1">
              <label className="portal-label">Scope</label>
              <select value={scopeUnitId} onChange={e => setScopeUnitId(e.target.value)} className="portal-input portal-select">
                <option value="">Zone-wide (all units)</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="portal-form-stack">
        <h2 className="portal-heading" style={{ fontSize: '1.125rem' }}>Fields</h2>

        {fields.map((field, idx) => (
          <div key={field.key} className="portal-card portal-card-body-sm">
            <div className="portal-perf-field-header">
              <div className="portal-perf-field-grip"><GripVertical size={16} /></div>
              <span className="portal-perf-field-num">#{idx + 1}</span>
              <select value={field.type} onChange={e => updateField(field.key, { type: e.target.value as PerfFieldType })} className="portal-input portal-select portal-perf-field-type">
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
              </select>
              <button onClick={() => removeField(field.key)} className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red" aria-label="Remove field"><Trash2 size={14} /></button>
            </div>

            <div className="portal-form-stack" style={{ marginTop: 12 }}>
              <div>
                <label className="portal-label portal-label-required">Label</label>
                <input type="text" value={field.label} onChange={e => updateField(field.key, { label: e.target.value })} placeholder="e.g. How many events did you attend?" className="portal-input" />
              </div>
              <div>
                <label className="portal-label">Help Text</label>
                <input type="text" value={field.description} onChange={e => updateField(field.key, { description: e.target.value })} placeholder="Optional explanation" className="portal-input" />
              </div>

              {/* Options for MCQ / MSQ */}
              {(field.type === 'mcq' || field.type === 'msq') && (
                <div>
                  <label className="portal-label">Options</label>
                  <div className="portal-form-stack">
                    {field.options.map((opt, oi) => (
                      <div key={oi} className="portal-perf-option-row">
                        <input type="text" value={opt} onChange={e => updateOption(field.key, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="portal-input flex-1" />
                        {field.options.length > 1 && (
                          <button onClick={() => removeOption(field.key, oi)} className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red"><Trash2 size={12} /></button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addOption(field.key)} className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start"><Plus size={14} /> Add Option</button>
                  </div>
                </div>
              )}

              {/* Max value for number/rating */}
              {(field.type === 'number' || field.type === 'rating') && (
                <div>
                  <label className="portal-label">Max Value</label>
                  <input type="number" value={field.max_value} onChange={e => updateField(field.key, { max_value: parseInt(e.target.value) || 0 })} className="portal-input" style={{ maxWidth: 120 }} />
                </div>
              )}

              <label className="portal-perf-required-toggle">
                <input type="checkbox" checked={field.is_required} onChange={e => updateField(field.key, { is_required: e.target.checked })} />
                <span>Required</span>
              </label>
            </div>
          </div>
        ))}

        <button onClick={() => setFields(prev => [...prev, newField()])} className="portal-btn portal-btn-secondary portal-self-start">
          <Plus size={16} /> Add Field
        </button>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving} className="portal-btn portal-btn-primary portal-self-start">
        <Save size={16} /> {saving ? 'Saving…' : 'Create Form'}
      </button>
    </div>
  )
}
