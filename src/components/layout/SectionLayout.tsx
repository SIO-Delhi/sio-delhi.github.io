import React, { useRef, useState, useEffect } from 'react'

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

    const checkScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
        }
    }

    useEffect(() => {
        checkScrollButtons()
    }, [children])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 320
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
            setTimeout(checkScrollButtons, 300)
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
                    gap: '10px'
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
                    alignItems: 'flex-start', // Force top alignment to prevent vertical shifts
                    gap: '12px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    paddingTop: '12px', // Optimized space for hover lift (4px)
                    paddingLeft: '8%',
                    paddingRight: '8%',
                    paddingBottom: '40px', // Increased for shadow
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                {children}
            </div>

            <style>{`
                #${id} > div:last-of-type::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    )
}
