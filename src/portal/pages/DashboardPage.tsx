import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, UserCheck, UserCog, ArrowRightLeft, Mail,
  Activity, UserX, TrendingUp, Phone, MapPin, Shield, Calendar,
  Clock, Lock, Unlock, Trash2, CircleDot, GraduationCap, Globe,
} from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { UserAvatar } from '../components/UserAvatar'
import { StatusBadge } from '../components/StatusBadge'
import { StatCard } from '../components/StatCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { HeroAgeBar, formatPreciseAge } from '../components/AgeBar'
import * as api from '../api'
import type { DashboardStats, DashboardStat, RetiringMember } from '../types'
import { ROLE_LABELS } from '../constants'

/** Return the URL prefix for a given role, e.g. admin → /portal/admin */
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

/** Calculate age progress toward 30 as a percentage (0-100, capped at 100) */
function ageProgress(ageThisYear: number): number {
  // Show progress from age 18 to 30 (12-year window)
  const min = 18
  const max = 30
  const clamped = Math.max(min, Math.min(max, ageThisYear))
  return Math.round(((clamped - min) / (max - min)) * 100)
}

export function DashboardPage() {
  const { user } = usePortalAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [retiringMembers, setRetiringMembers] = useState<RetiringMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lockTarget, setLockTarget] = useState<RetiringMember | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RetiringMember | null>(null)
  const [retiringOpen, setRetiringOpen] = useState(false)

  const isLeader = user?.role === 'admin' || user?.role === 'zonal_secretary'

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      try {
        const data = await api.fetchDashboardStats(user!.role, user!.id, user!.unit_id, user!.region_id)
        if (!cancelled) setStats(data)
        // Fetch retiring members for admin / zonal
        if (user!.role === 'admin' || user!.role === 'zonal_secretary') {
          const retiring = await api.fetchRetiringMembers()
          if (!cancelled) setRetiringMembers(retiring)
        }
      }
      catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load stats.') }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  if (!user) return null

  const prefix = rolePrefix(user.role)
  const displayName = user.full_name || user.first_name

  async function handleLock() {
    if (!lockTarget || !user) return
    const shouldLock = lockTarget.status === 'active'
    try {
      await api.lockUser(lockTarget.id, shouldLock, { userId: user.id, role: user.role, unitId: user.unit_id })
      setRetiringMembers(prev => prev.map(m => m.id === lockTarget.id ? { ...m, status: shouldLock ? 'inactive' : 'active' } : m))
      setLockTarget(null)
    } catch { /* ignore */ }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api.deleteUser(deleteTarget.id)
      setRetiringMembers(prev => prev.filter(m => m.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch { /* ignore */ }
  }

  function getStatCards(): DashboardStat[] {
    if (!stats) return []
    const role = user!.role
    const cards: DashboardStat[] = []

    if (role === 'admin' || role === 'zonal_secretary' || role === 'regional_president') {
      cards.push(
        { label: 'Units', value: stats.totalUnits, icon: Building2, color: 'amber', to: `${prefix}/units${role === 'admin' ? '/manage' : ''}` },
      )
      if (role === 'admin' || role === 'zonal_secretary') {
        cards.push(
          { label: 'Regions', value: stats.totalRegions ?? 0, icon: Globe, color: 'indigo', to: `${prefix}/regions` },
          { label: 'Total Circles', value: stats.totalCircles ?? 0, icon: CircleDot, color: 'amber', to: `${prefix}/circles${role === 'admin' ? '/manage' : ''}` },
          { label: 'Campuses', value: stats.totalCampuses ?? 0, icon: GraduationCap, color: 'amber', to: `${prefix}/campuses${role === 'admin' ? '/manage' : ''}` },
        )
      }
      cards.push(
        { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'red', to: `${prefix}/members${role === 'admin' ? '/manage' : ''}` },
        { label: 'Active Members', value: stats.activeMembers, icon: Activity, color: 'green', to: `${prefix}/members${role === 'admin' ? '/manage' : ''}` },
        { label: 'Inactive Members', value: stats.inactiveMembers, icon: UserX, color: 'slate', to: `${prefix}/members${role === 'admin' ? '/manage' : ''}` },
        { label: 'Migrated', value: stats.migratedMembers, icon: ArrowRightLeft, color: 'amber', to: `${prefix}/migrations` },
        { label: 'Unit Presidents', value: stats.totalRegionUnits ? `${stats.totalUnitPresidents} / ${stats.totalRegionUnits}` : stats.totalUnitPresidents, icon: UserCheck, color: 'amber', to: role === 'admin' && (stats.unitsWithoutPresident ?? 0) > 0 ? `${prefix}/unit-presidents/units-without-president` : `${prefix}/unit-presidents${role === 'admin' ? '/manage' : ''}` },
      )
      if (role === 'admin') cards.push({ label: 'Zonal Secretaries', value: stats.totalZonalSecretaries, icon: UserCog, color: 'red', to: `${prefix}/zonal-secretaries/manage` })
      cards.push(
        { label: 'Retiring Members', value: stats.retiringMembers ?? 0, icon: Clock, color: 'amber', onClick: () => setRetiringOpen(prev => !prev) },
        { label: 'Pending Migrations', value: stats.pendingMigrations, icon: ArrowRightLeft, color: 'amber', to: `${prefix}/migrations` },
        { label: 'Unread Messages', value: stats.unreadMessages, icon: Mail, color: 'red', to: `${prefix}/messages/inbox` },
      )
    }

    if (role === 'unit_president') {
      cards.push(
        { label: 'Unit Members', value: stats.totalMembers, icon: Users, color: 'red', to: `${prefix}/members` },
        { label: 'Active', value: stats.activeMembers, icon: Activity, color: 'green', to: `${prefix}/members` },
        { label: 'Inactive', value: stats.inactiveMembers, icon: UserX, color: 'slate', to: `${prefix}/members` },
        { label: 'Migrated', value: stats.migratedMembers, icon: ArrowRightLeft, color: 'amber', to: `${prefix}/members` },
        { label: 'Performance', value: 'View', icon: TrendingUp, color: 'green', to: `${prefix}/performance` },
        { label: 'Unread Messages', value: stats.unreadMessages, icon: Mail, color: 'red', to: `${prefix}/messages/inbox` },
      )
    }

    if (role === 'member') {
      cards.push(
        { label: 'Performance', value: 'View', icon: TrendingUp, color: 'green', to: `${prefix}/performance` },
        { label: 'Migrations', value: 'View', icon: ArrowRightLeft, color: 'amber', to: `${prefix}/migrations` },
        { label: 'Unread Messages', value: stats.unreadMessages, icon: Mail, color: 'red', to: `${prefix}/messages/inbox` },
      )
    }

    return cards
  }

  return (
    <div className="portal-page">
      {/* ── Member Overview Card ── */}
      <div className="portal-dashboard-hero">
        <div className="portal-dashboard-hero-bg" />
        <div className="portal-dashboard-hero-content">
          <UserAvatar name={displayName} avatarUrl={user.avatar_url} size="xl" />
          <div className="portal-dashboard-hero-info">
            <h1 className="portal-dashboard-hero-name">{displayName}</h1>
            <div className="portal-dashboard-hero-role">
              <Shield size={14} />
              <span>{ROLE_LABELS[user.role]}</span>
              {user.title && <span className="portal-dashboard-hero-title">{user.title}</span>}
            </div>
            <HeroAgeBar dob={user.date_of_birth} />
            <div className="portal-dashboard-hero-meta">
              {user.phone && (
                <span className="portal-dashboard-hero-meta-item">
                  <Phone size={13} /> {user.phone}
                </span>
              )}
              {user.unit_name && (
                <span className="portal-dashboard-hero-meta-item">
                  <Building2 size={13} /> {user.unit_name}
                </span>
              )}
              <span className="portal-dashboard-hero-meta-item">
                <MapPin size={13} /> Delhi Zone
              </span>
            </div>
          </div>
          <div className="portal-dashboard-hero-badges">
            <StatusBadge status={user.status} />
            {user.created_at && (
              <span className="portal-dashboard-hero-since">
                <Calendar size={12} /> Joined {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Section heading ── */}
      <div className="portal-dashboard-section-heading">
        <h2>Overview</h2>
        <p>Quick access to your most important data</p>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="portal-grid-stats">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="portal-skeleton portal-skeleton-card" />)}
        </div>
      )}

      {/* ── Error ── */}
      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      {/* ── Stats grid ── */}
      {stats && (
        <div className="portal-grid-stats">
          {getStatCards().map((stat, i) => <StatCard key={i} stat={stat} />)}
        </div>
      )}

      {/* ── Retiring Members Section (admin/zonal only) ── */}
      {isLeader && retiringMembers.length > 0 && retiringOpen && (
        <>
          <div className="portal-dashboard-section-heading">
            <h2>Retiring Members</h2>
            <p>Members who have turned 30 by December 31 — retired (age 30+ as of year end)</p>
          </div>
          <div className="portal-card portal-card-body">
            <div className="portal-retiring-list">
              {retiringMembers.map(member => {
                const age = Number(member.age_this_year) || 0
                const pct = ageProgress(age)
                const isRetired = age >= 30
                return (
                  <div key={member.id} className={`portal-retiring-row ${isRetired ? 'portal-retiring-row-retired' : ''}`}>
                    <div className="portal-retiring-info">
                      <UserAvatar name={member.full_name} avatarUrl={member.avatar_url} size="sm" />
                      <div className="portal-retiring-details">
                        <button className="portal-table-link portal-retiring-name" onClick={() => navigate(`${prefix}/members/${member.id}`)}>{member.full_name}</button>
                        <span className="portal-retiring-meta">
                          {member.unit_name ?? 'No unit'} &middot; {formatPreciseAge(member.date_of_birth, true) ?? `Age ${age}`}
                          {member.status !== 'active' && <StatusBadge status={member.status} />}
                        </span>
                      </div>
                    </div>
                    <div className="portal-retiring-bar-wrap">
                      <div className="portal-retiring-bar">
                        <div
                          className={`portal-retiring-bar-fill ${isRetired ? 'portal-retiring-bar-gold' : 'portal-retiring-bar-normal'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`portal-retiring-bar-label ${isRetired ? 'portal-retiring-label-gold' : ''}`}>
                        {isRetired ? 'Retired' : `${age}/30`}
                      </span>
                    </div>
                    {(user.role === 'admin' || user.role === 'zonal_secretary' || user.role === 'regional_president' || user.role === 'unit_president') && (
                      <div className="portal-retiring-actions">
                        <button onClick={() => setLockTarget(member)} className="portal-btn portal-btn-ghost portal-btn-sm" title={member.status === 'active' ? 'Set inactive' : 'Set active'}>
                          {member.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                        {user.role === 'admin' && (
                          <button onClick={() => setDeleteTarget(member)} className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red" title="Delete member">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!lockTarget}
        title={lockTarget?.status === 'active' ? 'Set Inactive' : 'Set Active'}
        message={lockTarget ? (lockTarget.status === 'active'
          ? `Set "${lockTarget.full_name}" to inactive? They won't be able to log in until set back to active.`
          : `Set "${lockTarget.full_name}" to active? They'll be able to log in again.`
        ) : ''}
        confirmLabel={lockTarget?.status === 'active' ? 'Set Inactive' : 'Set Active'}
        danger={lockTarget?.status === 'active'}
        onConfirm={handleLock}
        onCancel={() => setLockTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Member"
        message={deleteTarget ? `Permanently delete "${deleteTarget.full_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
