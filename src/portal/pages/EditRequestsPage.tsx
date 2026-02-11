import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, User, Phone } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import * as api from '../api'
import type { EditRequest } from '../api'

const FIELD_LABELS: Record<string, string> = {
  first_name: 'First Name',
  middle_name: 'Middle Name',
  last_name: 'Last Name',
  phone: 'Phone',
  alt_phone: 'Alt Phone',
  date_of_birth: 'Date of Birth',
}

export function EditRequestsPage() {
  const { user } = usePortalAuth()
  const [requests, setRequests] = useState<EditRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      try {
        const data = await api.fetchEditRequests({
          unitId: user!.role === 'unit_president' ? (user!.unit_id ?? undefined) : undefined,
          status: 'pending',
        })
        if (!cancelled) setRequests(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  if (!user) return null

  async function handleResolve(id: string, status: 'approved' | 'rejected') {
    setResolving(id)
    try {
      await api.resolveEditRequest(id, status, user!.id)
      setRequests(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.')
    } finally {
      setResolving(null)
    }
  }

  return (
    <div className="portal-page">
      <div>
        <h1 className="portal-heading">Edit Requests</h1>
        <p className="portal-subheading">Review and approve member profile change requests.</p>
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      {loading && (
        <div className="portal-loading-list">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="portal-skeleton portal-skeleton-card" />)}
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="portal-empty">
          <div className="portal-empty-icon"><CheckCircle size={28} /></div>
          <h3 className="portal-empty-title">No pending requests</h3>
          <p className="portal-empty-desc">All member profile edit requests have been reviewed.</p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="portal-grid-stats">
          {requests.map(req => (
            <div key={req.id} className="portal-card portal-card-body-sm">
              <div className="portal-perf-card-header">
                <div>
                  <h3 className="portal-perf-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={16} /> {req.member_name ?? 'Unknown Member'}
                  </h3>
                  {req.member_phone && (
                    <p className="portal-perf-card-desc" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} /> {req.member_phone}
                    </p>
                  )}
                </div>
                <span className="portal-badge portal-badge-active" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> Pending
                </span>
              </div>

              <div style={{ marginTop: 12 }}>
                <p className="portal-text-muted" style={{ fontSize: '0.75rem', marginBottom: 8 }}>Requested changes:</p>
                <div style={{ display: 'grid', gap: 4 }}>
                  {Object.entries(req.changes).map(([field, value]) => (
                    <div key={field} style={{ display: 'flex', gap: 8, fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--p-text-muted)', minWidth: 100 }}>{FIELD_LABELS[field] ?? field}:</span>
                      <span style={{ color: 'var(--p-cream)' }}>{String(value ?? '—')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="portal-perf-card-meta" style={{ marginTop: 8 }}>
                <span className="portal-perf-card-meta-item">
                  {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="portal-perf-card-actions" style={{ marginTop: 12 }}>
                <button
                  onClick={() => handleResolve(req.id, 'approved')}
                  disabled={resolving === req.id}
                  className="portal-btn portal-btn-primary portal-btn-sm"
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  onClick={() => handleResolve(req.id, 'rejected')}
                  disabled={resolving === req.id}
                  className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
