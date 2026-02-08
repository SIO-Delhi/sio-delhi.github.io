import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Upload, CheckCircle } from 'lucide-react'
import { CSVUpload } from '../components/CSVUpload'
import { ENTITY_LABELS, ENTITY_CSV_FIELDS, ENTITY_EDIT_FIELDS, ENTITY_ROLE_MAP } from '../constants'
import { usePortalAuth } from '../context/PortalAuthContext'
import * as api from '../api'
import type { EntityType, PortalRole, PortalUnit, PortalCircle, PortalCampus, EditField } from '../types'

interface BulkAddPageProps { entity: EntityType }

type AddMode = 'individual' | 'bulk'

export function BulkAddPage({ entity }: BulkAddPageProps) {
  usePortalAuth()
  const navigate = useNavigate()
  const labels = ENTITY_LABELS[entity] ?? { plural: entity, singular: entity }
  const csvFields = ENTITY_CSV_FIELDS[entity] ?? []
  const targetRole = ENTITY_ROLE_MAP[entity]

  const [mode, setMode] = useState<AddMode>('individual')
  const [units, setUnits] = useState<PortalUnit[]>([])
  const [circles, setCircles] = useState<PortalCircle[]>([])
  const [campuses, setCampuses] = useState<PortalCampus[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isUserEntity = entity !== 'units' && entity !== 'circles' && entity !== 'campuses'

  // Fetch units/circles/campuses for select dropdowns
  useEffect(() => {
    if (isUserEntity) {
      Promise.all([api.fetchUnits(), api.fetchCircles(), api.fetchCampuses()])
        .then(([u, c, ca]) => { setUnits(u); setCircles(c); setCampuses(ca) })
        .catch(() => {})
    }
  }, [isUserEntity])

  // Build form fields for individual add
  function getAddFields(): EditField[] {
    const base = ENTITY_EDIT_FIELDS[entity] ?? []
    if (!isUserEntity) return base

    // For user entities: use edit fields + add password, populate select options
    const fields = base
      .filter(f => f.key !== 'status') // new users default to active
      .map(f => {
        if (f.key === 'unit_id') return { ...f, options: units.map(u => ({ value: u.id, label: u.name })) }
        if (f.key === 'circle_id') return { ...f, options: [{ value: '', label: '-- None --' }, ...circles.map(c => ({ value: c.id, label: c.name }))] }
        if (f.key === 'campus_id') return { ...f, options: [{ value: '', label: '-- None --' }, ...campuses.map(c => ({ value: c.id, label: c.name }))] }
        return f
      })
    // Add password field
    fields.push({ key: 'password', label: 'Password', type: 'text', required: false, placeholder: 'Leave empty for auto-generated' })
    return fields
  }

  async function handleIndividualSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(false)

    const fields = getAddFields()
    for (const field of fields) {
      if (field.required && !values[field.key]?.trim()) {
        setError(`${field.label} is required.`)
        return
      }
    }

    setSaving(true)
    try {
      if (entity === 'units') {
        await api.createUnits([{ name: values.name.trim() }])
      } else if (entity === 'circles') {
        await api.createCircles([{ name: values.name.trim() }])
      } else if (entity === 'campuses') {
        await api.createCampuses([{ name: values.name.trim() }])
      } else {
        const userData: Record<string, unknown> = {
          first_name: (values.first_name ?? '').trim(),
          last_name: (values.last_name ?? '').trim(),
          phone: (values.phone ?? '').trim(),
          role: targetRole as PortalRole,
        }
        if (values.middle_name?.trim()) userData.middle_name = values.middle_name.trim()
        if (values.password?.trim()) userData.password = values.password.trim()
        if (values.date_of_birth?.trim()) userData.date_of_birth = values.date_of_birth.trim()
        if (values.unit_id) userData.unit_id = values.unit_id
        if (values.circle_id) userData.circle_id = values.circle_id
        if (values.campus_id) userData.campus_id = values.campus_id
        await api.createUsers([userData as Parameters<typeof api.createUsers>[0][0]])
      }
      setSuccess(true)
      setValues({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = useCallback(async (rows: Record<string, string>[]) => {
    if (entity === 'units') { await api.createUnits(rows.map(r => ({ name: r.name }))); return }
    if (entity === 'circles') { await api.createCircles(rows.map(r => ({ name: r.name }))); return }
    if (entity === 'campuses') { await api.createCampuses(rows.map(r => ({ name: r.name }))); return }
    const [units, circles, campuses] = await Promise.all([api.fetchUnits(), api.fetchCircles(), api.fetchCampuses()])
    const unitMap = new Map(units.map(u => [u.name.toLowerCase(), u.id]))
    const circleMap = new Map(circles.map(c => [c.name.toLowerCase(), c.id]))
    const users = rows.map((r, idx) => {
      const user: { first_name: string; middle_name?: string; last_name: string; phone: string; password?: string; date_of_birth?: string; role: PortalRole; unit_id?: string; circle_id?: string; campus_id?: string } = {
        first_name: (r.first_name ?? '').trim(),
        last_name: (r.last_name ?? '').trim(),
        phone: r.phone,
        role: targetRole as PortalRole,
      }
      if (r.middle_name != null && r.middle_name.trim() !== '') user.middle_name = r.middle_name.trim()
      if (r.password != null && r.password.trim() !== '') user.password = r.password.trim()
      if (r.date_of_birth != null && r.date_of_birth.trim() !== '') user.date_of_birth = r.date_of_birth.trim()
      if (r.unit_name) {
        const unitId = unitMap.get(r.unit_name.toLowerCase())
        if (!unitId) throw new Error(`Row ${idx + 1}: Unit "${r.unit_name}" not found.`)
        user.unit_id = unitId
      }
      if (r.circle_name) {
        const circleId = circleMap.get(r.circle_name.trim().toLowerCase())
        if (circleId) user.circle_id = circleId
      }
      if (r.campus_name) {
        const campusId = campuses.find(c => c.name.toLowerCase() === r.campus_name.trim().toLowerCase())?.id
        if (campusId) user.campus_id = campusId
      }
      return user
    })
    await api.createUsers(users)
  }, [entity, targetRole])

  const addFields = getAddFields()
  const isWide = addFields.length > 4

  return (
    <div className="portal-page">
      <div>
        <h1 className="portal-heading">Add {labels.plural}</h1>
        <p className="portal-subheading">Add {labels.plural.toLowerCase()} individually or upload a CSV file for bulk import.</p>
      </div>

      {/* Tab toggle */}
      <div className="portal-tab-group">
        <button onClick={() => { setMode('individual'); setError(null); setSuccess(false) }} className={`portal-tab ${mode === 'individual' ? 'active' : ''}`}>
          <UserPlus size={15} /> Add Individual
        </button>
        <button onClick={() => { setMode('bulk'); setError(null); setSuccess(false) }} className={`portal-tab ${mode === 'bulk' ? 'active' : ''}`}>
          <Upload size={15} /> Bulk Upload CSV
        </button>
      </div>

      {mode === 'individual' && (
        <div className="portal-card portal-card-body">
          {error && <div className="portal-alert portal-alert-error portal-mb-4"><span>{error}</span></div>}
          {success && (
            <div className="portal-alert portal-alert-success portal-mb-4">
              <CheckCircle size={16} />
              <span>{labels.singular} added successfully!</span>
              <button onClick={() => navigate(-1)} className="portal-btn portal-btn-ghost portal-btn-sm" style={{ marginLeft: 'auto' }}>Go Back</button>
            </div>
          )}

          <form onSubmit={handleIndividualSubmit}>
            <div className={`portal-edit-grid ${isWide ? 'portal-edit-grid-2col' : ''}`}>
              {addFields.map(field => (
                <div key={field.key} className="portal-edit-field">
                  <label className={`portal-label ${field.required ? 'portal-label-required' : ''}`}>{field.label}</label>
                  {field.type === 'select' && field.options ? (
                    <select
                      value={values[field.key] ?? ''}
                      onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="portal-input portal-select"
                    >
                      <option value="">Select...</option>
                      {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'tel' ? 'tel' : 'text'}
                      value={values[field.key] ?? ''}
                      onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="portal-input"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="portal-edit-actions">
              <button type="button" onClick={() => navigate(-1)} className="portal-btn portal-btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="portal-btn portal-btn-primary">
                <UserPlus size={15} /> {saving ? 'Adding...' : `Add ${labels.singular}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'bulk' && (
        <CSVUpload fields={csvFields} onUpload={handleUpload} entityLabel={labels.plural} />
      )}
    </div>
  )
}
