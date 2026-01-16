import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'

export function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null)
    const circleRef = useRef<HTMLDivElement>(null)
    const location = useLocation()

    useEffect(() => {
        const dot = dotRef.current
        const circle = circleRef.current
        if (!dot || !circle) return

        // Set initial position off-screen
        gsap.set([dot, circle], { xPercent: -50, yPercent: -50, x: -100, y: -100 })

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e

            // Dot follows more quickly
            gsap.to(dot, {
                x: clientX,
                y: clientY,
                duration: 0.15,
                ease: 'power2.out',
            })

            // Circle follows with more lag
            gsap.to(circle, {
                x: clientX,
                y: clientY,
                duration: 0.5,
                ease: 'power2.out',
            })
        }

        // Hover state handlers
        const handleMouseEnter = () => {
            // Hide the dot
            gsap.to(dot, {
                opacity: 0,
                duration: 0.2,
            })

            // Show and expand the circle
            gsap.to(circle, {
                width: 100,
                height: 100,
                opacity: 1,
                duration: 0.4,
                ease: 'power3.out',
            })
        }

        const handleMouseLeave = () => {
            // Show the dot
            gsap.to(dot, {
                opacity: 1,
                duration: 0.2,
            })
            // Hide the circle
            gsap.to(circle, {
                width: 0,
                height: 0,
                opacity: 0,
                duration: 0.4,
                ease: 'power3.out',
            })
        }

        // Add event listeners
        window.addEventListener('mousemove', handleMouseMove)

        // Listen for specific "view" elements only (blog posts, cards, etc.)
        const addHoverListeners = () => {
            const viewables = document.querySelectorAll('[data-cursor="view"], .cursor-view')
            viewables.forEach((el) => {
                el.addEventListener('mouseenter', handleMouseEnter)
                el.addEventListener('mouseleave', handleMouseLeave)
            })
        }

        // Initial setup and mutation observer for dynamic content
        addHoverListeners()

        const observer = new MutationObserver(() => {
            addHoverListeners()
        })
        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            observer.disconnect()
        }
    }, [])

    // Reset cursor on route change
    useEffect(() => {
        const dot = dotRef.current
        const circle = circleRef.current
        if (!dot || !circle) return

        // Force reset to default state
        gsap.to(dot, { opacity: 1, duration: 0.2 })
        gsap.to(circle, { width: 0, height: 0, opacity: 0, duration: 0.2 })
    }, [location])

    return (
        <>
            {/* Small Red Glowing Dot */}
            <div
                ref={dotRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: 'rgba(255, 59, 59, 0.8)',
                    pointerEvents: 'none',
                    zIndex: 9998,
                }}
            />

            {/* Large Transparent Circle with View Text */}
            <div
                ref={circleRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                    borderRadius: '50%',
                    background: 'rgba(80, 80, 80, 0.6)',
                    backdropFilter: 'blur(2px)',
                    pointerEvents: 'none',
                    zIndex: 9997,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                }}
            >
                <span
                    style={{
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 400,
                        letterSpacing: '0.02em',
                        pointerEvents: 'none',
                    }}
                >
                    View
                </span>
            </div>
        </>
    )
}
