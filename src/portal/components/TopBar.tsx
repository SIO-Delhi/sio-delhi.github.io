import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, Mail, ArrowRightLeft, BarChart3, Search, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePortalAuth } from '../context/PortalAuthContext'
import { useNotifications } from '../context/NotificationContext'
import { ROLE_LABELS } from '../constants'
import { UserAvatar } from './UserAvatar'
import * as api from '../api'
import type { PortalSearchResult } from '../types'

function rolePrefix(role: string): string {
  const map: Record<string, string> = {
    admin: '/portal/admin',
    zonal_secretary: '/portal/zonal',
    regional_president: '/portal/regional',
    unit_president: '/portal/unit',
    member: '/portal/member',
  }
  return map[role] ?? '/portal/member'
}

type PortalTheme = 'dark' | 'light'

type TopBarProps = {
  title?: string
  theme?: PortalTheme
  onToggleTheme?: () => void
}

export function TopBar({ title, theme = 'dark', onToggleTheme }: TopBarProps) {
  const { user } = usePortalAuth()
  const { counts, decrement, refresh } = useNotifications()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PortalSearchResult | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery)
  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery)
    if (!searchQuery.trim()) {
      setSearchResults(null)
      setSearchOpen(false)
    }
  }

  const showSearch = !!user

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults(null); return }
    try {
      const res = await api.searchPortal(q)
      const term = q.trim().toLowerCase()
      if (user) {
        const selfMatches = [
          user.full_name,
          user.first_name,
          user.middle_name ?? '',
          user.last_name,
          user.username ?? '',
          user.phone ?? '',
        ].some(v => String(v ?? '').toLowerCase().includes(term))
        const hasSelf = res.members.some(m => m.id === user.id)
        if (selfMatches && !hasSelf) {
          res.members = [{
            id: user.id,
            full_name: user.full_name,
            phone: user.phone,
            unit_name: user.membership_name ?? user.unit_name ?? user.circle_name ?? user.campus_name ?? null,
          }, ...res.members]
        }
      }
      setSearchResults(res)
      setSearchOpen(true)
    } catch {
      setSearchResults(null)
    }
  }, [user])

  useEffect(() => {
    if (!searchQuery.trim()) return
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => runSearch(searchQuery), 250)
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current) }
  }, [searchQuery, runSearch])

  useEffect(() => {
    if (!searchOpen) return
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [searchOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!user) return null

  const prefix = rolePrefix(user.role)
  const total = counts.unreadMessages + counts.pendingMigrations + counts.pendingForms

  function handleSearchSelect(type: 'member' | 'unit' | 'region' | 'circle' | 'campus', id: string) {
    if (!user) return
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults(null)
    if (type === 'member') {
      // Members searching for themselves should go to their profile page
      if (user.role === 'member' && id === user.id) {
        navigate(`${prefix}/profile`)
      } else if (user.role === 'member') {
        // Members can't view other members' profiles, go to profile
        navigate(`${prefix}/profile`)
      } else {
        navigate(`${prefix}/members/${id}`)
      }
    }
    else if (type === 'unit') navigate(`${prefix}/units/${id}`)
    else if (type === 'region') navigate(`${prefix}/regions`)
    else if (type === 'circle') navigate(`${prefix}/circles/${id}`)
    else navigate(`${prefix}/campuses/${id}`)
  }

  const items = [
    { key: 'messages', label: 'Unread Messages', count: counts.unreadMessages, icon: Mail, path: `${prefix}/messages/inbox` },
    { key: 'migrations', label: 'Pending Migrations', count: counts.pendingMigrations, icon: ArrowRightLeft, path: `${prefix}/migrations` },
    {
      key: 'forms',
      label: user.role === 'member' ? 'Pending Forms' : 'Responses Needing Review',
      count: counts.pendingForms,
      icon: BarChart3,
      path: `${prefix}/forms`,
    },
  ]

  async function handleItemClick(item: typeof items[number]) {
    setOpen(false)
    if (item.key === 'forms' && user.role !== 'member') {
      api.markPerfResponseNotificationsSeen(user.id)
        .then(() => decrement('pendingForms', item.count))
        .catch(() => refresh())
    }
    navigate(item.path)
  }

  return (
    <header className="portal-topbar">
      <div className="portal-topbar-left">
        {showSearch && (
          <div className="portal-topbar-search-wrap" ref={searchRef}>
            <Search size={18} className="portal-topbar-search-icon" />
            <input
              type="search"
              className="portal-topbar-search-input"
              placeholder="Search members, units, regions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchResults && setSearchOpen(true)}
              aria-label="Search"
            />
            {searchOpen && searchResults && (
              <div className="portal-topbar-search-dropdown">
                {searchResults.members.length > 0 && (
                  <div className="portal-topbar-search-section">
                    <span className="portal-topbar-search-section-title">Members</span>
                    {searchResults.members.slice(0, 5).map(m => (
                      <button key={m.id} type="button" className="portal-topbar-search-item" onClick={() => handleSearchSelect('member', m.id)}>
                        <span>{m.full_name}</span>
                        {m.unit_name && <span className="portal-topbar-search-meta">{m.unit_name}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.units.length > 0 && (
                  <div className="portal-topbar-search-section">
                    <span className="portal-topbar-search-section-title">Units</span>
                    {searchResults.units.slice(0, 5).map(u => (
                      <button key={u.id} type="button" className="portal-topbar-search-item" onClick={() => handleSearchSelect('unit', u.id)}>{u.name}</button>
                    ))}
                  </div>
                )}
                {searchResults.regions.length > 0 && (
                  <div className="portal-topbar-search-section">
                    <span className="portal-topbar-search-section-title">Regions</span>
                    {searchResults.regions.slice(0, 5).map(r => (
                      <button key={r.id} type="button" className="portal-topbar-search-item" onClick={() => handleSearchSelect('region', r.id)}>{r.name}</button>
                    ))}
                  </div>
                )}
                {searchResults.circles.length > 0 && (
                  <div className="portal-topbar-search-section">
                    <span className="portal-topbar-search-section-title">Circles</span>
                    {searchResults.circles.slice(0, 5).map(c => (
                      <button key={c.id} type="button" className="portal-topbar-search-item" onClick={() => handleSearchSelect('circle', c.id)}>{c.name}</button>
                    ))}
                  </div>
                )}
                {searchResults.campuses.length > 0 && (
                  <div className="portal-topbar-search-section">
                    <span className="portal-topbar-search-section-title">Campuses</span>
                    {searchResults.campuses.slice(0, 5).map(c => (
                      <button key={c.id} type="button" className="portal-topbar-search-item" onClick={() => handleSearchSelect('campus', c.id)}>{c.name}</button>
                    ))}
                  </div>
                )}
                {searchResults.members.length === 0 && searchResults.units.length === 0 && searchResults.regions.length === 0 && searchResults.circles.length === 0 && searchResults.campuses.length === 0 && (
                  <p className="portal-topbar-search-empty">No results</p>
                )}
              </div>
            )}
          </div>
        )}
        {title && <h2 className="portal-topbar-title">{title}</h2>}
      </div>

      <div className="portal-topbar-right">
        {onToggleTheme && (
          <button
            type="button"
            className="portal-topbar-theme-toggle"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            onClick={onToggleTheme}
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        )}

        <div className="portal-topbar-notif-wrap" ref={dropdownRef}>
          <button className="portal-topbar-notif" aria-label="Notifications" onClick={() => { setOpen(prev => !prev); refresh() }}>
            <Bell size={20} />
            {total > 0 && <span className="portal-topbar-notif-badge">{total > 99 ? '99+' : total}</span>}
          </button>

          {open && (
            <div className="portal-topbar-dropdown">
              <p className="portal-topbar-dropdown-title">Notifications</p>
              {total === 0 ? (
                <p className="portal-topbar-dropdown-empty">All caught up!</p>
              ) : (
                <div className="portal-topbar-dropdown-list">
                  {items.filter(i => i.count > 0).map(item => {
                    const Icon = item.icon
                    return (
                      <button key={item.key} className="portal-topbar-dropdown-item" onClick={() => handleItemClick(item)}>
                        <div className="portal-topbar-dropdown-icon"><Icon size={16} /></div>
                        <span className="portal-topbar-dropdown-label">{item.label}</span>
                        <span className="portal-topbar-dropdown-count">{item.count}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

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
