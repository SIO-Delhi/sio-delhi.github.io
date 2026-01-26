import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { X, Instagram, Youtube, Facebook } from 'lucide-react'

// ... existing code ...

gsap.registerPlugin(ScrollTrigger)

const sections = ['About', 'Initiatives', 'Media', 'Leadership', 'Contact']

const XLogo = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
)

const TelegramLogo = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
)

const ThreadsLogo = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 192 192" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
    </svg>
)

export function Footer() {
    const footerRef = useRef<HTMLElement>(null)
    const [showCredits, setShowCredits] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()

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
        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: sectionId } })
            return
        }

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
                        <a href="https://www.facebook.com/delhisio/" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: '#cccccc', transition: 'color 0.2s' }} aria-label="Facebook"><Facebook size={20} /></a>
                        <a href="https://youtube.com/c/SIODELHI" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: '#cccccc', transition: 'color 0.2s' }} aria-label="YouTube"><Youtube size={20} /></a>
                        <a href="https://x.com/siodelhi?lang=en" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: '#cccccc', transition: 'color 0.2s' }} aria-label="X (Twitter)"><XLogo size={18} /></a>
                        <a href="https://t.me/siodelhi" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: '#cccccc', transition: 'color 0.2s' }} aria-label="Telegram"><TelegramLogo size={20} /></a>
                        <a href="https://www.threads.net/@siodelhi" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: '#cccccc', transition: 'color 0.2s' }} aria-label="Threads"><ThreadsLogo size={20} /></a>
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
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#fdedcb')}
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
                            Development by <a href="https://www.0x-adnan.com" target="_blank" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>0xAdnan</a>
                        </p>
                        {/* <button
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
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#fdedcb')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#aaa')}
                        >
                            Full credits
                        </button> */}
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
