import { useState, useEffect, useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { useNotifications } from '../context/NotificationContext'
import * as api from '../api'
import type { PerfForm, PerfField } from '../types'

const NON_ANSWER_TYPES = ['heading', 'paragraph', 'image', 'submit', 'divider', 'section_collapse', 'page_break', 'section']

export function PerfFormFillPage({ publicMode = false }: { publicMode?: boolean }) {
  const { formId } = useParams<{ formId: string }>()
  const { user } = usePortalAuth()
  const { decrement, refresh } = useNotifications()
  const navigate = useNavigate()
  const [form, setForm] = useState<PerfForm | null>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const Shell = ({ children }: { children: ReactNode }) => (
    publicMode ? <div className="portal-app portal-theme-light portal-public-form-shell">{children}</div> : <>{children}</>
  )

  useEffect(() => {
    if (!formId) return
    let cancelled = false
    const loadForm = publicMode ? api.fetchPublicPerfForm(formId) : api.fetchPerfForm(formId)
    loadForm
      .then(data => {
        if (cancelled) return
        setForm(data)
        // Mark as "seen" for members so the notification badge decreases
        if (!publicMode && user && user.role === 'member') {
          api.markPerfFormSeen(formId, user.id)
            .then(() => decrement('pendingForms'))
            .catch(() => {})
        }
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load form.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [formId, user, decrement, publicMode])

  if (!publicMode && !user) return null

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
    if (!form || !formId) return
    if (!publicMode && !user) return
    setError(null)

    // Validate required
    for (const field of form.fields ?? []) {
      if (NON_ANSWER_TYPES.includes(field.type)) continue
      if (field.type === 'captcha' && answers[field.id] !== 'SIO') {
        setError(`"${field.label}" verification is incorrect.`); return
      }
      if (field.is_required) {
        const val = answers[field.id]
        if (isEmptyAnswer(val)) {
          setError(`"${field.label}" is required.`); return
        }
      }
    }

    setSubmitting(true)
    try {
      if (publicMode) {
        await api.submitPublicPerfResponse(formId, answers)
      } else {
        await api.submitPerfResponse(formId, user!.id, answers)
      }
      setSuccess(true)
      if (!publicMode) refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Submission failed.') }
    finally { setSubmitting(false) }
  }

  if (loading) {
    return (
      <Shell>
        <div className="portal-page portal-page-narrow">
          <div className="portal-loading-list">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="portal-skeleton portal-skeleton-row" />)}
          </div>
        </div>
      </Shell>
    )
  }

  if (!form) {
    return (
      <Shell>
        <div className="portal-page">
          <div className="portal-alert portal-alert-error">Form not found.</div>
        </div>
      </Shell>
    )
  }

  if (success) {
    return (
      <Shell>
        <div className="portal-page portal-page-narrow">
          <div className="portal-card portal-card-body">
            <div className="portal-empty">
              <div className="portal-empty-icon" style={{ background: 'rgba(5,150,105,0.1)', color: '#34d399' }}><CheckCircle size={28} /></div>
              <h3 className="portal-empty-title">Response Submitted!</h3>
              <p className="portal-empty-desc">Your response to "{form.title}" has been saved successfully.</p>
              <button onClick={() => publicMode ? navigate('/portal/login') : navigate(-1)} className="portal-btn portal-btn-primary mt-6">
                <ArrowLeft size={16} /> {publicMode ? 'Done' : 'Back'}
              </button>
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="portal-page portal-page-narrow">
        {!publicMode && (
          <button onClick={() => navigate(-1)} className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start">
            <ArrowLeft size={16} /> Back
          </button>
        )}

        <div>
          <h1 className="portal-heading">{form.title}</h1>
          {form.description && <p className="portal-subheading">{form.description}</p>}
          {form.period && <p className="portal-subheading">Period: {form.period}</p>}
        </div>

        {error && <div className="portal-alert portal-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="portal-form-stack-lg">
          {(form.fields ?? []).map((field, idx) => (
            <div key={field.id} className={NON_ANSWER_TYPES.includes(field.type) ? 'portal-perf-section-block' : 'portal-card portal-card-body-sm'}>
              {field.type !== 'divider' && (
                <label className={`portal-label ${field.is_required && !NON_ANSWER_TYPES.includes(field.type) ? 'portal-label-required' : ''}`}>
                  {idx + 1}. {field.label}
                </label>
              )}
              {field.description && <p className="portal-hint portal-mb-4">{field.description}</p>}

              {renderFieldInput(field, answers[field.id], (val) => updateAnswer(field.id, val), (opt) => toggleMsq(field.id, opt))}
            </div>
          ))}

          <button type="submit" disabled={submitting} className="portal-btn portal-btn-primary portal-self-start">
            {submitting ? 'Submitting…' : 'Submit Response'}
          </button>
        </form>
      </div>
    </Shell>
  )
}

function isEmptyAnswer(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value)) {
    if (value.length === 0) return true
    return value.every(item => Array.isArray(item) ? item.every(cell => !String(cell ?? '').trim()) : !String(item ?? '').trim())
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(v => {
      if (typeof v === 'number') return v === 0
      return !String(v ?? '').trim()
    })
  }
  return false
}

function renderFieldInput(
  field: PerfField,
  value: unknown,
  onChange: (val: unknown) => void,
  toggleMsq: (opt: string) => void,
) {
  switch (field.type) {
    case 'heading':
      return field.description ? <p className="portal-hint">{field.description}</p> : null

    case 'paragraph':
      return <p className="portal-perf-paragraph">{field.description || field.label}</p>

    case 'divider':
      return <hr className="portal-perf-divider" />

    case 'page_break':
      return <div className="portal-perf-page-break">Page Break</div>

    case 'section_collapse':
      return <details className="portal-perf-details" open><summary>{field.label}</summary>{field.description && <p>{field.description}</p>}</details>

    case 'image':
      return field.description ? <img src={field.description} alt={field.label} className="portal-perf-image" /> : <p className="portal-hint">Add an image URL in help text.</p>

    case 'submit':
      return <p className="portal-hint">This form uses the submit button at the bottom.</p>

    case 'section':
      return null

    case 'full_name':
      return <NameInput value={value} onChange={onChange} />

    case 'short_text':
    case 'fill_blank':
      return <input type="text" value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} className="portal-input" placeholder="Type your answer…" />

    case 'subjective':
    case 'long_text':
      return <textarea value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} rows={3} className="portal-input portal-textarea" placeholder="Type your answer…" />

    case 'email':
      return <input type="email" value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} className="portal-input" placeholder="name@example.com" />

    case 'address':
      return <AddressInput value={value} onChange={onChange} />

    case 'phone':
      return <input type="tel" value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} className="portal-input" placeholder="Phone number" />

    case 'date':
      return <input type="date" value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} className="portal-input" />

    case 'appointment':
      return <input type="datetime-local" value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} className="portal-input" />

    case 'time':
      return <input type="time" value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} className="portal-input" />

    case 'number':
      return <input type="number" value={(value as number) ?? ''} onChange={e => onChange(e.target.value)} className="portal-input" placeholder={field.max_value ? `0 – ${field.max_value}` : 'Enter a number'} max={field.max_value ?? undefined} />

    case 'rating':
    case 'scale_rating':
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

    case 'star_rating':
      return (
        <div className="portal-perf-rating-row">
          {Array.from({ length: field.max_value ?? 5 }).map((_, i) => (
            <button key={i} type="button" onClick={() => onChange(i + 1)} className={`portal-perf-star-btn ${(value as number) >= i + 1 ? 'active' : ''}`}>
              ★
            </button>
          ))}
        </div>
      )

    case 'spinner':
      return <SpinnerInput value={value} max={field.max_value ?? 99} onChange={onChange} />

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

    case 'dropdown':
      return (
        <select value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} className="portal-input portal-select">
          <option value="">Select one</option>
          {(field.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )

    case 'product_list':
      return <ProductListInput field={field} value={value} onChange={onChange} />

    case 'input_table':
      return <InputTable field={field} value={value} onChange={onChange} />

    case 'file_upload':
      return <input type="file" multiple onChange={e => onChange(Array.from(e.target.files ?? []).map(file => file.name))} className="portal-input" />

    case 'signature':
      return <SignatureInput value={value} onChange={onChange} />

    case 'captcha':
      return (
        <div className="portal-form-stack">
          <div className="portal-perf-captcha">SIO</div>
          <input type="text" value={(value as string) ?? ''} onChange={e => onChange(e.target.value.toUpperCase())} className="portal-input" placeholder="Type SIO" />
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

function NameInput({ value, onChange }: { value: unknown; onChange: (val: unknown) => void }) {
  const current = (value as Record<string, string>) ?? {}
  function update(key: string, next: string) {
    onChange({ ...current, [key]: next })
  }
  return (
    <div className="portal-form-row">
      <input className="portal-input" value={current.first ?? ''} onChange={e => update('first', e.target.value)} placeholder="First name" />
      <input className="portal-input" value={current.last ?? ''} onChange={e => update('last', e.target.value)} placeholder="Last name" />
    </div>
  )
}

function AddressInput({ value, onChange }: { value: unknown; onChange: (val: unknown) => void }) {
  const current = (value as Record<string, string>) ?? {}
  function update(key: string, next: string) {
    onChange({ ...current, [key]: next })
  }
  return (
    <div className="portal-form-stack">
      <input className="portal-input" value={current.street ?? ''} onChange={e => update('street', e.target.value)} placeholder="Street address" />
      <div className="portal-form-row">
        <input className="portal-input" value={current.city ?? ''} onChange={e => update('city', e.target.value)} placeholder="City" />
        <input className="portal-input" value={current.state ?? ''} onChange={e => update('state', e.target.value)} placeholder="State" />
      </div>
      <input className="portal-input" value={current.pin ?? ''} onChange={e => update('pin', e.target.value)} placeholder="PIN code" />
    </div>
  )
}

function SpinnerInput({ value, max, onChange }: { value: unknown; max: number; onChange: (val: unknown) => void }) {
  const current = Number(value ?? 0)
  return (
    <div className="portal-perf-spinner">
      <button type="button" className="portal-btn portal-btn-secondary portal-btn-sm" onClick={() => onChange(Math.max(0, current - 1))}>-</button>
      <input className="portal-input" type="number" value={current} min={0} max={max} onChange={e => onChange(Number(e.target.value))} />
      <button type="button" className="portal-btn portal-btn-secondary portal-btn-sm" onClick={() => onChange(Math.min(max, current + 1))}>+</button>
    </div>
  )
}

function ProductListInput({ field, value, onChange }: { field: PerfField; value: unknown; onChange: (val: unknown) => void }) {
  const current = (value as Record<string, number>) ?? {}
  function update(product: string, qty: number) {
    onChange({ ...current, [product]: Math.max(0, qty) })
  }
  return (
    <div className="portal-perf-product-list">
      {(field.options ?? []).map(product => (
        <label key={product} className="portal-perf-product-row">
          <span>{product}</span>
          <input type="number" min={0} className="portal-input" value={current[product] ?? 0} onChange={e => update(product, Number(e.target.value))} />
        </label>
      ))}
    </div>
  )
}

function InputTable({ field, value, onChange }: { field: PerfField; value: unknown; onChange: (val: unknown) => void }) {
  const columns = field.options?.length ? field.options : ['Column 1', 'Column 2']
  const current = (value as string[][]) ?? Array.from({ length: 3 }, () => columns.map(() => ''))
  function update(row: number, col: number, next: string) {
    const copy = current.map(r => [...r])
    copy[row] = copy[row] ?? columns.map(() => '')
    copy[row][col] = next
    onChange(copy)
  }
  return (
    <div className="portal-perf-input-table-wrap">
      <table className="portal-perf-input-table">
        <thead><tr>{columns.map(col => <th key={col}>{col}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: 3 }).map((_, row) => (
            <tr key={row}>
              {columns.map((col, colIndex) => (
                <td key={col}><input className="portal-input" value={current[row]?.[colIndex] ?? ''} onChange={e => update(row, colIndex, e.target.value)} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SignatureInput({ value, onChange }: { value: unknown; onChange: (val: unknown) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)

  function point(e: PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function start(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    drawingRef.current = true
    const p = point(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }

  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const p = point(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#f8fafc'
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    onChange(canvas.toDataURL('image/png'))
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onChange('')
  }

  return (
    <div className="portal-form-stack">
      <canvas
        ref={canvasRef}
        width={520}
        height={160}
        className="portal-perf-signature"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={() => { drawingRef.current = false }}
        onPointerLeave={() => { drawingRef.current = false }}
      />
      {typeof value === 'string' && value ? <span className="portal-text-muted portal-text-sm">Signature captured</span> : null}
      <button type="button" className="portal-btn portal-btn-secondary portal-btn-sm portal-self-start" onClick={clear}>Clear</button>
    </div>
  )
}
