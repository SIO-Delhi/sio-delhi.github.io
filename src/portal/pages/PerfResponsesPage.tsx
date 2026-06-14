import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import {
  ArrowLeft, Eye, X, Star, MessageSquare, Save, Trash2, Users, Filter,
  Search, Download, Columns3, BarChart3, ChevronUp, ChevronDown,
} from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { useNotifications } from '../context/NotificationContext'
import * as api from '../api'
import type { PerfForm, PerfResponse, PerfReview, PerfField } from '../types'

const NON_ANSWER_TYPES = ['heading', 'paragraph', 'image', 'submit', 'divider', 'section_collapse', 'page_break', 'section']

export function PerfResponsesPage() {
  const { formId } = useParams<{ formId: string }>()
  const { user } = usePortalAuth()
  const { refresh: refreshNotifications } = useNotifications()
  const navigate = useNavigate()
  const [form, setForm] = useState<PerfForm | null>(null)
  const [responses, setResponses] = useState<PerfResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResponse, setSelectedResponse] = useState<PerfResponse | null>(null)
  const [reviews, setReviews] = useState<PerfReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewRating, setReviewRating] = useState<number | null>(null)
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'member' | 'public'>('all')
  const [visibleFieldIds, setVisibleFieldIds] = useState<string[]>([])
  const [showFieldPicker, setShowFieldPicker] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [sortKey, setSortKey] = useState('submitted_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const pageSize = 20

  const loadResponses = useCallback(() => {
    if (!formId) return
    setLoading(true)
    Promise.all([api.fetchPerfForm(formId!), api.fetchPerfResponses(formId!)])
      .then(([f, r]) => { setForm(f); setResponses(r) })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [formId])

  useEffect(() => {
    if (!formId) return
    loadResponses()
  }, [formId, loadResponses])

  useEffect(() => {
    if (!formId || !selectedResponse) {
      setReviews([])
      return
    }
    setReviewsLoading(true)
    api.fetchPerfResponseReviews(formId, selectedResponse.id)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false))
  }, [formId, selectedResponse?.id])

  // When opening detail, check if current user already has a review and populate form
  useEffect(() => {
    if (!user || !selectedResponse || !reviews.length) {
      setReviewComment('')
      setReviewRating(null)
      return
    }
    const myReview = reviews.find(r => r.reviewer_id === user.id)
    if (myReview) {
      setReviewComment(myReview.comment ?? '')
      setReviewRating(myReview.rating ?? null)
    } else {
      setReviewComment('')
      setReviewRating(null)
    }
  }, [user, selectedResponse, reviews])

  const portalUser = user!
  const canReview = ['admin', 'zonal_secretary', 'regional_president', 'unit_president'].includes(portalUser.role)
  const selectedIsPublic = selectedResponse?.response_source === 'public'
  const myReview = selectedResponse ? reviews.find(r => r.reviewer_id === portalUser.id) : null
  const answerFields = useMemo(() => (form?.fields ?? []).filter(f => !NON_ANSWER_TYPES.includes(f.type)), [form?.fields])
  const units = useMemo(() => Array.from(new Set(responses.map(r => r.unit_name).filter(Boolean) as string[])).sort(), [responses])

  useEffect(() => {
    setVisibleFieldIds(answerFields.map(field => field.id))
  }, [answerFields])

  const filteredResponses = useMemo(() => {
    const q = query.trim().toLowerCase()
    return responses.filter(r => {
      if (unitFilter !== 'all' && (r.unit_name || '—') !== unitFilter) return false
      if (sourceFilter !== 'all' && (r.response_source ?? 'member') !== sourceFilter) return false
      if (!q) return true
      const values = [
        r.member_name ?? '',
        r.member_phone ?? '',
        r.unit_name ?? '',
        r.response_source ?? 'member',
        ...Object.values(r.response_data ?? {}).map(v => formatAnswer(v, true)),
      ].map(v => String(v ?? '').toLowerCase())
      return values.some(v => v.includes(q))
    })
  }, [responses, query, unitFilter, sourceFilter])

  const visibleFields = useMemo(() => answerFields.filter(field => visibleFieldIds.includes(field.id)), [answerFields, visibleFieldIds])
  const hiddenFieldCount = Math.max(0, answerFields.length - visibleFields.length)

  const sortedResponses = useMemo(() => {
    return [...filteredResponses].sort((a, b) => {
      const av = sortableValue(a, sortKey)
      const bv = sortableValue(b, sortKey)
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filteredResponses, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedResponses.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paginatedResponses = sortedResponses.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const unitBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    filteredResponses.forEach(r => counts.set(r.unit_name || '—', (counts.get(r.unit_name || '—') ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [filteredResponses])

  const sourceBreakdown = useMemo(() => {
    const member = filteredResponses.filter(r => (r.response_source ?? 'member') !== 'public').length
    const publicCount = filteredResponses.length - member
    return [
      ['Portal', member],
      ['Public', publicCount],
    ] as const
  }, [filteredResponses])

  const fieldCompletion = useMemo(() => {
    return answerFields.map(field => {
      const answered = filteredResponses.filter(r => !isEmptyAnswer(r.response_data?.[field.id])).length
      return { field, answered, pct: filteredResponses.length ? Math.round((answered / filteredResponses.length) * 100) : 0 }
    }).sort((a, b) => b.pct - a.pct).slice(0, 4)
  }, [answerFields, filteredResponses])

  useEffect(() => {
    setPage(0)
  }, [query, unitFilter, sourceFilter, visibleFieldIds.join('|')])

  function handleSort(nextKey: string) {
    if (sortKey === nextKey) setSortDir(current => current === 'asc' ? 'desc' : 'asc')
    else { setSortKey(nextKey); setSortDir('asc') }
  }

  function toggleField(fieldId: string) {
    setVisibleFieldIds(prev => prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId])
  }

  function getExportData() {
    const columns = [
      { key: 'member_name', label: 'Respondent' },
      { key: 'member_phone', label: 'Phone' },
      { key: 'unit_name', label: 'Unit' },
      { key: 'response_source', label: 'Source' },
      ...visibleFields.map(field => ({ key: field.id, label: field.label })),
      { key: 'submitted_at', label: 'Submitted' },
    ]
    const rows = sortedResponses.map(response => columns.map(column => {
      if (visibleFields.some(field => field.id === column.key)) return formatAnswer(response.response_data?.[column.key], true)
      if (column.key === 'response_source') return response.response_source === 'public' ? 'Public' : 'Portal'
      if (column.key === 'submitted_at') return fmtDate(response.submitted_at)
      return String((response as unknown as Record<string, unknown>)[column.key] ?? '')
    }))
    return { columns, rows }
  }

  function exportVisibleCsv() {
    const { columns, rows } = getExportData()
    downloadCsv([columns.map(column => column.label), ...rows], form ? `${form.title}-filtered-responses.csv` : 'filtered-responses.csv')
    setShowExportMenu(false)
  }

  function exportVisiblePdf() {
    const { columns, rows } = getExportData()
    downloadPdf({
      title: form?.title ?? 'Responses',
      subtitle: `${sortedResponses.length} visible of ${responses.length} total responses`,
      filters: [
        `Search: ${query.trim() || 'All'}`,
        `Unit: ${unitFilter === 'all' ? 'All units' : unitFilter}`,
        `Source: ${sourceFilter === 'all' ? 'All sources' : sourceFilter === 'member' ? 'Portal only' : 'Public only'}`,
        `Fields: ${visibleFields.length} visible`,
      ],
      columns: columns.map(column => column.label),
      rows,
      filename: form ? `${form.title}-filtered-responses.pdf` : 'filtered-responses.pdf',
    })
    setShowExportMenu(false)
  }

  async function handleSaveReview() {
    if (!formId || !selectedResponse || !portalUser) return
    setReviewError(null)
    setReviewSaving(true)
    try {
      await api.upsertPerfResponseReview(formId, selectedResponse.id, portalUser.id, {
        comment: reviewComment.trim() || null,
        rating: reviewRating,
      })
      const list = await api.fetchPerfResponseReviews(formId, selectedResponse.id)
      setReviews(list)
      refreshNotifications()
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to save review.')
    } finally {
      setReviewSaving(false)
    }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!selectedResponse) return
    try {
      await api.deletePerfReview(reviewId, portalUser.id)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
      setReviewComment('')
      setReviewRating(null)
      refreshNotifications()
    } catch {
      setReviewError('Failed to delete review.')
    }
  }

  return (
    <div className="portal-page">
      <button onClick={() => navigate(-1)} className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="portal-heading">{form?.title ?? 'Responses'}</h1>
        <p className="portal-subheading">{responses.length} response{responses.length !== 1 ? 's' : ''} received{form?.period ? ` — ${form.period}` : ''}</p>
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      <div className="portal-grid-summary">
        <div className="portal-card portal-card-body-sm">
          <span className="portal-label"><Users size={14} /> Responses</span>
          <strong className="portal-response-stat">{responses.length}</strong>
        </div>
        <div className="portal-card portal-card-body-sm">
          <span className="portal-label"><Filter size={14} /> Visible</span>
          <strong className="portal-response-stat">{filteredResponses.length}</strong>
        </div>
        <div className="portal-card portal-card-body-sm">
          <span className="portal-label"><Columns3 size={14} /> Columns</span>
          <strong className="portal-response-stat">{visibleFields.length}</strong>
          {hiddenFieldCount > 0 && <span className="portal-response-stat-note">{hiddenFieldCount} hidden</span>}
        </div>
        <div className="portal-card portal-card-body-sm">
          <span className="portal-label"><BarChart3 size={14} /> Fields</span>
          <strong className="portal-response-stat">{answerFields.length}</strong>
        </div>
      </div>

      <div className="portal-perf-response-insights">
        <InsightPanel title="Units" rows={unitBreakdown} total={filteredResponses.length} />
        <InsightPanel title="Source" rows={sourceBreakdown} total={filteredResponses.length} />
        <div className="portal-card portal-card-body-sm portal-perf-insight-panel">
          <h3>Field Completion</h3>
          <div className="portal-perf-insight-bars">
            {fieldCompletion.length === 0 ? <p className="portal-text-muted portal-text-sm">No fields yet.</p> : fieldCompletion.map(item => (
              <div key={item.field.id} className="portal-perf-insight-row">
                <div className="portal-perf-insight-row-head">
                  <span>{item.field.label}</span>
                  <strong>{item.pct}%</strong>
                </div>
                <div className="portal-perf-insight-track"><div style={{ width: `${item.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="portal-card portal-card-body-sm portal-perf-response-controls">
        <div className="portal-input-icon-wrap portal-perf-response-search">
          <Search size={16} className="portal-input-icon" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="portal-input"
            placeholder="Search respondent, phone, unit, source, or any answer..."
          />
        </div>
        <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} className="portal-input portal-select">
          <option value="all">All units</option>
          {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value as typeof sourceFilter)} className="portal-input portal-select">
          <option value="all">All sources</option>
          <option value="member">Portal only</option>
          <option value="public">Public only</option>
        </select>
        <button type="button" onClick={() => setShowFieldPicker(value => !value)} className="portal-btn portal-btn-secondary">
          <Columns3 size={16} /> Fields
        </button>
        <div className="portal-export-choice">
          <button type="button" onClick={() => setShowExportMenu(value => !value)} className="portal-btn portal-btn-primary">
            <Download size={16} /> Export Visible
          </button>
          {showExportMenu && (
            <div className="portal-export-choice-menu">
              <button type="button" onClick={exportVisiblePdf}>
                <strong>PDF report</strong>
                <span>Formatted summary and table</span>
              </button>
              <button type="button" onClick={exportVisibleCsv}>
                <strong>CSV data</strong>
                <span>Spreadsheet-ready visible rows</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showFieldPicker && (
        <div className="portal-card portal-card-body-sm portal-perf-field-picker">
          <div className="portal-perf-field-picker-head">
            <div>
              <h3>Visible Fields</h3>
              <p>{visibleFields.length} of {answerFields.length} answer fields selected.</p>
            </div>
            <div className="portal-perf-field-picker-actions">
              <button type="button" onClick={() => setVisibleFieldIds(answerFields.map(field => field.id))} className="portal-btn portal-btn-ghost portal-btn-sm">All</button>
              <button type="button" onClick={() => setVisibleFieldIds([])} className="portal-btn portal-btn-ghost portal-btn-sm">None</button>
            </div>
          </div>
          <div className="portal-perf-field-toggle-grid">
            {answerFields.map(field => (
              <label key={field.id} className="portal-perf-field-toggle">
                <input type="checkbox" checked={visibleFieldIds.includes(field.id)} onChange={() => toggleField(field.id)} />
                <span>{field.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="portal-card portal-perf-response-table-card">
        <div className="portal-perf-response-table-head">
          <span>{sortedResponses.length} record{sortedResponses.length !== 1 ? 's' : ''}</span>
          <span>Showing {sortedResponses.length === 0 ? 0 : safePage * pageSize + 1}-{Math.min(sortedResponses.length, (safePage + 1) * pageSize)}</span>
        </div>

        {loading ? (
          <div className="portal-loading-list portal-p-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="portal-skeleton portal-skeleton-row" />)}
          </div>
        ) : sortedResponses.length === 0 ? (
          <div className="portal-empty portal-p-4">
            <h3 className="portal-empty-title">No matching responses</h3>
            <p className="portal-empty-desc">Try clearing search, unit, source, or field filters.</p>
          </div>
        ) : (
          <>
            <div className="portal-overflow-x">
              <table className="portal-table portal-perf-response-table">
                <thead>
                  <tr>
                    <SortableTh label="Respondent" sortKey="member_name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortableTh label="Unit" sortKey="unit_name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortableTh label="Source" sortKey="response_source" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                    {visibleFields.map(field => (
                      <SortableTh key={field.id} label={field.label} sortKey={field.id} activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                    ))}
                    <SortableTh label="Submitted" sortKey="submitted_at" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paginatedResponses.map(response => (
                    <tr key={response.id}>
                      <td>
                        <button type="button" onClick={() => setSelectedResponse(response)} className="portal-table-link">
                          {response.member_name ?? 'Respondent'}
                        </button>
                      </td>
                      <td>{response.unit_name || '—'}</td>
                      <td><span className="portal-perf-source-pill">{response.response_source === 'public' ? 'Public' : 'Portal'}</span></td>
                      {visibleFields.map(field => (
                        <td key={field.id} className="portal-perf-answer-cell">{formatAnswer(response.response_data?.[field.id], true)}</td>
                      ))}
                      <td>{fmtDate(response.submitted_at)}</td>
                      <td className="portal-text-right">
                        <button type="button" onClick={() => setSelectedResponse(response)} className="portal-btn portal-btn-ghost portal-btn-sm">
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="portal-perf-response-pagination">
              <button type="button" className="portal-btn portal-btn-secondary portal-btn-sm" disabled={safePage === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>Previous</button>
              <span>Page {safePage + 1} of {totalPages}</span>
              <button type="button" className="portal-btn portal-btn-secondary portal-btn-sm" disabled={safePage >= totalPages - 1} onClick={() => setPage(value => Math.min(totalPages - 1, value + 1))}>Next</button>
            </div>
          </>
        )}
      </div>

      {/* Detail panel: response + reviews + add/edit review */}
      {selectedResponse && (
        <div className="portal-perf-detail-overlay" role="dialog" aria-modal="true" aria-label="Response details" onClick={() => setSelectedResponse(null)}>
          <div className="portal-card portal-card-body portal-perf-detail-panel" onClick={e => e.stopPropagation()}>
            <div className="portal-perf-detail-header">
              <h2 className="portal-heading" style={{ fontSize: '1.125rem' }}>
                {selectedResponse.member_name ?? 'Respondent'} — {selectedResponse.unit_name ?? '—'}
              </h2>
              <button type="button" onClick={() => setSelectedResponse(null)} className="portal-btn portal-btn-ghost portal-btn-sm" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="portal-perf-detail-fields">
              <h3 className="portal-label">Response</h3>
              {(form?.fields ?? []).filter(field => !NON_ANSWER_TYPES.includes(field.type)).map((field: PerfField) => {
                const data = selectedResponse.response_data ?? {}
                const val = data[field.id]
                let display = '—'
                if (val !== undefined && val !== null) {
                  display = formatAnswer(val)
                }
                return (
                  <div key={field.id} className="portal-perf-detail-field">
                    <span className="portal-perf-detail-field-label">{field.label}</span>
                    <span className="portal-perf-detail-field-value">{display}</span>
                  </div>
                )
              })}
              <p className="portal-text-muted portal-text-sm">Submitted {fmtDate(selectedResponse.submitted_at)}</p>
            </div>

            <div className="portal-perf-detail-reviews">
              <h3 className="portal-label">
                <MessageSquare size={16} /> Reviews ({reviews.length})
              </h3>
              {reviewsLoading && <p className="portal-text-muted">Loading reviews…</p>}
              {!reviewsLoading && reviews.length === 0 && <p className="portal-text-muted">No reviews yet.</p>}
              {!reviewsLoading && reviews.length > 0 && (
                <ul className="portal-perf-review-list">
                  {reviews.map(r => (
                    <li key={r.id} className="portal-perf-review-item">
                      <div className="portal-perf-review-meta">
                        <span className="portal-perf-review-author">{r.reviewer_name ?? 'Reviewer'}</span>
                        {r.rating != null && (
                          <span className="portal-perf-review-rating">
                            <Star size={14} fill="currentColor" /> {r.rating}
                          </span>
                        )}
                        <span className="portal-text-muted portal-text-sm">{fmtDate(r.created_at)}</span>
                        {r.reviewer_id === portalUser.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r.id)}
                            className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {r.comment && <p className="portal-perf-review-comment">{r.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}

              {canReview && !selectedIsPublic && (
                <div className="portal-perf-review-form">
                  <h4 className="portal-label">{myReview ? 'Edit your review' : 'Add your review'}</h4>
                  {reviewError && <div className="portal-alert portal-alert-error portal-mb-4">{reviewError}</div>}
                  <div className="portal-form-stack">
                    <div>
                      <label className="portal-label">Rating (1–5)</label>
                      <div className="portal-perf-rating-row">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setReviewRating(n)}
                            className={`portal-perf-rating-btn ${reviewRating === n ? 'active' : ''}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="portal-label">Comment</label>
                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        rows={3}
                        className="portal-input portal-textarea"
                        placeholder="Optional comment…"
                      />
                    </div>
                    <button type="button" onClick={handleSaveReview} disabled={reviewSaving} className="portal-btn portal-btn-primary portal-btn-sm">
                      <Save size={14} /> {reviewSaving ? 'Saving…' : myReview ? 'Update review' : 'Submit review'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SortableTh({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string
  sortKey: string
  activeKey: string
  dir: 'asc' | 'desc'
  onSort: (key: string) => void
}) {
  return (
    <th className="sortable" onClick={() => onSort(sortKey)}>
      <span className="portal-sort-indicator">
        {label}
        {activeKey === sortKey && (dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </span>
    </th>
  )
}

function InsightPanel({ title, rows, total }: { title: string; rows: readonly (readonly [string, number])[]; total: number }) {
  return (
    <div className="portal-card portal-card-body-sm portal-perf-insight-panel">
      <h3>{title}</h3>
      <div className="portal-perf-insight-bars">
        {rows.length === 0 ? <p className="portal-text-muted portal-text-sm">No data yet.</p> : rows.map(([label, count]) => {
          const pct = total ? Math.round((count / total) * 100) : 0
          return (
            <div key={label} className="portal-perf-insight-row">
              <div className="portal-perf-insight-row-head">
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
              <div className="portal-perf-insight-track"><div style={{ width: `${pct}%` }} /></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function sortableValue(response: PerfResponse, key: string): unknown {
  if (key in response) return (response as unknown as Record<string, unknown>)[key]
  return response.response_data?.[key]
}

function isEmptyAnswer(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value)) return value.length === 0 || value.every(item => isEmptyAnswer(item))
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).every(isEmptyAnswer)
  return false
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadPdf({
  title,
  subtitle,
  filters,
  columns,
  rows,
  filename,
}: {
  title: string
  subtitle: string
  filters: string[]
  columns: string[]
  rows: string[][]
  filename: string
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 36
  const tableWidth = pageWidth - margin * 2
  const accent = '#2563eb'
  const border = '#d7deea'
  const headerBg = '#eef4ff'
  const text = '#111827'
  const muted = '#64748b'

  const baseWidths = columns.map((_, index) => {
    if (index === 0) return 92
    if (index === 1) return 74
    if (index === 2) return 82
    if (index === 3) return 54
    if (index === columns.length - 1) return 68
    return 105
  })
  const baseTotal = baseWidths.reduce((sum, width) => sum + width, 0)
  const scale = tableWidth / baseTotal
  const colWidths = baseWidths.map(width => Math.max(46, width * scale))

  function drawPageHeader(page: number) {
    doc.setFillColor(accent)
    doc.rect(0, 0, pageWidth, 8, 'F')
    doc.setTextColor(text)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(title, margin, 34)
    doc.setTextColor(muted)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(subtitle, margin, 51)
    doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, pageWidth - margin, 34, { align: 'right' })
    doc.text(`Page ${page}`, pageWidth - margin, 51, { align: 'right' })

    let x = margin
    let y = 72
    filters.forEach(filter => {
      const chipWidth = Math.min(210, doc.getTextWidth(filter) + 18)
      if (x + chipWidth > pageWidth - margin) {
        x = margin
        y += 22
      }
      doc.setFillColor('#f8fafc')
      doc.setDrawColor(border)
      doc.roundedRect(x, y - 12, chipWidth, 18, 5, 5, 'FD')
      doc.setTextColor(muted)
      doc.setFontSize(8)
      doc.text(filter, x + 9, y)
      x += chipWidth + 8
    })
    return y + 22
  }

  function drawTableHeader(y: number) {
    let x = margin
    doc.setFillColor(headerBg)
    doc.setDrawColor(border)
    doc.rect(margin, y, tableWidth, 24, 'FD')
    doc.setTextColor(text)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    columns.forEach((column, index) => {
      doc.text(doc.splitTextToSize(column, colWidths[index] - 8).slice(0, 2), x + 4, y + 10)
      x += colWidths[index]
    })
    return y + 24
  }

  let page = 1
  let y = drawTableHeader(drawPageHeader(page))

  if (rows.length === 0) {
    doc.setTextColor(muted)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('No matching responses for the current filters.', margin, y + 28)
    doc.save(filename)
    return
  }

  rows.forEach((row, rowIndex) => {
    const wrapped = row.map((cell, index) => doc.splitTextToSize(String(cell || '-'), colWidths[index] - 8).slice(0, 4))
    const rowHeight = Math.max(28, Math.max(...wrapped.map(lines => lines.length)) * 9 + 12)

    if (y + rowHeight > pageHeight - 34) {
      doc.addPage()
      page += 1
      y = drawTableHeader(drawPageHeader(page))
    }

    doc.setFillColor(rowIndex % 2 === 0 ? '#ffffff' : '#fbfdff')
    doc.setDrawColor(border)
    doc.rect(margin, y, tableWidth, rowHeight, 'FD')

    let x = margin
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(text)
    wrapped.forEach((lines, index) => {
      doc.text(lines, x + 4, y + 12)
      x += colWidths[index]
    })
    y += rowHeight
  })

  doc.save(filename)
}

function csvEscape(value: string): string {
  const normalized = value.replace(/\r?\n/g, ' ')
  if (/[",\n]/.test(normalized)) return `"${normalized.replace(/"/g, '""')}"`
  return normalized
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}

function formatAnswer(value: unknown, compact = false): string {
  if (value === undefined || value === null || value === '') return '—'
  if (Array.isArray(value)) {
    if (value.every(row => Array.isArray(row))) {
      return compact ? 'Table response' : value.map(row => (row as unknown[]).join(' | ')).join('\n')
    }
    return value.join(', ')
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string') {
    if (value.startsWith('data:image/')) return 'Signature captured'
    return value
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== 0)
      .map(([k, v]) => `${labelize(k)}: ${String(v)}`)
      .join(compact ? ', ' : '\n') || '—'
  }
  return String(value)
}

function labelize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
