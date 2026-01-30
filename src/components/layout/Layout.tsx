import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import Lenis from 'lenis'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Navbar } from './Navbar'
import { UtilitiesNavbar } from './UtilitiesNavbar' // Imported
import { Footer } from './Footer'
import { CustomCursor } from '../ui/CustomCursor'

gsap.registerPlugin(ScrollTrigger)

interface LayoutProps {
    children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
    const mainRef = useRef<HTMLDivElement>(null)
    const lenisRef = useRef<Lenis | null>(null)
    const location = useLocation()
    const isUtilities = location.pathname.startsWith('/utilities')
    const isFrameTool = location.pathname.includes('/utilities/frame-tool')

    // Dynamic Title Logic
    useEffect(() => {
        let title = 'SIO Delhi'
        const path = location.pathname

        if (path.startsWith('/about-us')) title += ' | About Us'
        else if (path.startsWith('/initiative')) title += ' | Initiatives'
        else if (path.startsWith('/media')) title += ' | Press & Media'
        else if (path.startsWith('/leader')) title += ' | Leadership'
        else if (path.startsWith('/subsection')) title += ' | Collection'
        else if (path.includes('frame-tool')) title += ' | Frame Tool'

        document.title = title
    }, [location])

    // Initialize Lenis smooth scrolling
    useEffect(() => {
        // Prevent browser from checking scroll position on refresh/back
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual'
        }

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            touchMultiplier: 2,
        })

        lenisRef.current = lenis

            // Expose lenis globally for scrollTo functionality
            ; (window as typeof window & { lenis?: Lenis }).lenis = lenis

        // Sync with GSAP ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update)

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000)
        })

        gsap.ticker.lagSmoothing(0)

        return () => {
            lenis.destroy()
            lenisRef.current = null
        }
    }, [])

    // Handle hash scrolling
    useEffect(() => {
        if (!location.hash) return

        const scrollToHash = () => {
            const hash = location.hash
            if (!hash) return

            // Parse composed hash format: #section:cardId or #section
            const hashContent = hash.replace('#', '')
            const [sectionId, cardId] = hashContent.includes(':')
                ? hashContent.split(':')
                : [hashContent, null]

            // Target the card element if present, otherwise fallback to section
            const targetId = cardId ? `card-${cardId}` : sectionId
            const offset = -100

            // Helper to find and scroll to element
            const attemptScroll = () => {
                let targetElement = document.getElementById(targetId)

                // If card not found, fallback to section
                if (!targetElement && cardId) {
                    targetElement = document.getElementById(sectionId)
                }

                if (targetElement) {
                    const lenis = (window as any).lenis
                    if (lenis) {
                        // Force resize to ensure Lenis knows the new page height
                        lenis.resize()

                        // If we found the actual card element (not section fallback),
                        // scroll it into view horizontally within its container first
                        if (cardId && targetElement.id === targetId) {
                            // Scroll horizontally within the container
                            targetElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'nearest',  // Don't change vertical position yet
                                inline: 'center'   // Center horizontally in viewport
                            })
                            // Then use Lenis for smooth vertical scroll with offset
                            setTimeout(() => {
                                lenis.scrollTo(targetElement, { offset, immediate: false })
                            }, 150)
                        } else {
                            // Section-only scroll
                            lenis.scrollTo(targetElement, { offset, immediate: false })
                        }
                        return true
                    }
                    return false
                }
                return false // Not found yet
            }

            // Delay initial attempt to allow layout to settle (especially when switching pages)
            setTimeout(() => {
                // Attempt immediately after delay
                if (attemptScroll()) return

                // Polling for dynamic content AND Lenis initialization
                let attempts = 0
                const maxAttempts = 40
                const interval = setInterval(() => {
                    attempts++
                    const success = attemptScroll()
                    if (success) {
                        clearInterval(interval)
                    } else if (attempts >= maxAttempts) {
                        // Final fallback attempt using native scroll
                        const targetElement = document.getElementById(targetId)
                        if (targetElement) {
                            const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset
                            window.scrollTo({
                                top: elementPosition + offset,
                                behavior: 'smooth'
                            })
                        }
                        clearInterval(interval)
                    }
                }, 100)

                // Return empty cleanup since we handled interval internally/implicitly in this simplified logic
                // Ideally we'd track the timeout/interval in a ref but for this fix simplicity:
                return () => { }
            }, 100)

            // Return empty cleanup since we handled interval internally/implicitly in this simplified logic
            // Ideally we'd track the timeout/interval in a ref but for this fix simplicity:
            return () => { }
        }

        // Run on mount and hash change
        const cleanup = scrollToHash()
        return () => {
            if (cleanup) cleanup()
        }
    }, [location.hash, location.pathname])

    // Page entry animation
    useEffect(() => {
        if (!mainRef.current) return

        const ctx = gsap.context(() => {
            gsap.fromTo(
                mainRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.5, ease: 'power2.out' }
            )
        })

        return () => ctx.revert()
    }, [])

    return (
        <div className="min-h-screen flex flex-col">
            <CustomCursor />
            {!isFrameTool && (isUtilities ? <UtilitiesNavbar /> : <Navbar />)}
            <main ref={mainRef} className="flex-1">
                {children}
            </main>
            {!isFrameTool && <Footer />}
        </div>
    )
}
