
import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Layers, LogOut, Menu, X, Trash2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useContent } from '../../context/ContentContext'

export function AdminLayout() {
    const { isDark } = useTheme()
    const { sections } = useContent()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`)

    // Detect screen size
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (isMobile) setSidebarOpen(false)
    }, [location, isMobile])

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

    const sidebarWidth = isMobile ? '280px' : '240px'

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: isDark ? '#000000' : '#f5f5f5',
            color: isDark ? '#ffffff' : '#111111',
            fontFamily: '"Geist", sans-serif',
        }}>
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 99,
                        backdropFilter: 'blur(4px)'
                    }}
                />
            )}

            {/* Sidebar */}
            <aside style={{
                width: sidebarWidth,
                borderRight: isDark ? '1px solid #222' : '1px solid #ddd',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                background: isDark ? '#0a0a0a' : '#ffffff',
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: isMobile ? (sidebarOpen ? 0 : `-${sidebarWidth}`) : 0,
                zIndex: 100,
                transition: 'left 0.3s ease',
                overflowY: 'auto'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '50%', background: '#ff3b3b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '0.8rem'
                        }}>
                            A
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 700 }}>Admin</span>
                    </div>
                    {isMobile && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link
                        to="/admin/dashboard"
                        onClick={() => isMobile && setSidebarOpen(false)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px', borderRadius: '8px',
                            background: isActive('/admin/dashboard') ? (isDark ? '#222' : '#f0f0f0') : 'transparent',
                            color: isActive('/admin/dashboard') ? '#ff3b3b' : 'inherit',
                            textDecoration: 'none', fontWeight: 500,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </Link>

                    <Link
                        to="/admin/sections"
                        onClick={() => isMobile && setSidebarOpen(false)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px', borderRadius: '8px',
                            background: isActive('/admin/sections') ? (isDark ? '#222' : '#f0f0f0') : 'transparent',
                            color: isActive('/admin/sections') ? '#ff3b3b' : 'inherit',
                            textDecoration: 'none', fontWeight: 500,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Layers size={20} />
                        Manage Sections
                    </Link>

                    <Link
                        to="/admin/cleaner"
                        onClick={() => isMobile && setSidebarOpen(false)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px', borderRadius: '8px',
                            background: isActive('/admin/cleaner') ? (isDark ? '#222' : '#f0f0f0') : 'transparent',
                            color: isActive('/admin/cleaner') ? '#ff3b3b' : 'inherit',
                            textDecoration: 'none', fontWeight: 500,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Trash2 size={20} />
                        Garbage Collector
                    </Link>

                    <div style={{ height: '1px', background: isDark ? '#222' : '#eee', margin: '8px 0' }} />

                    <div style={{ padding: '0 12px', fontSize: '0.75rem', color: '#666', fontWeight: 600, letterSpacing: '0.05em' }}>
                        SECTIONS
                    </div>

                    {sections.map(section => (
                        <Link
                            key={section.id}
                            to={`/admin/section/${section.id}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px',
                                background: isActive(`/admin/section/${section.id}`) ? (isDark ? '#222' : '#eee') : 'transparent',
                                color: isActive(`/admin/section/${section.id}`) ? '#ff3b3b' : 'inherit',
                                textDecoration: 'none', transition: 'all 0.2s', fontSize: '0.85rem'
                            }}
                        >
                            <Layers size={16} />
                            {section.title}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <Link to="/" style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px',
                    color: '#666', textDecoration: 'none', fontSize: '0.85rem'
                }}>
                    <LogOut size={18} />
                    Exit to Site
                </Link>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: isMobile ? 0 : sidebarWidth,
                padding: isMobile ? '16px' : '32px',
                maxWidth: '1400px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {/* Mobile Header */}
                {isMobile && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px',
                        padding: '12px 0',
                        borderBottom: isDark ? '1px solid #222' : '1px solid #ddd'
                    }}>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            style={{
                                background: isDark ? '#1a1a1a' : '#f0f0f0',
                                border: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Menu size={20} />
                        </button>
                        <span style={{ fontWeight: 600, fontSize: '1rem' }}>Admin Panel</span>
                    </div>
                )}
                <Outlet />
            </main>
        </div>
    )
}
