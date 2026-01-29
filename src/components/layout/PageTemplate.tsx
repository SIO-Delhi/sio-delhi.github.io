import { useRef, useEffect, type ReactNode } from 'react'
import { useTheme } from '../../context/ThemeContext'
import gsap from 'gsap'

interface PageTemplateProps {
    title: string
    highlight: string
    highlightColor?: string
    children: ReactNode
}

export function PageTemplate({
    title,
    highlight,
    highlightColor = '#ff3b3b',
    children
}: PageTemplateProps) {
    const { isDark } = useTheme()
    const headerRef = useRef<HTMLHeadingElement>(null)
    const lineRef = useRef<HTMLDivElement>(null)

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    // Animate header on load
    useEffect(() => {
        const header = headerRef.current
        const line = lineRef.current

        if (header && line) {
            gsap.fromTo(header,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
            )

            gsap.fromTo(line,
                { width: 0, opacity: 0 },
                { width: 80, opacity: 1, duration: 0.8, delay: 0.4, ease: 'power3.out' }
            )
        }
    }, [])

    return (
        <div style={{
            minHeight: '100vh',
            paddingTop: '120px',
            paddingBottom: '80px',
            position: 'relative'
        }}>
            <div className="container">
                {/* Header */}
                <div style={{ marginBottom: '60px' }}>
                    <h1
                        ref={headerRef}
                        style={{
                            fontSize: 'clamp(3rem, 6vw, 5rem)',
                            fontWeight: 800,
                            color: isDark ? '#fdedcb' : '#000000',
                            lineHeight: 1,
                            margin: 0,
                            textTransform: 'uppercase',
                            fontFamily: '"DM Sans", sans-serif',
                            letterSpacing: '-0.03em',
                            opacity: 0 // Start hidden for animation
                        }}
                    >
                        {title} <span style={{ color: highlightColor }}>{highlight}</span>
                    </h1>
                    <div
                        ref={lineRef}
                        style={{
                            width: '0px', // Start width 0 for animation
                            height: '4px',
                            background: highlightColor,
                            marginTop: '24px',
                            borderRadius: '2px',
                            opacity: 0
                        }}
                    />
                </div>

                {/* Content */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '120px' // Spacing between major sections
                }}>
                    {children}
                </div>
            </div>
        </div>
    )
}
