import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from '../../context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

const leaders = [
    {
        name: 'Abdullah Azzam',
        role: 'State President',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&q=80',
    },
    {
        name: 'Mohammed Bilal',
        role: 'General Secretary',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop&q=80',
    },
    {
        name: 'Zaid Khan',
        role: 'Joint Secretary',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=600&fit=crop&q=80',
    },
    {
        name: 'Ahmed Ali',
        role: 'Coordinator',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=600&fit=crop&q=80',
    },
    {
        name: 'Omar Farooq',
        role: 'Media Head',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop&q=80',
    },
    {
        name: 'Yusuf Ahmed',
        role: 'Campus Secretary',
        image: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=600&h=600&fit=crop&q=80',
    }
]

export function LeadershipSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const { isDark } = useTheme()

    useEffect(() => {
        const ctx = gsap.context(() => {
            const container = containerRef.current
            if (!container) return

            // Calculate the distance to scroll
            // Scroll amount = total width - viewport width
            const scrollAmount = container.scrollWidth - window.innerWidth

            if (scrollAmount > 0) {
                gsap.to(container, {
                    x: -scrollAmount - 100, // Extra padding
                    ease: 'none',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top top',
                        end: () => `+=${container.scrollWidth}`, // Scroll distance based on content width
                        scrub: 1,
                        pin: true,
                        invalidateOnRefresh: true,
                        anticipatePin: 1
                    },
                })
            }
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section
            id="leadership"
            ref={sectionRef}
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden',
                background: 'transparent',
                transition: 'background 0.3s ease',
                position: 'relative'
            }}
        >
            <div style={{
                position: 'absolute',
                top: '120px',
                left: '5vw',
                zIndex: 2,
                marginBottom: '60px'
            }}>
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
                        Our Leadership
                    </span>
                </div>
            </div>

            <div
                ref={containerRef}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '60px',
                    paddingLeft: '5vw',
                    width: 'max-content', // Ensure container grows with content
                }}
            >
                {leaders.map((leader, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center', // Centered alignment
                            width: '300px', // Adjusted width
                            flexShrink: 0,
                            textAlign: 'center' // Centered text
                        }}
                    >
                        <div style={{
                            width: '280px', // Square dimensions
                            height: '280px',
                            overflow: 'hidden',
                            borderRadius: '50%', // Circular cut
                            marginBottom: '32px',
                            boxShadow: isDark ? '0 0 0 1px rgba(255,255,255,0.1)' : '0 0 0 1px rgba(0,0,0,0.1)' // Subtle ring
                        }}>
                            <img
                                src={leader.image}
                                alt={leader.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    filter: isDark ? 'grayscale(20%)' : 'none',
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

                        <h3
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: 500,
                                color: isDark ? '#ffffff' : '#111111',
                                marginBottom: '8px',
                                lineHeight: 1.2
                            }}
                        >
                            {leader.name}
                        </h3>
                        <p
                            style={{
                                fontSize: '1rem',
                                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                margin: 0,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}
                        >
                            {leader.role}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}
