import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null)
    const cursorDotRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const cursor = cursorRef.current
        const cursorDot = cursorDotRef.current

        if (!cursor || !cursorDot) return

        const moveCursor = (e: MouseEvent) => {
            // Glow follows cursor center
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.5,
                ease: 'power2.out',
            })
            // Dot offset to bottom-right of cursor
            gsap.to(cursorDot, {
                x: e.clientX + 20,
                y: e.clientY + 20,
                duration: 0.4,
                ease: 'power2.out',
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

        window.addEventListener('mousemove', moveCursor)
        document.body.addEventListener('mouseenter', handleMouseEnter)
        document.body.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            window.removeEventListener('mousemove', moveCursor)
            document.body.removeEventListener('mouseenter', handleMouseEnter)
            document.body.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [])

    return (
        <>
            <div ref={cursorRef} className="cursor-glow" />
            <div ref={cursorDotRef} className="cursor-dot" />
        </>
    )
}
