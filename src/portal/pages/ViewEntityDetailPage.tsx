import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Users, UserCheck, UserX } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { UserAvatar } from '../components/UserAvatar'
import { StatusBadge } from '../components/StatusBadge'
import * as api from '../api'
import type { PortalUser, PortalUnit, PortalCircle, PortalCampus } from '../types'

type EntityKind = 'unit' | 'circle' | 'campus'

const ENTITY_LABEL: Record<EntityKind, { singular: string; plural: string }> = {
  unit: { singular: 'Unit', plural: 'Units' },
  circle: { singular: 'Circle', plural: 'Circles' },
  campus: { singular: 'Campus', plural: 'Campuses' },
}

interface ViewEntityDetailPageProps {
  entity: EntityKind
  paramKey: string
}

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

export function ViewEntityDetailPage({ entity, paramKey }: ViewEntityDetailPageProps) {
  const params = useParams()
  const id = params[paramKey]
  const { user } = usePortalAuth()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<PortalUnit | PortalCircle | PortalCampus | null>(null)
  const [members, setMembers] = useState<PortalUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        if (entity === 'unit') {
          const [d, m] = await Promise.all([api.fetchUnit(id!), api.fetchUnitMembers(id!)])
          if (!cancelled) { setDetail(d); setMembers(m) }
        } else if (entity === 'circle') {
          const [d, m] = await Promise.all([api.fetchCircle(id!), api.fetchCircleMembers(id!)])
          if (!cancelled) { setDetail(d); setMembers(m) }
        } else {
          const [d, m] = await Promise.all([api.fetchCampus(id!), api.fetchCampusMembers(id!)])
          if (!cancelled) { setDetail(d); setMembers(m) }
        }
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load.') }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [id, entity])

  if (loading) return <div className="portal-page"><div className="portal-skeleton portal-skeleton-card" style={{ height: 200 }} /></div>
  if (error || !detail) return (
    <div className="portal-page">
      <div className="portal-alert portal-alert-error">{error ?? 'Not found.'}</div>
      <button onClick={() => navigate(-1)} className="portal-btn portal-btn-secondary portal-self-start"><ArrowLeft size={16} /> Back</button>
    </div>
  )

  const name = (detail as { name?: string }).name ?? ''
  const labels = ENTITY_LABEL[entity]
  const prefix = user ? rolePrefix(user.role) : '/portal/member'

  const active = members.filter(m => m.status === 'active')
  const inactive = members.filter(m => m.status === 'inactive')
  const migrated = members.filter(m => m.status === 'migrated')

  // President and secretaries/titled members for display under the entity name
  const unitPresident = entity === 'unit' ? members.find(m => m.role === 'unit_president') : null
  const campusPresident = entity === 'campus' ? members.find(m => m.role === 'campus_president') : null
  const titledMembers = members.filter(m => {
    const title = m.display_title ?? m.title
    if (!title || !title.trim()) return false
    if (entity === 'unit' && m.role === 'unit_president') return false
    if (entity === 'campus' && m.role === 'campus_president') return false
    return true
  })
  const hasLeaders = (entity === 'unit' && unitPresident) || (entity === 'campus' && campusPresident) || titledMembers.length > 0

  function MemberRow({ m }: { m: PortalUser }) {
    const titleLabel = m.display_title ?? m.title
    const subtitle = [m.unit_name ?? '—', titleLabel].filter(Boolean).join(' · ') + (m.phone ? ` · ${m.phone}` : '')
    return (
      <button className="portal-entity-member-row" onClick={() => navigate(`${prefix}/members/${m.id}`)}>
        <UserAvatar name={m.full_name} avatarUrl={m.avatar_url} size="sm" />
        <div className="portal-entity-member-info">
          <span className="portal-entity-member-name">{m.full_name}</span>
          <span className="portal-text-muted" style={{ fontSize: '0.75rem' }}>{subtitle || '—'}</span>
        </div>
        <StatusBadge status={m.status} />
      </button>
    )
  }

  return (
    <div className="portal-page">
      <button onClick={() => navigate(-1)} className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="portal-entity-hero">
        <div className="portal-entity-hero-icon"><Building2 size={28} /></div>
        <div>
          <h1 className="portal-entity-hero-name">{name}</h1>
          <p className="portal-entity-hero-meta">{labels.singular} · {members.length} member{members.length !== 1 ? 's' : ''}</p>
          {hasLeaders && (
            <div className="portal-entity-hero-leaders" style={{ marginTop: 10, fontSize: '0.875rem', color: 'var(--p-text-muted)', display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
              {entity === 'unit' && unitPresident && (
                <span><strong style={{ color: 'var(--p-cream)' }}>Unit President:</strong> {unitPresident.full_name}</span>
              )}
              {entity === 'campus' && campusPresident && (
                <span><strong style={{ color: 'var(--p-cream)' }}>Campus President:</strong> {campusPresident.full_name}</span>
              )}
              {titledMembers.map(m => (
                <span key={m.id}>
                  <strong style={{ color: 'var(--p-cream)' }}>{(m.display_title ?? m.title)?.trim()}:</strong> {m.full_name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="portal-entity-stats">
        <div className="portal-entity-stat">
          <UserCheck size={18} />
          <span>Active</span>
          <strong>{active.length}</strong>
        </div>
        <div className="portal-entity-stat">
          <UserX size={18} />
          <span>Inactive</span>
          <strong>{inactive.length}</strong>
        </div>
        {migrated.length > 0 && (
          <div className="portal-entity-stat">
            <Users size={18} />
            <span>Migrated</span>
            <strong>{migrated.length}</strong>
          </div>
        )}
      </div>

      <section className="portal-entity-section">
        <h2 className="portal-section-title">Active members ({active.length})</h2>
        {active.length === 0 ? <p className="portal-text-muted">No active members.</p> : (
          <div className="portal-entity-member-list">
            {active.map(m => <MemberRow key={m.id} m={m} />)}
          </div>
        )}
      </section>

      <section className="portal-entity-section">
        <h2 className="portal-section-title">Inactive members ({inactive.length})</h2>
        {inactive.length === 0 ? <p className="portal-text-muted">No inactive members.</p> : (
          <div className="portal-entity-member-list">
            {inactive.map(m => <MemberRow key={m.id} m={m} />)}
          </div>
        )}
      </section>

      {migrated.length > 0 && (
        <section className="portal-entity-section">
          <h2 className="portal-section-title">Migrated ({migrated.length})</h2>
          <div className="portal-entity-member-list">
            {migrated.map(m => <MemberRow key={m.id} m={m} />)}
          </div>
        </section>
      )}

      <section className="portal-entity-section">
        <h2 className="portal-section-title">All members ({members.length})</h2>
        <div className="portal-entity-member-list">
          {members.map(m => <MemberRow key={m.id} m={m} />)}
        </div>
      </section>
    </div>
  )
}
