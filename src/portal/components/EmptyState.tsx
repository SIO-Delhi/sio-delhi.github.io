import { Link } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: { label: string; to: string }
  /* Aliases for convenient DataTable usage */
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, actionLabel, actionHref }: EmptyStateProps) {
  const finalAction = action ?? (actionLabel && actionHref ? { label: actionLabel, to: actionHref } : undefined)

  return (
    <div className="portal-empty">
      <div className="portal-empty-icon">
        <Icon size={28} />
      </div>
      <h3 className="portal-empty-title">{title}</h3>
      <p className="portal-empty-desc">{description}</p>
      {finalAction && (
        <Link to={finalAction.to} className="portal-btn portal-btn-primary mt-6">
          {finalAction.label}
        </Link>
      )}
    </div>
  )
}
