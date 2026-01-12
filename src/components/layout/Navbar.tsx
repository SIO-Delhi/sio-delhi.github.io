import { useState, useEffect, useRef } from 'react'
import { Menu, X, Sun, Moon, ChevronDown } from 'lucide-react'
import gsap from 'gsap'
import { useTheme } from '../../context/ThemeContext'

const navLinks = [
    { name: 'Home', href: '#home', hasDropdown: false },
    { name: 'About', href: '#about', hasDropdown: true },
    { name: 'Initiatives', href: '#initiatives', hasDropdown: true },
    { name: 'Media', href: '#media', hasDropdown: true },
    { name: 'Leadership', href: '#leadership', hasDropdown: true },
    { name: 'More', href: '#more', hasDropdown: true },
]

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [activeSection, setActiveSection] = useState('home')
    const [isMobile, setIsMobile] = useState(false)
    const navRef = useRef<HTMLElement>(null)
    const { isDark, toggleTheme } = useTheme()

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)

        const handleScroll = () => {
            const sections = ['home', 'about', 'initiatives', 'media', 'leadership', 'more', 'contact']
            for (const section of sections) {
                const el = document.getElementById(section)
                if (el) {
                    const rect = el.getBoundingClientRect()
                    if (rect.top <= 150 && rect.bottom >= 150) {
                        setActiveSection(section)
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
    }, [])

    useEffect(() => {
        gsap.fromTo(
            navRef.current,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
        )
    }, [])

    const scrollToSection = (href: string) => {
        const element = document.querySelector(href)
        if (element) {
            const lenis = (window as typeof window & { lenis?: { scrollTo: (el: Element) => void } }).lenis
            if (lenis) {
                lenis.scrollTo(element)
            } else {
                element.scrollIntoView({ behavior: 'smooth' })
            }
        }
        setIsOpen(false)
    }

    const isActive = (href: string) => {
        const sectionId = href.replace('#', '')
        return activeSection === sectionId
    }

    return (
        <nav
            ref={navRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                padding: '24px 40px',
                opacity: 0,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    position: 'relative',
                }}
            >

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
                                {link.hasDropdown && <ChevronDown size={14} style={{ opacity: 0.6 }} />}
                            </a>
                        ))}
                    </div>
                )}

                {/* Desktop: Right side buttons */}
                {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <a
                            href="#contact"
                            onClick={(e) => {
                                e.preventDefault()
                                scrollToSection('#contact')
                            }}
                            style={{
                                padding: '12px 24px',
                                background: isDark
                                    ? 'rgba(30, 30, 32, 0.7)'
                                    : 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(20px) saturate(1.1)',
                                WebkitBackdropFilter: 'blur(20px) saturate(1.1)',
                                border: isDark
                                    ? '1px solid rgba(255, 255, 255, 0.08)'
                                    : '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '100px',
                                color: isDark ? '#ffffff' : '#111111',
                                fontSize: '14px',
                                fontWeight: 400,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                boxShadow: isDark ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.08)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
                            }}
                        >
                            Get in touch
                        </a>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '44px',
                                height: '44px',
                                background: isDark
                                    ? 'rgba(30, 30, 32, 0.7)'
                                    : 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(20px) saturate(1.1)',
                                WebkitBackdropFilter: 'blur(20px) saturate(1.1)',
                                border: isDark
                                    ? '1px solid rgba(255, 255, 255, 0.08)'
                                    : '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '100px',
                                color: isDark ? '#ffffff' : '#111111',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: isDark ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.08)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
                            }}
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                )}

                {/* Mobile: Menu Button */}
                {isMobile && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            padding: '8px',
                            color: isDark ? 'white' : '#111111',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                )}
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobile && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: '20px',
                        right: '20px',
                        marginTop: '10px',
                        background: isDark ? 'rgba(20, 20, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
                        pointerEvents: isOpen ? 'auto' : 'none',
                    }}
                >
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    color: isDark ? '#ffffff' : '#111111',
                                    background: isActive(link.href)
                                        ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')
                                        : 'transparent',
                                }}
                            >
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: isActive(link.href) ? '#ff3b3b' : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'),
                                }} />
                                {link.name}
                            </a>
                        ))}
                        <a
                            href="#contact"
                            onClick={(e) => { e.preventDefault(); scrollToSection('#contact'); }}
                            style={{
                                marginTop: '8px',
                                padding: '12px 16px',
                                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: '12px',
                                color: isDark ? '#ffffff' : '#111111',
                                textAlign: 'center',
                                fontSize: '14px',
                            }}
                        >
                            Get in touch
                        </a>
                    </div>
                </div>
            )}
        </nav>
    )
}
