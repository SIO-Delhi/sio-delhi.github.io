const STATUS_CLASS: Record<string, string> = {
  active: 'portal-badge-active',
  inactive: 'portal-badge-inactive',
  migrated: 'portal-badge-migrated',
  revoked: 'portal-badge-revoked',
  pending: 'portal-badge-pending',
  approved: 'portal-badge-approved',
  rejected: 'portal-badge-rejected',
}

const STATUS_LABEL: Record<string, string> = {
  revoked: 'Membership Revoked',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLASS[status] ?? STATUS_CLASS.inactive
  const label = STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={`portal-badge ${cls}`}>
      {label}
    </span>
  )
}
