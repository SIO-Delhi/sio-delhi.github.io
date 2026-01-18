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

        // Track active state
        let isActive = false

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

            // Check for viewable elements under cursor
            const target = e.target as HTMLElement
            const isViewable = target.closest('[data-cursor="view"], .cursor-view')

            if (isViewable && !isActive) {
                isActive = true
                console.log('Cursor enter viewable')
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
            } else if (!isViewable && isActive) {
                isActive = false
                console.log('Cursor leave viewable')
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
        }

        // Add event listeners
        window.addEventListener('mousemove', handleMouseMove)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
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
