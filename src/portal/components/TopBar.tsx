import { Bell } from 'lucide-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { ROLE_LABELS } from '../constants'
import { UserAvatar } from './UserAvatar'

export function TopBar({ title }: { title?: string }) {
  const { user } = usePortalAuth()
  if (!user) return null

  return (
    <header className="portal-topbar">
      <div className="portal-topbar-left">
        {title && <h2 className="portal-topbar-title">{title}</h2>}
      </div>

      <div className="portal-topbar-right">
        <button className="portal-topbar-notif" aria-label="Notifications">
          <Bell size={20} />
        </button>

        <div className="portal-topbar-user">
          <UserAvatar name={user.full_name} avatarUrl={user.avatar_url} size="md" />
          <div>
            <p className="portal-topbar-user-name">{user.full_name}</p>
            <p className="portal-topbar-user-role">
              {ROLE_LABELS[user.role]}{user.title ? ` — ${user.title}` : ''}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
