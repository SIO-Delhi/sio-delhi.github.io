import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from '../../context/ThemeContext'
import { Link } from 'react-router-dom'
import { initiatives } from '../../data/initiatives'

gsap.registerPlugin(ScrollTrigger)

export function InitiativesSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLHeadingElement>(null)
    const headerWrapperRef = useRef<HTMLDivElement>(null)
    const cardsContainerRef = useRef<HTMLDivElement>(null)
    const { isDark } = useTheme()

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
            // Start at 'top top' so header only shows after previous section scrolled away
            ScrollTrigger.create({
                trigger: sectionRef.current,
                start: 'top top',
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
                        start: 'bottom center',
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
            id="initiatives"
            ref={sectionRef}
            style={{
                minHeight: '350vh',
                position: 'relative',
                background: 'transparent',
            }}
        >
            {/* Fixed Header Container */}
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
                    pointerEvents: 'none'
                }}
            >
                <h1
                    ref={headerRef}
                    style={{
                        fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
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
                    OUR
                    <br />
                    <span style={{ fontWeight: 300 }}>INITIATIVES</span>
                </h1>
            </div>

            {/* Right Side - Cards that scroll naturally */}
            <div
                ref={cardsContainerRef}
                style={{
                    marginLeft: '35%',
                    width: '65%',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '24px',
                    padding: '150vh 5% 30vh 0',
                    position: 'relative',
                    alignContent: 'start',
                    zIndex: 10
                }}
            >
                {initiatives.map((item, index) => (
                    <Link
                        to={`/initiative/${item.id}`}
                        key={index}
                        className="initiative-card"
                        data-cursor="view"
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
                            textDecoration: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {/* Label with color bar */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '4px',
                                    height: '20px',
                                    background: '#e82828'
                                }}></div>
                                <span style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    color: '#e82828',
                                    textTransform: 'uppercase'
                                }}>
                                    {item.category}
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
                                {item.title}
                            </h3>
                        </div>

                        {/* Description */}
                        <p style={{
                            fontSize: '0.9rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            margin: '12px 0 24px 0',
                            fontWeight: 400,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            flexGrow: 1
                        }}>
                            {item.description}
                        </p>

                        {/* Bottom Action */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: 'auto'
                        }}>
                            <span style={{ color: '#e82828', fontSize: '1rem' }}>→</span>
                            <span style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em'
                            }}>
                                LEARN MORE
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
