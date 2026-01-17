import { useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useContent } from '../../context/ContentContext'
import { SectionCard } from '../ui/SectionCard'

gsap.registerPlugin(ScrollTrigger)

export function AboutSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLHeadingElement>(null)
    const headerWrapperRef = useRef<HTMLDivElement>(null)
    const cardsContainerRef = useRef<HTMLDivElement>(null)
    const { isDark } = useTheme()
    const { getPostsBySection } = useContent()

    // Get PUBLISHED posts from database
    const dynamicPosts = getPostsBySection('about').filter(p => p.isPublished)
    const cards = useMemo(() => {
        return dynamicPosts.map(post => ({
            id: post.id,
            label: 'About',
            title: post.title.split(' ')[0] || 'ABOUT',
            subtitle: post.title.split(' ').slice(1).join(' ') || '',
            type: post.subtitle || '',
            color: '#ef4444',
            image: post.image || '',
            isSubsection: post.isSubsection || false
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
    const hasContent = cards.length > 0

    return (
        <section
            id="about"
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
                    pointerEvents: 'none'
                }}
            >
                <h1
                    ref={headerRef}
                    style={{
                        fontSize: 'clamp(3rem, 6vw, 5rem)',
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
                    <span style={{ color: '#ffffff' }}>ABOUT</span>
                    <br />
                    <span style={{ color: '#ff3333' }}>US</span>
                </h1>
            </div>

            <div
                ref={cardsContainerRef}
                className="cards-grid"
                style={{
                    marginLeft: '30%',
                    marginRight: '2%',
                    width: '65%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 420px)',
                    gap: '40px',
                    justifyContent: 'center',
                    padding: '80vh 0 100vh 0',
                    position: 'relative',
                    alignContent: 'start',
                    zIndex: 10
                }}
            >
                {hasContent ? (
                    cards.map((card, index) => (
                        <div key={card.id} style={{ transform: index % 2 === 1 ? 'translateY(120px)' : 'none' }}>
                            <Link
                                to={card.isSubsection ? `/subsection/${card.id}` : `/about-us/${card.id}`}
                                data-cursor="view"
                                style={{ textDecoration: 'none', display: 'block' }}
                            >
                                <SectionCard
                                    className="about-card"
                                    label={card.label}
                                    labelColor={card.color}
                                    title={card.title}
                                    subtitle={card.subtitle}
                                    description={card.type}
                                    image={card.image}
                                />
                            </Link>
                        </div>
                    ))
                ) : (
                    <div style={{
                        gridColumn: '1 / -1',
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
