import React, { useRef, useState, useEffect, useCallback } from 'react'

interface SectionLayoutProps {
    id: string
    header: React.ReactNode
    subtitle?: string
    children: React.ReactNode
    className?: string
}

export default function SectionLayout({
    id,
    header,
    subtitle,
    children,
    className = ''
}: SectionLayoutProps) {
    const sectionRef = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    // Removed useLayoutEffect as all GSAP animations were causing instability
    // The layout is now purely CSS-based for maximum stability

    const checkScrollButtons = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            // Use a small threshold (2px) to account for browser rounding errors
            setCanScrollLeft(scrollLeft > 2)
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2)
        }
    }, [])

    useEffect(() => {
        checkScrollButtons()
        window.addEventListener('resize', checkScrollButtons)
        return () => window.removeEventListener('resize', checkScrollButtons)
    }, [checkScrollButtons, children])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 340 // Card width + gap
            console.log(`Scrolling ${direction} by ${scrollAmount}`)

            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })

            // Check buttons after scrolling animation (approx 300ms)
            setTimeout(checkScrollButtons, 350)
        } else {
            console.error('Scroll container ref is missing')
        }
    }

    return (
        <section
            id={id}
            ref={sectionRef}
            style={{
                minHeight: 'auto',
                position: 'relative',
                background: 'transparent',
                paddingTop: '80px',
                paddingBottom: '60px'
            }}
        >
            {/* Header with Arrow */}
            <div
                ref={headerRef}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginBottom: '16px', // Reduced from 28px
                    paddingLeft: '8%',
                    paddingRight: '8%'
                }}
            >
                <div>
                    {header}
                    {subtitle && (
                        <p style={{
                            fontSize: '0.95rem',
                            color: 'rgba(255, 255, 255, 0.45)',
                            marginTop: '8px', // Reduced from 10px
                            maxWidth: '450px',
                            lineHeight: 1.5
                        }}>
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Navigation Arrows */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    position: 'relative',
                    zIndex: 50 // Ensure buttons are above everything
                }}>
                    <button
                        onClick={() => scroll('left')}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            border: `1px solid ${canScrollLeft ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)'}`,
                            background: canScrollLeft ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                            color: canScrollLeft ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.2)',
                            fontSize: '1.1rem',
                            cursor: canScrollLeft ? 'pointer' : 'default',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => canScrollLeft && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
                        onMouseLeave={(e) => e.currentTarget.style.background = canScrollLeft ? 'rgba(255, 255, 255, 0.08)' : 'transparent'}
                    >
                        ←
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            border: '1px solid transparent',
                            background: canScrollRight ? '#ff3333' : 'rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            fontSize: '1.1rem',
                            cursor: canScrollRight ? 'pointer' : 'default',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => canScrollRight && (e.currentTarget.style.background = '#ff4444')}
                        onMouseLeave={(e) => e.currentTarget.style.background = canScrollRight ? '#ff3333' : 'rgba(255, 255, 255, 0.1)'}
                    >
                        →
                    </button>
                </div>
            </div>

            {/* Horizontal Scroll Container */}
            <div
                ref={scrollContainerRef}
                className={className}
                onScroll={checkScrollButtons}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start', // Force top alignment
                    gap: '24px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    paddingTop: '12px',
                    paddingLeft: '8%',
                    paddingRight: '8%',
                    paddingBottom: '40px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    // "Nice" Snap Scroll
                    scrollSnapType: 'x mandatory',
                    scrollPaddingLeft: '8%', // Matches container padding for perfect alignment
                    scrollBehavior: 'smooth'
                }}
            >
                {children}
            </div>

            <style>{`
                #${id} > div:last-of-type::-webkit-scrollbar {
                    display: none;
                }
                /* Target direct children (cards) to make them snap alignment points */
                #${id} > div:last-of-type > * {
                    scroll-snap-align: start;
                }
            `}</style>
        </section>
    )
}
