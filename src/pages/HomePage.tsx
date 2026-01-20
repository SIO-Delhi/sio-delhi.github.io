import { HeroSection } from '../components/sections/HeroSection'
import { AboutSection } from '../components/sections/AboutSection'
import { LeadershipSection } from '../components/sections/LeadershipSection'
import { MediaSection } from '../components/sections/MediaSection'
import { InitiativesSection } from '../components/sections/InitiativesSection'
import { MoreSection } from '../components/sections/MoreSection'
import { ContactSection } from '../components/sections/ContactSection'
import { useRef, useEffect, useState } from 'react'
import { InteractiveFlag } from '../components/three/InteractiveFlag'
import { useContent } from '../context/ContentContext'
import { GenericSection } from '../components/sections/GenericSection'

export function HomePage() {
    const { sections } = useContent()
    const flagContainerRef = useRef<HTMLDivElement>(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

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
                        />
                    )
                })}

            <ContactSection />
        </>
    )
}
