import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const footerLinks = ['Work', 'Services', 'FAQ', 'Contact', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube', 'Email', 'Privacy', 'Terms']

export function Footer() {
    const footerRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.footer-logo',
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    scrollTrigger: {
                        trigger: footerRef.current,
                        start: 'top 85%',
                    },
                }
            )

            gsap.fromTo(
                '.footer-link',
                { opacity: 0 },
                {
                    opacity: 1,
                    duration: 0.4,
                    stagger: 0.05,
                    scrollTrigger: {
                        trigger: '.footer-links',
                        start: 'top 90%',
                    },
                }
            )
        }, footerRef)

        return () => ctx.revert()
    }, [])



    const scrollToSection = (href: string) => {
        const el = document.querySelector(href)
        if (el) {
            const lenis = (window as typeof window & { lenis?: { scrollTo: (el: Element) => void } }).lenis
            if (lenis) lenis.scrollTo(el)
            else el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <footer
            ref={footerRef}
            style={{
                padding: '40px 0',
                borderTop: '1px solid #2c2c2c',
            }}
        >
            <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {/* Logo */}
                <div className="footer-logo">
                    <h2 style={{
                        fontSize: 'clamp(3rem, 15vw, 7rem)',
                        fontWeight: 400,
                        lineHeight: 1,
                        letterSpacing: '-0.04em'
                    }}>
                        SIO <span className="text-gradient">Delhi</span>
                    </h2>
                </div>

                {/* Bottom row */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '32px',
                }}>
                    {/* Info */}
                    <div style={{ maxWidth: '500px' }}>
                        <p style={{ color: '#999999', fontSize: '16px', lineHeight: 1.6, marginBottom: '16px' }}>
                            Students Islamic Organisation of India - Delhi Zone. Building ethical leaders for tomorrow through education, service, and community development.
                        </p>
                        <p style={{ color: '#666666', fontSize: '14px' }}>
                            © {new Date().getFullYear()} SIO Delhi. All rights reserved.
                        </p>
                    </div>

                    {/* Links row */}
                    <div className="footer-links" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        {footerLinks.map((link) => (
                            <a
                                key={link}
                                href="#"
                                className="footer-link"
                                style={{
                                    color: '#666666',
                                    fontSize: '14px',
                                    transition: 'color 0.3s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
                                onClick={(e) => {
                                    e.preventDefault()
                                    if (['Work', 'Services', 'FAQ', 'Contact'].includes(link)) {
                                        const section = link === 'Work' ? '#about' : link === 'Services' ? '#initiatives' : `#${link.toLowerCase()}`
                                        scrollToSection(section)
                                    }
                                }}
                            >
                                {link}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
