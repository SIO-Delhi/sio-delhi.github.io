import { useRef, useEffect } from 'react'
import { Heart, Copy } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useTheme } from '../../context/ThemeContext'
import { useContent } from '../../context/ContentContext'
import siodelLogo from '../../assets/logo.svg'
import { ShinyButton } from '../ui/ShinyButton'

export function UtilitiesNavbar() {
    const navRef = useRef<HTMLElement>(null)
    const { isDark } = useTheme()
    const { setShowDonation, showDonation } = useContent()
    const location = useLocation()
    const navigate = useNavigate()

    const isFrameTool = location.pathname.includes('frame-tool')

    useEffect(() => {
        gsap.fromTo(
            navRef.current,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
        )
    }, [])

    return (
        <nav
            ref={navRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                padding: '20px 40px',
                opacity: 0,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    margin: '0',
                    position: 'relative',
                }}
            >
                {/* Left: SIO Logo (Links to Home) */}
                <a
                    href="/"
                    onClick={(e) => {
                        e.preventDefault()
                        navigate('/')
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
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#fdedcb',
                            letterSpacing: '-0.01em',
                            mixBlendMode: 'difference'
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


                {/* Center: Tool Name */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 24px',
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
                        color: '#efc676',
                        fontSize: '1rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                    }}
                >
                    <Copy size={16} />
                    {isFrameTool ? 'Frame Tool' : 'Utilities'}
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShinyButton
                        href="/"
                        onClick={(e) => {
                            e.preventDefault()
                            navigate('/#contact')
                        }}
                        style={{ color: '#efc676' }}
                    >
                        Get in touch
                    </ShinyButton>

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
            </div>
        </nav >
    )
}
