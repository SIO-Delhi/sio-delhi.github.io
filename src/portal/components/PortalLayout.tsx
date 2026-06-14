import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { NotificationProvider } from '../context/NotificationContext'

type PortalTheme = 'dark' | 'light'

export function PortalLayout() {
  const [theme, setTheme] = useState<PortalTheme>(() => {
    if (typeof window === 'undefined') return 'dark'
    return window.localStorage.getItem('portal-theme') === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    window.localStorage.setItem('portal-theme', theme)
  }, [theme])

  return (
    <NotificationProvider>
      <div className={`portal-app portal-layout portal-theme-${theme}`}>
        <Sidebar />
        <div className="portal-layout-main">
          <TopBar theme={theme} onToggleTheme={() => setTheme(current => current === 'dark' ? 'light' : 'dark')} />
          <main className="portal-layout-content portal-animate-in">
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  )
}
