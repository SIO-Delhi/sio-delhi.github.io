import { useRef, useEffect, useState } from 'react'
import { Heart, FlaskConical, X, Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useTheme } from '../../context/ThemeContext'
import { useContent } from '../../context/ContentContext'
import siodelLogo from '../../assets/logo.svg'
import donateQr from '../../assets/qr-code.svg'

export function UtilitiesNavbar() {
    const navRef = useRef<HTMLElement>(null)
    const { isDark } = useTheme()
    const { setShowDonation, showDonation } = useContent()
    const navigate = useNavigate()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        gsap.fromTo(
            navRef.current,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
        )
    }, [])

    return (
        <>
            <nav
                ref={navRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    padding: isMobile ? '20px 16px' : '20px 40px',
                    opacity: 0,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        margin: '0 auto',
                        position: 'relative',
                        maxWidth: '1400px'
                    }}
                >
                    {/* Left: SIO Logo & Flask */}
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
                            position: 'relative'
                        }}
                    >
                        <div style={{ position: 'relative' }}>
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

                            {/* Flask Icon Overlay */}
                            <div style={{
                                position: 'absolute',
                                top: -12,
                                right: -12,
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {/* Glass Circle */}
                                <div style={{
                                    position: 'absolute',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle at 30% 30%, rgba(255, 59, 59, 0.2), rgba(255, 0, 0, 0.05))',
                                    backdropFilter: 'blur(2px)',
                                    border: '1px solid rgba(255, 59, 59, 0.3)',
                                    zIndex: -1
                                }} />
                                <FlaskConical size={12} strokeWidth={2} color="#FCA5A5" style={{ filter: 'drop-shadow(0 0 4px rgba(255,59,59,0.5))', marginBottom: '-2px' }} />
                            </div>
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

                    {/* Right: Support Button */}
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
            </nav>

            {/* Donation Overlay */}
            {showDonation && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999, // Ensure it's above navbar
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
                        padding: '40px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
                        position: 'relative',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <DonationContent />
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

function DonationContent() {
    const [isLoaded, setIsLoaded] = useState(false)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            width: '100%'
        }}>
            <p style={{ color: '#888', textAlign: 'center', margin: 0 }}>Your contribution makes a difference.</p>

            {/* QR Code */}
            <img
                src={donateQr}
                alt="Donation QR Code"
                onLoad={() => setIsLoaded(true)}
                style={{
                    width: '200px',
                    height: 'auto',
                    display: 'block'
                }}
            />

            {/* Bank Details */}
            <div style={{
                width: '100%',
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
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            IDFB0020197
                            <button onClick={() => copyToClipboard('IDFB0020197')} style={{ background: 'none', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: 0 }} title="Copy">
                                <Copy size={14} />
                            </button>
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                        <span style={{ color: '#999' }}>SWIFT</span>
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            IDFBINBBMUM
                            <button onClick={() => copyToClipboard('IDFBINBBMUM')} style={{ background: 'none', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: 0 }} title="Copy">
                                <Copy size={14} />
                            </button>
                        </span>
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
        </div>
    )
}
