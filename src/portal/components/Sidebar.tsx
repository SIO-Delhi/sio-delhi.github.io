import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronLeft, Menu, X, LogOut } from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'
import { usePortalAuth } from '../context/PortalAuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { NAV_CONFIG, ROLE_LABELS } from '../constants'
import type { NavItem } from '../constants'
import { UserAvatar } from './UserAvatar'
import logo from '../../assets/logo.svg'
import lightLogo from '../../assets/siodel_logo.png'

export function Sidebar() {
  const { user } = usePortalAuth()
  const { signOut } = useClerk()
  const location = useLocation()
  const { counts: notifications } = useNotifications()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (!user) return null
  const navItems = NAV_CONFIG[user.role]

  function toggleExpand(label: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const isActive = (path: string) => location.pathname === path
  const isParentActive = (item: NavItem) => item.children?.some(c => location.pathname === c.path) ?? false

  function getBadgeCount(item: NavItem): number {
    if (!item.badgeKey) return 0
    return notifications[item.badgeKey] ?? 0
  }

  function renderBadge(count: number) {
    if (count <= 0) return null
    return (
      <span className="portal-sidebar-badge">
        {count > 99 ? '99+' : count}
      </span>
    )
  }

  function renderItem(item: NavItem) {
    const Icon = item.icon
    const hasChildren = !!item.children?.length
    const open = expanded.has(item.label) || isParentActive(item)
    const badgeCount = getBadgeCount(item)

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpand(item.label)}
            className={`portal-sidebar-nav-item ${isParentActive(item) ? 'active' : ''}`}
          >
            <span className="portal-sidebar-icon-wrap">
              <Icon size={20} className="shrink-0" />
              {collapsed && renderBadge(badgeCount)}
            </span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {renderBadge(badgeCount)}
                <ChevronDown
                  size={16}
                  className={`portal-sidebar-expand-icon ${open ? 'open' : ''}`}
                />
              </>
            )}
          </button>
          {!collapsed && open && (
            <div className="portal-sidebar-sub-group">
              {item.children!.map(child => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={() => setMobileOpen(false)}
                  className={`portal-sidebar-sub-item ${isActive(child.path) ? 'active' : ''}`}
                >
                  {child.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`portal-sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
      >
        <span className="portal-sidebar-icon-wrap">
          <Icon size={20} className="shrink-0" />
          {collapsed && renderBadge(badgeCount)}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {renderBadge(badgeCount)}
          </>
        )}
      </NavLink>
    )
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(prev => !prev)}
        className="portal-mobile-toggle"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="portal-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`portal-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="portal-sidebar-inner">
          {/* Brand */}
          <div className="portal-sidebar-brand">
            <div className="portal-sidebar-logo">
              <img className="portal-sidebar-logo-dark" src={logo} alt="SIO Delhi" />
              <img className="portal-sidebar-logo-light" src={lightLogo} alt="SIO Delhi" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="portal-sidebar-brand-name">SIO Delhi</p>
                <p className="portal-sidebar-brand-sub">Portal</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="portal-sidebar-nav">
            {navItems.map(renderItem)}
          </nav>

          {/* User footer */}
          <div className="portal-sidebar-footer">
            {!collapsed && (
              <div className="portal-sidebar-user">
                <div className="portal-sidebar-user-row">
                  <UserAvatar name={user.full_name} avatarUrl={user.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="portal-sidebar-user-name">{user.full_name}</p>
                    <p className="portal-sidebar-user-role">
                      {ROLE_LABELS[user.role]}{user.title ? ` — ${user.title}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => signOut({ redirectUrl: '/' })} className="portal-logout-btn">
              <LogOut size={18} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="portal-sidebar-collapse-toggle"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              size={18}
              className={`portal-sidebar-collapse-icon ${collapsed ? 'rotated' : ''}`}
            />
          </button>
        </div>
      </aside>
    </>
  )
}
