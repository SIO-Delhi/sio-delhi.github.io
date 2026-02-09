import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, CheckCircle } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import * as api from '../api'
import type { PortalUser, PortalRole } from '../types'
import { ROLE_LABELS } from '../constants'

type RecipientMode = 'individual' | 'role' | 'broadcast'

function getAvailableRoleTargets(userRole: PortalRole): PortalRole[] {
  switch (userRole) {
    case 'admin': return ['admin', 'zonal_secretary', 'regional_president', 'unit_president', 'campus_president', 'member']
    case 'zonal_secretary': return ['admin', 'zonal_secretary', 'regional_president', 'unit_president', 'campus_president', 'member']
    case 'regional_president': return ['unit_president', 'campus_president', 'member']
    case 'unit_president': return ['member']
    case 'campus_president': return ['member']
    case 'member': return ['unit_president', 'zonal_secretary']
    default: return []
  }
}

export function MessagesComposePage() {
  const { user } = usePortalAuth()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<RecipientMode>('individual')
  const [recipientId, setRecipientId] = useState('')
  const [recipientRole, setRecipientRole] = useState<PortalRole | ''>('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [users, setUsers] = useState<PortalUser[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Pre-fill from reply params
  useEffect(() => {
    const replyTo = searchParams.get('replyTo')
    const replySubject = searchParams.get('subject')
    if (replyTo) { setMode('individual'); setRecipientId(replyTo) }
    if (replySubject) setSubject(replySubject)
  }, [searchParams])

  useEffect(() => { api.fetchUsers().then(setUsers).catch(() => {}) }, [])
  const roleTargets = user ? getAvailableRoleTargets(user.role) : []
  if (!user) return null

  const individualRecipients = user.role === 'member'
    ? users.filter(u => u.id !== user.id && (
        (u.role === 'unit_president' && u.unit_id === user.unit_id) ||
        u.role === 'regional_president' ||
        u.role === 'zonal_secretary' ||
        u.role === 'admin'
      ))
    : users.filter(u => u.id !== user.id)
  const canBroadcast = user.role !== 'member' || !!user.title
  const memberOnlyIndividual = user.role === 'member'
  const availableModes: RecipientMode[] = memberOnlyIndividual
    ? ['individual']
    : canBroadcast
      ? ['individual', 'role', 'broadcast']
      : ['individual', 'role']

  async function handleSend(e: React.FormEvent) {
    e.preventDefault(); if (!user) return; setError(null); setSuccess(false)
    if (!subject.trim()) { setError('Subject is required.'); return }
    if (!body.trim()) { setError('Message body is required.'); return }
    if (mode === 'individual' && !recipientId) { setError('Please select a recipient.'); return }
    if (mode === 'role' && !recipientRole) { setError('Please select a target role.'); return }

    setSending(true)
    try {
      await api.sendMessage({ sender_id: user.id, recipient_id: mode === 'individual' ? recipientId : null, recipient_role: mode === 'role' ? (recipientRole as PortalRole) : null, subject: subject.trim(), body: body.trim(), is_broadcast: mode === 'broadcast' })
      setSuccess(true); setSubject(''); setBody(''); setRecipientId(''); setRecipientRole('')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to send message.') }
    finally { setSending(false) }
  }

  return (
    <div className="portal-page portal-page-narrow">
      <div>
        <h1 className="portal-heading">Compose Message</h1>
        <p className="portal-subheading">
          {user.role === 'member'
            ? 'Send a message to your unit president, regional president, zonal secretary, or admin.'
            : 'Send a message to individuals, groups, or broadcast to everyone.'}
        </p>
      </div>

      {success && <div className="portal-alert portal-alert-success"><CheckCircle size={18} /> <p>Message sent successfully!</p></div>}
      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      <div className="portal-card portal-card-body">
        <form onSubmit={handleSend} className="portal-form-stack-lg">
          {!memberOnlyIndividual && (
            <div>
              <label className="portal-label">Send To</label>
              <div className="portal-tab-group">
                {availableModes.map(m => (
                  <button key={m} type="button" onClick={() => { setMode(m); setRecipientId(''); setRecipientRole('') }} className={`portal-tab ${mode === m ? 'active' : ''}`}>
                    {m === 'individual' ? 'Individual' : m === 'role' ? 'By Role' : 'Broadcast All'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'individual' && (
            <div>
              <label className="portal-label">{memberOnlyIndividual ? 'Send To' : 'Recipient'}</label>
              <select value={recipientId} onChange={e => setRecipientId(e.target.value)} className="portal-input portal-select">
                <option value="">{memberOnlyIndividual ? 'Select recipient…' : 'Select recipient…'}</option>
                {individualRecipients.map(u => <option key={u.id} value={u.id}>{u.full_name} ({ROLE_LABELS[u.role]}){u.unit_name ? ` — ${u.unit_name}` : ''}</option>)}
              </select>
            </div>
          )}

          {mode === 'role' && (
            <div>
              <label className="portal-label">Target Role</label>
              <select value={recipientRole} onChange={e => setRecipientRole(e.target.value as PortalRole)} className="portal-input portal-select">
                <option value="">Select role…</option>
                {roleTargets.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}s</option>)}
              </select>
            </div>
          )}

          {mode === 'broadcast' && <div className="portal-alert portal-alert-warning">This message will be sent to all users in the system.</div>}

          <div>
            <label className="portal-label portal-label-required">Subject</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Message subject" className="portal-input" />
          </div>

          <div>
            <label className="portal-label portal-label-required">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Type your message…" rows={6} className="portal-input portal-textarea" />
          </div>

          <button type="submit" disabled={sending} className="portal-btn portal-btn-primary portal-self-start">
            <Send size={16} /> {sending ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  )
}
