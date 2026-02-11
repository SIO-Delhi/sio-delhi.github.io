import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface RevokeDialogProps {
  open: boolean
  memberName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export function RevokeDialog({ open, memberName, onConfirm, onCancel }: RevokeDialogProps) {
  const [reason, setReason] = useState('')

  if (!open) return null

  function handleConfirm() {
    if (reason.trim().length === 0) return
    onConfirm(reason.trim())
    setReason('')
  }

  function handleCancel() {
    setReason('')
    onCancel()
  }

  const hasReason = reason.trim().length > 0

  return (
    <div className="portal-dialog-overlay" onClick={handleCancel}>
      <div className="portal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="portal-dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
            <AlertTriangle size={20} />
            <h3 className="portal-dialog-title">Revoke Membership</h3>
          </div>
        </div>

        <div className="portal-dialog-body">
          <p style={{ marginBottom: 16, fontSize: '0.875rem', color: 'var(--p-text-muted)' }}>
            You are about to revoke the membership of <strong style={{ color: 'var(--p-cream)' }}>{memberName}</strong>.
            Their profile will be hidden from unit and regional members and marked as banned. This can be reversed later.
          </p>

          <div>
            <label className="portal-label" style={{ fontSize: '0.75rem' }}>Reason for revocation (required)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Enter the reason for revoking this member's membership..."
              className="portal-input"
              rows={3}
              style={{ fontSize: '0.8125rem', resize: 'vertical' }}
            />
          </div>
        </div>

        <div className="portal-dialog-footer">
          <button onClick={handleCancel} className="portal-btn portal-btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasReason}
            className="portal-btn"
            style={{
              opacity: hasReason ? 1 : 0.5,
              background: '#ef4444',
              color: '#fff',
              border: '1px solid #ef4444',
            }}
          >
            Revoke Membership
          </button>
        </div>
      </div>
    </div>
  )
}
