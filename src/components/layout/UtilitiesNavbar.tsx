import { useRef, useEffect, useState } from 'react'
import { Heart, X, Copy, MessageSquare, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { useTheme } from '../../context/ThemeContext'
import { useContent } from '../../context/ContentContext'
import { api } from '../../lib/api'
import siodelLogo from '../../assets/logo.svg'
import donateQr from '../../assets/qr-code.svg'

export function UtilitiesNavbar() {
    const navRef = useRef<HTMLElement>(null)
    const { isDark } = useTheme()
    const { setShowDonation, showDonation } = useContent()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobile, setIsMobile] = useState(false)
    const [showReport, setShowReport] = useState(false)

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
                    {/* Left: SIO Logo */}
                    <a
                        href="/"
                        onClick={(e) => {
                            e.preventDefault()
                            navigate('/')
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
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
                            textDecoration: 'none',
                        }}
                    >
                        <img
                            src={siodelLogo}
                            alt="SIO Delhi Logo"
                            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                        />
                    </a>

                    {/* Right: Report + Support Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={() => setShowReport(true)}
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
                        aria-label="Report Issue"
                    >
                        <MessageSquare size={18} />
                    </button>
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

            {/* Report Issue Overlay */}
            {showReport && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
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
                        if (e.target === e.currentTarget) setShowReport(false)
                    }}
                >
                    <button
                        onClick={() => setShowReport(false)}
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
                        <ReportForm pageUrl={window.location.origin + location.pathname} onClose={() => setShowReport(false)} />
                    </div>
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
                            Stude05.07@idfcbank
                            <button onClick={() => copyToClipboard('Stude05.07@idfcbank')} style={{ background: 'none', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: 0 }} title="Copy">
                                <Copy size={14} />
                            </button>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ReportForm({ pageUrl, onClose }: { pageUrl: string; onClose: () => void }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [issueType, setIssueType] = useState('bug')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    const browserInfo = navigator.userAgent

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')
        setErrorMsg('')

        const result = await api.devReports.submit({
            name: name.trim(),
            email: email.trim(),
            issueType,
            description: description.trim(),
            pageUrl,
            browserInfo
        })

        if (result.error) {
            setStatus('error')
            setErrorMsg(result.error)
        } else {
            setStatus('success')
        }
    }

    if (status === 'success') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', animation: 'fadeIn 0.4s ease' }}>
                <CheckCircle2 size={48} color="#4ade80" />
                <h3 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>Report Submitted</h3>
                <p style={{ color: '#999', textAlign: 'center', margin: 0 }}>Thank you for your feedback. We'll look into it shortly.</p>
                <button
                    onClick={onClose}
                    style={{
                        marginTop: '8px',
                        padding: '10px 24px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    Close
                </button>
            </div>
        )
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box'
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', animation: 'fadeIn 0.4s ease' }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', textAlign: 'center' }}>Report an Issue</h3>
            <p style={{ color: '#888', textAlign: 'center', margin: 0, fontSize: '0.85rem' }}>Help us improve by reporting bugs or suggestions.</p>

            <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={255}
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,59,59,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
            />

            <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,59,59,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
            />

            <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23999\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
                <option value="bug" style={{ background: '#1a1a1a' }}>Bug Report</option>
                <option value="suggestion" style={{ background: '#1a1a1a' }}>Suggestion</option>
                <option value="question" style={{ background: '#1a1a1a' }}>Question</option>
                <option value="other" style={{ background: '#1a1a1a' }}>Other</option>
            </select>

            <textarea
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={10}
                maxLength={5000}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,59,59,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
            />

            <div style={{ fontSize: '0.75rem', color: '#666', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                Page: {pageUrl}
            </div>

            {status === 'error' && (
                <p style={{ color: '#ff3b3b', margin: 0, fontSize: '0.85rem', textAlign: 'center' }}>{errorMsg}</p>
            )}

            <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: status === 'loading' ? 'rgba(255,59,59,0.3)' : 'rgba(255,59,59,0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => { if (status !== 'loading') e.currentTarget.style.background = 'rgba(255,59,59,1)' }}
                onMouseLeave={(e) => { if (status !== 'loading') e.currentTarget.style.background = 'rgba(255,59,59,0.8)' }}
            >
                {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
                {status === 'loading' ? 'Submitting...' : 'Submit Report'}
            </button>
        </form>
    )
}
