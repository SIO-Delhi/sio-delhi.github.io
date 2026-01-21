import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null)
    const cursorDotRef = useRef<HTMLDivElement>(null)
    const [isView, setIsView] = useState(false)
    const location = useLocation()

    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024
            setIsMobile(mobile)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Reset cursor state on route change
    useEffect(() => {
        setIsView(false)
    }, [location])



    useEffect(() => {
        const cursor = cursorRef.current
        const cursorDot = cursorDotRef.current

        if (!cursor || !cursorDot) return

        const moveCursor = (e: MouseEvent) => {
            // Glow follows cursor center
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                xPercent: -50,
                yPercent: -50,
                duration: 0.5,
                ease: 'power2.out',
            })
            // Dot follows cursor center (removed offset)
            gsap.to(cursorDot, {
                x: e.clientX + 22,
                y: e.clientY + 22,
                xPercent: -50,
                yPercent: -50,
                duration: 0.6,
                ease: 'power3.out',
            })
        }

        const handleMouseEnter = () => {
            gsap.to([cursor, cursorDot], {
                opacity: 1,
                duration: 0.3,
            })
        }

        const handleMouseLeave = () => {
            gsap.to([cursor, cursorDot], {
                opacity: 0,
                duration: 0.3,
            })
        }

        // Detect hover on elements with data-cursor="view"
        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const viewElement = target.closest('[data-cursor="view"]')
            if (viewElement) {
                setIsView(true)
            }
        }

        const handleMouseOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const viewElement = target.closest('[data-cursor="view"]')
            const relatedTarget = e.relatedTarget as HTMLElement
            const relatedViewElement = relatedTarget?.closest?.('[data-cursor="view"]')

            // Only set to false if we're leaving a view element and not entering another one
            if (viewElement && !relatedViewElement) {
                setIsView(false)
            }
        }

        window.addEventListener('mousemove', moveCursor)
        document.body.addEventListener('mouseenter', handleMouseEnter)
        document.body.addEventListener('mouseleave', handleMouseLeave)
        document.addEventListener('mouseover', handleMouseOver)
        document.addEventListener('mouseout', handleMouseOut)

        return () => {
            window.removeEventListener('mousemove', moveCursor)
            document.body.removeEventListener('mouseenter', handleMouseEnter)
            document.body.removeEventListener('mouseleave', handleMouseLeave)
            document.removeEventListener('mouseover', handleMouseOver)
            document.removeEventListener('mouseout', handleMouseOut)
        }
    }, [])

    if (isMobile) return null

    return (
        <>
            <div ref={cursorRef} className="cursor-glow" />
            <div
                ref={cursorDotRef}
                className="cursor-dot"
                style={{
                    // Conditional styles for View state
                    width: isView ? '80px' : undefined,
                    height: isView ? '80px' : undefined,
                    borderRadius: isView ? '50%' : undefined,
                    background: isView ? 'rgba(255, 255, 255, 0.05)' : undefined,
                    backdropFilter: isView ? 'blur(16px) saturate(1.5)' : undefined,
                    WebkitBackdropFilter: isView ? 'blur(16px) saturate(1.5)' : undefined,
                    border: isView ? '1px solid rgba(255, 255, 255, 0.1)' : undefined,
                    boxShadow: isView ? '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)' : undefined,
                    display: isView ? 'flex' : undefined,
                    alignItems: isView ? 'center' : undefined,
                    justifyContent: isView ? 'center' : undefined,
                    fontSize: isView ? '14px' : undefined,
                    fontWeight: isView ? 500 : undefined,
                    letterSpacing: isView ? '0.02em' : undefined,
                    color: isView ? '#ffffff' : undefined,
                    filter: isView ? 'blur(0)' : undefined,
                }}
            >
                {isView && 'View'}
            </div>
        </>
    )
}
