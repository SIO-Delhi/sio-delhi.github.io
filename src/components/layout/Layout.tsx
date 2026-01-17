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
