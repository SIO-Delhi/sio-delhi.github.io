import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, Mail, ArrowRightLeft, BarChart3, Search } from 'lucide-react'
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

export function TopBar({ title }: { title?: string }) {
  const { user } = usePortalAuth()
  const { counts } = useNotifications()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PortalSearchResult | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showSearch = !!user

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults(null); return }
    try {
      const res = await api.searchPortal(q)
      setSearchResults(res)
      setSearchOpen(true)
    } catch {
      setSearchResults(null)
    }
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      setSearchOpen(false)
      return
    }
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
    { key: 'forms', label: 'Pending Forms', count: counts.pendingForms, icon: BarChart3, path: `${prefix}/performance` },
  ]

  function handleItemClick(path: string) {
    setOpen(false)
    navigate(path)
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
        <div className="portal-topbar-notif-wrap" ref={dropdownRef}>
          <button className="portal-topbar-notif" aria-label="Notifications" onClick={() => setOpen(prev => !prev)}>
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
                      <button key={item.key} className="portal-topbar-dropdown-item" onClick={() => handleItemClick(item.path)}>
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
