import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Phone, Building2, MapPin, Shield, Calendar, Award, Activity,
  User, Mail, ArrowRightLeft, BarChart3, Lock, Camera, Trash2, Save,
  CheckCircle, ChevronDown,
} from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { UserAvatar } from '../components/UserAvatar'
import { StatusBadge } from '../components/StatusBadge'
import { HeroAgeBar, getAgeThisYear } from '../components/AgeBar'
import { ROLE_LABELS, ALL_PERMISSIONS, PERMISSION_LABELS, hasPermission } from '../constants'
import * as api from '../api'
import type { PortalUser, PortalMessage, MigrationRequest, PerfResponse, PortalRole } from '../types'

type Tab = 'info' | 'messages' | 'performance' | 'migrations' | 'permissions'

function rolePrefix(role: string): string {
  const map: Record<string, string> = {
    admin: '/portal/admin',
    zonal_secretary: '/portal/zonal',
    regional_president: '/portal/regional',
    unit_president: '/portal/unit',
    member: '/portal/member',
  }
  return map[role] ?? '/portal/member'
}

type PerfResponseWithForm = PerfResponse & { form_title?: string; form_description?: string; form_period?: string }

export function ViewMemberPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const { user: currentUser } = usePortalAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [member, setMember] = useState<PortalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tab, setTab] = useState<Tab>('info')
  const [messages, setMessages] = useState<PortalMessage[]>([])
  const [migrations, setMigrations] = useState<MigrationRequest[]>([])
  const [perfResponses, setPerfResponses] = useState<PerfResponseWithForm[]>([])
  const [tabLoading, setTabLoading] = useState(false)

  // Edit state (admin only)
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Permissions edit
  const [permOverrides, setPermOverrides] = useState<Record<string, boolean>>({})

  // Units/circles/campuses for dropdowns
  const [units, setUnits] = useState<{ id: string; name: string }[]>([])
  const [circles, setCircles] = useState<{ id: string; name: string }[]>([])
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([])

  const isAdmin = currentUser?.role === 'admin'
  const canSetActiveInactive = currentUser && ['admin', 'zonal_secretary', 'regional_president', 'unit_president'].includes(currentUser.role)
  const [statusUpdating, setStatusUpdating] = useState(false)

  // Load member data
  useEffect(() => {
    if (!memberId) return
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const data = await api.fetchUser(memberId!)
        if (!cancelled) setMember(data)
        if (isAdmin) {
          const [u, c, ca] = await Promise.all([api.fetchUnits(), api.fetchCircles(), api.fetchCampuses()])
          if (!cancelled) { setUnits(u); setCircles(c); setCampuses(ca) }
        }
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load member.') }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [memberId, isAdmin])

  // Load tab data
  useEffect(() => {
    if (!memberId || tab === 'info' || tab === 'permissions') return
    let cancelled = false
    async function loadTab() {
      setTabLoading(true)
      try {
        if (tab === 'messages') {
          const data = await api.fetchUserMessages(memberId!)
          if (!cancelled) setMessages(data)
        } else if (tab === 'migrations') {
          const data = await api.fetchUserMigrations(memberId!)
          if (!cancelled) setMigrations(data)
        } else if (tab === 'performance') {
          const data = await api.fetchUserPerformance(memberId!)
          if (!cancelled) setPerfResponses(data)
        }
      } catch { /* ignore tab errors */ }
      finally { if (!cancelled) setTabLoading(false) }
    }
    loadTab()
    return () => { cancelled = true }
  }, [memberId, tab])

  // Populate edit form when entering edit mode
  useEffect(() => {
    if (editing && member) {
      setEditValues({
        first_name: member.first_name ?? '',
        middle_name: member.middle_name ?? '',
        last_name: member.last_name ?? '',
        phone: member.phone ?? '',
        date_of_birth: member.date_of_birth ?? '',
        unit_id: member.unit_id ?? '',
        circle_id: member.circle_id ?? '',
        campus_id: member.campus_id ?? '',
        status: member.status ?? 'active',
        role: member.role ?? 'member',
      })
      // Populate permissions
      const overrides = (member as unknown as Record<string, unknown>).permission_overrides as Record<string, boolean> | null
      const effective: Record<string, boolean> = {}
      for (const p of ALL_PERMISSIONS) effective[p] = overrides?.[p] ?? hasPermission(member.role, p)
      setPermOverrides(effective)
    }
  }, [editing, member])

  async function handleSave() {
    if (!member) return
    setSaving(true); setSaveError(null); setSaveSuccess(false)
    try {
      const payload: Record<string, unknown> = { ...editValues }
      // Compute permission overrides diff
      const overrides: Record<string, boolean> = {}
      const role = (editValues.role || member.role) as PortalRole
      for (const p of ALL_PERMISSIONS) {
        if (permOverrides[p] !== hasPermission(role, p)) overrides[p] = !!permOverrides[p]
      }
      payload.permission_overrides = overrides
      await api.updateUser(member.id, payload)
      // Reload member
      const updated = await api.fetchUser(member.id)
      setMember(updated)
      setEditing(false)
      setSaveSuccess(true)
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Save failed.') }
    finally { setSaving(false) }
  }

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !member) return
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) { setSaveError('Please upload a JPG, PNG, WebP, or GIF image.'); return }
    if (file.size > 5 * 1024 * 1024) { setSaveError('Image must be smaller than 5 MB.'); return }
    setUploading(true); setSaveError(null)
    try {
      const url = await api.uploadAvatar(member.id, file)
      setMember(prev => prev ? { ...prev, avatar_url: url } : prev)
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Upload failed.') }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  async function handleRemoveAvatar() {
    if (!member) return
    setUploading(true); setSaveError(null)
    try {
      await api.removeAvatar(member.id)
      setMember(prev => prev ? { ...prev, avatar_url: null } : prev)
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Failed to remove photo.') }
    finally { setUploading(false) }
  }

  async function handleSetActiveInactive(setInactive: boolean) {
    if (!member || !currentUser) return
    setStatusUpdating(true); setSaveError(null)
    try {
      await api.lockUser(member.id, setInactive, { userId: currentUser.id, role: currentUser.role, unitId: currentUser.unit_id })
      setMember(prev => prev ? { ...prev, status: setInactive ? 'inactive' : 'active' } : prev)
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Failed to update status.') }
    finally { setStatusUpdating(false) }
  }

  if (loading) return (
    <div className="portal-page">
      <div className="portal-skeleton portal-skeleton-card" style={{ height: 120 }} />
      <div className="portal-skeleton portal-skeleton-card" style={{ height: 200 }} />
    </div>
  )

  if (error || !member) return (
    <div className="portal-page">
      <div className="portal-alert portal-alert-error">{error ?? 'Member not found.'}</div>
      <button onClick={() => navigate(-1)} className="portal-btn portal-btn-secondary portal-self-start"><ArrowLeft size={16} /> Go Back</button>
    </div>
  )

  const prefix = currentUser ? rolePrefix(currentUser.role) : '/portal/member'
  const displayName = member.full_name || [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')
  const age = getAgeThisYear(member.date_of_birth)

  const tabs: { key: Tab; label: string; icon: typeof Mail }[] = [
    { key: 'info', label: 'Details', icon: User },
    { key: 'messages', label: 'Messages', icon: Mail },
    { key: 'performance', label: 'Performance', icon: BarChart3 },
    { key: 'migrations', label: 'Migrations', icon: ArrowRightLeft },
  ]
  if (isAdmin) tabs.push({ key: 'permissions', label: 'Permissions', icon: Lock })

  return (
    <div className="portal-page">
      {/* ── Back button ── */}
      <button onClick={() => navigate(-1)} className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start">
        <ArrowLeft size={16} /> Back
      </button>

      {/* ── Status messages ── */}
      {saveSuccess && <div className="portal-alert portal-alert-success"><CheckCircle size={16} /> <p>Profile updated successfully!</p></div>}
      {saveError && <div className="portal-alert portal-alert-error">{saveError}</div>}

      {/* ── Hero card ── */}
      <div className="portal-profile-hero">
        <div className="portal-profile-hero-accent" />
        <div className="portal-profile-hero-body">
          <div className="portal-profile-hero-avatar-wrap">
            <UserAvatar name={displayName} avatarUrl={member.avatar_url} size="xl" />
            {isAdmin && (
              <label className="portal-profile-hero-avatar-overlay" aria-label="Change photo">
                <Camera size={20} />
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarSelect} hidden />
              </label>
            )}
          </div>
          <div className="portal-profile-hero-info">
            <h2 className="portal-profile-hero-name">{displayName}</h2>
            <div className="portal-profile-hero-role">
              <Shield size={14} />
              <span>{ROLE_LABELS[member.role]}</span>
              <StatusBadge status={member.status} />
              {member.title && <span className="portal-dashboard-hero-title">{member.title}</span>}
            </div>
            <HeroAgeBar dob={member.date_of_birth} />
            {isAdmin && (
              <div className="portal-profile-hero-actions">
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="portal-btn portal-btn-ghost portal-btn-sm">
                  <Camera size={14} /> {uploading ? 'Uploading…' : 'Change Photo'}
                </button>
                {member.avatar_url && (
                  <button onClick={handleRemoveAvatar} disabled={uploading} className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red">
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="portal-dashboard-hero-badges">
            <StatusBadge status={member.status} />
            {member.created_at && (
              <span className="portal-dashboard-hero-since">
                <Calendar size={12} /> Joined {new Date(member.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="portal-view-tabs">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              className={`portal-view-tab ${tab === t.key ? 'portal-view-tab-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      {tab === 'info' && (
        <>
          {/* Read-only details grid */}
          {!editing && (
            <div className="portal-profile-details">
              <div className="portal-view-section-header">
                <h3 className="portal-section-title">Personal Information</h3>
                {isAdmin && (
                  <button onClick={() => setEditing(true)} className="portal-btn portal-btn-secondary portal-btn-sm">
                    Edit Details
                  </button>
                )}
              </div>
              <div className="portal-profile-details-grid">
                <InfoItem icon={User} label="Full Name" value={displayName} />
                <InfoItem icon={Phone} label="Phone" value={member.phone} />
                <InfoItem icon={Building2} label="Unit" value={member.unit_name ?? '—'} />
                <InfoItem icon={MapPin} label="Zone" value="Delhi" />
                {member.circle_name && <InfoItem icon={Building2} label="Circle" value={member.circle_name} />}
                {member.campus_name && <InfoItem icon={Building2} label="Campus" value={member.campus_name} />}
                <InfoItem icon={Calendar} label="Date of Birth" value={member.date_of_birth ? formatDob(member.date_of_birth) : '—'} />
                <InfoItem icon={Activity} label="Age" value={age !== null ? `${age} years` : '—'} />
                <InfoItem icon={Activity} label="Status" value={member.status} capitalize />
                {member.title && <InfoItem icon={Award} label="Title" value={member.title} />}
                <InfoItem icon={Calendar} label="Joined" value={member.created_at ? new Date(member.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                {member.username && <InfoItem icon={User} label="Username" value={member.username} />}
              </div>
              {canSetActiveInactive && (
                <div className="portal-view-status-actions">
                  <span className="portal-view-status-label">Account status:</span>
                  <StatusBadge status={member.status} />
                  <button
                    onClick={() => handleSetActiveInactive(member.status === 'active')}
                    disabled={statusUpdating}
                    className={member.status === 'active' ? 'portal-btn portal-btn-ghost portal-btn-sm' : 'portal-btn portal-btn-secondary portal-btn-sm'}
                  >
                    {statusUpdating ? 'Updating…' : member.status === 'active' ? 'Set Inactive' : 'Set Active'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Admin edit form */}
          {editing && isAdmin && (
            <div className="portal-card portal-card-body">
              <div className="portal-view-section-header">
                <h3 className="portal-section-title">Edit Details</h3>
                <button onClick={() => { setEditing(false); setSaveError(null) }} className="portal-btn portal-btn-ghost portal-btn-sm">Cancel</button>
              </div>
              <div className="portal-edit-grid portal-edit-grid-2col" style={{ marginTop: 16 }}>
                <EditFieldInput label="First Name" value={editValues.first_name} onChange={v => setEditValues(p => ({ ...p, first_name: v }))} required />
                <EditFieldInput label="Middle Name" value={editValues.middle_name} onChange={v => setEditValues(p => ({ ...p, middle_name: v }))} />
                <EditFieldInput label="Last Name" value={editValues.last_name} onChange={v => setEditValues(p => ({ ...p, last_name: v }))} required />
                <EditFieldInput label="Phone" value={editValues.phone} onChange={v => setEditValues(p => ({ ...p, phone: v }))} type="tel" required />
                <EditFieldInput label="Date of Birth (DDMMYYYY)" value={editValues.date_of_birth} onChange={v => setEditValues(p => ({ ...p, date_of_birth: v }))} placeholder="e.g. 25031999" />
                <div className="portal-edit-field">
                  <label className="portal-label portal-label-required">Unit</label>
                  <select value={editValues.unit_id} onChange={e => setEditValues(p => ({ ...p, unit_id: e.target.value }))} className="portal-input portal-select">
                    <option value="">Select…</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="portal-edit-field">
                  <label className="portal-label">Circle</label>
                  <select value={editValues.circle_id} onChange={e => setEditValues(p => ({ ...p, circle_id: e.target.value }))} className="portal-input portal-select">
                    <option value="">— None —</option>
                    {circles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="portal-edit-field">
                  <label className="portal-label">Campus</label>
                  <select value={editValues.campus_id} onChange={e => setEditValues(p => ({ ...p, campus_id: e.target.value }))} className="portal-input portal-select">
                    <option value="">— None —</option>
                    {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="portal-edit-field">
                  <label className="portal-label portal-label-required">Status</label>
                  <select value={editValues.status} onChange={e => setEditValues(p => ({ ...p, status: e.target.value }))} className="portal-input portal-select">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="migrated">Migrated</option>
                  </select>
                </div>
                <div className="portal-edit-field">
                  <label className="portal-label portal-label-required">Role</label>
                  <select value={editValues.role} onChange={e => setEditValues(p => ({ ...p, role: e.target.value }))} className="portal-input portal-select">
                    {(['admin', 'zonal_secretary', 'regional_president', 'unit_president', 'member'] as const).map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Permissions */}
              <div className="portal-edit-permissions">
                <label className="portal-label">Powers (override role)</label>
                <div className="portal-edit-perms-grid">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p} className="portal-edit-perm-item">
                      <input type="checkbox" checked={permOverrides[p] ?? false} onChange={e => setPermOverrides(prev => ({ ...prev, [p]: e.target.checked }))} />
                      <span>{PERMISSION_LABELS[p]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="portal-edit-actions">
                <button onClick={() => { setEditing(false); setSaveError(null) }} disabled={saving} className="portal-btn portal-btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="portal-btn portal-btn-primary">
                  <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'messages' && (
        <div className="portal-card portal-card-body">
          <h3 className="portal-section-title" style={{ marginBottom: 12 }}>Messages ({messages.length})</h3>
          {tabLoading ? <div className="portal-spinner" /> : messages.length === 0 ? (
            <p className="portal-text-muted">No messages found.</p>
          ) : (
            <div className="portal-view-msg-list">
              {messages.map(msg => (
                <div key={msg.id} className="portal-view-msg-item">
                  <div className="portal-view-msg-header">
                    <span className="portal-view-msg-direction">{msg.sender_id === memberId ? 'Sent' : msg.is_broadcast ? 'Broadcast' : 'Received'}</span>
                    <span className="portal-text-muted" style={{ fontSize: '0.75rem' }}>{new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="portal-view-msg-subject">{msg.subject}</p>
                  <p className="portal-view-msg-body">{msg.body}</p>
                  <p className="portal-text-muted" style={{ fontSize: '0.75rem' }}>
                    {msg.sender_id === memberId ? `To: ${msg.recipient_name ?? msg.recipient_role ?? 'Broadcast'}` : `From: ${msg.sender_name ?? 'Unknown'}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'performance' && (
        <div className="portal-card portal-card-body">
          <h3 className="portal-section-title" style={{ marginBottom: 12 }}>Performance Responses ({perfResponses.length})</h3>
          {tabLoading ? <div className="portal-spinner" /> : perfResponses.length === 0 ? (
            <p className="portal-text-muted">No performance responses found.</p>
          ) : (
            <div className="portal-view-perf-list">
              {perfResponses.map(resp => (
                <PerfResponseCard key={resp.id} resp={resp} prefix={prefix} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'migrations' && (
        <div className="portal-card portal-card-body">
          <h3 className="portal-section-title" style={{ marginBottom: 12 }}>Migration History ({migrations.length})</h3>
          {tabLoading ? <div className="portal-spinner" /> : migrations.length === 0 ? (
            <p className="portal-text-muted">No migration requests found.</p>
          ) : (
            <div className="portal-view-migr-list">
              {migrations.map(m => (
                <div key={m.id} className="portal-view-migr-item">
                  <div className="portal-view-migr-header">
                    <StatusBadge status={m.status} />
                    <span className="portal-text-muted" style={{ fontSize: '0.75rem' }}>{new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--p-cream)' }}>
                    {m.from_unit_name ?? '—'} → {m.to_unit_name ?? m.to_location ?? '—'}
                  </p>
                  {m.reason && <p className="portal-text-muted" style={{ fontSize: '0.8125rem' }}>{m.reason}</p>}
                  <p className="portal-text-muted" style={{ fontSize: '0.75rem' }}>Requested by: {m.requested_by_name ?? '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'permissions' && isAdmin && member && (
        <div className="portal-card portal-card-body">
          <h3 className="portal-section-title" style={{ marginBottom: 12 }}>Effective Permissions</h3>
          <p className="portal-text-muted" style={{ fontSize: '0.8125rem', marginBottom: 12 }}>
            Base role: <strong>{ROLE_LABELS[member.role]}</strong>. Override permissions via the Edit Details form.
          </p>
          <div className="portal-edit-perms-grid">
            {ALL_PERMISSIONS.map(p => {
              const overrides = (member as unknown as Record<string, unknown>).permission_overrides as Record<string, boolean> | null
              const effective = overrides?.[p] ?? hasPermission(member.role, p)
              return (
                <div key={p} className="portal-edit-perm-item" style={{ cursor: 'default' }}>
                  <span style={{ width: 15, height: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: effective ? '#34d399' : 'var(--p-text-muted)' }}>
                    {effective ? '✓' : '✗'}
                  </span>
                  <span>{PERMISSION_LABELS[p]}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Small helper components ── */

function InfoItem({ icon: Icon, label, value, capitalize }: { icon: typeof User; label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="portal-profile-detail-item">
      <div className="portal-profile-detail-icon"><Icon size={16} /></div>
      <div>
        <span className="portal-profile-detail-label">{label}</span>
        <span className={`portal-profile-detail-value ${capitalize ? 'portal-profile-detail-value-cap' : ''}`}>{value}</span>
      </div>
    </div>
  )
}

function EditFieldInput({ label, value, onChange, type = 'text', required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string
}) {
  return (
    <div className="portal-edit-field">
      <label className={`portal-label ${required ? 'portal-label-required' : ''}`}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="portal-input" />
    </div>
  )
}

function PerfResponseCard({ resp }: { resp: PerfResponseWithForm; prefix: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="portal-view-perf-item">
      <div className="portal-view-perf-header" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--p-cream)' }}>{resp.form_title ?? 'Untitled Form'}</p>
          {resp.form_period && <span className="portal-text-muted" style={{ fontSize: '0.75rem' }}>Period: {resp.form_period}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="portal-text-muted" style={{ fontSize: '0.75rem' }}>{new Date(resp.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <ChevronDown size={14} style={{ color: 'var(--p-text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
        </div>
      </div>
      {expanded && resp.response_data && (
        <div className="portal-view-perf-body">
          {Object.entries(resp.response_data).map(([key, val]) => (
            <div key={key} className="portal-view-perf-answer">
              <span className="portal-text-muted" style={{ fontSize: '0.75rem' }}>{key}</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--p-cream)' }}>{Array.isArray(val) ? val.join(', ') : String(val ?? '—')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDob(dob: string): string {
  if (dob.length !== 8) return dob
  const day = dob.substring(0, 2)
  const month = dob.substring(2, 4)
  const year = dob.substring(4, 8)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const m = parseInt(month, 10)
  return `${parseInt(day, 10)} ${months[m - 1] ?? month} ${year}`
}
