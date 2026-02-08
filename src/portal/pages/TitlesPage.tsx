import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Award, Plus, X, Search } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { DataTable } from '../components/DataTable'
import { ConfirmDialog } from '../components/ConfirmDialog'
import * as api from '../api'
import type { PortalUser, TableColumn } from '../types'
import { ROLE_LABELS, TITLE_BADGE_COLORS, getTitleBadgeColorClass, TITLE_PRESETS_BY_ROLE, TITLE_LEVELS, getDefaultColorForLevel } from '../constants'

export function TitlesPage() {
  const { user } = usePortalAuth()
  const [titledUsers, setTitledUsers] = useState<PortalUser[]>([])
  const [allUsers, setAllUsers] = useState<PortalUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [titleText, setTitleText] = useState<string>('')
  const [titleColor, setTitleColor] = useState<string>('')
  const [titleLevel, setTitleLevel] = useState<string>('')
  const [assigning, setAssigning] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState<string>('')
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const userSearchRef = useRef<HTMLDivElement>(null)
  const [editTarget, setEditTarget] = useState<PortalUser | null>(null)
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
    if (user.role === 'member') return u.id === user.id
    return false
  })

  const canAssign = isAdmin || isZonal || isUnitPres
  /** Only admin can set or change tag color; zonal/unit pres use defaults (gold/silver/blue). */
  const canEditColor = isAdmin

  const selectedUser = useMemo(() => assignableUsers.find(u => u.id === selectedUserId) ?? null, [assignableUsers, selectedUserId])
  const filteredAssignableUsers = useMemo(() => {
    const q = (userSearchQuery ?? '').trim().toLowerCase()
    if (!q) return assignableUsers.slice(0, 50)
    return assignableUsers.filter(u =>
      [u.full_name, u.phone, u.unit_name].some(f => String(f ?? '').toLowerCase().includes(q))
    ).slice(0, 50)
  }, [assignableUsers, userSearchQuery])

  const columns: TableColumn<Record<string, unknown>>[] = [
    { key: 'full_name', label: 'Name', sortable: true },
    { key: 'title', label: 'Title', sortable: true, render: (v: unknown, row: Record<string, unknown>) => {
      const displayTitle = (row?.display_title ?? v) as string | null
      const titleColor = row?.title_color as string | null | undefined
      if (!displayTitle) return <span className="portal-text-muted">—</span>
      const colorClass = getTitleBadgeColorClass(displayTitle, titleColor)
      return <span className={`portal-badge portal-badge-title portal-badge-title-${colorClass}`}><Award size={12} /> {displayTitle}</span>
    } },
    { key: 'role', label: 'Base Role', sortable: true, render: (v: unknown) => ROLE_LABELS[v as keyof typeof ROLE_LABELS] ?? v },
    { key: 'unit_name', label: 'Unit', sortable: true, render: (v: unknown) => (v as string) || '—' },
    { key: 'phone', label: 'Phone', sortable: true },
  ]

  async function handleAssignTitle(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserId || !titleText.trim() || !titleLevel?.trim() || !user) return
    setAssigning(true)
    try {
      const level = titleLevel.trim()
      let colorToSend: string
      if (level === 'unit' && isUnitPres) {
        colorToSend = 'red'
      } else {
        colorToSend = getDefaultColorForLevel(level, titleText.trim()) || 'blue'
      }
      await api.assignTitle(selectedUserId, titleText.trim(), user.id, colorToSend)
      setShowAssign(false)
      setSelectedUserId('')
      setUserSearchQuery('')
      setTitleText('')
      setTitleColor('')
      setTitleLevel('')
      await fetchData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to assign title.') }
    finally { setAssigning(false) }
  }

  function openEdit(row: Record<string, unknown>) {
    const u = row as unknown as PortalUser
    setEditTarget(u)
    setTitleText(typeof u.title === 'string' ? u.title : '')
    setTitleColor(typeof u.title_color === 'string' ? u.title_color : '')
  }

  async function handleEditTitle(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget || !titleText.trim() || !user) return
    setAssigning(true)
    try {
      const colorToSend = canEditColor ? ((titleColor && titleColor.trim()) || undefined) : undefined
      await api.assignTitle(editTarget.id, titleText.trim(), user.id, colorToSend)
      setEditTarget(null)
      setTitleText('')
      setTitleColor('')
      await fetchData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update title.') }
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
          <p className="portal-subheading">{canAssign ? `Manage ${scopeLabel}-level title assignments.` : 'Members cannot add or remove titles. You can only view your own title here.'}</p>
        </div>
        {canAssign && <button onClick={() => setShowAssign(true)} className="portal-btn portal-btn-primary"><Plus size={16} /> Assign Title</button>}
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      <DataTable data={visibleTitled as unknown as Record<string, unknown>[]} columns={columns} loading={loading} searchPlaceholder="Search titled users…" exportFilename="titles.csv" emptyTitle="No titles assigned" emptyDescription="No users have been given a title yet." onEdit={canAssign ? openEdit : undefined} onDelete={canAssign ? (row: Record<string, unknown>) => setRevokeTarget(row as unknown as PortalUser) : undefined} />

      {/* Assign dialog */}
      {showAssign && (
        <div className="portal-overlay">
          <div className="portal-overlay-bg" onClick={() => setShowAssign(false)} />
          <div className="portal-dialog portal-dialog-md portal-card-body">
            <button onClick={() => setShowAssign(false)} className="portal-dialog-close" aria-label="Close"><X size={18} /></button>
            <h3 className="portal-dialog-title">Assign Title</h3>
            <p className="portal-dialog-desc">Choose a position or enter a custom title.</p>
            <form onSubmit={handleAssignTitle} className="portal-form-stack">
              <div>
                <label className="portal-label">User</label>
                <div ref={userSearchRef} className="portal-search-select-wrap">
                  <Search size={16} className="portal-search-select-icon" aria-hidden />
                  <input
                    type="text"
                    value={selectedUser ? `${selectedUser.full_name} (${ROLE_LABELS[selectedUser.role]}${selectedUser.unit_name ? ` — ${selectedUser.unit_name}` : ''})` : (userSearchQuery ?? '')}
                    onChange={e => {
                      setSelectedUserId('')
                      setUserSearchQuery(e.target.value)
                      setUserDropdownOpen(true)
                    }}
                    onFocus={() => setUserDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setUserDropdownOpen(false), 150)}
                    placeholder="Search by name, phone, or unit…"
                    className="portal-input portal-search-select-input"
                    autoComplete="off"
                  />
                  {selectedUser && (
                    <button type="button" onClick={() => { setSelectedUserId(''); setUserSearchQuery('') }} className="portal-search-select-clear" aria-label="Clear selection"><X size={14} /></button>
                  )}
                  {userDropdownOpen && (
                    <div className="portal-search-select-dropdown">
                      {filteredAssignableUsers.length === 0 ? (
                        <p className="portal-search-select-empty">No users match. Try name, phone, or unit.</p>
                      ) : (
                        filteredAssignableUsers.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            className={`portal-search-select-option ${u.id === selectedUserId ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedUserId(u.id)
                              setUserSearchQuery('')
                              setUserDropdownOpen(false)
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
              </div>
              <div>
                <label className="portal-label">Position (preset)</label>
                <select
                  value={
                    (TITLE_PRESETS_BY_ROLE[user.role] ?? []).includes(titleText)
                      ? titleText
                      : titleText ? '__custom__' : ''
                  }
                  onChange={e => {
                    const v = e.target.value
                    setTitleText(v === '__custom__' ? '' : v)
                  }}
                  className="portal-input portal-select"
                >
                  <option value="">Select a position…</option>
                  {(TITLE_PRESETS_BY_ROLE[user.role] ?? []).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="__custom__">Custom title</option>
                </select>
              </div>
              <div>
                <label className="portal-label portal-label-required">Title</label>
                <input type="text" value={titleText ?? ''} onChange={e => {
                  const v = e.target.value
                  setTitleText(v)
                  if (titleLevel && canEditColor) setTitleColor(getDefaultColorForLevel(titleLevel, v))
                }} placeholder="Or type a custom title" className="portal-input" />
                <p className="portal-hint">Set level below to fix color (e.g. JAC Secretary at Zonal = gold, at Unit = silver).</p>
              </div>
              <div>
                <label className="portal-label portal-label-required">Level</label>
                <select
                  value={titleLevel ?? ''}
                  onChange={e => {
                    const v = e.target.value
                    setTitleLevel(v)
                    if (v && canEditColor) setTitleColor(getDefaultColorForLevel(v, titleText))
                    else if (!v && canEditColor) setTitleColor('')
                  }}
                  className="portal-input portal-select"
                  required
                >
                  <option value="">Select level…</option>
                  {TITLE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <p className="portal-hint">Required. Campus = magenta, Regional = green, Zonal = gold, Unit = silver/blue (unit president = red).</p>
              </div>
              {canEditColor && (
                <div>
                  <label className="portal-label">Tag color</label>
                  <select value={titleColor ?? ''} onChange={e => setTitleColor(e.target.value)} className="portal-input portal-select">
                    <option value="">Default (auto from title text)</option>
                    {TITLE_BADGE_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              )}
              <div className="portal-dialog-actions">
                <button type="button" onClick={() => setShowAssign(false)} className="portal-btn portal-btn-secondary">Cancel</button>
                <button type="submit" disabled={assigning || !selectedUserId || !titleText.trim() || !titleLevel?.trim()} className="portal-btn portal-btn-primary">{assigning ? 'Assigning…' : 'Assign Title'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit title dialog */}
      {editTarget && (
        <div className="portal-overlay">
          <div className="portal-overlay-bg" onClick={() => { setEditTarget(null); setTitleText(''); setTitleColor('') }} />
          <div className="portal-dialog portal-dialog-md portal-card-body">
            <button onClick={() => { setEditTarget(null); setTitleText(''); setTitleColor('') }} className="portal-dialog-close" aria-label="Close"><X size={18} /></button>
            <h3 className="portal-dialog-title">Edit Title</h3>
            <p className="portal-dialog-desc">Change the title or tag color for {editTarget.full_name}.</p>
            <form onSubmit={handleEditTitle} className="portal-form-stack">
              <div>
                <label className="portal-label">Title</label>
                <input type="text" value={titleText ?? ''} onChange={e => setTitleText(e.target.value)} placeholder="e.g. Joint Secretary" className="portal-input" />
              </div>
              {canEditColor && (
                <div>
                  <label className="portal-label">Tag color</label>
                  <select value={titleColor ?? ''} onChange={e => setTitleColor(e.target.value)} className="portal-input portal-select">
                    <option value="">Default (auto: secretary=silver, zonal=gold)</option>
                    {TITLE_BADGE_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              )}
              <div className="portal-dialog-actions">
                <button type="button" onClick={() => { setEditTarget(null); setTitleText(''); setTitleColor('') }} className="portal-btn portal-btn-secondary">Cancel</button>
                <button type="submit" disabled={assigning || !titleText.trim()} className="portal-btn portal-btn-primary">{assigning ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!revokeTarget} title="Revoke Title" message={revokeTarget ? `Remove the title "${revokeTarget.display_title ?? revokeTarget.title}" from ${revokeTarget.full_name}?` : ''} confirmLabel="Revoke" danger onConfirm={handleRevokeConfirm} onCancel={() => setRevokeTarget(null)} />
    </div>
  )
}
