const STATUS_CLASS: Record<string, string> = {
  active: 'portal-badge-active',
  inactive: 'portal-badge-inactive',
  migrated: 'portal-badge-migrated',
  pending: 'portal-badge-pending',
  approved: 'portal-badge-approved',
  rejected: 'portal-badge-rejected',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLASS[status] ?? STATUS_CLASS.inactive
  return (
    <span className={`portal-badge ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
