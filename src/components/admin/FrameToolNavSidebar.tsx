import { useRef, useEffect } from 'react'
import { Heart, Copy, Menu, X, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'

import { useTheme } from '../../context/ThemeContext'
import { useContent } from '../../context/ContentContext'
import siodelLogo from '../../assets/logo.svg'
import logoPng from '../../assets/logo.png'
import { ShinyButton } from '../ui/ShinyButton'

interface FrameToolNavSidebarProps {
    isCollapsed: boolean
    setIsCollapsed: (collapsed: boolean) => void
    onCollapseChange?: (isCollapsed: boolean) => void // Keep for backward compat if needed, or remove
}

export function FrameToolNavSidebar({ isCollapsed, setIsCollapsed, onCollapseChange }: FrameToolNavSidebarProps) {
    // Removed internal state
    const sidebarRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const logoRef = useRef<HTMLDivElement>(null)
    const menuItemsRef = useRef<HTMLDivElement>(null)
    const isFirstRender = useRef(true)

    const { isDark } = useTheme()
    const { setShowDonation } = useContent()
    const navigate = useNavigate()

    // Initial load animation
    useEffect(() => {
        if (!sidebarRef.current) return

        gsap.fromTo(
            sidebarRef.current,
            { x: -100, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
        )

        // Stagger menu items on initial load
        if (menuItemsRef.current) {
            const items = menuItemsRef.current.querySelectorAll('.nav-item')
            if (items.length > 0) {
                gsap.fromTo(
                    items,
                    { x: -20, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.5 }
                )
            }
        }
    }, [])

    // Collapse/Expand animation logic based on prop
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        if (!sidebarRef.current || !contentRef.current) return

        const isMobile = window.innerWidth < 768

        if (isMobile) {
            if (isCollapsed) {
                // Mobile: Close (Slide Up)
                gsap.to(sidebarRef.current, {
                    y: '-100%',
                    duration: 0.5,
                    ease: 'power3.inOut'
                })
                gsap.to(contentRef.current, {
                    opacity: 0,
                    duration: 0.3
                })
            } else {
                // Mobile: Open (Slide Down)
                gsap.to(sidebarRef.current, {
                    y: '0%',
                    duration: 0.5,
                    ease: 'power3.inOut'
                })
                gsap.to(contentRef.current, {
                    opacity: 1,
                    duration: 0.4,
                    delay: 0.1
                })
            }
        } else {
            // Desktop: Expand/Collapse Width
            if (isCollapsed) {
                gsap.to(sidebarRef.current, {
                    width: 70,
                    duration: 0.4,
                    ease: 'power2.inOut'
                })
                gsap.to(contentRef.current, {
                    opacity: 0,
                    duration: 0.2,
                    ease: 'power2.in'
                })
            } else {
                gsap.to(sidebarRef.current, {
                    width: 240,
                    duration: 0.4,
                    ease: 'power2.inOut'
                })
                gsap.to(contentRef.current, {
                    opacity: 1,
                    duration: 0.3,
                    delay: 0.2,
                    ease: 'power2.out'
                })

                // Stagger menu items
                if (menuItemsRef.current) {
                    const items = menuItemsRef.current.querySelectorAll('.nav-item')
                    gsap.fromTo(
                        items,
                        { x: -10, opacity: 0 },
                        { x: 0, opacity: 1, duration: 0.3, stagger: 0.05, delay: 0.2, ease: 'power2.out' }
                    )
                }
            }
        }
    }, [isCollapsed])

    const toggleCollapse = () => {
        const nextState = !isCollapsed
        setIsCollapsed(nextState)
        onCollapseChange?.(nextState)
    }

    return (
        <>
            {/* Overlay backdrop removed for mobile as sidebar covers full screen */}

            <div
                ref={sidebarRef}
                style={{
                    position: 'fixed',
                    left: 0,
                    right: 0, // Ensure full width
                    // Mobile: Start hidden (y: -100%) if collapsed, sit below header
                    top: window.innerWidth < 768 ? '60px' : 0,
                    // Mobile: use translate Y for animation constraint
                    transform: window.innerWidth < 768 && isCollapsed ? 'translateY(-100%)' : 'none',
                    bottom: 0,
                    // Mobile: Full width
                    width: window.innerWidth < 768 ? '100%' : (isCollapsed ? 70 : 240),
                    background: isDark ? '#09090b' : '#fafafa',
                    borderRight: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: window.innerWidth < 768 ? 40 : 10000, // Mobile: Below header (50)
                    overflow: 'hidden',
                    // Remove transition as GSAP handles it
                }}
            >
                {/* Toggle Button - More Prominent - Hide on Mobile (Header handles it) */}
                <button
                    onClick={toggleCollapse}
                    style={{
                        position: 'absolute',
                        top: 24,
                        right: isCollapsed ? 12 : 16,
                        width: isCollapsed ? 40 : 32,
                        height: isCollapsed ? 40 : 32,
                        borderRadius: '8px',
                        background: isDark
                            ? 'linear-gradient(135deg, #ff3b3b 0%, #ff6b6b 100%)'
                            : 'linear-gradient(135deg, #ff3b3b 0%, #ff6b6b 100%)',
                        border: 'none',
                        display: window.innerWidth < 768 ? 'none' : 'flex', // Hidden on mobile
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10001,
                        transition: 'all 0.2s ease',
                        color: '#ffffff',
                        boxShadow: '0 4px 12px rgba(255, 59, 59, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, {
                            scale: 1.1,
                            boxShadow: '0 6px 20px rgba(255, 59, 59, 0.5)',
                            duration: 0.2,
                            ease: 'power2.out'
                        })
                    }}
                    onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, {
                            scale: 1,
                            boxShadow: '0 4px 12px rgba(255, 59, 59, 0.3)',
                            duration: 0.2,
                            ease: 'power2.out'
                        })
                    }}
                    title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                    {isCollapsed ? <Menu size={20} strokeWidth={2.5} /> : <X size={20} strokeWidth={2.5} />}
                </button>

                {/* Content */}
                <div
                    ref={contentRef}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        padding: '24px 20px',
                        gap: '32px',
                    }}
                >
                    {/* Logo Section */}
                    <div ref={logoRef} style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
                        <a
                            href="/"
                            onClick={(e) => {
                                e.preventDefault()
                                navigate('/')
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                textDecoration: 'none',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                gsap.to(e.currentTarget, {
                                    scale: 1.02,
                                    duration: 0.2,
                                    ease: 'power2.out'
                                })
                            }}
                            onMouseLeave={(e) => {
                                gsap.to(e.currentTarget, {
                                    scale: 1,
                                    duration: 0.2,
                                    ease: 'power2.out'
                                })
                            }}
                        >
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                }}
                            >
                                <img
                                    src={siodelLogo}
                                    alt="SIO Delhi Logo"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            {!isCollapsed && (
                                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        color: '#fdedcb',
                                        letterSpacing: '-0.01em',
                                    }}>
                                        Students Islamic
                                    </span>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        color: '#fdedcb',
                                        letterSpacing: '-0.01em',
                                    }}>
                                        Organization
                                    </span>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 500,
                                        color: '#ff3b3b',
                                        letterSpacing: '-0.01em',
                                        marginTop: '2px',
                                    }}>
                                        Delhi Zone
                                    </span>
                                </div>
                            )}
                        </a>
                    </div>

                    {/* Tool Title */}
                    {!isCollapsed && window.innerWidth >= 768 && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: isDark
                                ? 'rgba(255, 59, 59, 0.1)'
                                : 'rgba(255, 59, 59, 0.05)',
                            border: `1px solid ${isDark ? 'rgba(255, 59, 59, 0.2)' : 'rgba(255, 59, 59, 0.15)'}`,
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#efc676',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                            }}>
                                <Copy size={14} />
                                Frame Tool
                            </div>
                        </div>
                    )}

                    {/* Navigation Menu */}
                    <div ref={menuItemsRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        {!isCollapsed && (
                            <>
                                <div
                                    className="nav-item"
                                    onClick={() => navigate('/utilities')}
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: 'transparent',
                                        border: '1px solid transparent',
                                        color: isDark ? '#e4e4e7' : '#3f3f46',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent'
                                    }}
                                >
                                    <Home size={18} strokeWidth={2} />
                                    Home
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: isDark ? '#52525b' : '#a1a1aa',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    marginTop: '24px',
                                    marginBottom: '8px',
                                    paddingLeft: '16px',
                                }}>
                                    Tools
                                </div>

                                <div
                                    className="nav-item active"
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        background: isDark ? 'rgba(255, 59, 59, 0.1)' : 'rgba(255, 59, 59, 0.05)',
                                        border: `1px solid ${isDark ? 'rgba(255, 59, 59, 0.2)' : 'rgba(255, 59, 59, 0.15)'}`,
                                        color: '#ff3b3b',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        cursor: 'default',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Copy size={18} strokeWidth={2} />
                                        Frame Tool
                                    </div>
                                    <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#ff3b3b',
                                        boxShadow: '0 0 8px rgba(255, 59, 59, 0.5)'
                                    }} />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!isCollapsed ? (
                            <>
                                <ShinyButton
                                    href="/"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        navigate('/#contact')
                                    }}
                                    style={{
                                        color: '#efc676',
                                        fontSize: '0.85rem',
                                        padding: '10px 16px',
                                    }}
                                >
                                    Get in touch
                                </ShinyButton>

                                <button
                                    onClick={() => setShowDonation(true)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '10px 16px',
                                        background: isDark
                                            ? 'rgba(30, 30, 32, 0.5)'
                                            : 'rgba(255, 255, 255, 0.5)',
                                        border: isDark
                                            ? '1px solid rgba(255, 255, 255, 0.1)'
                                            : '1px solid rgba(0, 0, 0, 0.1)',
                                        borderRadius: '100px',
                                        color: '#ff3b3b',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        gsap.to(e.currentTarget, {
                                            background: 'rgba(255, 59, 59, 0.1)',
                                            borderColor: 'rgba(255, 59, 59, 0.5)',
                                            scale: 1.02,
                                            duration: 0.2,
                                            ease: 'power2.out'
                                        })
                                    }}
                                    onMouseLeave={(e) => {
                                        gsap.to(e.currentTarget, {
                                            background: isDark ? 'rgba(30, 30, 32, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                            scale: 1,
                                            duration: 0.2,
                                            ease: 'power2.out'
                                        })
                                    }}
                                >
                                    <Heart size={16} />
                                    Support Us
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/#contact')}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: isDark ? '#18181b' : '#ffffff',
                                        border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#efc676',
                                        margin: '0 auto',
                                    }}
                                    title="Get in touch"
                                >
                                    <Copy size={16} />
                                </button>
                                <button
                                    onClick={() => setShowDonation(true)}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: isDark ? '#18181b' : '#ffffff',
                                        border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#ff3b3b',
                                        margin: '0 auto',
                                    }}
                                    title="Support Us"
                                >
                                    <Heart size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Collapsed Logo at Bottom - Outside animated content */}
                {isCollapsed && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '16px 0',
                            borderTop: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
                            marginTop: 'auto',
                        }}
                    >
                        <img
                            src={logoPng}
                            alt="SIO Logo"
                            style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                )}
            </div>
        </>
    )
}
