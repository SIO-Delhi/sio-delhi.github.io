import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, UserCheck } from 'lucide-react'
import * as api from '../api'

export function UnitsWithoutPresidentPage() {
  const navigate = useNavigate()
  const [units, setUnits] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.fetchRegionUnitsWithoutPresident()
      .then((list) => { if (!cancelled) setUnits(list) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="portal-page">
        <div className="portal-skeleton portal-skeleton-card" style={{ height: 200 }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="portal-page">
        <div className="portal-alert portal-alert-error">{error}</div>
        <button onClick={() => navigate(-1)} className="portal-btn portal-btn-secondary portal-self-start">
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    )
  }

  return (
    <div className="portal-page">
      <button
        onClick={() => navigate('/portal/admin/unit-presidents/manage')}
        className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start"
      >
        <ArrowLeft size={16} /> Back to Unit Presidents
      </button>

      <div className="portal-entity-hero" style={{ marginTop: 8 }}>
        <div className="portal-entity-hero-icon" style={{ background: 'var(--p-amber-bg)', color: 'var(--p-amber)' }}>
          <UserCheck size={28} />
        </div>
        <div>
          <h1 className="portal-entity-hero-name">Region units without president</h1>
          <p className="portal-entity-hero-meta">
            {units.length} unit{units.length !== 1 ? 's' : ''} with no unit president assigned. Assign from Unit Presidents → Manage.
          </p>
        </div>
      </div>

      {units.length === 0 ? (
        <p className="portal-text-muted">All region units have a president assigned.</p>
      ) : (
        <section className="portal-entity-section">
          <h2 className="portal-section-title">Units</h2>
          <div className="portal-entity-member-list">
            {units.map((u) => (
              <div key={u.id} className="portal-entity-member-row" style={{ cursor: 'default', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Building2 size={18} className="portal-text-muted" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{u.name}</span>
                <button
                  type="button"
                  className="portal-btn portal-btn-sm portal-btn-secondary"
                  onClick={() => navigate('/portal/admin/unit-presidents/manage')}
                >
                  Assign president
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="portal-text-muted" style={{ marginTop: 16, fontSize: '0.875rem' }}>
        To assign a president: go to Unit Presidents → Manage, then add or edit a user and set their role to Unit President and unit to the one above.
      </p>
    </div>
  )
}
