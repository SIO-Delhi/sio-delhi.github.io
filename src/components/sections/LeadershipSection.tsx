import { useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useContent } from '../../context/ContentContext'

gsap.registerPlugin(ScrollTrigger)

export function LeadershipSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const headerWrapperRef = useRef<HTMLDivElement>(null)
    const headerRef = useRef<HTMLHeadingElement>(null)
    const cardsContainerRef = useRef<HTMLDivElement>(null)
    const { isDark } = useTheme()
    const { getPostsBySection } = useContent()

    // Get PUBLISHED posts from database
    const dynamicPosts = getPostsBySection('leadership').filter(p => p.isPublished)
    const leaders = useMemo(() => {
        return dynamicPosts.map(post => ({
            id: post.id,
            name: post.title,
            role: post.subtitle || '',
            image: post.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&q=80',
        }))
    }, [dynamicPosts])

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.set(headerWrapperRef.current, {
                opacity: 0,
                visibility: 'hidden'
            })

            gsap.set(headerRef.current, {
                scale: 3,
                y: '80vh',
                x: '30vw',
                transformOrigin: 'center center',
                opacity: 0
            })

            ScrollTrigger.create({
                trigger: sectionRef.current,
                start: 'top 90%',
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

            gsap.fromTo(headerRef.current,
                { opacity: 0 },
                {
                    opacity: 1,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        end: 'top 30%',
                        scrub: 0.5
                    }
                }
            )

            gsap.fromTo(headerRef.current,
                {
                    scale: 3,
                    y: '80vh',
                    x: '30vw'
                },
                {
                    scale: 1,
                    y: 0,
                    x: 0,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        end: 'top -20%',
                        scrub: 1
                    }
                }
            )

            gsap.fromTo(headerRef.current,
                { opacity: 1 },
                {
                    opacity: 0,
                    ease: 'power2.in',
                    scrollTrigger: {
                        trigger: cardsContainerRef.current,
                        start: 'bottom 120%',
                        end: 'bottom 60%',
                        scrub: 0.5
                    }
                }
            )

        }, sectionRef)

        return () => ctx.revert()
    }, [])

    // Show minimal section if no published posts
    const hasContent = leaders.length > 0

    return (
        <section
            id="leadership"
            ref={sectionRef}
            style={{
                minHeight: '200vh',
                position: 'relative',
                background: 'transparent',
                paddingTop: '100px',
            }}
        >
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
                    paddingBottom: '24vh',
                    zIndex: 5,
                    pointerEvents: 'none',
                    opacity: 0,
                    visibility: 'hidden'
                }}
            >
                <h1
                    ref={headerRef}
                    style={{
                        fontSize: 'clamp(3rem, 6vw, 5rem)',
                        fontWeight: 800,
                        color: isDark ? '#ffffff' : '#111111',
                        lineHeight: 1,
                        margin: 0,
                        textTransform: 'uppercase',
                        fontFamily: '"Geist", sans-serif',
                        letterSpacing: '-0.03em',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'auto'
                    }}
                >
                    <span style={{ color: '#ffffff' }}>OUR</span>
                    <br />
                    <span style={{ color: '#ff3333' }}>LEADERS</span>
                </h1>
            </div>

            <div
                ref={cardsContainerRef}
                style={{
                    marginLeft: '20%',
                    marginRight: '5%',
                    width: '75%',
                    padding: '80vh 0 100vh 0',
                    position: 'relative',
                    zIndex: 10
                }}
            >
                {hasContent ? (
                    <>
                        {/* First Row - Top 2 Leaders */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '32px',
                            marginBottom: '32px'
                        }}>
                            {leaders.slice(0, 2).map((leader) => (
                                <Link
                                    key={leader.id}
                                    to={`/leader/${leader.id}`}
                                    data-cursor="view"
                                    style={{
                                        textDecoration: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{
                                        width: '110px',
                                        height: '110px',
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        marginBottom: '24px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        backdropFilter: 'blur(20px)',
                                        WebkitBackdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                                    }}>
                                        <img
                                            src={leader.image}
                                            alt={leader.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.1)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)'
                                            }}
                                        />
                                    </div>
                                    <h3 style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 600,
                                        color: '#ffffff',
                                        marginBottom: '8px'
                                    }}>
                                        {leader.name}
                                    </h3>
                                    <p style={{
                                        fontSize: '0.9rem',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        margin: 0,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {leader.role}
                                    </p>
                                </Link>
                            ))}
                        </div>

                        {/* Second Row - Remaining Leaders */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '32px'
                        }}>
                            {leaders.slice(2).map((leader) => (
                                <Link
                                    key={leader.id}
                                    to={`/leader/${leader.id}`}
                                    data-cursor="view"
                                    style={{
                                        textDecoration: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{
                                        width: '110px',
                                        height: '110px',
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        marginBottom: '20px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        backdropFilter: 'blur(20px)',
                                        WebkitBackdropFilter: 'blur(20px)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                                    }}>
                                        <img
                                            src={leader.image}
                                            alt={leader.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.1)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)'
                                            }}
                                        />
                                    </div>
                                    <h3 style={{
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        color: '#ffffff',
                                        marginBottom: '6px'
                                    }}>
                                        {leader.name}
                                    </h3>
                                    <p style={{
                                        fontSize: '0.8rem',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        margin: 0,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {leader.role}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{
                        padding: '80px 40px',
                        textAlign: 'center',
                        color: '#666',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '16px',
                        border: '1px dashed #333'
                    }}>
                        <p style={{ fontSize: '1.1rem', margin: 0 }}>No content published yet</p>
                    </div>
                )}
            </div>
        </section>
    )
}
