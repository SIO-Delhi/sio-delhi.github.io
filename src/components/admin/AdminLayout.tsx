
import { useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Layers, LogOut } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useContent } from '../../context/ContentContext'

export function AdminLayout() {
    const { isDark } = useTheme()
    const { sections } = useContent()
    const location = useLocation()

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`)

    // Update Page Title
    useEffect(() => {
        let title = 'Admin Panel'
        if (location.pathname.includes('/dashboard')) {
            title += ' | Dashboard'
        } else if (location.pathname.includes('/section/')) {
            const sectionId = location.pathname.split('/section/')[1]
            const section = sections.find(s => s.id === sectionId)
            if (section) title += ` | ${section.title}`
        } else if (location.pathname.includes('/create') || location.pathname.includes('/post')) {
            title += ' | Editor'
        }
        document.title = title
    }, [location, sections])

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: isDark ? '#000000' : '#f5f5f5',
            color: isDark ? '#ffffff' : '#111111',
            fontFamily: '"Geist", sans-serif',
        }}>
            {/* Sidebar */}
            <aside style={{
                width: '280px',
                borderRight: isDark ? '1px solid #222' : '1px solid #ddd',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
                background: isDark ? '#0a0a0a' : '#ffffff',
                position: 'fixed',
                top: 0,
                bottom: 0,
                zIndex: 100
            }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: '#ff3b3b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white'
                    }}>
                        A
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Admin Panel</span>
                </div>

                {/* Navigation */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <Link
                        to="/admin/dashboard"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px',
                            background: isActive('/admin/dashboard') ? (isDark ? '#222' : '#eee') : 'transparent',
                            color: isActive('/admin/dashboard') ? '#ff3b3b' : 'inherit',
                            textDecoration: 'none', transition: 'all 0.2s'
                        }}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>

                    <div style={{ margin: '16px 0 8px', fontSize: '0.75rem', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                        Sections
                    </div>

                    {sections.map(section => (
                        <Link
                            key={section.id}
                            to={`/admin/section/${section.id}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px',
                                background: isActive(`/admin/section/${section.id}`) ? (isDark ? '#222' : '#eee') : 'transparent',
                                color: isActive(`/admin/section/${section.id}`) ? '#ff3b3b' : 'inherit',
                                textDecoration: 'none', transition: 'all 0.2s', fontSize: '0.9rem'
                            }}
                        >
                            <Layers size={18} />
                            {section.title}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <Link to="/" style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px',
                    color: '#666', textDecoration: 'none', marginTop: 'auto'
                }}>
                    <LogOut size={20} />
                    Exit to Site
                </Link>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: '280px',
                padding: '40px',
                maxWidth: '1200px',
                width: '100%'
            }}>
                <Outlet />
            </main>
        </div>
    )
}
