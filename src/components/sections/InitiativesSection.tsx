import { useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from '../../context/ThemeContext'
import { useContent } from '../../context/ContentContext'
import { Link } from 'react-router-dom'
import { SectionCard } from '../ui/SectionCard'

gsap.registerPlugin(ScrollTrigger)

export function InitiativesSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLHeadingElement>(null)
    const headerWrapperRef = useRef<HTMLDivElement>(null)
    const cardsContainerRef = useRef<HTMLDivElement>(null)
    const { isDark } = useTheme()
    const { getPostsBySection } = useContent()

    // Get PUBLISHED posts from database only
    const dynamicPosts = getPostsBySection('initiatives').filter(p => p.isPublished)
    const initiatives = useMemo(() => {
        return dynamicPosts.map(post => ({
            id: post.id,
            title: post.title,
            category: 'Initiative',
            image: post.image || '',
            description: post.subtitle || '',
            content: post.content,
            isSubsection: post.isSubsection || false
        }))
    }, [dynamicPosts])

    // Track if we have content
    const hasContent = initiatives.length > 0

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Header wrapper starts HIDDEN - only shows when scrolled into section
            gsap.set(headerWrapperRef.current, {
                opacity: 0,
                visibility: 'hidden'
            })

            // Initial state: Header starts scaled and offset
            gsap.set(headerRef.current, {
                scale: 3,
                y: '80vh',
                x: '30vw',
                transformOrigin: 'center center',
                opacity: 0
            })

            // Show header wrapper when section enters viewport
            ScrollTrigger.create({
                trigger: sectionRef.current,
                start: 'top 90%', // Only when section reaches top of viewport
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

            // Header opacity fades in FAST on entry
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

            // Header zooms in faster
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

            // Header fades out as cards approach exit (before next section)
            gsap.fromTo(headerRef.current,
                { opacity: 1 },
                {
                    opacity: 0,
                    ease: 'power2.in',
                    scrollTrigger: {
                        trigger: cardsContainerRef.current,
                        start: 'bottom 120%', // Start fading when cards still below viewport bottom
                        end: 'bottom 60%',    // Complete fade by the time cards are leaving
                        scrub: 0.5
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
                minHeight: '200vh',
                position: 'relative',
                background: 'transparent',
                paddingTop: '100px',
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
                    <span style={{ color: '#ffffff' }}>OUR</span>
                    <br />
                    <span style={{ color: '#ff3333' }}>INITIATIVES</span>
                </h1>
            </div>

            {/* Right Side - Cards that scroll naturally */}
            <div
                ref={cardsContainerRef}
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
                    initiatives.map((item, index) => (
                        <div key={index} style={{ transform: index % 2 === 1 ? 'translateY(120px)' : 'none' }}>
                            <Link
                                to={item.isSubsection ? `/subsection/${item.id}` : `/initiative/${item.id}`}
                                data-cursor="view"
                                style={{ textDecoration: 'none', display: 'block' }}
                            >
                                <SectionCard
                                    className="initiative-card"
                                    label={item.category}
                                    labelColor="#e82828"
                                    title={item.title}
                                    subtitle=""
                                    description={item.description}
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
