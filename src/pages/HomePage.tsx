import { HeroSection } from '../components/sections/HeroSection'
import { AboutSection } from '../components/sections/AboutSection'
import { LeadershipSection } from '../components/sections/LeadershipSection'
import { MediaSection } from '../components/sections/MediaSection'
import { InitiativesSection } from '../components/sections/InitiativesSection'
import { MoreSection } from '../components/sections/MoreSection'
import { ContactSection } from '../components/sections/ContactSection'
import { useRef, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { InteractiveFlag } from '../components/three/InteractiveFlag'
import { useContent } from '../context/ContentContext'
import { GenericSection } from '../components/sections/GenericSection'

export function HomePage() {
    const { sections, loading } = useContent()
    const flagContainerRef = useRef<HTMLDivElement>(null)
    const [isMobile, setIsMobile] = useState(false)
    const location = useLocation()

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Handle scroll from other pages
    useEffect(() => {
        if (loading) return

        const performScroll = (targetId: string) => {
            let attempts = 0
            const maxAttempts = 20 // 2 seconds

            const poll = setInterval(() => {
                const element = document.querySelector(targetId)
                if (element) {
                    clearInterval(poll)
                    // Small delay to ensure layout stability
                    setTimeout(() => {
                        const lenis = (window as any).lenis
                        if (lenis) {
                            lenis.scrollTo(element, { offset: -50 }) // Add some offset
                        } else {
                            element.scrollIntoView({ behavior: 'smooth' })
                        }
                    }, 100)
                } else {
                    attempts++
                    if (attempts >= maxAttempts) clearInterval(poll)
                }
            }, 100)
        }

        if (location.state && (location.state as any).scrollTo) {
            const targetId = (location.state as any).scrollTo
            performScroll(targetId)
            // Clear state to avoid scrolling on subsequent updates
            window.history.replaceState({}, document.title)
        } else if (location.hash) {
            performScroll(location.hash)
        }
    }, [location, loading])

    useEffect(() => {
        // Global Scroll Trigger for Flag - Blur and move to center
        // ... existing legacy code ...
        const onScroll = () => {
            const scrollY = window.scrollY
            const viewportHeight = window.innerHeight
            const mobile = window.innerWidth < 1280 // Mobile/Tablet check

            // Progress from 0 to 1 over first 50% of viewport scroll
            const progress = Math.min(scrollY / (viewportHeight * 0.5), 1)

            if (flagContainerRef.current) {
                const blur = progress * 4 // Max 4px blur
                const opacity = 1 - (progress * 0.4) // Fade slightly

                if (mobile) {
                    flagContainerRef.current.style.filter = `blur(${blur}px)`
                    flagContainerRef.current.style.opacity = `${opacity}`
                    flagContainerRef.current.style.transform = `none`
                } else {
                    const translateX = progress * 28
                    const translateY = progress * 25

                    flagContainerRef.current.style.filter = `blur(${blur}px)`
                    flagContainerRef.current.style.opacity = `${opacity}`
                    flagContainerRef.current.style.transform = `translate(${translateX}vw, ${translateY}vh) scale(1)`
                }
            }
        }

        onScroll()

        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onScroll)
        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', onScroll)
        }
    }, [])

    if (loading) {
        return <HomePageSkeleton />
    }

    return (
        <>
            {/* Global Fixed Flag Background - Only on Home */}
            <div
                ref={flagContainerRef}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2, // Above gradient
                    pointerEvents: 'none',
                    transition: 'filter 0.2s ease-out, opacity 0.2s ease-out, transform 0.3s ease-out',
                    willChange: 'filter, opacity, transform'
                }}
            >
                <InteractiveFlag isMobile={isMobile} />
            </div>

            {/* Global Blurred Gradient - Responsive Position */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: '100vw',
                    height: '100vh',
                    background: isMobile
                        ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%), linear-gradient(to bottom, rgba(255, 59, 59, 0.6) 0%, rgba(255, 59, 59, 0.3) 60%, transparent 100%)' // Black Bottom-up + Red Top-down (Inverted & Extended)
                        : 'radial-gradient(ellipse 130% 100% at 130% 50%, rgba(255, 59, 59, 0.8) 0%, rgba(255, 59, 59, 0.5) 40%, rgba(255, 59, 59, 0.2) 70%, transparent 100%)', // Right-side for desktop
                    zIndex: 1, // Below flag
                    pointerEvents: 'none',
                    transition: 'background 0.5s ease'
                }}
            />

            <HeroSection />

            {/* Dynamic Sections */}
            {sections
                .filter(s => s.is_published)
                .map(section => {
                    // Map legacy/custom sections to their specific components
                    if (section.type === 'custom') {
                        switch (section.id) {
                            case 'about': return <AboutSection key={section.id} />
                            case 'initiatives': return <InitiativesSection key={section.id} />
                            case 'media': return <MediaSection key={section.id} />
                            case 'leadership': return <LeadershipSection key={section.id} />
                            case 'more': return <MoreSection key={section.id} />
                            default: break // Fallback to generic if id mismatch
                        }
                    }
                    // Render Generic Section for new/generic types
                    return (
                        <GenericSection
                            key={section.id}
                            sectionId={section.id}
                            title={section.title}
                            label={section.label}
                            template={section.template}
                        />
                    )
                })}

            <ContactSection />
        </>
    )
}

function SkeletonBlock({ width = '100%', height = '20px', borderRadius = '8px', style = {} }: {
    width?: string; height?: string; borderRadius?: string; style?: React.CSSProperties
}) {
    return (
        <div style={{
            width, height, borderRadius,
            background: 'linear-gradient(90deg, #18181b 25%, #27272a 50%, #18181b 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeletonShimmer 1.5s ease-in-out infinite',
            ...style
        }} />
    )
}

function HomePageSkeleton() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#09090b',
            color: 'white',
            fontFamily: '"DM Sans", sans-serif',
            overflow: 'hidden'
        }}>
            <style>{`
                @keyframes skeletonShimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>

            {/* Hero skeleton */}
            <div style={{ padding: '160px 40px 80px', maxWidth: '1400px', margin: '0 auto' }}>
                <SkeletonBlock width="120px" height="14px" style={{ marginBottom: '24px' }} />
                <SkeletonBlock width="60%" height="48px" borderRadius="12px" style={{ marginBottom: '16px' }} />
                <SkeletonBlock width="40%" height="48px" borderRadius="12px" style={{ marginBottom: '32px' }} />
                <SkeletonBlock width="80%" height="18px" style={{ marginBottom: '12px' }} />
                <SkeletonBlock width="50%" height="18px" style={{ marginBottom: '40px' }} />
                <SkeletonBlock width="160px" height="48px" borderRadius="100px" />
            </div>

            {/* Section skeletons */}
            {[1, 2, 3].map(i => (
                <div key={i} style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
                    <SkeletonBlock width="80px" height="12px" style={{ marginBottom: '16px' }} />
                    <SkeletonBlock width="300px" height="32px" borderRadius="10px" style={{ marginBottom: '32px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {[1, 2, 3].map(j => (
                            <SkeletonBlock key={j} height="200px" borderRadius="16px" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
