import { useState, useEffect } from 'react'
import { Mail, MailOpen, ArrowLeft, Clock } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import * as api from '../api'
import type { PortalMessage } from '../types'
import { ROLE_LABELS } from '../constants'
import { EmptyState } from '../components/EmptyState'

type Tab = 'inbox' | 'sent'

export function MessagesInboxPage() {
  const { user } = usePortalAuth()
  const [tab, setTab] = useState<Tab>('inbox')
  const [messages, setMessages] = useState<PortalMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<PortalMessage | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false; setLoading(true); setError(null)
    api.fetchMessages(user.id, tab)
      .then(data => { if (!cancelled) setMessages(data) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load messages.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user, tab])

  if (!user) return null

  async function handleOpen(msg: PortalMessage) {
    setSelected(msg)
    if (tab === 'inbox' && !msg.is_read) {
      try { await api.markMessageAsRead(msg.id); setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m)) } catch { /* non-critical */ }
    }
  }

  // Detail view
  if (selected) {
    return (
      <div className="portal-page portal-page-narrow">
        <button onClick={() => setSelected(null)} className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start">
          <ArrowLeft size={16} /> Back to {tab}
        </button>
        <div className="portal-card portal-card-body">
          <h2 className="portal-msg-detail-subject">{selected.subject}</h2>
          <div className="portal-msg-detail-meta">
            <span>From: <strong>{selected.sender_name ?? 'Unknown'}</strong>{selected.sender_role && ` (${ROLE_LABELS[selected.sender_role]})`}</span>
            {selected.recipient_name && <span>To: <strong>{selected.recipient_name}</strong></span>}
            {selected.is_broadcast && <span className="portal-badge portal-badge-migrated">Broadcast</span>}
            <span className="portal-sort-indicator"><Clock size={12} /> {fmtDate(selected.created_at)}</span>
          </div>
          <div className="portal-msg-detail-body">{selected.body}</div>
        </div>
      </div>
    )
  }

  const unread = messages.filter(m => !m.is_read).length

  return (
    <div className="portal-page">
      <div>
        <h1 className="portal-heading">Messages</h1>
        <p className="portal-subheading">View your sent and received messages.</p>
      </div>

      <div className="portal-tab-group">
        <button onClick={() => setTab('inbox')} className={`portal-tab ${tab === 'inbox' ? 'active' : ''}`}>
          Inbox {unread > 0 && tab === 'inbox' && <span className="portal-unread-pill">{unread}</span>}
        </button>
        <button onClick={() => setTab('sent')} className={`portal-tab ${tab === 'sent' ? 'active' : ''}`}>Sent</button>
      </div>

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      {loading && (
        <div className="portal-loading-list">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="portal-skeleton portal-skeleton-msg" />)}
        </div>
      )}

      {!loading && messages.length === 0 && (
        <EmptyState title={`No ${tab} messages`} description={tab === 'inbox' ? 'Your inbox is empty.' : "You haven't sent any messages yet."} />
      )}

      {!loading && messages.length > 0 && (
        <div className="portal-msg-list">
          {messages.map(msg => (
            <button key={msg.id} onClick={() => handleOpen(msg)} className={`portal-msg-card ${!msg.is_read && tab === 'inbox' ? 'unread' : ''}`}>
              <div className="portal-msg-row">
                <div className={`portal-msg-icon ${msg.is_read || tab === 'sent' ? 'portal-msg-icon-read' : 'portal-msg-icon-unread'}`}>
                  {msg.is_read || tab === 'sent' ? <MailOpen size={16} /> : <Mail size={16} />}
                </div>
                <div className="portal-msg-body">
                  <div className="portal-msg-header">
                    <p className={`portal-msg-subject ${!msg.is_read && tab === 'inbox' ? 'portal-msg-subject-unread' : ''}`}>{msg.subject}</p>
                    <span className="portal-msg-time">{fmtRelative(msg.created_at)}</span>
                  </div>
                  <p className="portal-msg-snippet">
                    {tab === 'inbox' ? `From: ${msg.sender_name ?? 'Unknown'}${msg.is_broadcast ? ' (Broadcast)' : ''}` : `To: ${msg.recipient_name ?? (msg.is_broadcast ? 'Everyone' : 'Unknown')}`}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return iso }
}

function fmtRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return fmtDate(iso)
  } catch { return iso }
}
