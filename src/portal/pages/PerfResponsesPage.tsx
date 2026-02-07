import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, X, Star, MessageSquare, Save, Trash2 } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { DataTable } from '../components/DataTable'
import * as api from '../api'
import type { PerfForm, PerfResponse, PerfReview, PerfField, TableColumn } from '../types'

export function PerfResponsesPage() {
  const { formId } = useParams<{ formId: string }>()
  const { user } = usePortalAuth()
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

  if (!user) return null

  const canReview = ['admin', 'zonal_secretary', 'regional_president', 'unit_president'].includes(user.role)
  const myReview = selectedResponse ? reviews.find(r => r.reviewer_id === user.id) : null

  async function handleSaveReview() {
    if (!formId || !selectedResponse || !user) return
    setReviewError(null)
    setReviewSaving(true)
    try {
      await api.upsertPerfResponseReview(formId, selectedResponse.id, user.id, {
        comment: reviewComment.trim() || null,
        rating: reviewRating,
      })
      const list = await api.fetchPerfResponseReviews(formId, selectedResponse.id)
      setReviews(list)
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to save review.')
    } finally {
      setReviewSaving(false)
    }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!selectedResponse) return
    try {
      await api.deletePerfReview(reviewId, user!.id)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
      setReviewComment('')
      setReviewRating(null)
    } catch {
      setReviewError('Failed to delete review.')
    }
  }

  // Build columns from form fields
  const fieldColumns: TableColumn<Record<string, unknown>>[] = (form?.fields ?? []).map(f => ({
    key: f.id,
    label: f.label.length > 25 ? f.label.slice(0, 25) + '…' : f.label,
    sortable: true,
    render: (_: unknown, row: Record<string, unknown>) => {
      const data = row.response_data as Record<string, unknown> | undefined
      if (!data) return '—'
      const val = data[f.id]
      if (val === undefined || val === null) return '—'
      if (Array.isArray(val)) return val.join(', ')
      if (typeof val === 'boolean') return val ? 'Yes' : 'No'
      return String(val)
    },
  }))

  const columns: TableColumn<Record<string, unknown>>[] = [
    { key: 'member_name', label: 'Member', sortable: true },
    { key: 'unit_name', label: 'Unit', sortable: true, render: v => (v as string) || '—' },
    ...fieldColumns,
    { key: 'submitted_at', label: 'Submitted', sortable: true, render: v => fmtDate(v as string) },
    {
      key: '_view',
      label: '',
      sortable: false,
      render: (_: unknown, row: Record<string, unknown>) => (
        <button
          type="button"
          onClick={() => setSelectedResponse(row as unknown as PerfResponse)}
          className="portal-btn portal-btn-ghost portal-btn-sm"
        >
          <Eye size={14} /> View
        </button>
      ),
    },
  ]

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

      <DataTable
        data={responses as unknown as Record<string, unknown>[]}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search responses…"
        exportFilename={form ? `${form.title}-responses.csv` : 'responses.csv'}
        emptyTitle="No responses yet"
        emptyDescription="No members have submitted responses to this form."
      />

      {/* Detail panel: response + reviews + add/edit review */}
      {selectedResponse && (
        <div className="portal-card portal-card-body portal-perf-detail-panel">
          <div className="portal-perf-detail-header">
            <h2 className="portal-heading" style={{ fontSize: '1.125rem' }}>
              {selectedResponse.member_name ?? 'Member'} — {selectedResponse.unit_name ?? '—'}
            </h2>
            <button type="button" onClick={() => setSelectedResponse(null)} className="portal-btn portal-btn-ghost portal-btn-sm" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="portal-perf-detail-fields">
            <h3 className="portal-label">Response</h3>
            {(form?.fields ?? []).map((field: PerfField) => {
              const data = selectedResponse.response_data ?? {}
              const val = data[field.id]
              let display = '—'
              if (val !== undefined && val !== null) {
                if (Array.isArray(val)) display = val.join(', ')
                else if (typeof val === 'boolean') display = val ? 'Yes' : 'No'
                else display = String(val)
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
                      {r.reviewer_id === user.id && (
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

            {canReview && (
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
      )}
    </div>
  )
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}
