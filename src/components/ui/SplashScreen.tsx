import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import logoImage from '../../assets/logo.png'

export function SplashScreen() {
    const location = useLocation()

    // Don't show splash on admin pages
    if (location.pathname.startsWith('/admin')) {
        return null
    }

    // Check if splash was already seen in this tab session
    const alreadySeen = sessionStorage.getItem('sio_splash_seen') === 'true'
    const [isCollapsed, setIsCollapsed] = useState(alreadySeen)
    const [scrollProgress, setScrollProgress] = useState(0)
    const overlayRef = useRef<HTMLDivElement>(null)
    const glowRef = useRef<HTMLDivElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    const handleStartExploring = () => {
        sessionStorage.setItem('sio_splash_seen', 'true')
        setIsCollapsed(true)
    }

    // Scroll listener
    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollTop
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
            if (windowHeight === 0) return
            const scroll = totalScroll / windowHeight
            setScrollProgress(Number(scroll))
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleExpandCard = () => {
        // Just toggle state - CSS transitions handle the animation
        // This is the exact reverse of handleStartExploring
        setIsCollapsed(false)
    }

    // Initial animation on mount
    useEffect(() => {
        if (!cardRef.current || !glowRef.current) return

        gsap.fromTo(glowRef.current,
            { scale: 0.5, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.1 }
        )

        gsap.fromTo(cardRef.current,
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out', delay: 0.3 }
        )
    }, [])

    return (
        <>
            {/* Dark Overlay */}
            <div
                ref={overlayRef}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: isCollapsed ? -1 : 9999,
                    background: '#000000',
                    opacity: isCollapsed ? 0 : 1,
                    pointerEvents: isCollapsed ? 'none' : 'auto',
                    transition: 'opacity 0.4s ease',
                }}
            />

            {/* Red Glow - Full screen background with motion */}
            <div
                ref={glowRef}
                style={{
                    position: 'fixed',
                    zIndex: isCollapsed ? -1 : 10000,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '150vw',
                    height: '150vh',
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse at center, rgba(180, 50, 50, 0.6) 0%, rgba(120, 30, 30, 0.4) 30%, rgba(60, 15, 15, 0.2) 60%, transparent 80%)',
                    opacity: isCollapsed ? 0 : 1,
                    pointerEvents: 'none',
                    animation: !isCollapsed ? 'floatGlow 8s ease-in-out infinite' : 'none',
                    transition: 'opacity 0.4s ease',
                }}
            />

            {/* Glass Card - Simple CSS transition approach */}
            <div
                ref={cardRef}
                onClick={isCollapsed ? handleExpandCard : undefined}
                style={{
                    position: 'fixed',
                    zIndex: isCollapsed ? 100 : 10001,
                    // Position: center when expanded, bottom-right when collapsed
                    // We use bottom/right for both so it can animate (cannot animate from 'auto')
                    // Expanded: Bottom-Right corner is at Center (50% 50%), so we translate(50%, 50%) to center the element
                    top: 'auto',
                    left: 'auto',
                    right: isCollapsed ? 'clamp(20px, 5vw, 40px)' : '50%',
                    bottom: isCollapsed ? 'clamp(20px, 5vw, 40px)' : '50%',
                    transform: isCollapsed ? 'none' : 'translate(50%, 50%)',

                    // Size: large when expanded, small circle when collapsed
                    width: isCollapsed ? 'clamp(60px, 15vw, 70px)' : 'min(85vw, 600px)',
                    height: isCollapsed ? 'clamp(60px, 15vw, 70px)' : 'auto',
                    minHeight: isCollapsed ? 'clamp(60px, 15vw, 70px)' : 'min(50vh, 320px)',
                    padding: isCollapsed ? 0 : 'clamp(30px, 5vh, 40px) clamp(24px, 5vw, 48px) clamp(24px, 4vh, 32px)',
                    borderRadius: isCollapsed ? '50%' : 24,
                    // Style
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isCollapsed
                        ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                        : '0 8px 32px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: isCollapsed ? 'pointer' : 'default',
                    // Only transition transform and size properties, remove top/left/right/bottom as they are constant now
                    transition: 'all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    fontFamily: '"Geist", sans-serif',
                    letterSpacing: '-0.02em',
                }}
                onMouseEnter={(e) => {
                    if (isCollapsed) {
                        e.currentTarget.style.transform = 'scale(1.1)'
                    }
                }}
                onMouseLeave={(e) => {
                    if (isCollapsed) {
                        e.currentTarget.style.transform = 'scale(1)'
                    }
                }}
            >
                {/* Scroll Progress Indicator - Red line around circle */}
                {isCollapsed && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none', zIndex: 10 }}>
                        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2" />
                            <circle
                                cx="50"
                                cy="50"
                                r="48"
                                fill="none"
                                stroke="#ff3b3b"
                                strokeWidth="2"
                                strokeDasharray="301.59"
                                strokeDashoffset={301.59 * (1 - scrollProgress)}
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                )}

                {/* Logo */}
                <img
                    src={logoImage}
                    alt="SIO Delhi Logo"
                    style={{
                        width: isCollapsed ? 'clamp(30px, 8vw, 40px)' : 'clamp(80px, 20vw, 100px)',
                        height: isCollapsed ? 'clamp(30px, 8vw, 40px)' : 'clamp(80px, 20vw, 100px)',
                        objectFit: 'contain',
                        marginBottom: isCollapsed ? 0 : 'clamp(16px, 4vh, 20px)',
                        transition: 'width 0.5s ease, height 0.5s ease, margin 0.5s ease',
                    }}
                />

                {/* Content - Mission Statement */}
                {!isCollapsed && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            width: '100%',
                        }}
                    >
                        <p
                            style={{
                                color: 'rgba(255, 255, 255, 0.75)',
                                fontSize: 'clamp(0.85rem, 4vw, 1.1rem)',
                                lineHeight: 1.6,
                                maxWidth: '100%',
                                fontWeight: 300,
                                margin: 0,
                                padding: '0 10px',
                                fontFamily: '"Geist", sans-serif',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            The mission of the <span style={{ color: '#ff6b6b', fontWeight: 500 }}>Students Islamic Organisation of India (SIO)</span> is to{' '}
                            "<span style={{ color: '#ffffff', fontWeight: 400 }}>prepare the students and youth</span> for the{' '}
                            <span style={{ color: '#ff6b6b', fontWeight: 500 }}>reconstruction of the society</span> in the light of{' '}
                            <span style={{ color: '#ffffff', fontWeight: 400 }}>Divine Guidance</span>."
                        </p>
                    </div>
                )}
            </div>

            {/* Start Exploring Button - Glassy with animated border light */}
            {/* Scroll Indicator - Only on Home Page & At Top */}
            {isCollapsed && location.pathname === '/' && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 99,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontFamily: '"Geist", sans-serif',
                        letterSpacing: '-0.02em',
                        fontSize: 10,
                        opacity: scrollProgress < 0.02 ? 1 : 0, // Fade out when scrolled (approx moment it leaves hero)
                        pointerEvents: scrollProgress < 0.02 ? 'auto' : 'none',
                        transition: 'opacity 0.3s ease',
                    }}
                >
                    <span style={{ textTransform: 'uppercase' }}>Scroll</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                </div>
            )}

            {!isCollapsed && (
                <div
                    className="shiny-button-container"
                    style={{
                        position: 'fixed',
                        zIndex: 10002,
                        bottom: 'clamp(15%, 20vh, 25%)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                    }}
                >
                    <button
                        ref={buttonRef}
                        onClick={handleStartExploring}
                        className="shiny-button"
                        style={{
                            position: 'relative',
                            padding: 'clamp(12px, 2vh, 14px) clamp(24px, 5vw, 36px)',
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: 100,
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: 'clamp(11px, 3vw, 13px)',
                            fontWeight: 500,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        Start Exploring
                    </button>
                </div>
            )}

            {/* CSS for animations */}
            <style>{`
                @keyframes floatGlow {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    25% {
                        transform: translate(-48%, -52%) scale(1.02);
                    }
                    50% {
                        transform: translate(-52%, -48%) scale(0.98);
                    }
                    75% {
                        transform: translate(-50%, -50%) scale(1.01);
                    }
                }
                
                .shiny-button-container {
                    position: relative;
                    border-radius: 100px;
                    padding: 1px;
                    background: rgba(255, 255, 255, 0.15);
                    overflow: hidden;
                }
                
                .shiny-button-container::before {
                    content: '';
                    position: absolute;
                    inset: -50%;
                    background: conic-gradient(
                        from var(--angle, 0deg),
                        transparent 0deg,
                        transparent 260deg,
                        rgba(255, 255, 255, 0.2) 290deg,
                        rgba(255, 255, 255, 0.5) 320deg,
                        rgba(255, 255, 255, 1) 350deg,
                        rgba(255, 255, 255, 0.5) 355deg,
                        rgba(255, 255, 255, 0.2) 358deg,
                        transparent 360deg
                    );
                    animation: spin 5s linear infinite;
                }
                
                .shiny-button-container::after {
                    content: '';
                    position: absolute;
                    inset: 1px;
                    border-radius: 100px;
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
                
                .shiny-button {
                    position: relative;
                    z-index: 1;
                    border: none !important;
                    background: transparent !important;
                }
                
                @keyframes spin {
                    0% { --angle: 0deg; }
                    100% { --angle: 360deg; }
                }
                
                @property --angle {
                    syntax: '<angle>';
                    initial-value: 0deg;
                    inherits: false;
                }
            `}</style>
        </>
    )
}
