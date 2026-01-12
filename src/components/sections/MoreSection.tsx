import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from '../../context/ThemeContext'
import { FileText, Users, Calendar, Download } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const resources = [
    { icon: <FileText size={24} />, title: 'Constitution', desc: 'Read our organizational constitution' },
    { icon: <Users size={24} />, title: 'Join Us', desc: 'Become a member of our movement' },
    { icon: <Calendar size={24} />, title: 'Calendar', desc: 'Upcoming events and schedule' },
    { icon: <Download size={24} />, title: 'Downloads', desc: 'Resources, logos, and materials' },
]

export function MoreSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const { isDark } = useTheme()

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.resource-card',
                { opacity: 0, y: 20 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                    },
                }
            )
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section
            id="more"
            ref={sectionRef}
            style={{
                padding: '100px 24px',
                background: 'transparent',
                transition: 'background 0.3s ease',
            }}
        >
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 20px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '100px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        marginBottom: '60px',
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
                        Resources
                    </span>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '24px',
                    }}
                >
                    {resources.map((item, index) => (
                        <div
                            key={index}
                            className="resource-card"
                            style={{
                                padding: '32px',
                                background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f5f5f5',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : '#eeeeee'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.03)' : '#f5f5f5'
                            }}
                        >
                            <div style={{
                                color: '#ff3b3b',
                                marginBottom: '20px'
                            }}>
                                {item.icon}
                            </div>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 500,
                                color: isDark ? '#ffffff' : '#111111',
                                marginBottom: '8px'
                            }}>
                                {item.title}
                            </h3>
                            <p style={{
                                fontSize: '0.9rem',
                                color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                margin: 0,
                                lineHeight: 1.5
                            }}>
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
