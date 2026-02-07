import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { useNotifications } from '../context/NotificationContext'
import * as api from '../api'
import type { PerfForm, PerfField } from '../types'

export function PerfFormFillPage() {
  const { formId } = useParams<{ formId: string }>()
  const { user } = usePortalAuth()
  const { decrement } = useNotifications()
  const navigate = useNavigate()
  const [form, setForm] = useState<PerfForm | null>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!formId) return
    let cancelled = false
    api.fetchPerfForm(formId)
      .then(data => {
        if (cancelled) return
        setForm(data)
        // Mark as "seen" for members so the notification badge decreases
        if (user && user.role === 'member') {
          api.markPerfFormSeen(formId, user.id)
            .then(() => decrement('pendingForms'))
            .catch(() => {})
        }
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load form.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [formId, user, decrement])

  if (!user) return null

  function updateAnswer(fieldId: string, value: unknown) {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
  }

  function toggleMsq(fieldId: string, option: string) {
    setAnswers(prev => {
      const current = (prev[fieldId] as string[]) ?? []
      return { ...prev, [fieldId]: current.includes(option) ? current.filter(o => o !== option) : [...current, option] }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form || !user || !formId) return
    setError(null)

    // Validate required
    for (const field of form.fields ?? []) {
      if (field.is_required) {
        const val = answers[field.id]
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          setError(`"${field.label}" is required.`); return
        }
      }
    }

    setSubmitting(true)
    try {
      await api.submitPerfResponse(formId, user.id, answers)
      setSuccess(true)
    } catch (err) { setError(err instanceof Error ? err.message : 'Submission failed.') }
    finally { setSubmitting(false) }
  }

  if (loading) {
    return (
      <div className="portal-page portal-page-narrow">
        <div className="portal-loading-list">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="portal-skeleton portal-skeleton-row" />)}
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="portal-page">
        <div className="portal-alert portal-alert-error">Form not found.</div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="portal-page portal-page-narrow">
        <div className="portal-card portal-card-body">
          <div className="portal-empty">
            <div className="portal-empty-icon" style={{ background: 'rgba(5,150,105,0.1)', color: '#34d399' }}><CheckCircle size={28} /></div>
            <h3 className="portal-empty-title">Response Submitted!</h3>
            <p className="portal-empty-desc">Your response to "{form.title}" has been saved successfully.</p>
            <button onClick={() => navigate(-1)} className="portal-btn portal-btn-primary mt-6"><ArrowLeft size={16} /> Back</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="portal-page portal-page-narrow">
      <button onClick={() => navigate(-1)} className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="portal-heading">{form.title}</h1>
        {form.description && <p className="portal-subheading">{form.description}</p>}
        {form.period && <p className="portal-subheading">Period: {form.period}</p>}
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="portal-form-stack-lg">
        {(form.fields ?? []).map((field, idx) => (
          <div key={field.id} className="portal-card portal-card-body-sm">
            <label className={`portal-label ${field.is_required ? 'portal-label-required' : ''}`}>
              {idx + 1}. {field.label}
            </label>
            {field.description && <p className="portal-hint portal-mb-4">{field.description}</p>}

            {renderFieldInput(field, answers[field.id], (val) => updateAnswer(field.id, val), (opt) => toggleMsq(field.id, opt))}
          </div>
        ))}

        <button type="submit" disabled={submitting} className="portal-btn portal-btn-primary portal-self-start">
          {submitting ? 'Submitting…' : 'Submit Response'}
        </button>
      </form>
    </div>
  )
}

function renderFieldInput(
  field: PerfField,
  value: unknown,
  onChange: (val: unknown) => void,
  toggleMsq: (opt: string) => void,
) {
  switch (field.type) {
    case 'subjective':
      return <textarea value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} rows={3} className="portal-input portal-textarea" placeholder="Type your answer…" />

    case 'number':
      return <input type="number" value={(value as number) ?? ''} onChange={e => onChange(e.target.value)} className="portal-input" placeholder={field.max_value ? `0 – ${field.max_value}` : 'Enter a number'} max={field.max_value ?? undefined} />

    case 'rating':
      return (
        <div className="portal-perf-rating-row">
          {Array.from({ length: field.max_value ?? 5 }).map((_, i) => (
            <button key={i} type="button" onClick={() => onChange(i + 1)} className={`portal-perf-rating-btn ${(value as number) === i + 1 ? 'active' : ''}`}>
              {i + 1}
            </button>
          ))}
          <span className="portal-text-muted portal-text-sm">/ {field.max_value ?? 5}</span>
        </div>
      )

    case 'checkbox':
      return (
        <label className="portal-perf-checkbox-label">
          <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />
          <span>Yes</span>
        </label>
      )

    case 'mcq':
      return (
        <div className="portal-perf-options">
          {(field.options ?? []).map(opt => (
            <label key={opt} className="portal-perf-radio-label">
              <input type="radio" name={field.id} value={opt} checked={(value as string) === opt} onChange={() => onChange(opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )

    case 'msq':
      return (
        <div className="portal-perf-options">
          {(field.options ?? []).map(opt => (
            <label key={opt} className="portal-perf-checkbox-label">
              <input type="checkbox" checked={((value as string[]) ?? []).includes(opt)} onChange={() => toggleMsq(opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )

    default:
      return <input type="text" value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} className="portal-input" />
  }
}
