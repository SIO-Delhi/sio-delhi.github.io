import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import logo from '../../assets/logo.png'
import { X, Instagram, Youtube, Facebook } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const sections = ['About', 'Initiatives', 'Media', 'Leadership', 'Contact']

const XLogo = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
)

export function Footer() {
    const footerRef = useRef<HTMLElement>(null)
    const [showCredits, setShowCredits] = useState(false)

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

            // Animate icons
            gsap.fromTo(
                '.social-icon',
                { opacity: 0, scale: 0.8 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.4,
                    stagger: 0.1,
                    scrollTrigger: {
                        trigger: '.footer-socials',
                        start: 'top 90%',
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
                        start: 'top 95%',
                    },
                }
            )
        }, footerRef)

        return () => ctx.revert()
    }, [])

    const scrollToSection = (sectionId: string) => {
        const el = document.querySelector(sectionId)
        if (el) {
            const lenis = (window as any).lenis
            if (lenis) lenis.scrollTo(el)
            else el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <>
            <footer
                ref={footerRef}
                style={{
                    padding: '40px 0',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(10, 10, 10, 0.4)',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    zIndex: 10
                }}
            >
                <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>
                    {/* Logo */}
                    <div className="footer-logo">
                        <img src={logo} alt="SIO Delhi" style={{ height: '100px', width: 'auto' }} />
                    </div>

                    {/* Social Icons */}
                    <div className="footer-socials" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <a href="https://www.instagram.com/siodelhi/?hl=en" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: '#cccccc', transition: 'color 0.2s' }} aria-label="Instagram"><Instagram size={20} /></a>
                        <a href="https://x.com/siodelhi?lang=en" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: '#cccccc', transition: 'color 0.2s' }} aria-label="X (Twitter)"><XLogo size={18} /></a>
                        <a href="https://youtube.com/c/SIODELHI" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: '#cccccc', transition: 'color 0.2s' }} aria-label="YouTube"><Youtube size={20} /></a>
                        <a href="https://www.facebook.com/delhisio/" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: '#cccccc', transition: 'color 0.2s' }} aria-label="Facebook"><Facebook size={20} /></a>
                    </div>
                    <style>{`
                        .social-icon:hover { color: #fff !important; transform: translateY(-2px); }
                    `}</style>

                    {/* Section Links */}
                    <div className="footer-links" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
                        {sections.map((link) => (
                            <a
                                key={link}
                                href={`#${link.toLowerCase()}`}
                                className="footer-link"
                                style={{
                                    color: '#e0e0e0', // Increased brightness
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    transition: 'color 0.3s ease',
                                    textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#e0e0e0')}
                                onClick={(e) => {
                                    e.preventDefault()
                                    scrollToSection(`#${link.toLowerCase()}`)
                                }}
                            >
                                {link}
                            </a>
                        ))}
                    </div>

                    {/* Copyright & Description */}
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <p style={{ color: '#b0b0b0', fontSize: '14px', lineHeight: 1.6 }}> {/* Lighter grey for copy */}
                            © {new Date().getFullYear()} Students Islamic Organisation of India - Delhi Zone. <br />
                            All rights reserved.
                        </p>
                    </div>

                    {/* Development Credits */}
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        <p style={{ color: '#999', fontSize: '14px', margin: 0 }}> {/* Lighter Credits */}
                            Development by <a href="https://github.com/0xAdnan" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>0xAdnan</a>
                        </p>
                        <button
                            onClick={() => setShowCredits(true)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#aaa', // lighter button text
                                fontSize: '13px',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: '4px'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#aaa')}
                        >
                            Full credits
                        </button>
                    </div>
                </div>
            </footer>

            {/* Credits Overlay */}
            {showCredits && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(10, 10, 10, 0.6)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.5s ease-out'
                }}>
                    <button
                        onClick={() => setShowCredits(false)}
                        style={{
                            position: 'absolute',
                            top: '32px',
                            right: '32px',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            transition: 'background 0.2s'
                        }}
                    >
                        <X size={20} />
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', alignItems: 'center', textAlign: 'center', maxWidth: '90vw' }}>
                        <img src={logo} alt="SIO Delhi" style={{ height: '80px', width: 'auto', marginBottom: '16px' }} />

                        <div className="credit-block">
                            <h3 style={{ color: '#666', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 500 }}>
                                Design & Project Lead
                            </h3>
                            <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
                                Mohammad Saad Inam
                            </p>
                        </div>

                        <div className="credit-block">
                            <h3 style={{ color: '#666', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 500 }}>
                                Development
                            </h3>
                            <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
                                Adnan Shakeel Ahmed
                            </p>
                        </div>


                    </div>

                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </>
    )
}
