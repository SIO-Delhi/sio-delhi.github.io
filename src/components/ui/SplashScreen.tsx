import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import logoImage from '../../assets/logo.svg'
import pngEggImage from '../../assets/pngegg.webp'
import { useContent } from '../../context/ContentContext'

export function SplashScreen() {
    const location = useLocation()
    const { setShowDonation } = useContent()

    // Check if splash was already seen in this tab session
    const alreadySeen = typeof window !== 'undefined' && sessionStorage.getItem('sio_splash_seen') === 'true'
    const [isCollapsed, setIsCollapsed] = useState(alreadySeen)
    const [isAssetsLoaded, setIsAssetsLoaded] = useState(false)
    const [scrollProgress, setScrollProgress] = useState(0)

    // Preload Images
    useEffect(() => {
        const loadImages = async () => {
            const images = [logoImage, pngEggImage]
            const promises = images.map(src => {
                return new Promise((resolve) => {
                    const img = new Image()
                    img.src = src
                    img.onload = resolve
                    img.onerror = resolve
                })
            })
            await Promise.all(promises)
            // Small buffer to ensure rendering
            setTimeout(() => setIsAssetsLoaded(true), 100)
        }
        loadImages()
    }, [])

    // Refs for Splash Elements
    const splashContainerRef = useRef<HTMLDivElement>(null)
    const splashContentRef = useRef<HTMLDivElement>(null)

    // Refs for Persistent Button
    const buttonRef = useRef<HTMLDivElement>(null)

    // Only show splash screen on the strict home page
    const isHomePage = location.pathname === '/'

    const handleStartExploring = () => {
        if (!splashContainerRef.current) {
            finishSplash()
            return
        }

        const tl = gsap.timeline({
            onComplete: finishSplash
        })

        // Animate Splash Container Up and Out
        tl.to(splashContainerRef.current, {
            yPercent: -100,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.inOut'
        })
    }

    const finishSplash = () => {
        sessionStorage.setItem('sio_splash_seen', 'true')
        setIsCollapsed(true)
    }

    const handleScrollToTop = () => {
        // If mobile/tablet (< 1024px), open Donation modal instead
        if (window.innerWidth < 1024) {
            setShowDonation(true)
            return
        }

        if ((window as any).lenis) {
            (window as any).lenis.scrollTo(0, { duration: 1.5 })
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    // Scroll listener for progress ring
    useEffect(() => {
        if (!isHomePage) return
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollTop
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
            if (windowHeight === 0) return
            const scroll = totalScroll / windowHeight
            setScrollProgress(Number(scroll))
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isHomePage])

    // Don't render on non-home pages (forms, admin, etc.)
    if (!isHomePage) {
        return null
    }

    return (
        <>
            {/* SPLASH SCREEN OVERLAY */}
            {!isCollapsed && (
                <div
                    ref={splashContainerRef}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: '#000000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    {/* Background Glow */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '150vw',
                            height: '150vh',
                            background: 'radial-gradient(ellipse at center, rgba(180, 50, 50, 0.4) 0%, rgba(120, 30, 30, 0.2) 30%, transparent 70%)',
                            pointerEvents: 'none',
                        }}
                    />

                    {/* Content Container - Only show when assets loaded */}
                    <div
                        ref={splashContentRef}
                        style={{
                            position: 'relative',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: 0,
                            padding: '1rem',
                            maxWidth: 'clamp(300px, 90vw, 700px)',
                            width: '100%',
                            fontFamily: '"DM Sans", sans-serif',
                            opacity: isAssetsLoaded ? 1 : 0,
                            transition: 'opacity 0.6s ease-out'
                        }}
                    >
                        {/* Decorative Bismillah/Calligraphy */}
                        <img
                            src={pngEggImage}
                            alt="Bismillah"
                            style={{
                                width: 'clamp(140px, 30vw, 200px)',
                                height: 'auto',
                                objectFit: 'contain',
                                filter: 'brightness(0) invert(1)', // White silhouette
                                opacity: 0.9,
                                marginBottom: '0' // Tight to logo
                            }}
                        />

                        {/* Logo */}
                        <img
                            src={logoImage}
                            alt="SIO Delhi Logo"
                            style={{
                                width: 'clamp(80px, 18vw, 120px)',
                                height: 'auto',
                                objectFit: 'contain',
                                marginBottom: 'clamp(0.5rem, 1.5vh, 1rem)', // Reduced gap to text
                            }}
                        />

                        {/* Mission Statement */}
                        <p
                            style={{
                                color: '#fdedcb', // Updated to Cream
                                fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)',
                                lineHeight: 1.5,
                                fontWeight: 300,
                                letterSpacing: '-0.02em',
                                maxWidth: '90%',
                                margin: 0,
                            }}
                        >
                            The mission of the <span style={{ color: '#ff6b6b', fontWeight: 500 }}>Students Islamic Organisation of India (SIO)</span> is to{' '}
                            "<span style={{ color: '#fdedcb', fontWeight: 500 }}>prepare the students and youth</span> for the{' '}
                            <span style={{ color: '#ff6b6b', fontWeight: 500 }}>reconstruction of the society</span> in the light of{' '}
                            <span style={{ color: '#fdedcb', fontWeight: 500 }}>Divine Guidance</span>."
                        </p>

                        {/* Shiny Start Exploring Button */}
                        <div
                            className="shiny-button-container"
                            style={{
                                marginTop: 'clamp(1.5rem, 3vh, 2.5rem)', // Separation for button
                            }}
                        >
                            <button
                                onClick={handleStartExploring}
                                className="shiny-button"
                                style={{
                                    position: 'relative',
                                    padding: 'clamp(12px, 2vh, 14px) clamp(24px, 5vw, 36px)',
                                    background: 'rgba(253, 237, 203, 0.08)', // Hint of cream in bg
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(253, 237, 203, 0.2)', // Cream border
                                    borderRadius: 100,
                                    color: '#fdedcb', // Cream text
                                    fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                                    fontWeight: 500,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(253, 237, 203, 0.12)'
                                    e.currentTarget.style.borderColor = 'rgba(253, 237, 203, 0.3)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(253, 237, 203, 0.08)'
                                    e.currentTarget.style.borderColor = 'rgba(253, 237, 203, 0.2)'
                                }}
                            >
                                Start Exploring
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* PERSISTENT SCROLL TOP BUTTON */}
            {/* Always rendered, sits at bottom red */}
            <div
                ref={buttonRef}
                onClick={handleScrollToTop}
                style={{
                    position: 'fixed',
                    zIndex: 100,
                    right: 'clamp(20px, 5vw, 40px)',
                    bottom: 'clamp(20px, 5vw, 40px)',
                    width: 'clamp(60px, 15vw, 70px)',
                    height: 'clamp(60px, 15vw, 70px)',
                    padding: 0,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease',
                    fontFamily: '"DM Sans", sans-serif',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                }}
            >
                {/* Scroll Progress Indicator */}
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

                {/* Small Logo */}
                <img
                    src={logoImage}
                    alt="Up"
                    style={{
                        width: 'clamp(30px, 8vw, 40px)',
                        height: 'auto',
                        objectFit: 'contain',
                    }}
                />
            </div>

            {/* Scroll Indicator - Only visible when not scrolled much */}
            {location.pathname === '/' && (
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
                        fontFamily: '"DM Sans", sans-serif',
                        letterSpacing: '-0.02em',
                        fontSize: 10,
                        opacity: scrollProgress < 0.02 && isCollapsed ? 1 : 0, // Only show if splash is gone
                        pointerEvents: scrollProgress < 0.02 && isCollapsed ? 'auto' : 'none',
                        transition: 'opacity 0.3s ease',
                    }}
                >
                    <span style={{ textTransform: 'uppercase' }}>Scroll</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                </div>
            )}
        </>
    )
}
