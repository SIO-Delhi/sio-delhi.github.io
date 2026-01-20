import { useState, useEffect, useRef, useMemo } from 'react'
import { Heart, X, Copy } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useTheme } from '../../context/ThemeContext'
import { useContent } from '../../context/ContentContext'

import siodelLogo from '../../assets/logo.png'
import donateQr from '../../assets/donate-sio.svg'

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [activeSection, setActiveSection] = useState('home')
    const [isMobile, setIsMobile] = useState(false)
    const [showDonation, setShowDonation] = useState(false)
    const navRef = useRef<HTMLElement>(null)
    const { isDark } = useTheme()
    const { sections } = useContent()
    const location = useLocation()
    const navigate = useNavigate()

    // Check if we're on the homepage
    const isHomePage = location.pathname === '/'

    // Generate Dynamic Nav Links
    const navLinks = useMemo(() => {
        return sections
            .filter(s => s.is_published)
            .map(s => ({
                name: s.label, // Use label (e.g., INITIATIVES) for navbar
                href: `#${s.id}`
            }))
    }, [sections])

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)

        const handleScroll = () => {
            // Dynamic check including home and contact
            const sectionIds = ['home', ...navLinks.map(l => l.href.replace('#', '')), 'contact']

            for (const section of sectionIds) {
                const el = document.getElementById(section)
                if (el) {
                    const rect = el.getBoundingClientRect()
                    if (rect.top <= 150 && rect.bottom >= 150) {
                        if (activeSection !== section) {
                            setActiveSection(section)
                            // Update URL hash using replaceState to avoid history stack pollution or router triggers
                            if (window.history.replaceState) {
                                window.history.replaceState(null, '', `#${section === 'home' ? '' : section}`)
                            }
                        }
                        break
                    }
                }
            }
        }
        window.addEventListener('scroll', handleScroll)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', checkMobile)
        }
    }, [navLinks, activeSection]) // Added dependencies

    useEffect(() => {
        gsap.fromTo(
            navRef.current,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
        )
    }, [])

    const scrollToSection = (href: string) => {
        const sectionId = href.replace('#', '')

        // If not on homepage, navigate to homepage with the hash
        if (!isHomePage) {
            navigate('/' + href)
            setIsOpen(false)
            return
        }

        // For sections with scroll animations, scroll to the cards/content area instead
        const targetElement = document.getElementById(sectionId)
        const offset = -100 // Navbar height buffer

        if (targetElement) {
            const lenis = (window as typeof window & { lenis?: { scrollTo: (target: number | Element, options?: { offset?: number, immediate?: boolean }) => void } }).lenis

            if (lenis) {
                lenis.scrollTo(targetElement, { offset, immediate: false }) // Smooth scroll
            } else {
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset
                window.scrollTo({
                    top: elementPosition + offset,
                    behavior: 'smooth'
                })
            }
        }
        setIsOpen(false)
    }

    const isActive = (href: string) => {
        const sectionId = href.replace('#', '')
        return activeSection === sectionId
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add toast here
    }

    return (
        <>
            <nav
                ref={navRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    padding: isMobile ? '32px 16px' : '20px 40px',
                    opacity: 0,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        maxWidth: '1600px',
                        margin: '0 auto',
                        position: 'relative',
                    }}
                >
                    {/* Left: SIO Logo + Organization Name Capsule */}
                    <a
                        href="#home"
                        onClick={(e) => {
                            e.preventDefault()
                            scrollToSection('#home')
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 16px 8px 8px',
                            borderRadius: '100px',
                            background: isDark
                                ? 'rgba(30, 30, 32, 0.5)'
                                : 'rgba(255, 255, 255, 0.25)',
                            backdropFilter: 'blur(40px) saturate(1.5)',
                            WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
                            border: isDark
                                ? '1px solid rgba(255, 255, 255, 0.1)'
                                : '1px solid rgba(255, 255, 255, 0.5)',
                            boxShadow: isDark
                                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                                : '0 4px 30px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease',
                            flexShrink: 0,
                            cursor: 'pointer',
                            textDecoration: 'none',
                        }}
                    >
                        {/* SIO Logo */}
                        <div
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}
                        >
                            <img
                                src={siodelLogo}
                                alt="SIO Delhi Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </div>
                        {/* Organization Text */}
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                color: isDark ? '#ffffff' : '#111111',
                                letterSpacing: '-0.01em',
                            }}>
                                Students Islamic Organization
                            </span>
                            <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                color: '#ff3b3b',
                                letterSpacing: '-0.01em',
                            }}>
                                Delhi Zone
                            </span>
                        </div>
                    </a>

                    {/* Desktop: Center Menu */}
                    {!isMobile && (
                        <div
                            style={{
                                position: 'absolute',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0',
                                padding: '6px 8px',
                                borderRadius: '100px',
                                background: isDark
                                    ? 'rgba(30, 30, 32, 0.5)'
                                    : 'rgba(255, 255, 255, 0.25)',
                                backdropFilter: 'blur(40px) saturate(1.5)',
                                WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
                                border: isDark
                                    ? '1px solid rgba(255, 255, 255, 0.1)'
                                    : '1px solid rgba(255, 255, 255, 0.5)',
                                boxShadow: isDark
                                    ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                                    : '0 4px 30px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        scrollToSection(link.href)
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 20px',
                                        borderRadius: '100px',
                                        fontSize: '14px',
                                        fontWeight: 400,
                                        color: isActive(link.href)
                                            ? (isDark ? '#ffffff' : '#111111')
                                            : (isDark ? '#888888' : '#666666'),
                                        background: 'transparent',
                                        border: isActive(link.href)
                                            ? (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.15)')
                                            : '1px solid transparent',
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    <span style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: isActive(link.href) ? '#ff3b3b' : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
                                        transition: 'background 0.3s ease',
                                    }} />
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Desktop: Right side buttons */}
                    {!isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Shiny Get in touch Button */}
                            <div className="shiny-button-container">
                                <a
                                    href="#contact"
                                    className="shiny-button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        scrollToSection('#contact')
                                    }}
                                    style={{
                                        display: 'inline-block',
                                        padding: '12px 24px',
                                        borderRadius: '100px',
                                        color: '#ffffff', // Always white because the button is dark
                                        fontSize: '14px',
                                        fontWeight: 400,
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                    }}
                                >
                                    Get in touch
                                </a>
                            </div>

                            {/* Donation Button (Replacing Theme Toggle) */}
                            <button
                                onClick={() => setShowDonation(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '44px',
                                    height: '44px',
                                    background: isDark
                                        ? 'rgba(30, 30, 32, 0.5)'
                                        : 'rgba(255, 255, 255, 0.25)',
                                    backdropFilter: 'blur(40px) saturate(1.5)',
                                    WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
                                    border: isDark
                                        ? '1px solid rgba(255, 255, 255, 0.1)'
                                        : '1px solid rgba(255, 255, 255, 0.5)',
                                    borderRadius: '100px',
                                    color: '#ff3b3b',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isDark
                                        ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                                        : '0 4px 30px rgba(0, 0, 0, 0.1)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 59, 59, 0.5)'
                                    e.currentTarget.style.background = 'rgba(255, 59, 59, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'
                                    e.currentTarget.style.background = isDark ? 'rgba(30, 30, 32, 0.5)' : 'rgba(255, 255, 255, 0.25)'
                                }}
                                aria-label="Support Us"
                            >
                                <Heart size={20} className={showDonation ? "fill-current" : ""} />
                            </button>
                        </div>
                    )}

                    {/* Mobile: Menu Button */}
                    {isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* Mobile Donation Button removed from top bar */}

                            <button
                                className={`mobile-menu-btn ${isOpen ? 'active' : ''}`}
                                onClick={() => setIsOpen(!isOpen)}
                                aria-label="Toggle menu"
                            >
                                <span className="bar"></span>
                                <span className="bar"></span>
                                <span className="bar"></span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Overlay */}
                {isMobile && (
                    <div className={`mobile-menu-overlay ${isOpen ? 'active' : ''}`}>
                        <div className="mobile-menu-content">
                            <ul className="mobile-links">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        className={isActive(link.href) ? 'active' : ''}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            scrollToSection(link.href)
                                            setIsOpen(false)
                                        }}
                                    >
                                        {link.name}
                                    </a>
                                ))}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', width: '100%' }}>
                                    {/* Get in touch Button */}
                                    <div className="shiny-button-container" style={{ width: '100%' }}>
                                        <a
                                            href="#contact"
                                            className="shiny-button"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                scrollToSection('#contact')
                                                setIsOpen(false)
                                            }}
                                            style={{
                                                display: 'flex', // Changed to flex for centering
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                padding: '14px 24px',
                                                borderRadius: '12px', // Slightly less rounded for mobile stack look? No, keep it consistent.
                                                color: '#ffffff',
                                                fontSize: '16px',
                                                fontWeight: 500,
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer',
                                                textDecoration: 'none',
                                                width: '100%',
                                                textAlign: 'center'
                                            }}
                                        >
                                            Get in touch
                                        </a>
                                    </div>

                                    {/* Support Us Button */}
                                    <div className="shiny-button-container" style={{ width: '100%' }}>
                                        <button
                                            onClick={() => {
                                                setShowDonation(true);
                                                setIsOpen(false);
                                            }}
                                            className="shiny-button"
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '14px 24px',
                                                borderRadius: '12px',
                                                color: '#ff3b3b', // Red Text
                                                fontSize: '16px',
                                                fontWeight: 500,
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer',
                                                width: '100%'
                                            }}
                                        >
                                            <Heart size={18} fill="currentColor" />
                                            Support Us
                                        </button>
                                    </div>
                                </div>
                            </ul>
                        </div>
                    </div>
                )}
            </nav>

            {/* Donation Overlay */}
            {showDonation && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(10, 10, 10, 0.8)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.5s ease-out'
                }}
                    onClick={(e) => {
                        // Close on click outside
                        if (e.target === e.currentTarget) setShowDonation(false)
                    }}
                >
                    <button
                        onClick={() => setShowDonation(false)}
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
                            transition: 'background 0.2s',
                            zIndex: 10
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                        <X size={20} />
                    </button>

                    <div style={{
                        maxWidth: '90%', width: '500px',
                        // background: '#1a1a1a', // Removed
                        // borderRadius: '24px', // Removed
                        // border: '1px solid #333', // Removed
                        padding: '40px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
                        // boxShadow: '0 20px 50px rgba(0,0,0,0.5)', // Removed
                        position: 'relative',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>

                        {/* <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, textAlign: 'center' }}>Support Our Cause</h2> */}
                        <p style={{ color: '#888', textAlign: 'center', margin: '-10px 0 10px' }}>Your contribution makes a difference.</p>

                        {/* QR Code */}
                        <img
                            src={donateQr}
                            alt="Donation QR Code"
                            style={{
                                width: '200px',
                                height: 'auto',
                                display: 'block'
                            }}
                        />

                        {/* Bank Details */}
                        <div style={{
                            width: '100%',
                            // background: '#222', // Removed
                            // borderRadius: '12px', // Removed
                            // padding: '24px', // Removed to let text flow naturally in parent
                            fontSize: '0.9rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                                    <span style={{ color: '#999' }}>Account Name</span>
                                    <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>STUDENTS ISLAMIC ORGANISATION OF INDIA-Delhi</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                                    <span style={{ color: '#999' }}>Account No</span>
                                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        10128891237
                                        <button onClick={() => copyToClipboard('10128891237')} style={{ background: 'none', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: 0 }} title="Copy">
                                            <Copy size={14} />
                                        </button>
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                                    <span style={{ color: '#999' }}>IFSC</span>
                                    <span style={{ fontWeight: 600 }}>IDFB0020197</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                                    <span style={{ color: '#999' }}>SWIFT</span>
                                    <span style={{ fontWeight: 600 }}>IDFBINBBMUM</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                                    <span style={{ color: '#999' }}>Bank name</span>
                                    <span style={{ fontWeight: 600, textAlign: 'right' }}>IDFC FIRST Branch: JASOLA, NEW DELHI</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#999' }}>UPI ID</span>
                                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Stude05.07@cmsidfc
                                        <button onClick={() => copyToClipboard('Stude05.07@cmsidfc')} style={{ background: 'none', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: 0 }} title="Copy">
                                            <Copy size={14} />
                                        </button>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#999', textAlign: 'center', lineHeight: 1.5, background: 'rgba(255, 59, 59, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 59, 59, 0.2)' }}>
                            Send your donation details on <span style={{ color: '#ff3b3b', fontWeight: 600 }}>+91 7827378127</span> through WhatsApp to get your receipt.
                        </p>

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
