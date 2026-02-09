import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '../components/DataTable'
import { EditDialog } from '../components/EditDialog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { StatusBadge } from '../components/StatusBadge'
import { usePortalAuth } from '../context/PortalAuthContext'
import * as api from '../api'
import { ENTITY_LABELS, ENTITY_EDIT_FIELDS, ENTITY_ROLE_MAP, ALL_PERMISSIONS, hasPermission, ROLE_LABELS, getTitleBadgeColorClass } from '../constants'
import { getAgeThisYear, formatPreciseAge } from '../components/AgeBar'
import type { EntityType, TableColumn, PortalUnit, PortalCircle, PortalCampus, EditField } from '../types'
import type { PortalRole } from '../types'

interface ManagePageProps { entity: EntityType; readOnly?: boolean }

const ROLE_PREFIX: Record<string, string> = {
  admin: '/portal/admin',
  zonal_secretary: '/portal/zonal',
  regional_president: '/portal/regional',
  unit_president: '/portal/unit',
  member: '/portal/member',
}

export function ManagePage({ entity, readOnly = false }: ManagePageProps) {
  const { user } = usePortalAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [units, setUnits] = useState<PortalUnit[]>([])
  const [circles, setCircles] = useState<PortalCircle[]>([])
  const [campuses, setCampuses] = useState<PortalCampus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [deleteRow, setDeleteRow] = useState<Record<string, unknown> | null>(null)

  const labels = ENTITY_LABELS[entity] ?? { plural: entity, singular: entity }
  const role = ENTITY_ROLE_MAP[entity]

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      if (entity === 'units') setData(await api.fetchUnits({ excludeCampusUnits: true }) as unknown as Record<string, unknown>[])
      else if (entity === 'circles') setData(await api.fetchCircles() as unknown as Record<string, unknown>[])
      else if (entity === 'campuses') setData(await api.fetchCampuses() as unknown as Record<string, unknown>[])
      else if (entity === 'regions') {
        // Fetch regions and transform to simple format for table
        const regions = await api.fetchRegions()
        setData(regions.map(r => ({ id: r.region_id, name: r.region_name, regional_president_name: r.regional_president_name ?? '—', created_at: '' })))
      } else {
        const membershipId = user?.role === 'unit_president' ? (user.membership_id ?? undefined) : undefined
        const regionId = user?.role === 'regional_president' ? (user.region_id ?? undefined) : undefined
        const excludeCampusUnits = entity === 'unit-presidents'
        const campusUnitsOnly = entity === 'campus-presidents'
        const options = {
          excludeCampusUnits,
          campusUnitsOnly,
          regionId
        }
        setData(await api.fetchUsers(role ?? undefined, membershipId, options) as unknown as Record<string, unknown>[])
      }
      setUnits(await api.fetchUnits())
      setCircles(await api.fetchCircles())
      setCampuses(await api.fetchCampuses())
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load data.') }
    finally { setLoading(false) }
  }, [entity, role, user])

  useEffect(() => { fetchData() }, [fetchData])

  function getColumns(): TableColumn<Record<string, unknown>>[] {
    if (entity === 'units') return [
      { key: 'name', label: 'Unit Name', sortable: true },
      { key: 'unit_president_name', label: 'President', sortable: true, render: v => (v as string) || '—' },
      { key: 'created_at', label: 'Created', sortable: true, render: v => fmtDate(v as string) },
    ]
    if (entity === 'circles') return [
      { key: 'name', label: 'Circle Name', sortable: true },
      { key: 'created_at', label: 'Created', sortable: true, render: v => fmtDate(v as string) },
    ]
    if (entity === 'campuses') return [
      { key: 'name', label: 'Campus Name', sortable: true },
      { key: 'campus_president_name', label: 'President', sortable: true, render: v => (v as string) || '—' },
      { key: 'created_at', label: 'Created', sortable: true, render: v => fmtDate(v as string) },
    ]
    if (entity === 'regions') return [
      { key: 'name', label: 'Region Name', sortable: true },
      { key: 'regional_president_name', label: 'Regional President', sortable: true },
    ]
    const cols: TableColumn<Record<string, unknown>>[] = [
      { key: 'full_name', label: 'Full Name', sortable: true },
      { key: 'phone', label: 'Phone', sortable: true },
    ]
    // Add Region column for regional-presidents
    if (entity === 'regional-presidents') {
      cols.push({ key: 'region_name', label: 'Region', sortable: true, render: v => (v as string) || '—' })
    }
    cols.push({ key: 'membership_name', label: 'Unit/Circle/Campus', sortable: true, render: v => (v as string) || '—' })
    if (entity === 'members' || entity === 'zonal-secretaries' || entity === 'unit-presidents' || entity === 'campus-presidents')
      cols.push({
        key: 'title', label: 'Title', sortable: true, render: (v, row) => {
          const displayTitle = (row?.display_title ?? v) as string | null
          const titleColor = row?.title_color as string | null | undefined
          if (!displayTitle) return <span className="portal-text-muted">—</span>
          const colorClass = getTitleBadgeColorClass(displayTitle, titleColor)
          return <span className={`portal-badge portal-badge-title portal-badge-title-${colorClass}`}>{displayTitle}</span>
        }
      })
    if (entity === 'members')
      cols.push({ key: 'status', label: 'Status', sortable: true, render: v => <StatusBadge status={v as string} /> })
    if (entity === 'members' && user?.role === 'admin')
      cols.push({ key: 'date_of_birth', label: 'Age', sortable: true, render: (v) => renderAgeBar(v as string | null) })
    cols.push({ key: 'created_at', label: 'Joined', sortable: true, render: v => fmtDate(v as string) })
    return cols
  }

  function getEditFields(): EditField[] {
    const base = ENTITY_EDIT_FIELDS[entity] ?? []
    const withOptions = base.map(f => {
      // Dynamic options for membership_id based on membership_type
      if (f.key === 'membership_id') {
        // For editing we need to provide all options; the form should use the current membership_type
        const allOptions = [
          ...units.map(u => ({ value: u.id, label: `Unit: ${u.name}` })),
          ...circles.map(c => ({ value: c.id, label: `Circle: ${c.name}` })),
          ...campuses.map(c => ({ value: c.id, label: `Campus: ${c.name}` })),
        ]
        return { ...f, options: allOptions }
      }
      return f
    })
    if (entity !== 'units' && entity !== 'circles' && entity !== 'campuses' && user?.role === 'admin') {
      withOptions.push({
        key: 'role',
        label: 'Role',
        type: 'select',
        required: true,
        options: (['admin', 'zonal_secretary', 'regional_president', 'unit_president', 'member'] as const).map(r => ({ value: r, label: ROLE_LABELS[r] })),
      })
      withOptions.push({ key: 'permission_overrides', label: 'Powers (override role)', type: 'permissions', required: false })
    }
    return withOptions
  }

  function getInitialEditValues(row: Record<string, unknown>): Record<string, string> {
    const vals: Record<string, string> = {}
    const fields = ENTITY_EDIT_FIELDS[entity] ?? []
    for (const field of fields) vals[field.key] = String(row[field.key] ?? '')
    if (entity !== 'units' && entity !== 'circles' && entity !== 'campuses' && entity !== 'regions') {
      vals['role'] = String(row['role'] ?? 'member')
      if (user?.role === 'admin') {
        const role = (row.role as PortalRole) ?? 'member'
        const overrides = (typeof row.permission_overrides === 'object' && row.permission_overrides != null)
          ? row.permission_overrides as Record<string, boolean>
          : {}
        const effective: Record<string, boolean> = {}
        for (const p of ALL_PERMISSIONS) effective[p] = overrides[p] ?? hasPermission(role, p)
        vals['permission_overrides'] = JSON.stringify(effective)
      }
    }
    return vals
  }

  async function handleSaveEdit(values: Record<string, string>) {
    if (!editRow) return
    const id = editRow.id as string
    if (entity === 'units') await api.updateUnit(id, { name: values.name })
    else if (entity === 'circles') await api.updateCircle(id, { name: values.name })
    else if (entity === 'campuses') await api.updateCampus(id, { name: values.name })
    else if (entity === 'regions') {
      await api.updateRegion(id, { name: values.name })
    } else {
      const payload: Record<string, unknown> = { ...values }
      if (values.permission_overrides !== undefined && editRow.role) {
        try {
          const effective = JSON.parse(values.permission_overrides || '{}') as Record<string, boolean>
          const role = editRow.role as PortalRole
          const overrides: Record<string, boolean> = {}
          for (const p of ALL_PERMISSIONS) {
            if (effective[p] !== hasPermission(role, p)) overrides[p] = !!effective[p]
          }
          payload.permission_overrides = overrides
        } catch {
          payload.permission_overrides = {}
        }
      }
      await api.updateUser(id, payload)
    }
    setEditRow(null); await fetchData()
  }

  /** President/secretary entities: demote to member instead of deleting the account */
  const isDemoteEntity = ['regional-presidents', 'unit-presidents', 'campus-presidents', 'zonal-secretaries'].includes(entity)

  async function handleDelete() {
    if (!deleteRow) return
    try {
      if (isDemoteEntity) {
        // Demote back to member — don't delete their account
        await api.updateUser(deleteRow.id as string, { role: 'member' })
      } else if (entity === 'units') await api.deleteUnit(deleteRow.id as string)
      else if (entity === 'circles') await api.deleteCircle(deleteRow.id as string)
      else if (entity === 'campuses') await api.deleteCampus(deleteRow.id as string)
      else if (entity === 'regions') await api.deleteRegion(deleteRow.id as string)
      else await api.deleteUser(deleteRow.id as string)
      setDeleteRow(null); await fetchData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Delete failed.') }
  }

  const canEdit = !readOnly && user?.role === 'admin'
  const deleteName = deleteRow ? String(deleteRow.name ?? deleteRow.full_name ?? 'this record') : ''

  const prefix = user ? (ROLE_PREFIX[user.role] ?? '/portal/member') : '/portal/member'
  // User entities: clickable name -> member profile
  const isUserEntity = entity !== 'units' && entity !== 'circles' && entity !== 'campuses' && entity !== 'regions'
  // Unit/Circle/Campus/Region: clickable name -> entity detail page
  const isEntityDetail = entity === 'units' || entity === 'circles' || entity === 'campuses'
  const handleRowClick = isUserEntity
    ? (row: Record<string, unknown>) => navigate(`${prefix}/members/${row.id}`)
    : isEntityDetail
      ? (row: Record<string, unknown>) => {
        const id = row.id as string
        if (entity === 'units') navigate(`${prefix}/units/${id}`)
        else if (entity === 'circles') navigate(`${prefix}/circles/${id}`)
        else navigate(`${prefix}/campuses/${id}`)
      }
      : undefined

  return (
    <div className="portal-page">
      <div>
        <h1 className="portal-heading">{readOnly ? '' : 'Manage '}{labels.plural}</h1>
        <p className="portal-subheading">{readOnly ? `View all ${labels.plural.toLowerCase()} across the Delhi zone.` : `View, edit, and manage ${labels.plural.toLowerCase()}.`}</p>
      </div>

      <DataTable data={data} columns={getColumns()} loading={loading} error={error} searchPlaceholder={`Search ${labels.plural.toLowerCase()}…`}
        onEdit={canEdit ? row => setEditRow(row) : undefined} onDelete={canEdit ? row => setDeleteRow(row) : undefined}
        onRowClick={handleRowClick}
        exportFilename={`${entity}.csv`} emptyTitle={`No ${labels.plural.toLowerCase()} found`} emptyDescription={`There are no ${labels.plural.toLowerCase()} registered yet.`} />

      {canEdit && <EditDialog open={!!editRow} title={`Edit ${labels.singular}`} fields={getEditFields()} initialValues={editRow ? getInitialEditValues(editRow) : {}} onSave={handleSaveEdit} onCancel={() => setEditRow(null)} />}
      {canEdit && <ConfirmDialog
        open={!!deleteRow}
        title={isDemoteEntity ? `Remove ${labels.singular}` : `Delete ${labels.singular}`}
        message={isDemoteEntity
          ? `Remove "${deleteName}" from the ${labels.singular.toLowerCase()} role? They will be demoted back to Member. Their account will NOT be deleted.`
          : `Are you sure you want to delete "${deleteName}"? This action cannot be undone.`}
        confirmLabel={isDemoteEntity ? 'Remove' : 'Delete'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteRow(null)}
      />}
    </div>
  )
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

/** Render an age progress bar (18→30) for the manage members table */
function renderAgeBar(dob: string | null) {
  const age = getAgeThisYear(dob)
  if (age === null) return <span className="portal-text-muted">—</span>
  const min = 18, max = 30
  const pct = Math.round((Math.max(min, Math.min(max, age)) - min) / (max - min) * 100)
  const isRetired = age >= 30
  return (
    <div className="portal-age-bar-cell">
      <div className="portal-age-bar">
        <div
          className={`portal-age-bar-fill ${isRetired ? 'portal-age-bar-gold' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`portal-age-bar-label ${isRetired ? 'portal-age-label-gold' : ''}`}>{formatPreciseAge(dob, true) ?? String(age)}</span>
    </div>
  )
}
