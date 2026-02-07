import { useState, useEffect, useCallback } from 'react'
import { Award, Plus, X } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { DataTable } from '../components/DataTable'
import { ConfirmDialog } from '../components/ConfirmDialog'
import * as api from '../api'
import type { PortalUser, TableColumn } from '../types'
import { ROLE_LABELS } from '../constants'

export function TitlesPage() {
  const { user } = usePortalAuth()
  const [titledUsers, setTitledUsers] = useState<PortalUser[]>([])
  const [allUsers, setAllUsers] = useState<PortalUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [titleText, setTitleText] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<PortalUser | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try { const [titled, users] = await Promise.all([api.fetchUsersWithTitles(), api.fetchUsers()]); setTitledUsers(titled); setAllUsers(users) }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load data.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  if (!user) return null

  const isAdmin = user.role === 'admin'
  const isZonal = user.role === 'zonal_secretary'
  const isUnitPres = user.role === 'unit_president'

  const assignableUsers = allUsers.filter(u => {
    if (u.id === user.id || u.title) return false
    if (isAdmin) return true
    if (isZonal) return u.role !== 'admin'
    if (isUnitPres) return u.role === 'member' && u.unit_id === user.unit_id
    return false
  })

  const visibleTitled = titledUsers.filter(u => {
    if (isAdmin || isZonal) return true
    if (isUnitPres) return u.unit_id === user.unit_id
    return false
  })

  const canAssign = isAdmin || isZonal || isUnitPres

  const columns: TableColumn<Record<string, unknown>>[] = [
    { key: 'full_name', label: 'Name', sortable: true },
    { key: 'title', label: 'Title', sortable: true, render: (v: unknown) => <span className="portal-badge portal-badge-title"><Award size={12} /> {v as string}</span> },
    { key: 'role', label: 'Base Role', sortable: true, render: (v: unknown) => ROLE_LABELS[v as keyof typeof ROLE_LABELS] ?? v },
    { key: 'unit_name', label: 'Unit', sortable: true, render: (v: unknown) => (v as string) || '—' },
    { key: 'phone', label: 'Phone', sortable: true },
  ]

  async function handleAssignTitle(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId || !titleText.trim() || !user) return
    setAssigning(true)
    try { await api.assignTitle(selectedUserId, titleText.trim(), user.id); setShowAssign(false); setSelectedUserId(''); setTitleText(''); await fetchData() }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to assign title.') }
    finally { setAssigning(false) }
  }

  async function handleRevokeConfirm() {
    if (!revokeTarget) return
    try { await api.revokeTitle(revokeTarget.id); setRevokeTarget(null); await fetchData() }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to revoke title.') }
  }

  const scopeLabel = isUnitPres ? 'unit' : isZonal ? 'zonal' : 'all'

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <div>
          <h1 className="portal-heading">Titles & Designations</h1>
          <p className="portal-subheading">{canAssign ? `Manage ${scopeLabel}-level title assignments.` : 'View title assignments.'}</p>
        </div>
        {canAssign && <button onClick={() => setShowAssign(true)} className="portal-btn portal-btn-primary"><Plus size={16} /> Assign Title</button>}
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      <DataTable data={visibleTitled as unknown as Record<string, unknown>[]} columns={columns} loading={loading} searchPlaceholder="Search titled users…" exportFilename="titles.csv" emptyTitle="No titles assigned" emptyDescription="No users have been given a title yet." onDelete={canAssign ? (row: Record<string, unknown>) => setRevokeTarget(row as unknown as PortalUser) : undefined} />

      {/* Assign dialog */}
      {showAssign && (
        <div className="portal-overlay">
          <div className="portal-overlay-bg" onClick={() => setShowAssign(false)} />
          <div className="portal-dialog portal-dialog-md portal-card-body">
            <button onClick={() => setShowAssign(false)} className="portal-dialog-close" aria-label="Close"><X size={18} /></button>
            <h3 className="portal-dialog-title">Assign Title</h3>
            <p className="portal-dialog-desc">Give a user a designation or honorary title.</p>
            <form onSubmit={handleAssignTitle} className="portal-form-stack">
              <div>
                <label className="portal-label">User</label>
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="portal-input portal-select">
                  <option value="">Select user…</option>
                  {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({ROLE_LABELS[u.role]}{u.unit_name ? ` — ${u.unit_name}` : ''})</option>)}
                </select>
              </div>
              <div>
                <label className="portal-label portal-label-required">Title</label>
                <input type="text" value={titleText} onChange={e => setTitleText(e.target.value)} placeholder="e.g. Joint Secretary, Media Secretary" className="portal-input" />
                <p className="portal-hint">Free-text — type any designation.</p>
              </div>
              <div className="portal-dialog-actions">
                <button type="button" onClick={() => setShowAssign(false)} className="portal-btn portal-btn-secondary">Cancel</button>
                <button type="submit" disabled={assigning || !selectedUserId || !titleText.trim()} className="portal-btn portal-btn-primary">{assigning ? 'Assigning…' : 'Assign Title'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!revokeTarget} title="Revoke Title" message={revokeTarget ? `Remove the title "${revokeTarget.title}" from ${revokeTarget.full_name}?` : ''} confirmLabel="Revoke" danger onConfirm={handleRevokeConfirm} onCancel={() => setRevokeTarget(null)} />
    </div>
  )
}
