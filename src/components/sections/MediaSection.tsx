import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from '../../context/ThemeContext'
import { ArrowUpRight, Instagram } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const newsItems = [
    {
        date: 'Oct 15, 2025',
        title: 'SIO Delhi Launches New Educational Initiative',
        category: 'Press Release'
    },
    {
        date: 'Sep 28, 2025',
        title: 'Student Conference on Future Technologies',
        category: 'Event'
    },
    {
        date: 'Aug 10, 2025',
        title: 'Community Service Drive in North Delhi',
        category: 'Report'
    },
    {
        date: 'Jul 22, 2025',
        title: 'Scholarship Program Winners Announced',
        category: 'Announcement'
    }
]

export function MediaSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const { isDark } = useTheme()

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Section heading reveal
            gsap.fromTo(
                '#media h2',
                { opacity: 0, y: 60 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                    },
                }
            )

            // Staggered card reveals with different directions
            gsap.fromTo(
                '.media-item',
                { opacity: 0, y: 80, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    stagger: {
                        each: 0.15,
                        from: 'start',
                    },
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.media-item',
                        start: 'top 85%',
                    },
                }
            )
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section
            id="media"
            ref={sectionRef}
            style={{
                padding: '80px 24px',
                background: 'transparent',
                transition: 'background 0.3s ease',
            }}
        >
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '60px' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 20px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '100px',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#ff3b3b',
                            }}
                        />
                        <span
                            style={{
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#ffffff',
                            }}
                        >
                            Media & Updates
                        </span>
                    </div>
                    <a
                        href="#"
                        style={{
                            color: '#ff3b3b',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        View All <ArrowUpRight size={16} />
                    </a>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: '16px',
                    }}
                >
                    {newsItems.map((item, index) => (
                        <div
                            key={index}
                            className="media-item"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '24px',
                                background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#ff3b3b'
                                e.currentTarget.style.transform = 'translateX(10px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                                e.currentTarget.style.transform = 'translateX(0)'
                            }}
                        >
                            <div>
                                <span style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    color: '#ff3b3b',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {item.category} • {item.date}
                                </span>
                                <h3 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 400,
                                    color: isDark ? '#ffffff' : '#111111',
                                    margin: 0
                                }}>
                                    {item.title}
                                </h3>
                            </div>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isDark ? '#ffffff' : '#111111'
                            }}>
                                <ArrowUpRight size={20} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Instagram Feed Section */}
                <div style={{ marginTop: '60px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <h3 style={{
                            fontSize: '1.75rem',
                            fontWeight: 400,
                            color: isDark ? '#ffffff' : '#111111',
                            margin: 0
                        }}>
                            Latest on Instagram
                        </h3>
                        <a
                            href="https://www.instagram.com/siodelhi"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                color: isDark ? '#ffffff' : '#111111',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: 500,
                                fontSize: '14px',
                                padding: '8px 16px',
                                borderRadius: '100px',
                                border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#E1306C'
                                e.currentTarget.style.color = '#E1306C'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                                e.currentTarget.style.color = isDark ? '#ffffff' : '#111111'
                            }}
                        >
                            <Instagram size={18} /> @siodelhi
                        </a>
                    </div>

                    {/* Instagram Widget Container */}
                    <div style={{
                        width: '100%',
                        minHeight: '400px',
                        background: 'transparent',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        {/* 
                            PASTE YOUR WIDGET CODE HERE 
                            Example: <div className="elfsight-app-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"></div>
                        */}
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', marginBottom: '16px' }}>
                                Instagram Feed Widget Area
                            </p>
                            <a
                                href="https://elfsight.com/instagram-feed-instalink/create/"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: 'inline-block',
                                    background: '#ff3b3b',
                                    color: '#000',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                    fontSize: '14px'
                                }}
                            >
                                Get Widget Code
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
