import { useState, useEffect } from 'react'
import { BarChart3, Plus, Eye, FileText, Users, Trash2, Pencil, Globe2, Copy } from 'lucide-react'
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
  const [linkLoadingId, setLinkLoadingId] = useState<string | null>(null)

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

  function getCanonicalOrigin() {
    return 'https://siodelhi.org'
  }

  function getShareTarget(form: PerfForm) {
    const isPublic = Number(form.is_public ?? 0) === 1
    const path = isPublic ? `/portal/public/forms/${form.id}` : `/portal/forms/${form.id}/fill`
    return {
      kind: isPublic ? 'public' as const : 'internal' as const,
      fullUrl: `${getCanonicalOrigin()}${path}`,
    }
  }

  async function copyShortFormLink(form: PerfForm) {
    const { kind, fullUrl } = getShareTarget(form)
    setLinkLoadingId(form.id)
    setError(null)
    try {
      const link = await api.createPerfFormShortLink(form.id, fullUrl, kind)
      await navigator.clipboard.writeText(link.shortUrl)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create short link.'
      try {
        await navigator.clipboard.writeText(fullUrl)
      } catch {
        window.prompt('Form link', fullUrl)
      }
      setError(`${message} Copied the full form link instead.`)
    } finally {
      setLinkLoadingId(null)
    }
  }

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <div>
          <h1 className="portal-heading">Forms</h1>
          <p className="portal-subheading">
            {isMember ? 'View and fill out forms assigned to you.' : 'Create and manage forms.'}
          </p>
        </div>
      </div>

      {canCreate && (
        <div className="portal-center-action">
          <Link to={`${pathPrefix}/forms/create`} className="portal-btn portal-btn-primary">
            <Plus size={16} /> Create Form
          </Link>
        </div>
      )}

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      {loading && (
        <div className="portal-loading-list">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="portal-skeleton portal-skeleton-card" />)}
        </div>
      )}

      {!loading && forms.length === 0 && (
        <div className="portal-empty">
          <div className="portal-empty-icon"><BarChart3 size={28} /></div>
          <h3 className="portal-empty-title">No forms</h3>
          <p className="portal-empty-desc">
            {canCreate ? 'Create your first form.' : 'No forms have been assigned yet.'}
          </p>
        </div>
      )}

      {!loading && forms.length > 0 && (
        <div className="portal-forms-grid">
          {forms.map(form => (
            <div key={form.id} className="portal-card portal-card-body-sm portal-form-card">
              <div className="portal-perf-card-header">
                <div className="portal-perf-card-main">
                  <h3 className="portal-perf-card-title">{form.title}</h3>
                  {form.description && <p className="portal-perf-card-desc">{form.description}</p>}
                </div>
                <div className="portal-perf-card-badges">
                  {Number(form.is_public ?? 0) === 1 && <span className="portal-badge portal-badge-info"><Globe2 size={12} /> Public</span>}
                  {form.is_active ? <span className="portal-badge portal-badge-active">Active</span> : <span className="portal-badge portal-badge-inactive">Inactive</span>}
                </div>
              </div>

              <div className="portal-perf-card-meta">
                {form.period && <span className="portal-perf-card-meta-item"><FileText size={14} /> <span>{form.period}</span></span>}
                <span className="portal-perf-card-meta-item"><BarChart3 size={14} /> {form.field_count ?? 0} fields</span>
                {!isMember && <span className="portal-perf-card-meta-item"><Users size={14} /> {form.response_count ?? 0} responses</span>}
                <span className="portal-perf-card-meta-item">{formatScope(form)}</span>
                {form.is_template ? <span className="portal-perf-card-meta-item">Preset</span> : null}
              </div>

              <div className="portal-perf-card-actions">
                {isMember ? (
                  <Link to={`${pathPrefix}/forms/${form.id}/fill`} className="portal-btn portal-btn-primary portal-btn-sm">
                    <FileText size={14} /> Fill Form
                  </Link>
                ) : isUnitPresident && (form.scope_type ?? (form.scope_unit_id ? 'unit' : 'zone')) === 'zone' ? (
                  /* Zone-level forms: unit presidents can only fill them, not edit/delete/view responses */
                  <Link to={`${pathPrefix}/forms/${form.id}/fill`} className="portal-btn portal-btn-primary portal-btn-sm">
                    <FileText size={14} /> Fill Form
                  </Link>
                ) : (
                  <>
                    <Link to={`${pathPrefix}/forms/${form.id}/responses`} className="portal-btn portal-btn-secondary portal-btn-sm">
                      <Eye size={14} /> Responses
                    </Link>
                    {canCreate && (
                      <Link to={`${pathPrefix}/forms/${form.id}/edit`} className="portal-btn portal-btn-ghost portal-btn-sm">
                        <Pencil size={14} /> Edit
                      </Link>
                    )}
                    <Link to={`${pathPrefix}/forms/${form.id}/fill`} className="portal-btn portal-btn-ghost portal-btn-sm">
                      <FileText size={14} /> Preview
                    </Link>
                    <button type="button" onClick={() => copyShortFormLink(form)} disabled={linkLoadingId === form.id} className="portal-btn portal-btn-ghost portal-btn-sm">
                      <Copy size={14} /> {linkLoadingId === form.id ? 'Shortening...' : 'Short Link'}
                    </button>
                    {canCreate && (
                      <button onClick={() => setDeleteTarget(form)} className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red" aria-label="Delete form">
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

function formatScope(form: PerfForm): string {
  const type = form.scope_type ?? (form.scope_unit_id ? 'unit' : 'zone')
  if (type === 'region') return form.scope_region_name ? `Region: ${form.scope_region_name}` : 'Region'
  if (type === 'unit') return form.scope_unit_name ? `Unit: ${form.scope_unit_name}` : 'Unit'
  if (type === 'circle') return form.scope_circle_name ? `Circle: ${form.scope_circle_name}` : 'Circle'
  if (type === 'campus') return form.scope_campus_name ? `Campus: ${form.scope_campus_name}` : 'Campus'
  return 'Zone-wide'
}
