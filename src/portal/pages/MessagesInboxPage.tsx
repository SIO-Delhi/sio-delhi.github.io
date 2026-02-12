import React, { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Reply, Users, User, Radio } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePortalAuth } from '../context/PortalAuthContext'
import { useNotifications } from '../context/NotificationContext'
import * as api from '../api'
import type { PortalMessage } from '../types'
import { ROLE_LABELS } from '../constants'
import { EmptyState } from '../components/EmptyState'
import { UserAvatar } from '../components/UserAvatar'

type Tab = 'inbox' | 'sent'

export function MessagesInboxPage() {
  const { user } = usePortalAuth()
  const { decrement } = useNotifications()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('inbox')
  const [messages, setMessages] = useState<PortalMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<PortalMessage | null>(null)

  const [prevTab, setPrevTab] = useState(tab)
  if (tab !== prevTab) {
    setPrevTab(tab)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    if (!user) return
    let cancelled = false
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
      try {
        await api.markMessageAsRead(msg.id)
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m))
        decrement('unreadMessages')
      } catch { /* non-critical */ }
    }
  }

  function handleReply(msg: PortalMessage) {
    // Navigate to compose with pre-filled reply info via URL params
    const basePath = `/portal/${user!.role === 'unit_president' ? 'unit' : user!.role === 'regional_president' ? 'regional' : user!.role === 'zonal_secretary' ? 'zonal' : user!.role === 'admin' ? 'admin' : 'member'}/messages/compose`
    const params = new URLSearchParams()
    if (msg.sender_id && msg.sender_id !== user!.id) {
      params.set('replyTo', msg.sender_id)
      params.set('replyName', msg.sender_name ?? '')
    }
    params.set('subject', `Re: ${msg.subject.replace(/^Re:\s*/i, '')}`)
    navigate(`${basePath}?${params}`)
  }

  function isBroadcast(msg: PortalMessage): boolean {
    // PHP/MySQL may return TINYINT as string "0"/"1", number 0/1, or boolean
    return msg.is_broadcast === true || msg.is_broadcast === (1 as unknown) || msg.is_broadcast === ('1' as unknown)
  }

  function getMessageType(msg: PortalMessage): { label: string; icon: React.ReactNode; className: string } {
    if (isBroadcast(msg)) return { label: 'Broadcast', icon: <Radio size={12} />, className: 'portal-msg-type-broadcast' }
    if (msg.recipient_role) return { label: ROLE_LABELS[msg.recipient_role] ?? msg.recipient_role, icon: <Users size={12} />, className: 'portal-msg-type-role' }
    return { label: 'Direct', icon: <User size={12} />, className: 'portal-msg-type-direct' }
  }

  // Detail view
  if (selected) {
    const msgType = getMessageType(selected)
    const canReply = tab === 'inbox' && selected.sender_id !== user.id

    return (
      <div className="portal-page portal-page-narrow">
        <button onClick={() => setSelected(null)} className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start">
          <ArrowLeft size={16} /> Back to {tab}
        </button>
        <div className="portal-card portal-card-body portal-msg-detail">
          <div className="portal-msg-detail-top">
            <h2 className="portal-msg-detail-subject">{selected.subject}</h2>
            <span className={`portal-msg-type-badge ${msgType.className}`}>{msgType.icon} {msgType.label}</span>
          </div>
          <div className="portal-msg-detail-meta">
            <div className="portal-msg-detail-sender">
              <UserAvatar name={selected.sender_name ?? 'Unknown'} size="sm" />
              <div>
                <p className="portal-msg-detail-sender-name">{selected.sender_name ?? 'Unknown'}{selected.sender_role && <span className="portal-msg-detail-sender-role"> ({ROLE_LABELS[selected.sender_role]})</span>}</p>
                {selected.recipient_name && !isBroadcast(selected) && <p className="portal-msg-detail-to">To: {selected.recipient_name}</p>}
                {isBroadcast(selected) && <p className="portal-msg-detail-to">To: Everyone</p>}
              </div>
            </div>
            <span className="portal-msg-detail-time"><Clock size={13} /> {fmtDate(selected.created_at)}</span>
          </div>
          <div className="portal-msg-detail-divider" />
          <div className="portal-msg-detail-body">{selected.body}</div>
          {canReply && (
            <>
              <div className="portal-msg-detail-divider" />
              <button onClick={() => handleReply(selected)} className="portal-btn portal-btn-secondary portal-btn-sm">
                <Reply size={16} /> Reply
              </button>
            </>
          )}
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
          {messages.map(msg => {
            const msgType = getMessageType(msg)
            const isUnread = !msg.is_read && tab === 'inbox'
            const fromName = tab === 'inbox' ? (msg.sender_name ?? 'Unknown') : (msg.recipient_name ?? (isBroadcast(msg) ? 'Everyone' : 'Unknown'))
            const preview = msg.body?.slice(0, 100) ?? ''

            return (
              <button key={msg.id} onClick={() => handleOpen(msg)} className={`portal-msg-card ${isUnread ? 'unread' : ''}`}>
                <div className="portal-msg-row">
                  <div className="portal-msg-avatar-col">
                    <UserAvatar name={fromName} size="sm" />
                    {isUnread && <span className="portal-msg-unread-dot" />}
                  </div>
                  <div className="portal-msg-body">
                    <div className="portal-msg-header">
                      <div className="portal-msg-header-left">
                        <p className={`portal-msg-from ${isUnread ? 'portal-msg-from-unread' : ''}`}>{fromName}</p>
                        <span className={`portal-msg-type-pill ${msgType.className}`}>{msgType.label}</span>
                      </div>
                      <span className="portal-msg-time">{fmtRelative(msg.created_at)}</span>
                    </div>
                    <p className={`portal-msg-subject ${isUnread ? 'portal-msg-subject-unread' : ''}`}>{msg.subject}</p>
                    <p className="portal-msg-snippet">{preview}{preview.length >= 100 ? '…' : ''}</p>
                  </div>
                </div>
              </button>
            )
          })}
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
