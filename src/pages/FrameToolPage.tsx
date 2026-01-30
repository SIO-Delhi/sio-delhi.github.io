import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { Menu, X } from 'lucide-react'
import { FrameTool } from '../components/admin/FrameTool'
import { FrameToolNavSidebar } from '../components/admin/FrameToolNavSidebar'
import logoPng from '../assets/logo.png'

export function FrameToolPage() {
    const workspaceRef = useRef<HTMLDivElement>(null)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    // Refs for icon animation
    const menuIconRef = useRef<HTMLDivElement>(null)
    const closeIconRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (!workspaceRef.current) return

        const paddingLeft = isMobile ? 0 : (sidebarCollapsed ? 70 : 240)

        gsap.to(workspaceRef.current, {
            paddingLeft,
            duration: 0.4,
            ease: 'power2.inOut'
        })
    }, [sidebarCollapsed, isMobile])

    // Icon Animation Effect
    useEffect(() => {
        if (!menuIconRef.current || !closeIconRef.current) return

        if (!sidebarCollapsed) {
            // Menu Open (Show X) -> Pop Effect
            gsap.to(menuIconRef.current, { opacity: 0, rotate: 90, scale: 0.5, duration: 0.3, ease: 'back.in(1.5)' })
            gsap.to(closeIconRef.current, { opacity: 1, rotate: 0, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.6)', delay: 0.1 })
        } else {
            // Menu Closed (Show Hamburger) -> Pop Effect
            gsap.to(menuIconRef.current, { opacity: 1, rotate: 0, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.6)', delay: 0.1 })
            gsap.to(closeIconRef.current, { opacity: 0, rotate: -90, scale: 0.5, duration: 0.3, ease: 'back.in(1.5)' })
        }
    }, [sidebarCollapsed])

    return (
        <>
            <FrameToolNavSidebar
                isCollapsed={sidebarCollapsed}
                setIsCollapsed={setSidebarCollapsed}
                onCollapseChange={setSidebarCollapsed}
            />

            {/* Mobile Header (replaces floating button) */}
            {isMobile && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: '#09090b',
                    borderBottom: '1px solid #27272a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    zIndex: 50,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <a href="https://siodelhi.org" target="_blank" rel="noopener noreferrer">
                            <img src={logoPng} alt="SIO" style={{ height: '40px', width: 'auto' }} />
                        </a>
                    </div>

                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            width: '24px',
                            height: '24px',
                        }}
                    >
                        <div ref={menuIconRef} style={{ position: 'absolute', inset: 0 }}>
                            <Menu size={24} />
                        </div>
                        <div ref={closeIconRef} style={{ position: 'absolute', inset: 0, opacity: 0, transform: 'rotate(-90deg)' }}>
                            <X size={24} />
                        </div>
                    </button>
                </div>
            )}

            <div
                ref={workspaceRef}
                style={{
                    height: '100vh',
                    paddingLeft: window.innerWidth < 768 ? 0 : '240px',
                    paddingTop: isMobile ? '60px' : 0, // Push content down for header
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                    <FrameTool />
                </div>
            </div>
        </>
    )
}
