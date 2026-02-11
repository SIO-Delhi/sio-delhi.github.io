import { useState, useEffect } from 'react'
import { BarChart3, Plus, Eye, FileText, Users, Trash2, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePortalAuth } from '../context/PortalAuthContext'
import { ConfirmDialog } from '../components/ConfirmDialog'
import * as api from '../api'
import type { PerfForm } from '../types'

export function PerformancePage() {
  const { user } = usePortalAuth()
  const [forms, setForms] = useState<PerfForm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PerfForm | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      try {
        const data = await api.fetchPerfForms({
          role: user!.role,
          userId: user!.id,
          unitId: user!.unit_id ?? undefined,
        })
        if (!cancelled) setForms(data)
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load.') }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  if (!user) return null

  const isMember = user.role === 'member'
  const isUnitPresident = user.role === 'unit_president'
  const canCreate = user.role === 'admin' || user.role === 'zonal_secretary' || user.role === 'regional_president' || isUnitPresident

  const pathPrefix = `/portal/${user.role === 'admin' ? 'admin' : user.role === 'zonal_secretary' ? 'zonal' : user.role === 'regional_president' ? 'regional' : user.role === 'unit_president' ? 'unit' : 'member'}`

  async function handleDelete() {
    if (!deleteTarget) return
    try { await api.deletePerfForm(deleteTarget.id); setForms(f => f.filter(x => x.id !== deleteTarget.id)); setDeleteTarget(null) }
    catch (err) { setError(err instanceof Error ? err.message : 'Delete failed.') }
  }

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <div>
          <h1 className="portal-heading">Performance</h1>
          <p className="portal-subheading">
            {isMember ? 'View and fill out performance forms assigned to you.' : 'Create and manage performance evaluation forms.'}
          </p>
        </div>
        {canCreate && (
          <Link to={`${pathPrefix}/performance/create`} className="portal-btn portal-btn-primary">
            <Plus size={16} /> Create Form
          </Link>
        )}
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      {loading && (
        <div className="portal-loading-list">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="portal-skeleton portal-skeleton-card" />)}
        </div>
      )}

      {!loading && forms.length === 0 && (
        <div className="portal-empty">
          <div className="portal-empty-icon"><BarChart3 size={28} /></div>
          <h3 className="portal-empty-title">No performance forms</h3>
          <p className="portal-empty-desc">
            {canCreate ? 'Create your first performance evaluation form.' : 'No forms have been assigned yet.'}
          </p>
        </div>
      )}

      {!loading && forms.length > 0 && (
        <div className="portal-grid-stats">
          {forms.map(form => (
            <div key={form.id} className="portal-card portal-card-body-sm">
              <div className="portal-perf-card-header">
                <div>
                  <h3 className="portal-perf-card-title">{form.title}</h3>
                  {form.description && <p className="portal-perf-card-desc">{form.description}</p>}
                </div>
                {form.is_active ? <span className="portal-badge portal-badge-active">Active</span> : <span className="portal-badge portal-badge-inactive">Inactive</span>}
              </div>

              <div className="portal-perf-card-meta">
                {form.period && <span className="portal-perf-card-meta-item"><FileText size={14} /> {form.period}</span>}
                <span className="portal-perf-card-meta-item"><BarChart3 size={14} /> {form.field_count ?? 0} fields</span>
                {!isMember && <span className="portal-perf-card-meta-item"><Users size={14} /> {form.response_count ?? 0} responses</span>}
                {form.scope_unit_name && <span className="portal-perf-card-meta-item">{form.scope_unit_name}</span>}
                {!form.scope_unit_id && <span className="portal-perf-card-meta-item">Zone-wide</span>}
              </div>

              <div className="portal-perf-card-actions">
                {isMember ? (
                  <Link to={`${pathPrefix}/performance/${form.id}/fill`} className="portal-btn portal-btn-primary portal-btn-sm">
                    <FileText size={14} /> Fill Form
                  </Link>
                ) : isUnitPresident && !form.scope_unit_id ? (
                  /* Zone-level forms: unit presidents can only fill them, not edit/delete/view responses */
                  <Link to={`${pathPrefix}/performance/${form.id}/fill`} className="portal-btn portal-btn-primary portal-btn-sm">
                    <FileText size={14} /> Fill Form
                  </Link>
                ) : (
                  <>
                    <Link to={`${pathPrefix}/performance/${form.id}/responses`} className="portal-btn portal-btn-secondary portal-btn-sm">
                      <Eye size={14} /> Responses
                    </Link>
                    {canCreate && (
                      <Link to={`${pathPrefix}/performance/${form.id}/edit`} className="portal-btn portal-btn-ghost portal-btn-sm">
                        <Pencil size={14} /> Edit
                      </Link>
                    )}
                    <Link to={`${pathPrefix}/performance/${form.id}/fill`} className="portal-btn portal-btn-ghost portal-btn-sm">
                      <FileText size={14} /> Preview
                    </Link>
                    {canCreate && (
                      <button onClick={() => setDeleteTarget(form)} className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} title="Delete Form" message={deleteTarget ? `Delete "${deleteTarget.title}" and all its responses? This cannot be undone.` : ''} confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
