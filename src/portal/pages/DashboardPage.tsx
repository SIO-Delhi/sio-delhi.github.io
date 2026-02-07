import { useState, useEffect } from 'react'
import {
  Building2, Users, UserCheck, UserCog, ArrowRightLeft, Mail,
  Activity, UserX, TrendingUp,
} from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { StatCard } from '../components/StatCard'
import * as api from '../api'
import type { DashboardStats, DashboardStat } from '../types'
import { ROLE_LABELS } from '../constants'

export function DashboardPage() {
  const { user } = usePortalAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      try { const data = await api.fetchDashboardStats(user!.role, user!.id, user!.unit_id); if (!cancelled) setStats(data) }
      catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load stats.') }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  if (!user) return null

  function getStatCards(): DashboardStat[] {
    if (!stats) return []
    const role = user!.role
    const cards: DashboardStat[] = []

    if (role === 'admin' || role === 'zonal_secretary' || role === 'regional_president') {
      cards.push(
        { label: 'Total Units', value: stats.totalUnits, icon: Building2, color: 'amber' },
        { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'red' },
        { label: 'Active Members', value: stats.activeMembers, icon: Activity, color: 'green' },
        { label: 'Inactive Members', value: stats.inactiveMembers, icon: UserX, color: 'slate' },
        { label: 'Migrated', value: stats.migratedMembers, icon: ArrowRightLeft, color: 'amber' },
        { label: 'Unit Presidents', value: stats.totalUnitPresidents, icon: UserCheck, color: 'amber' },
      )
      if (role === 'admin') cards.push({ label: 'Zonal Secretaries', value: stats.totalZonalSecretaries, icon: UserCog, color: 'red' })
      cards.push(
        { label: 'Pending Migrations', value: stats.pendingMigrations, icon: ArrowRightLeft, color: 'amber' },
        { label: 'Unread Messages', value: stats.unreadMessages, icon: Mail, color: 'red' },
      )
    }

    if (role === 'unit_president') {
      cards.push(
        { label: 'Unit Members', value: stats.totalMembers, icon: Users, color: 'red' },
        { label: 'Active', value: stats.activeMembers, icon: Activity, color: 'green' },
        { label: 'Inactive', value: stats.inactiveMembers, icon: UserX, color: 'slate' },
        { label: 'Migrated', value: stats.migratedMembers, icon: ArrowRightLeft, color: 'amber' },
        { label: 'Unread Messages', value: stats.unreadMessages, icon: Mail, color: 'red' },
      )
    }

    if (role === 'member') {
      cards.push(
        { label: 'Status', value: user!.status.charAt(0).toUpperCase() + user!.status.slice(1), icon: Activity, color: user!.status === 'active' ? 'green' : 'amber' },
        { label: 'Unit', value: user!.unit_name ?? '—', icon: Building2, color: 'amber' },
        { label: 'Unread Messages', value: stats.unreadMessages, icon: Mail, color: 'red' },
        { label: 'Performance', value: 'View', icon: TrendingUp, color: 'green' },
      )
    }

    return cards
  }

  return (
    <div className="portal-page">
      {/* Welcome */}
      <div>
        <h1 className="portal-heading">Welcome back, {user.first_name}</h1>
        <p className="portal-subheading">
          {ROLE_LABELS[user.role]}{user.title ? ` — ${user.title}` : ''} Dashboard — Delhi Zone
          {user.unit_name && <span> &middot; {user.unit_name}</span>}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="portal-grid-stats">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="portal-skeleton portal-skeleton-card" />)}
        </div>
      )}

      {/* Error */}
      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      {/* Stats grid */}
      {stats && (
        <div className="portal-grid-stats">
          {getStatCards().map((stat, i) => <StatCard key={i} stat={stat} />)}
        </div>
      )}

      {/* Overview card */}
      {stats && (
        <div className="portal-card portal-card-body">
          <h3 className="portal-overview-card-title">Overview</h3>
          <div className="portal-grid-overview">
            {[
              { label: 'Zone', value: 'Delhi' },
              { label: 'Role', value: ROLE_LABELS[user.role] },
              ...(user.unit_name ? [{ label: 'Unit', value: user.unit_name }] : []),
              { label: 'Phone', value: user.phone },
            ].map(item => (
              <div key={item.label} className="portal-card-inset portal-overview-item">
                <span className="portal-overview-item-label">{item.label}</span>
                <span className="portal-overview-item-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
