import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function PortalLayout() {
  return (
    <div className="portal-app portal-layout">
      <Sidebar />
      <div className="portal-layout-main">
        <TopBar />
        <main className="portal-layout-content portal-animate-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
