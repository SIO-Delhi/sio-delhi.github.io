import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Instagram, Youtube, Facebook, ArrowUpRight } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

const XLogo = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
)

export function ContactSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const { isDark } = useTheme()

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.animate-up',
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top 75%',
                    },
                }
            )
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section
            id="contact"
            ref={sectionRef}
            style={{
                padding: '120px 0',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                position: 'relative',
                zIndex: 10
            }}
        >
            <div
                ref={containerRef}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start', // Left align
                    textAlign: 'left', // Left align text
                    gap: '24px', // Reduced gap
                    width: '100%',
                    paddingLeft: '8%', // Match SectionLayout
                    paddingRight: '8%'
                }}
            >
                {/* Header Block */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <span className="animate-up" style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: isDark ? '#ffffff' : '#000000',
                        opacity: 0.8,
                        marginLeft: '4px' // Subtle alignment correction
                    }}>
                        Get in Touch
                    </span>

                    <h2 className="animate-up" style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', // Matched other sections
                        fontWeight: 700,
                        color: isDark ? '#ffffff' : '#111111',
                        margin: 0,
                        lineHeight: 1, // Tighter line height
                        letterSpacing: '-0.02em',
                        fontFamily: '"Geist", sans-serif',
                        textShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                        Connect <span style={{ color: '#ff3333' }}>with us</span>
                    </h2>

                    <p className="animate-up" style={{
                        marginTop: '12px',
                        fontSize: '1.2rem',
                        color: isDark ? '#e0e0e0' : '#333333',
                        maxWidth: '600px',
                        lineHeight: 1.4, // Reduced line spacing
                        fontWeight: 400,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        Interested in collaborating on research, initiatives, or just want to say hi? We'd love to hear from you.
                    </p>
                </div>

                {/* Email Button */}
                <a
                    href="mailto:contact@sio-delhi.org"
                    className="animate-up group"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '24px 48px',
                        borderRadius: '100px',
                        background: 'rgba(20, 20, 20, 0.6)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#ffffff',
                        fontSize: '1.35rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        marginTop: '16px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.background = 'rgba(30, 30, 30, 0.8)'
                        e.currentTarget.style.borderColor = '#ffffff'
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.background = 'rgba(20, 20, 20, 0.6)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'
                    }}
                >
                    contact@sio-delhi.org
                    <ArrowUpRight size={28} />
                </a>

                {/* Social Links */}
                <div
                    className="animate-up"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '32px',
                        marginTop: '24px'
                    }}
                >
                    {[
                        { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/siodelhi/?hl=en' },
                        { icon: XLogo, label: 'Twitter', href: 'https://x.com/siodelhi?lang=en' },
                        { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/delhisio/' },
                        { icon: Youtube, label: 'YouTube', href: 'https://youtube.com/c/SIODELHI' }
                    ].map((social) => (
                        <a
                            key={social.label}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                textDecoration: 'none',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                transition: 'color 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = isDark ? '#ffffff' : '#000000'}
                            onMouseLeave={(e) => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                        >
                            {social.label}
                        </a>
                    ))}
                </div>
            </div>
        </section>
    )
}
