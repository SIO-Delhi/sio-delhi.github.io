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

    const checkScrollButtons = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setCanScrollLeft(scrollLeft > 2)
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2)
        }
    }, [])

    useEffect(() => {
        checkScrollButtons()
        window.addEventListener('resize', checkScrollButtons)
        return () => window.removeEventListener('resize', checkScrollButtons)
    }, [checkScrollButtons, children])

    // Drag Scroll Logic
    const isDown = useRef(false)
    const startX = useRef(0)
    const scrollLeft = useRef(0)
    const hasDragged = useRef(false) // Track if a meaningful drag occurred

    const onMouseDown = (e: React.MouseEvent) => {
        isDown.current = true
        hasDragged.current = false // Reset on new drag
        if (scrollContainerRef.current) {
            startX.current = e.pageX - scrollContainerRef.current.offsetLeft
            scrollLeft.current = scrollContainerRef.current.scrollLeft
        }
    }

    const onMouseLeave = () => {
        isDown.current = false
    }

    const onMouseUp = () => {
        isDown.current = false
    }

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current) return
        e.preventDefault()
        if (scrollContainerRef.current) {
            const x = e.pageX - scrollContainerRef.current.offsetLeft
            const walk = (x - startX.current) * 2 // Scroll speed multiplier
            // Mark as dragged if moved more than 5px
            if (Math.abs(x - startX.current) > 5) {
                hasDragged.current = true
            }
            scrollContainerRef.current.scrollLeft = scrollLeft.current - walk
        }
    }

    // Prevent click if user dragged
    const onClickCapture = (e: React.MouseEvent) => {
        if (hasDragged.current) {
            e.stopPropagation()
            e.preventDefault()
        }
    }

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 340 // Card width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
            // Check buttons after scrolling animation (approx 300ms)
            setTimeout(checkScrollButtons, 350)
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
                paddingBottom: '60px',
                zIndex: 10,
            }}
        >
            {/* Header with Arrow */}
            <div
                ref={headerRef}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginBottom: '16px',
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
                            marginTop: '8px',
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
                    zIndex: 50
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
                onMouseDown={onMouseDown}
                onMouseLeave={onMouseLeave}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                onClickCapture={onClickCapture}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '24px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    paddingTop: '12px',
                    paddingLeft: '8%',
                    paddingRight: '8%',
                    paddingBottom: '40px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    // Removed cursor styles to preserve custom cursor
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    scrollBehavior: 'auto'
                }}
            >
                {children}
            </div>

            <style>{`
                #${id} > div:last-of-type::-webkit-scrollbar {
                    display: none;
                }
                /* Removed snap alignment rules */
                @media (max-width: 1024px) {
                    #${id} {
                        padding-top: 40px !important;
                        padding-bottom: 30px !important;
                    }
                }
            `}</style>
        </section>
    )
}
