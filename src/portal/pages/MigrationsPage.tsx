import { useState, useEffect, useCallback } from 'react'
import { ArrowRightLeft, CheckCircle, XCircle, Plus, X } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { useNotifications } from '../context/NotificationContext'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import * as api from '../api'
import type { MigrationRequest, PortalUser, PortalUnit, TableColumn } from '../types'

type TargetType = 'unit' | 'zone'

export function MigrationsPage() {
  const { user } = usePortalAuth()
  const { counts, refresh: refreshNotifications } = useNotifications()
  const [migrations, setMigrations] = useState<MigrationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [members, setMembers] = useState<PortalUser[]>([])
  const [units, setUnits] = useState<PortalUnit[]>([])
  const [selectedMember, setSelectedMember] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('unit')
  const [targetUnit, setTargetUnit] = useState('')
  const [targetLocation, setTargetLocation] = useState('')
  const [reason, setReason] = useState('')
  const [creating, setCreating] = useState(false)
  const [actionRow, setActionRow] = useState<{ migration: MigrationRequest; action: 'approved' | 'rejected' } | null>(null)

  const isMember = user?.role === 'member'
  const isUnitPres = user?.role === 'unit_president'
  const isRegional = user?.role === 'regional_president'
  const canApprove = user?.role === 'admin' || user?.role === 'zonal_secretary'
  const canCreate = user?.role === 'admin' || user?.role === 'zonal_secretary' || user?.role === 'regional_president' || user?.role === 'unit_president' || user?.role === 'member'

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true); setError(null)
    try {
      setMigrations(await api.fetchMigrations({
        status: statusFilter,
        role: user.role,
        userId: user.id,
        unitId: user.unit_id ?? undefined,
      }))
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load migrations.') }
    finally { setLoading(false) }
  }, [statusFilter, user])

  useEffect(() => { fetchData() }, [fetchData])

  // When a member opens the migrations page, mark resolved migrations as "seen"
  useEffect(() => {
    if (!user || user.role !== 'member') return
    if (counts.pendingMigrations > 0) {
      api.markMigrationsSeen(user.id).then(() => refreshNotifications()).catch(() => {})
    }
  }, [user, counts.pendingMigrations, refreshNotifications])

  useEffect(() => {
    if (!user) return
    // Members don't need to fetch member list — they can only migrate themselves
    if (!isMember) {
      api.fetchUsers('member').then(setMembers).catch(() => {})
    }
    api.fetchUnits().then(setUnits).catch(() => {})
  }, [user, isMember])

  if (!user) return null

  // For member: auto-select self. For higher roles: filter members by hierarchy
  const availableMembers = isMember
    ? [] // member doesn't need member dropdown
    : isUnitPres
      ? members.filter(m => m.unit_id === user.unit_id)
      : isRegional
        ? members // TODO: filter by region if portal_region_units is available on frontend
        : members // admin/zonal see all

  // Determine the selected member's current unit for display
  const activeMember = isMember ? user : members.find(m => m.id === selectedMember)
  const fromUnitName = activeMember?.unit_name ?? units.find(u => u.id === activeMember?.unit_id)?.name ?? '—'

  const columns: TableColumn<Record<string, unknown>>[] = [
    { key: 'member_name', label: 'Member', sortable: true },
    { key: 'from_unit_name', label: 'From Unit', sortable: true },
    {
      key: 'to_unit_name', label: 'To', sortable: true,
      render: (_: unknown, row: Record<string, unknown>) => {
        if (row.to_unit_name) return row.to_unit_name as string
        if (row.to_location) return `${row.to_location} (zone)`
        return '—'
      },
    },
    { key: 'reason', label: 'Reason', sortable: false, render: (v: unknown) => (v as string) || '—' },
    { key: 'status', label: 'Status', sortable: true, render: (v: unknown) => <StatusBadge status={v as string} /> },
    { key: 'requested_by_name', label: 'Requested By', sortable: true },
    { key: 'created_at', label: 'Date', sortable: true, render: (v: unknown) => fmtDate(v as string) },
  ]

  if (canApprove) {
    columns.push({
      key: '_actions', label: '', sortable: false,
      render: (_: unknown, row: Record<string, unknown>) => {
        if (row.status !== 'pending') return null
        return (
          <div className="portal-action-row">
            <button onClick={e => { e.stopPropagation(); setActionRow({ migration: row as unknown as MigrationRequest, action: 'approved' }) }} className="portal-action-approve" title="Approve"><CheckCircle size={16} /></button>
            <button onClick={e => { e.stopPropagation(); setActionRow({ migration: row as unknown as MigrationRequest, action: 'rejected' }) }} className="portal-action-reject" title="Reject"><XCircle size={16} /></button>
          </div>
        )
      },
    })
  }

  function resetForm() {
    setSelectedMember(''); setTargetType('unit'); setTargetUnit(''); setTargetLocation(''); setReason('')
  }

  async function handleCreateMigration(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const memberId = isMember ? user.id : selectedMember
    if (!memberId) return
    const member = isMember ? user : members.find(m => m.id === memberId)
    if (!member?.unit_id) return

    // Validate target
    if (targetType === 'unit' && !targetUnit) return
    if (targetType === 'zone' && !targetLocation.trim()) return

    setCreating(true)
    try {
      await api.createMigration({
        member_id: memberId,
        from_unit_id: member.unit_id,
        to_unit_id: targetType === 'unit' ? targetUnit : undefined,
        to_location: targetType === 'zone' ? targetLocation.trim() : undefined,
        reason: reason.trim() || undefined,
        requested_by: user.id,
      })
      setShowCreate(false)
      resetForm()
      await fetchData()
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to create migration.') }
    finally { setCreating(false) }
  }

  async function handleResolve() {
    if (!actionRow || !user) return
    try { await api.resolveMigration(actionRow.migration.id, actionRow.action, user.id); setActionRow(null); await fetchData() }
    catch (err) { setError(err instanceof Error ? err.message : 'Action failed.') }
  }

  const isFormValid = (() => {
    if (creating) return false
    const hasMember = isMember || !!selectedMember
    const hasTarget = targetType === 'unit' ? !!targetUnit : !!targetLocation.trim()
    return hasMember && hasTarget
  })()

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <div>
          <h1 className="portal-heading">Migrations</h1>
          <p className="portal-subheading">
            {canApprove
              ? 'View and manage member migration requests between units and zones.'
              : isMember
                ? 'Request a transfer to another unit or zone.'
                : 'View migration requests and initiate transfers.'}
          </p>
        </div>
        {canCreate && <button onClick={() => setShowCreate(true)} className="portal-btn portal-btn-primary"><Plus size={16} /> New Request</button>}
      </div>

      <div className="portal-tab-group">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`portal-tab ${statusFilter === s ? 'active' : ''}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      <DataTable data={migrations as unknown as Record<string, unknown>[]} columns={columns} loading={loading} error={error} searchPlaceholder="Search migrations…" exportFilename="migrations.csv" emptyTitle="No migration requests" emptyDescription="There are no migration requests matching the current filter." />

      {/* Create dialog */}
      {showCreate && (
        <div className="portal-overlay">
          <div className="portal-overlay-bg" onClick={() => { setShowCreate(false); resetForm() }} />
          <div className="portal-dialog portal-dialog-md portal-card-body">
            <button onClick={() => { setShowCreate(false); resetForm() }} className="portal-dialog-close" aria-label="Close"><X size={18} /></button>
            <h3 className="portal-dialog-title">New Migration Request</h3>
            <p className="portal-dialog-desc">
              {isMember
                ? 'Request a transfer from your current unit to another unit or zone.'
                : 'Transfer a member from their current unit to another unit or zone.'}
            </p>
            <form onSubmit={handleCreateMigration} className="portal-form-stack">

              {/* Member selection: hidden for members (auto-self), shown for higher roles */}
              {!isMember && (
                <div>
                  <label className="portal-label">Member</label>
                  <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="portal-input portal-select">
                    <option value="">Select member…</option>
                    {availableMembers.filter(m => m.unit_id).map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.unit_name})</option>)}
                  </select>
                </div>
              )}

              {/* From Unit (read-only) */}
              {activeMember?.unit_id && (
                <div>
                  <label className="portal-label">From Unit</label>
                  <input type="text" value={fromUnitName} readOnly className="portal-input" style={{ opacity: 0.7, cursor: 'default' }} />
                </div>
              )}

              <div className="portal-transfer-indicator"><ArrowRightLeft size={16} /><span>Transfer to</span></div>

              {/* Target type toggle */}
              <div>
                <label className="portal-label">Transfer To</label>
                <div className="portal-tab-group" style={{ marginBottom: '0.75rem' }}>
                  <button type="button" onClick={() => { setTargetType('unit'); setTargetLocation('') }} className={`portal-tab ${targetType === 'unit' ? 'active' : ''}`}>Another Unit</button>
                  <button type="button" onClick={() => { setTargetType('zone'); setTargetUnit('') }} className={`portal-tab ${targetType === 'zone' ? 'active' : ''}`}>Another Zone / Location</button>
                </div>
              </div>

              {targetType === 'unit' && (
                <div>
                  <label className="portal-label">Target Unit</label>
                  <select value={targetUnit} onChange={e => setTargetUnit(e.target.value)} className="portal-input portal-select">
                    <option value="">Select unit…</option>
                    {units.filter(u => u.id !== activeMember?.unit_id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}

              {targetType === 'zone' && (
                <div>
                  <label className="portal-label">Target Zone / Location</label>
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={e => setTargetLocation(e.target.value)}
                    placeholder="e.g. SIO Hyderabad, West Zone, SIO UP…"
                    className="portal-input"
                  />
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="portal-label">Reason for Migration</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Why is this transfer needed?"
                  className="portal-input"
                  rows={3}
                />
              </div>

              <div className="portal-dialog-actions">
                <button type="button" onClick={() => { setShowCreate(false); resetForm() }} className="portal-btn portal-btn-secondary">Cancel</button>
                <button type="submit" disabled={!isFormValid} className="portal-btn portal-btn-primary">{creating ? 'Creating…' : 'Create Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!actionRow} title={actionRow?.action === 'approved' ? 'Approve Migration' : 'Reject Migration'} message={actionRow ? `Are you sure you want to ${actionRow.action === 'approved' ? 'approve' : 'reject'} the migration of ${actionRow.migration.member_name ?? 'this member'}?` : ''} confirmLabel={actionRow?.action === 'approved' ? 'Approve' : 'Reject'} danger={actionRow?.action === 'rejected'} onConfirm={handleResolve} onCancel={() => setActionRow(null)} />
    </div>
  )
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}
