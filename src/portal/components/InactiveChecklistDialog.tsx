import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useDialogA11y } from '../hooks/useDialogA11y'

const INACTIVE_REASONS = [
  'Not attending programs regularly',
  'Not giving ayant/dues',
  'Not participating in unit activities',
  'Repeated absence from meetings',
  'Not responding to communications',
  'Violation of organizational guidelines',
]

interface InactiveChecklistDialogProps {
  open: boolean
  memberName: string
  onConfirm: (reasons: string[]) => void
  onCancel: () => void
}

export function InactiveChecklistDialog({ open, memberName, onConfirm, onCancel }: InactiveChecklistDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [customReason, setCustomReason] = useState('')

  function handleCancel() {
    setSelected(new Set())
    setCustomReason('')
    onCancel()
  }

  const dialogRef = useDialogA11y(open, handleCancel)

  if (!open) return null

  function toggleReason(reason: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(reason)) next.delete(reason)
      else next.add(reason)
      return next
    })
  }

  function handleConfirm() {
    const reasons = [...selected]
    if (customReason.trim()) reasons.push(customReason.trim())
    if (reasons.length === 0) return
    onConfirm(reasons)
    setSelected(new Set())
    setCustomReason('')
  }

  const hasSelection = selected.size > 0 || customReason.trim().length > 0

  return (
    <div className="portal-dialog-overlay" onClick={handleCancel} role="dialog" aria-modal="true" aria-label="Set Member Inactive" ref={dialogRef}>
      <div className="portal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="portal-dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--p-amber)' }}>
            <AlertTriangle size={20} />
            <h3 className="portal-dialog-title">Set Member Inactive</h3>
          </div>
        </div>

        <div className="portal-dialog-body">
          <p style={{ marginBottom: 16, fontSize: '0.875rem', color: 'var(--p-text-muted)' }}>
            You are about to set <strong style={{ color: 'var(--p-cream)' }}>{memberName}</strong> as inactive.
            Please select at least one reason:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {INACTIVE_REASONS.map(reason => (
              <label
                key={reason}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  background: selected.has(reason) ? 'rgba(232, 197, 71, 0.08)' : 'transparent',
                  border: `1px solid ${selected.has(reason) ? 'var(--p-amber)' : 'var(--p-border)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(reason)}
                  onChange={() => toggleReason(reason)}
                  style={{ accentColor: 'var(--p-amber)' }}
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="portal-label" style={{ fontSize: '0.75rem' }}>Other reason (optional)</label>
            <input
              type="text"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Type additional reason…"
              className="portal-input"
              style={{ fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        <div className="portal-dialog-footer">
          <button onClick={handleCancel} className="portal-btn portal-btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasSelection}
            className="portal-btn portal-btn-primary"
            style={{ opacity: hasSelection ? 1 : 0.5 }}
          >
            Confirm — Set Inactive
          </button>
        </div>
      </div>
    </div>
  )
}
