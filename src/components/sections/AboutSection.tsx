import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from '../../context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

export function AboutSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLHeadingElement>(null)
    const headerWrapperRef = useRef<HTMLDivElement>(null)
    const cardsContainerRef = useRef<HTMLDivElement>(null)
    const { isDark } = useTheme()

    const cards = [
        {
            label: 'Organization',
            title: 'ABOUT',
            subtitle: 'SIO',
            type: 'Student Movement',
            startLabel: 'Est.',
            startValue: '1982',
            endLabel: 'Network',
            endValue: 'Pan India',
            color: '#ef4444'
        },
        {
            label: 'Ideology',
            title: 'SIO',
            subtitle: 'AIMS',
            type: 'Education & Reality',
            startLabel: 'Focus',
            startValue: 'Students',
            endLabel: 'Approach',
            endValue: 'Holistic',
            color: '#eab308'
        },
        {
            label: 'Impact',
            title: 'SIO',
            subtitle: 'WORKS',
            type: 'Constructive & Peaceful',
            startLabel: 'Method',
            startValue: 'Grassroots',
            endLabel: 'Reach',
            endValue: 'National',
            color: '#3b82f6'
        },
        {
            label: 'Network',
            title: 'PAN',
            subtitle: 'INDIA',
            type: 'Coast to Coast',
            startLabel: 'From',
            startValue: 'Punjab',
            endLabel: 'To',
            endValue: 'Kerala',
            color: '#10b981'
        }
    ]

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Initial state: Header hidden until section is reached
            gsap.set(headerWrapperRef.current, {
                opacity: 0,
                visibility: 'hidden'
            })

            gsap.set(headerRef.current, {
                scale: 5,
                y: '60vh',
                x: '50vw',
                transformOrigin: 'center center',
                opacity: 1
            })

            // Control visibility - hide when NOT in section
            // Start at 'top top' so header only shows after Hero is scrolled away
            ScrollTrigger.create({
                trigger: sectionRef.current,
                start: 'top top', // Only when section reaches top of viewport
                end: 'bottom top',
                onEnter: () => {
                    gsap.set(headerWrapperRef.current, { opacity: 1, visibility: 'visible' })
                },
                onLeave: () => {
                    gsap.set(headerWrapperRef.current, { opacity: 0, visibility: 'hidden' })
                },
                onEnterBack: () => {
                    gsap.set(headerWrapperRef.current, { opacity: 1, visibility: 'visible' })
                },
                onLeaveBack: () => {
                    // When scrolling back up past section start, hide immediately
                    gsap.set(headerWrapperRef.current, { opacity: 0, visibility: 'hidden' })
                }
            })

            // Header zooms from center-bottom to left position
            // Scrub means it reverses when scrolling back up
            gsap.fromTo(headerRef.current,
                {
                    scale: 5,
                    y: '60vh',
                    x: '50vw'
                },
                {
                    scale: 1,
                    y: 0,
                    x: 0,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top top',
                        end: '+=800',
                        scrub: 1
                    }
                }
            )

            // Header pinches out as soon as last card scrolls up
            gsap.fromTo(headerRef.current,
                { scale: 1 },
                {
                    scale: 0,
                    opacity: 0,
                    ease: 'power2.in',
                    scrollTrigger: {
                        trigger: cardsContainerRef.current,
                        start: 'bottom center', // When cards are about to scroll off
                        end: 'bottom top',
                        scrub: 1
                    }
                }
            )

        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section
            id="about"
            ref={sectionRef}
            style={{
                minHeight: '350vh',
                position: 'relative',
                background: 'transparent',
                marginTop: '-20vh',
            }}
        >
            {/* Fixed Header Container - Uses position:fixed via wrapper */}
            <div
                ref={headerWrapperRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '35%',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    paddingLeft: '10%',
                    paddingRight: '40px',
                    zIndex: 5,
                    pointerEvents: 'none' // Allow clicks through to content behind
                }}
            >
                <h1
                    ref={headerRef}
                    style={{
                        fontSize: 'clamp(3rem, 5vw, 4rem)',
                        fontWeight: 800,
                        color: isDark ? '#ffffff' : '#000000',
                        lineHeight: 1,
                        margin: 0,
                        textTransform: 'uppercase',
                        fontFamily: '"Geist", sans-serif',
                        letterSpacing: '-0.03em',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'auto'
                    }}
                >
                    ABOUT
                    <br />
                    <span style={{ fontWeight: 300 }}>US</span>
                </h1>
            </div>

            {/* Right Side - Cards that scroll naturally */}
            <div
                ref={cardsContainerRef}
                style={{
                    marginLeft: '35%', // Push right of the fixed header
                    width: '65%',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    padding: '150vh 5% 30vh 0', // Cards appear AFTER header zoom completes
                    position: 'relative',
                    alignContent: 'start',
                    zIndex: 10
                }}
            >
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="about-card"
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '16px',
                            padding: '32px',
                            boxSizing: 'border-box',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '380px',
                            marginTop: index % 2 !== 0 ? '120px' : '0',
                        }}
                    >
                        {/* Label with color bar */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '4px',
                                    height: '20px',
                                    background: card.color
                                }}></div>
                                <span style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    color: card.color,
                                    textTransform: 'capitalize'
                                }}>
                                    {card.label}
                                </span>
                            </div>
                        </div>

                        {/* Large Title */}
                        <div style={{ marginBottom: '8px' }}>
                            <h3 style={{
                                fontSize: '2.5rem',
                                fontWeight: 800,
                                margin: 0,
                                fontFamily: '"Geist", sans-serif',
                                lineHeight: 1,
                                textTransform: 'uppercase',
                                color: '#ffffff',
                                letterSpacing: '-0.02em'
                            }}>
                                {card.title}
                            </h3>
                            <span style={{
                                fontSize: '1.5rem',
                                fontWeight: 400,
                                color: 'rgba(255, 255, 255, 0.8)',
                                textTransform: 'uppercase'
                            }}>
                                {card.subtitle}
                            </span>
                        </div>

                        {/* Type */}
                        <p style={{
                            fontSize: '0.9rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            margin: '12px 0 24px 0',
                            fontWeight: 400
                        }}>
                            {card.type}
                        </p>

                        {/* Dates Section */}
                        <div style={{
                            display: 'flex',
                            gap: '40px',
                            marginBottom: '32px'
                        }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', margin: '0 0 4px 0' }}>
                                    {card.startLabel}
                                </p>
                                <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#ffffff', margin: 0 }}>
                                    {card.startValue}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', margin: '0 0 4px 0' }}>
                                    {card.endLabel}
                                </p>
                                <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#ffffff', margin: 0 }}>
                                    {card.endValue}
                                </p>
                            </div>
                        </div>

                        {/* Bottom Action */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: 'auto'
                        }}>
                            <span style={{ color: '#d9a116', fontSize: '1rem' }}>✓</span>
                            <span style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em'
                            }}>
                                READ MORE
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
