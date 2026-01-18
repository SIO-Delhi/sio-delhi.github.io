import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import Lenis from 'lenis'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

gsap.registerPlugin(ScrollTrigger)

interface LayoutProps {
    children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
    const mainRef = useRef<HTMLDivElement>(null)
    const lenisRef = useRef<Lenis | null>(null)
    const location = useLocation()

    // Dynamic Title Logic
    useEffect(() => {
        let title = 'SIO Delhi'
        const path = location.pathname

        if (path.startsWith('/about-us')) title += ' | About Us'
        else if (path.startsWith('/initiative')) title += ' | Initiatives'
        else if (path.startsWith('/media')) title += ' | Press & Media'
        else if (path.startsWith('/leader')) title += ' | Leadership'
        else if (path.startsWith('/subsection')) title += ' | Collection'

        document.title = title
    }, [location])

    // Initialize Lenis smooth scrolling
    useEffect(() => {
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

            const targetId = hash.replace('#', '')
            // Standard offset to account for fixed navbar
            const offset = -100

            // Helper to find and scroll to element
            const attemptScroll = () => {
                const targetElement = document.getElementById(targetId)
                if (targetElement) {
                    const lenis = (window as any).lenis
                    if (lenis) {
                        // Lenis is ready, perform smooth scroll
                        lenis.scrollTo(targetElement, { offset, immediate: false })
                        return true
                    }
                    // If target exists but Lenis isn't ready yet, we might want to wait a bit 
                    // unless we've been waiting too long. 
                    // For now, let's allow the loop to continue until Lenis is ready OR timeout takes over fallback.
                    // But to prevent infinite waiting if Lenis fails, the loop limit handles "giving up".
                    // However, we need a way to say "We found it, but waiting for Lenis".
                    // Simplification: Just allow native scroll fallback if Lenis really isn't there after a few tries?
                    // Actually, Lenis inits very fast. If it's null, we should probably wait.
                    return false
                }
                return false // Not found yet
            }

            // Attempt immediately
            if (attemptScroll()) return

            // Polling for dynamic content AND Lenis initialization
            let attempts = 0
            const maxAttempts = 40 // 4 seconds max (100ms interval)
            const interval = setInterval(() => {
                attempts++
                const success = attemptScroll()
                if (success) {
                    clearInterval(interval)
                } else if (attempts >= maxAttempts) {
                    // Final fallback attempt using native scroll if we timed out
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
            }, 100) // Check every 100ms

            return () => clearInterval(interval)
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
            <Navbar />
            <main ref={mainRef} className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    )
}
