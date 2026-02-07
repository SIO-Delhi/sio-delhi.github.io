import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, Building2 } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import * as api from '../api'

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

export function RegionsPage() {
  const { user } = usePortalAuth()
  const navigate = useNavigate()
  const [regions, setRegions] = useState<api.RegionWithUnits[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const data = await api.fetchRegions()
        if (!cancelled) setRegions(data)
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load regions.') }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const prefix = user ? rolePrefix(user.role) : '/portal/admin'

  if (loading) return <div className="portal-page"><div className="portal-skeleton portal-skeleton-card" style={{ height: 200 }} /></div>
  if (error) return <div className="portal-page"><div className="portal-alert portal-alert-error">{error}</div></div>

  return (
    <div className="portal-page">
      <div>
        <h1 className="portal-heading">Regions</h1>
        <p className="portal-subheading">Regional presidents and the units under each region.</p>
      </div>

      {regions.length === 0 ? (
        <div className="portal-card portal-card-body">
          <p className="portal-text-muted">No regions configured. Assign units to regional presidents in the database.</p>
        </div>
      ) : (
        <div className="portal-regions-list">
          {regions.map(r => (
            <div key={r.region_id} className="portal-region-card">
              <div className="portal-region-header">
                <div className="portal-region-icon"><Globe size={22} /></div>
                <div>
                  <h2 className="portal-region-name">{r.region_name}</h2>
                  {r.regional_president_name && <p className="portal-text-muted" style={{ fontSize: '0.8125rem', margin: '2px 0 0' }}>{r.regional_president_name}{r.phone ? ` · ${r.phone}` : ''}</p>}
                </div>
              </div>
              <div className="portal-region-units">
                <span className="portal-region-units-label">Units ({r.units.length}):</span>
                {r.units.length === 0 ? (
                  <p className="portal-text-muted" style={{ fontSize: '0.8125rem' }}>No units assigned</p>
                ) : (
                  <div className="portal-region-unit-chips">
                    {r.units.map(u => (
                      <button
                        key={u.id}
                        className="portal-region-unit-chip"
                        onClick={() => navigate(`${prefix}/units/${u.id}`)}
                      >
                        <Building2 size={14} /> {u.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
