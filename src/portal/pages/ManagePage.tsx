import { useState, useEffect, useCallback } from 'react'
import { DataTable } from '../components/DataTable'
import { EditDialog } from '../components/EditDialog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { StatusBadge } from '../components/StatusBadge'
import { usePortalAuth } from '../context/PortalAuthContext'
import * as api from '../api'
import { ENTITY_LABELS, ENTITY_EDIT_FIELDS, ENTITY_ROLE_MAP, ALL_PERMISSIONS, hasPermission, ROLE_LABELS } from '../constants'
import type { EntityType, TableColumn, PortalUnit, PortalCircle, EditField } from '../types'
import type { PortalRole } from '../types'

interface ManagePageProps { entity: EntityType; readOnly?: boolean }

export function ManagePage({ entity, readOnly = false }: ManagePageProps) {
  const { user } = usePortalAuth()
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [units, setUnits] = useState<PortalUnit[]>([])
  const [circles, setCircles] = useState<PortalCircle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [deleteRow, setDeleteRow] = useState<Record<string, unknown> | null>(null)

  const labels = ENTITY_LABELS[entity] ?? { plural: entity, singular: entity }
  const role = ENTITY_ROLE_MAP[entity]

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      if (entity === 'units') setData(await api.fetchUnits() as unknown as Record<string, unknown>[])
      else if (entity === 'circles') setData(await api.fetchCircles() as unknown as Record<string, unknown>[])
      else {
        const unitId = user?.role === 'unit_president' ? (user.unit_id ?? undefined) : undefined
        setData(await api.fetchUsers(role ?? undefined, unitId) as unknown as Record<string, unknown>[])
      }
      setUnits(await api.fetchUnits())
      setCircles(await api.fetchCircles())
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load data.') }
    finally { setLoading(false) }
  }, [entity, role, user])

  useEffect(() => { fetchData() }, [fetchData])

  function getColumns(): TableColumn<Record<string, unknown>>[] {
    if (entity === 'units') return [
      { key: 'name', label: 'Unit Name', sortable: true },
      { key: 'created_at', label: 'Created', sortable: true, render: v => fmtDate(v as string) },
    ]
    if (entity === 'circles') return [
      { key: 'name', label: 'Circle Name', sortable: true },
      { key: 'created_at', label: 'Created', sortable: true, render: v => fmtDate(v as string) },
    ]
    const cols: TableColumn<Record<string, unknown>>[] = [
      { key: 'full_name', label: 'Full Name', sortable: true },
      { key: 'phone', label: 'Phone', sortable: true },
    ]
    cols.push({ key: 'unit_name', label: 'Unit', sortable: true, render: v => (v as string) || '—' })
    cols.push({ key: 'circle_name', label: 'Circle', sortable: true, render: v => (v as string) || '—' })
    if (entity === 'members' || entity === 'zonal-secretaries' || entity === 'unit-presidents')
      cols.push({ key: 'title', label: 'Title', sortable: true, render: v => v ? <span className="portal-badge portal-badge-title">{v as string}</span> : <span className="portal-text-muted">—</span> })
    if (entity === 'members')
      cols.push({ key: 'status', label: 'Status', sortable: true, render: v => <StatusBadge status={v as string} /> })
    cols.push({ key: 'created_at', label: 'Joined', sortable: true, render: v => fmtDate(v as string) })
    return cols
  }

  function getEditFields(): EditField[] {
    const base = ENTITY_EDIT_FIELDS[entity] ?? []
    const withOptions = base.map(f => {
      if (f.key === 'unit_id') return { ...f, options: units.map(u => ({ value: u.id, label: u.name })) }
      if (f.key === 'circle_id') return { ...f, options: [{ value: '', label: '— None —' }, ...circles.map(c => ({ value: c.id, label: c.name }))] }
      return f
    })
    if (entity !== 'units' && entity !== 'circles' && user?.role === 'admin') {
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
    if (entity !== 'units' && entity !== 'circles') {
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
    else {
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

  async function handleDelete() {
    if (!deleteRow) return
    try {
      if (entity === 'units') await api.deleteUnit(deleteRow.id as string)
      else if (entity === 'circles') await api.deleteCircle(deleteRow.id as string)
      else await api.deleteUser(deleteRow.id as string)
      setDeleteRow(null); await fetchData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Delete failed.') }
  }

  const canEdit = !readOnly && user?.role === 'admin'
  const deleteName = deleteRow ? String(deleteRow.name ?? deleteRow.full_name ?? 'this record') : ''

  return (
    <div className="portal-page">
      <div>
        <h1 className="portal-heading">{readOnly ? '' : 'Manage '}{labels.plural}</h1>
        <p className="portal-subheading">{readOnly ? `View all ${labels.plural.toLowerCase()} across the Delhi zone.` : `View, edit, and manage ${labels.plural.toLowerCase()}.`}</p>
      </div>

      <DataTable data={data} columns={getColumns()} loading={loading} error={error} searchPlaceholder={`Search ${labels.plural.toLowerCase()}…`}
        onEdit={canEdit ? row => setEditRow(row) : undefined} onDelete={canEdit ? row => setDeleteRow(row) : undefined}
        exportFilename={`${entity}.csv`} emptyTitle={`No ${labels.plural.toLowerCase()} found`} emptyDescription={`There are no ${labels.plural.toLowerCase()} registered yet.`} />

      {canEdit && <EditDialog open={!!editRow} title={`Edit ${labels.singular}`} fields={getEditFields()} initialValues={editRow ? getInitialEditValues(editRow) : {}} onSave={handleSaveEdit} onCancel={() => setEditRow(null)} />}
      {canEdit && <ConfirmDialog open={!!deleteRow} title={`Delete ${labels.singular}`} message={`Are you sure you want to delete "${deleteName}"? This action cannot be undone.`} confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setDeleteRow(null)} />}
    </div>
  )
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}
