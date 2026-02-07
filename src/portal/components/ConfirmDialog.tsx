import { X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="portal-overlay">
      <div className="portal-overlay-bg" onClick={onCancel} />
      <div className="portal-dialog portal-dialog-sm portal-card-body">
        <button className="portal-dialog-close" onClick={onCancel} aria-label="Close"><X size={18} /></button>
        <h3 className="portal-dialog-title">{title}</h3>
        <p className="portal-dialog-desc">{message}</p>
        <div className="portal-dialog-actions">
          <button onClick={onCancel} className="portal-btn portal-btn-secondary">{cancelLabel}</button>
          <button onClick={onConfirm} className={`portal-btn ${danger ? 'portal-btn-danger' : 'portal-btn-primary'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
