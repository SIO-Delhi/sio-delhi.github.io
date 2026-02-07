import { useState, useEffect, useCallback } from 'react'
import { ArrowRightLeft, CheckCircle, XCircle, Plus, X } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import * as api from '../api'
import type { MigrationRequest, PortalUser, PortalUnit, TableColumn } from '../types'

export function MigrationsPage() {
  const { user } = usePortalAuth()
  const [migrations, setMigrations] = useState<MigrationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [members, setMembers] = useState<PortalUser[]>([])
  const [units, setUnits] = useState<PortalUnit[]>([])
  const [selectedMember, setSelectedMember] = useState('')
  const [targetUnit, setTargetUnit] = useState('')
  const [creating, setCreating] = useState(false)
  const [actionRow, setActionRow] = useState<{ migration: MigrationRequest; action: 'approved' | 'rejected' } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try { setMigrations(await api.fetchMigrations(statusFilter)) }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load migrations.') }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { api.fetchUsers('member').then(setMembers).catch(() => {}); api.fetchUnits().then(setUnits).catch(() => {}) }, [])

  if (!user) return null

  const canApprove = user.role === 'admin' || user.role === 'zonal_secretary'
  const canCreate = user.role === 'admin' || user.role === 'zonal_secretary' || user.role === 'regional_president' || user.role === 'member'

  const columns: TableColumn<Record<string, unknown>>[] = [
    { key: 'member_name', label: 'Member', sortable: true },
    { key: 'from_unit_name', label: 'From Unit', sortable: true },
    { key: 'to_unit_name', label: 'To Unit', sortable: true },
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

  async function handleCreateMigration(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMember || !targetUnit || !user) return
    const member = members.find(m => m.id === selectedMember)
    if (!member?.unit_id) return
    setCreating(true)
    try { await api.createMigration({ member_id: selectedMember, from_unit_id: member.unit_id, to_unit_id: targetUnit, requested_by: user.id }); setShowCreate(false); setSelectedMember(''); setTargetUnit(''); await fetchData() }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to create migration.') }
    finally { setCreating(false) }
  }

  async function handleResolve() {
    if (!actionRow || !user) return
    try { await api.resolveMigration(actionRow.migration.id, actionRow.action, user.id); setActionRow(null); await fetchData() }
    catch (err) { setError(err instanceof Error ? err.message : 'Action failed.') }
  }

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <div>
          <h1 className="portal-heading">Migrations</h1>
          <p className="portal-subheading">{canApprove ? 'View and manage member migration requests between units.' : 'View migration requests and initiate transfers.'}</p>
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
          <div className="portal-overlay-bg" onClick={() => setShowCreate(false)} />
          <div className="portal-dialog portal-dialog-md portal-card-body">
            <button onClick={() => setShowCreate(false)} className="portal-dialog-close" aria-label="Close"><X size={18} /></button>
            <h3 className="portal-dialog-title">New Migration Request</h3>
            <p className="portal-dialog-desc">Transfer a member from one unit to another.</p>
            <form onSubmit={handleCreateMigration} className="portal-form-stack">
              <div>
                <label className="portal-label">Member</label>
                <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="portal-input portal-select">
                  <option value="">Select member…</option>
                  {members.filter(m => m.unit_id).map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.unit_name})</option>)}
                </select>
              </div>
              <div className="portal-transfer-indicator"><ArrowRightLeft size={16} /><span>Transfer to</span></div>
              <div>
                <label className="portal-label">Target Unit</label>
                <select value={targetUnit} onChange={e => setTargetUnit(e.target.value)} className="portal-input portal-select">
                  <option value="">Select unit…</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="portal-dialog-actions">
                <button type="button" onClick={() => setShowCreate(false)} className="portal-btn portal-btn-secondary">Cancel</button>
                <button type="submit" disabled={creating || !selectedMember || !targetUnit} className="portal-btn portal-btn-primary">{creating ? 'Creating…' : 'Create Request'}</button>
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
