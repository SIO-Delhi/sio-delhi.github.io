import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Upload, CheckCircle, Search, X } from 'lucide-react'
import { CSVUpload } from '../components/CSVUpload'
import { DateInput } from '../components/DateInput'
import { ENTITY_LABELS, ENTITY_CSV_FIELDS, ENTITY_EDIT_FIELDS, ENTITY_ROLE_MAP, ROLE_LABELS, TITLE_LEVELS, getDefaultColorForLevel } from '../constants'
import { usePortalAuth } from '../context/PortalAuthContext'
import * as api from '../api'
import type { EntityType, PortalRole, PortalUser, PortalUnit, PortalCircle, PortalCampus, EditField, MembershipType } from '../types'

interface BulkAddPageProps { entity: EntityType }

type AddMode = 'individual' | 'bulk'

/** President entities that should use the "promote existing member" flow */
const PRESIDENT_ENTITIES = ['regional-presidents', 'unit-presidents', 'campus-presidents', 'zonal-secretaries']

export function BulkAddPage({ entity }: BulkAddPageProps) {
  const { user } = usePortalAuth()
  const navigate = useNavigate()
  const labels = ENTITY_LABELS[entity] ?? { plural: entity, singular: entity }
  const csvFields = ENTITY_CSV_FIELDS[entity] ?? []
  const targetRole = ENTITY_ROLE_MAP[entity]

  const [mode, setMode] = useState<AddMode>('individual')
  const [units, setUnits] = useState<PortalUnit[]>([])
  const [circles, setCircles] = useState<PortalCircle[]>([])
  const [campuses, setCampuses] = useState<PortalCampus[]>([])
  const [regions, setRegions] = useState<api.RegionWithUnits[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // President promotion state
  const isPresidentEntity = PRESIDENT_ENTITIES.includes(entity)
  const [allMembers, setAllMembers] = useState<PortalUser[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [promoteTitleText, setPromoteTitleText] = useState('')
  const [promoteTitleLevel, setPromoteTitleLevel] = useState('')
  const memberSearchRef = useRef<HTMLDivElement>(null)

  const isUserEntity = entity !== 'units' && entity !== 'circles' && entity !== 'campuses' && entity !== 'regions'

  // Fetch regions for units entity
  useEffect(() => {
    if (entity === 'units' || entity === 'regional-presidents') {
      api.fetchRegions().then(setRegions).catch(() => { })
    }
  }, [entity])

  // Fetch units/circles/campuses for select dropdowns
  useEffect(() => {
    if (isUserEntity) {
      Promise.all([api.fetchUnits(), api.fetchCircles(), api.fetchCampuses()])
        .then(([u, c, ca]) => { setUnits(u); setCircles(c); setCampuses(ca) })
        .catch(() => { })
    }
  }, [isUserEntity])

  // Fetch all members for president promotion
  useEffect(() => {
    if (isPresidentEntity) {
      api.fetchUsers().then(setAllMembers).catch(() => { })
    }
  }, [isPresidentEntity])

  const selectedMember = useMemo(() => allMembers.find(u => u.id === selectedMemberId) ?? null, [allMembers, selectedMemberId])
  const filteredMembers = useMemo(() => {
    const q = (memberSearchQuery ?? '').trim().toLowerCase()
    if (!q) return allMembers.slice(0, 50)
    return allMembers.filter(u =>
      [u.full_name, u.phone, u.unit_name].some(f => String(f ?? '').toLowerCase().includes(q))
    ).slice(0, 50)
  }, [allMembers, memberSearchQuery])

  // Build form fields for individual add (non-president entities)
  function getAddFields(): EditField[] {
    const base = ENTITY_EDIT_FIELDS[entity] ?? []
    if (entity === 'units') {
      return base.map(f => {
        if (f.key === 'region_id') {
          return { ...f, options: regions.map(r => ({ value: r.region_id, label: r.region_name })) }
        }
        return f
      })
    }
    if (!isUserEntity) return base

    // For user entities: use edit fields + populate select options
    const fields = base
      .filter(f => f.key !== 'status') // new users default to active
      .map(f => {
        if (f.key === 'membership_id') {
          const membershipType = values.membership_type as MembershipType | undefined
          let options: { value: string; label: string }[] = []
          if (membershipType === 'unit') options = units.map(u => ({ value: u.id, label: u.name }))
          else if (membershipType === 'circle') options = circles.map(c => ({ value: c.id, label: c.name }))
          else if (membershipType === 'campus') options = campuses.map(c => ({ value: c.id, label: c.name }))
          return { ...f, options }
        }
        return f
      })
    return fields
  }

  // Get assignment options for president promotion
  function getAssignmentOptions(): { value: string; label: string }[] {
    if (entity === 'regional-presidents') return regions.map(r => ({ value: r.region_id, label: r.region_name }))
    if (entity === 'unit-presidents') return units.filter(u => !u.is_campus).map(u => ({ value: u.id, label: u.name }))
    if (entity === 'campus-presidents') return campuses.map(c => ({ value: c.id, label: c.name }))
    return []
  }

  function getAssignmentLabel(): string {
    if (entity === 'regional-presidents') return 'Region'
    if (entity === 'unit-presidents') return 'Unit'
    if (entity === 'campus-presidents') return 'Campus'
    return 'Assignment'
  }

  function getDefaultTitleForEntity(): { title: string; level: string } {
    if (entity === 'regional-presidents') return { title: 'Regional President', level: 'regional' }
    if (entity === 'unit-presidents') return { title: 'Unit President', level: 'unit' }
    if (entity === 'campus-presidents') return { title: 'Campus President', level: 'campus' }
    if (entity === 'zonal-secretaries') return { title: 'Zonal Secretary', level: 'zonal' }
    return { title: '', level: '' }
  }

  // Handle president promotion
  async function handlePromote(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(false)
    if (!selectedMemberId) { setError('Please select a member.'); return }
    const needsAssignment = entity !== 'zonal-secretaries'
    if (needsAssignment && !selectedAssignmentId) { setError(`Please select a ${getAssignmentLabel().toLowerCase()}.`); return }
    if (!promoteTitleLevel) { setError('Please select a title level.'); return }

    setSaving(true)
    try {
      // 1. Update role & assignment
      const updates: Record<string, unknown> = { role: targetRole }
      if (entity === 'regional-presidents') {
        updates.region_id = selectedAssignmentId
      } else if (entity === 'unit-presidents') {
        updates.unit_id = selectedAssignmentId
        updates.membership_type = 'unit'
        updates.membership_id = selectedAssignmentId
      } else if (entity === 'campus-presidents') {
        updates.campus_id = selectedAssignmentId
        updates.membership_type = 'campus'
        updates.membership_id = selectedAssignmentId
      }
      await api.updateUser(selectedMemberId, updates)

      // 2. Assign title (replaces any previous title)
      if (promoteTitleText.trim()) {
        const color = getDefaultColorForLevel(promoteTitleLevel, promoteTitleText.trim()) || 'blue'
        await api.assignTitle(selectedMemberId, promoteTitleText.trim(), user!.id, color)
      }

      setSuccess(true)
      setSelectedMemberId('')
      setMemberSearchQuery('')
      setSelectedAssignmentId('')
      const def = getDefaultTitleForEntity()
      setPromoteTitleText(def.title)
      setPromoteTitleLevel(def.level)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote member.')
    } finally {
      setSaving(false)
    }
  }

  async function handleIndividualSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setWarning(null); setSuccess(false)

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
        const unitData: { name: string; region_id?: string } = { name: values.name.trim() }
        if (values.region_id) unitData.region_id = values.region_id
        await api.createUnits([unitData])
      } else if (entity === 'regions') {
        await api.createRegions([{ name: values.name.trim() }])
      } else if (entity === 'circles') {
        await api.createCircles([{ name: values.name.trim() }])
      } else if (entity === 'campuses') {
        await api.createCampuses([{ name: values.name.trim() }])
      } else {
        const userData: Record<string, unknown> = {
          first_name: (values.first_name ?? '').trim(),
          last_name: (values.last_name ?? '').trim(),
          phone: (values.phone ?? '').trim(),
          alt_phone: (values.alt_phone ?? '').trim(),
          role: targetRole as PortalRole,
        }
        if (values.middle_name?.trim()) userData.middle_name = values.middle_name.trim()
        if (values.date_of_birth?.trim()) userData.date_of_birth = values.date_of_birth.trim()
        if (values.membership_type) userData.membership_type = values.membership_type as MembershipType
        if (values.membership_id) userData.membership_id = values.membership_id
        const result = await api.createUsers([userData as Parameters<typeof api.createUsers>[0][0]])
        if (result.message) setWarning(result.message)
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
    if (entity === 'units') {
      const regs = await api.fetchRegions()
      const regionMap = new Map(regs.map(r => [r.region_name.toLowerCase(), r.region_id]))
      await api.createUnits(rows.map((r, idx) => {
        const unit: { name: string; region_id?: string } = { name: r.name }
        if (r.region_name?.trim()) {
          const rid = regionMap.get(r.region_name.trim().toLowerCase())
          if (!rid) throw new Error(`Row ${idx + 1}: Region "${r.region_name}" not found.`)
          unit.region_id = rid
        }
        return unit
      }))
      return
    }
    if (entity === 'regions') { await api.createRegions(rows.map(r => ({ name: r.name }))); return }
    if (entity === 'circles') { await api.createCircles(rows.map(r => ({ name: r.name }))); return }
    if (entity === 'campuses') { await api.createCampuses(rows.map(r => ({ name: r.name }))); return }
    const [units, circles, campuses] = await Promise.all([api.fetchUnits(), api.fetchCircles(), api.fetchCampuses()])
    const unitMap = new Map(units.map(u => [u.name.toLowerCase(), u.id]))
    const circleMap = new Map(circles.map(c => [c.name.toLowerCase(), c.id]))
    const campusMap = new Map(campuses.map(c => [c.name.toLowerCase(), c.id]))
    const users = rows.map((r, idx) => {
      const user: { first_name: string; middle_name?: string; last_name: string; phone: string; alt_phone?: string; date_of_birth?: string; role: PortalRole; membership_type?: MembershipType; membership_id?: string } = {
        first_name: (r.first_name ?? '').trim(),
        last_name: (r.last_name ?? '').trim(),
        phone: r.phone,
        alt_phone: r.alt_phone,
        role: targetRole as PortalRole,
      }
      if (r.middle_name != null && r.middle_name.trim() !== '') user.middle_name = r.middle_name.trim()
      if (r.date_of_birth != null && r.date_of_birth.trim() !== '') user.date_of_birth = r.date_of_birth.trim()
      if (r.unit_name) {
        const unitId = unitMap.get(r.unit_name.toLowerCase())
        if (!unitId) throw new Error(`Row ${idx + 1}: Unit "${r.unit_name}" not found.`)
        user.membership_type = 'unit'
        user.membership_id = unitId
      } else if (r.circle_name) {
        const circleId = circleMap.get(r.circle_name.trim().toLowerCase())
        if (circleId) {
          user.membership_type = 'circle'
          user.membership_id = circleId
        }
      } else if (r.campus_name) {
        const campusId = campusMap.get(r.campus_name.trim().toLowerCase())
        if (campusId) {
          user.membership_type = 'campus'
          user.membership_id = campusId
        }
      }
      return user
    })
    const result = await api.createUsers(users)
    if (result.message) setWarning(result.message)
  }, [entity, targetRole])

  const addFields = getAddFields()
  const isWide = addFields.length > 4

  return (
    <div className="portal-page">
      <div>
        <h1 className="portal-heading">{isPresidentEntity ? `Assign ${labels.singular}` : `Add ${labels.plural}`}</h1>
        <p className="portal-subheading">
          {isPresidentEntity
            ? `Promote an existing member to ${labels.singular.toLowerCase()} by selecting them below.`
            : `Add ${labels.plural.toLowerCase()} individually or upload a CSV file for bulk import.`}
        </p>
      </div>

      {/* Tab toggle — hide bulk tab for president entities */}
      {!isPresidentEntity && (
        <div className="portal-tab-group">
          <button onClick={() => { setMode('individual'); setError(null); setSuccess(false) }} className={`portal-tab ${mode === 'individual' ? 'active' : ''}`}>
            <UserPlus size={15} /> Add Individual
          </button>
          <button onClick={() => { setMode('bulk'); setError(null); setSuccess(false) }} className={`portal-tab ${mode === 'bulk' ? 'active' : ''}`}>
            <Upload size={15} /> Bulk Upload CSV
          </button>
        </div>
      )}

      {/* President promotion form */}
      {isPresidentEntity && (
        <div className="portal-card portal-card-body">
          {error && <div className="portal-alert portal-alert-error portal-mb-4"><span>{error}</span></div>}
          {success && (
            <div className="portal-alert portal-alert-success portal-mb-4">
              <CheckCircle size={16} />
              <span>Member promoted to {labels.singular} successfully!</span>
              <button onClick={() => { setSuccess(false) }} className="portal-btn portal-btn-ghost portal-btn-sm" style={{ marginLeft: 'auto' }}>Assign Another</button>
              <button onClick={() => navigate(-1)} className="portal-btn portal-btn-ghost portal-btn-sm">Go Back</button>
            </div>
          )}

          <form onSubmit={handlePromote} className="portal-form-stack">
            {/* Member search dropdown */}
            <div>
              <label className="portal-label portal-label-required">Select Member</label>
              <div ref={memberSearchRef} className="portal-search-select-wrap">
                <Search size={16} className="portal-search-select-icon" aria-hidden />
                <input
                  type="text"
                  value={selectedMember ? `${selectedMember.full_name} (${ROLE_LABELS[selectedMember.role]}${selectedMember.unit_name ? ` — ${selectedMember.unit_name}` : ''})` : (memberSearchQuery ?? '')}
                  onChange={e => {
                    setSelectedMemberId('')
                    setMemberSearchQuery(e.target.value)
                    setMemberDropdownOpen(true)
                  }}
                  onFocus={() => setMemberDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setMemberDropdownOpen(false), 150)}
                  placeholder="Search by name, phone, or unit…"
                  className="portal-input portal-search-select-input"
                  autoComplete="off"
                />
                {selectedMember && (
                  <button type="button" onClick={() => { setSelectedMemberId(''); setMemberSearchQuery('') }} className="portal-search-select-clear" aria-label="Clear selection"><X size={14} /></button>
                )}
                {memberDropdownOpen && (
                  <div className="portal-search-select-dropdown">
                    {filteredMembers.length === 0 ? (
                      <p className="portal-search-select-empty">No members found. Try name, phone, or unit.</p>
                    ) : (
                      filteredMembers.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          className={`portal-search-select-option ${u.id === selectedMemberId ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedMemberId(u.id)
                            setMemberSearchQuery('')
                            setMemberDropdownOpen(false)
                            // Auto-fill default title if not already set
                            if (!promoteTitleText) {
                              const def = getDefaultTitleForEntity()
                              setPromoteTitleText(def.title)
                              setPromoteTitleLevel(def.level)
                            }
                          }}
                        >
                          <span className="portal-search-select-option-name">{u.full_name}</span>
                          <span className="portal-search-select-option-meta">{ROLE_LABELS[u.role]}{u.unit_name ? ` · ${u.unit_name}` : ''}{u.phone ? ` · ${u.phone}` : ''}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedMember && (
                <p className="portal-hint">
                  Current role: <strong>{ROLE_LABELS[selectedMember.role]}</strong>
                  {selectedMember.unit_name ? ` · ${selectedMember.unit_name}` : ''}
                  {selectedMember.role !== 'member' && ' — This will change their role.'}
                </p>
              )}
            </div>

            {/* Region/Unit/Campus selector — not needed for zonal secretaries */}
            {entity !== 'zonal-secretaries' && (
              <div>
                <label className="portal-label portal-label-required">{getAssignmentLabel()}</label>
                <select
                  value={selectedAssignmentId}
                  onChange={e => setSelectedAssignmentId(e.target.value)}
                  className="portal-input portal-select"
                  required
                >
                  <option value="">Select {getAssignmentLabel().toLowerCase()}…</option>
                  {getAssignmentOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="portal-hint">
                  Their role will be changed to <strong>{labels.singular}</strong> and assigned to this {getAssignmentLabel().toLowerCase()}.
                </p>
              </div>
            )}

            {/* Title assignment */}
            <div>
              <label className="portal-label portal-label-required">Title</label>
              <input
                type="text"
                value={promoteTitleText}
                onChange={e => setPromoteTitleText(e.target.value)}
                placeholder={`e.g. ${getDefaultTitleForEntity().title}`}
                className="portal-input"
              />
              <p className="portal-hint">
                This title will replace any previous title they had.
                {selectedMember?.title && <> Current title: <strong>{(selectedMember as PortalUser & { display_title?: string }).display_title ?? selectedMember.title}</strong></>}
              </p>
            </div>

            <div>
              <label className="portal-label portal-label-required">Title Level</label>
              <select
                value={promoteTitleLevel}
                onChange={e => setPromoteTitleLevel(e.target.value)}
                className="portal-input portal-select"
                required
              >
                <option value="">Select level…</option>
                {TITLE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <p className="portal-hint">Color is set by level: Campus = magenta, Regional = green, Zonal = gold, Unit = silver/blue (president = red).</p>
            </div>

            <div className="portal-edit-actions">
              <button type="button" onClick={() => navigate(-1)} className="portal-btn portal-btn-secondary">Cancel</button>
              <button type="submit" disabled={saving || !selectedMemberId || (entity !== 'zonal-secretaries' && !selectedAssignmentId) || !promoteTitleText.trim() || !promoteTitleLevel} className="portal-btn portal-btn-primary">
                <UserPlus size={15} /> {saving ? 'Promoting...' : `Assign as ${labels.singular}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Standard individual add form (non-president entities) */}
      {!isPresidentEntity && mode === 'individual' && (
        <div className="portal-card portal-card-body">
          {error && <div className="portal-alert portal-alert-error portal-mb-4"><span>{error}</span></div>}
          {warning && <div className="portal-alert portal-alert-error portal-mb-4" style={{ borderColor: '#ca8a04', color: '#ca8a04' }}><span>{warning}</span></div>}
          {success && (
            <div className="portal-alert portal-alert-success portal-mb-4">
              <CheckCircle size={16} />
              <span>{labels.singular} added successfully!{warning ? ' (with Clerk warning — see above)' : ''}</span>
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
                  ) : field.type === 'date' ? (
                    <DateInput
                      value={values[field.key] ?? ''}
                      onChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
                    />
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

      {!isPresidentEntity && mode === 'bulk' && (
        <CSVUpload fields={csvFields} onUpload={handleUpload} entityLabel={labels.plural} />
      )}
    </div>
  )
}
