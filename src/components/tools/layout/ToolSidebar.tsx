import { useRef, useEffect, useState } from 'react'
import { Heart, Menu, X, Home, MessageSquare, Copy, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import gsap from 'gsap'

import { useTheme } from '../../../context/ThemeContext'
import { useContent } from '../../../context/ContentContext'
import logoPng from '../../../assets/logo.png'
import donateQr from '../../../assets/qr-code.svg'
import { ShinyButton } from '../../ui/ShinyButton'
import { TOOLS } from '../tools.config'
import { api } from '../../../lib/api'

interface ToolSidebarProps {
    isCollapsed: boolean
    setIsCollapsed: (collapsed: boolean) => void
    onCollapseChange?: (isCollapsed: boolean) => void
}

export function ToolSidebar({ isCollapsed, setIsCollapsed, onCollapseChange }: ToolSidebarProps) {
    const sidebarRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const menuItemsRef = useRef<HTMLDivElement>(null)
    const isFirstRender = useRef(true)

    const { isDark } = useTheme()
    const { showDonation, setShowDonation } = useContent()
    const navigate = useNavigate()
    const location = useLocation()
    const [showReport, setShowReport] = useState(false)

    // Initial load animation
    useEffect(() => {
        if (!sidebarRef.current) return

        gsap.fromTo(
            sidebarRef.current,
            { x: -100, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
        )

        if (menuItemsRef.current) {
            const items = menuItemsRef.current.querySelectorAll('.nav-item')
            if (items.length > 0) {
                gsap.fromTo(
                    items,
                    { x: -20, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.5 }
                )
            }
        }
    }, [])

    // Collapse/Expand state logic
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        if (!sidebarRef.current || !contentRef.current) return

        const isMobile = window.innerWidth < 768

        if (isMobile) {
            if (isCollapsed) {
                gsap.to(sidebarRef.current, { y: '-100%', duration: 0.5, ease: 'power3.inOut' })
                gsap.to(contentRef.current, { opacity: 0, duration: 0.3 })
            } else {
                gsap.to(sidebarRef.current, { y: '0%', duration: 0.5, ease: 'power3.inOut' })
                gsap.to(contentRef.current, { opacity: 1, duration: 0.4, delay: 0.1 })
            }
        } else {
            if (isCollapsed) {
                gsap.to(sidebarRef.current, { width: 70, duration: 0.4, ease: 'power2.inOut' })
                gsap.to(contentRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' })
            } else {
                gsap.to(sidebarRef.current, { width: 240, duration: 0.4, ease: 'power2.inOut' })
                gsap.to(contentRef.current, { opacity: 1, duration: 0.3, delay: 0.2, ease: 'power2.out' })

                if (menuItemsRef.current) {
                    const items = menuItemsRef.current.querySelectorAll('.nav-item')
                    gsap.fromTo(items, { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, stagger: 0.05, delay: 0.2, ease: 'power2.out' })
                }
            }
        }
    }, [isCollapsed])

    const toggleCollapse = () => {
        const nextState = !isCollapsed
        setIsCollapsed(nextState)
        onCollapseChange?.(nextState)
    }

    return (
        <>
            <div
                ref={sidebarRef}
                style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    top: window.innerWidth < 768 ? '60px' : 0,
                    transform: window.innerWidth < 768 && isCollapsed ? 'translateY(-100%)' : 'none',
                    bottom: 0,
                    width: window.innerWidth < 768 ? '100%' : (isCollapsed ? 70 : 240),
                    background: isDark ? '#09090b' : '#fafafa',
                    borderRight: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: window.innerWidth < 768 ? 40 : 10000,
                    overflow: 'hidden',
                }}
            >
                <button
                    onClick={toggleCollapse}
                    style={{
                        position: 'absolute',
                        top: 24,
                        right: isCollapsed ? 12 : 16,
                        width: isCollapsed ? 40 : 32,
                        height: isCollapsed ? 40 : 32,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #ff3b3b 0%, #ff6b6b 100%)',
                        border: 'none',
                        display: window.innerWidth < 768 ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10001,
                        transition: 'all 0.2s ease',
                        color: '#ffffff',
                        boxShadow: '0 4px 12px rgba(255, 59, 59, 0.3)',
                    }}
                    onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.1, boxShadow: '0 6px 20px rgba(255, 59, 59, 0.5)', duration: 0.2 })}
                    onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, boxShadow: '0 4px 12px rgba(255, 59, 59, 0.3)', duration: 0.2 })}
                    title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                    {isCollapsed ? <Menu size={20} /> : <X size={20} />}
                </button>

                <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 20px', paddingBottom: window.innerWidth < 768 ? '80px' : '24px', gap: '32px', overflowY: 'auto' }}>

                    {/* Logo - hidden on mobile since mobile header already shows it */}
                    {!isCollapsed && window.innerWidth >= 768 && (
                        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/') }} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', cursor: 'pointer' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src={logoPng} alt="SIO Delhi Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#fdedcb' }}>Students Islamic</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#fdedcb' }}>Organization</span>
                                <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#ff3b3b', marginTop: '2px' }}>Delhi Zone</span>
                            </div>
                        </a>
                    )}

                    {/* Navigation Menu */}
                    <div ref={menuItemsRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        {!isCollapsed && (
                            <>
                                <div
                                    className="nav-item"
                                    onClick={() => navigate('/utilities')}
                                    style={{
                                        padding: '12px 16px', borderRadius: '12px', background: 'transparent',
                                        color: isDark ? '#e4e4e7' : '#3f3f46', fontSize: '0.9rem', fontWeight: 500,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Home size={18} strokeWidth={2} />
                                    Home
                                </div>

                                {TOOLS.map(tool => {
                                    const isActive = location.pathname.includes(tool.activeMatch || tool.id)
                                    return (
                                        <div
                                            key={tool.id}
                                            className={`nav-item ${isActive ? 'active' : ''}`}
                                            onClick={() => navigate(tool.path)}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                background: isActive ? (isDark ? 'rgba(255, 59, 59, 0.1)' : 'rgba(255, 59, 59, 0.05)') : 'transparent',
                                                border: isActive ? `1px solid ${isDark ? 'rgba(255, 59, 59, 0.2)' : 'rgba(255, 59, 59, 0.15)'}` : '1px solid transparent',
                                                color: isActive ? '#ff3b3b' : (isDark ? '#e4e4e7' : '#3f3f46'),
                                                fontSize: '0.9rem',
                                                fontWeight: isActive ? 600 : 500,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}
                                            onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {tool.icon && <tool.icon size={18} strokeWidth={2} />}
                                                {tool.label}
                                            </div>
                                            {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3b3b', boxShadow: '0 0 8px rgba(255, 59, 59, 0.5)' }} />}
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!isCollapsed ? (
                            <>
                                <ShinyButton href="#" onClick={(e) => { e.preventDefault(); setShowReport(true) }} style={{ color: '#efc676', fontSize: '0.85rem', padding: '10px 16px' }}>
                                    Report Issue
                                </ShinyButton>
                                <button
                                    onClick={() => setShowDonation(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px',
                                        background: isDark ? 'rgba(30, 30, 32, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                                        borderRadius: '100px', color: '#ff3b3b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => gsap.to(e.currentTarget, { background: 'rgba(255, 59, 59, 0.1)', borderColor: 'rgba(255, 59, 59, 0.5)', scale: 1.02, duration: 0.2 })}
                                    onMouseLeave={(e) => gsap.to(e.currentTarget, { background: isDark ? 'rgba(30, 30, 32, 0.5)' : 'rgba(255, 255, 255, 0.5)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', scale: 1, duration: 0.2 })}
                                >
                                    <Heart size={16} /> Support Us
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setShowReport(true)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: isDark ? '#18181b' : '#ffffff', border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#efc676', margin: '0 auto' }} title="Report Issue"><MessageSquare size={16} /></button>
                                <button onClick={() => setShowDonation(true)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: isDark ? '#18181b' : '#ffffff', border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ff3b3b', margin: '0 auto' }} title="Support Us"><Heart size={16} /></button>
                            </>
                        )}
                    </div>
                </div>

                {isCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', borderTop: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`, marginTop: 'auto' }}>
                        <img src={logoPng} alt="SIO Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    </div>
                )}
            </div>

            {/* Donation Overlay */}
            {showDonation && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(10, 10, 10, 0.8)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s ease-out'
                }} onClick={(e) => { if (e.target === e.currentTarget) setShowDonation(false) }}>
                    <button onClick={() => setShowDonation(false)} style={{ position: 'absolute', top: '32px', right: '32px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 10 }}>
                        <X size={20} />
                    </button>
                    <div style={{ maxWidth: '90%', width: '500px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <DonationContent />
                    </div>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}} />
                </div>
            )}

            {/* Report Issue Overlay */}
            {showReport && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(10, 10, 10, 0.8)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s ease-out'
                }} onClick={(e) => { if (e.target === e.currentTarget) setShowReport(false) }}>
                    <button onClick={() => setShowReport(false)} style={{ position: 'absolute', top: '32px', right: '32px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', zIndex: 10 }}>
                        <X size={20} />
                    </button>
                    <div style={{ maxWidth: '90%', width: '500px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <SidebarReportForm pageUrl={window.location.origin + location.pathname} onClose={() => setShowReport(false)} />
                    </div>
                </div>
            )}
        </>
    )
}

function DonationContent() {
    const [isLoaded, setIsLoaded] = useState(false)
    const copyToClipboard = (text: string) => navigator.clipboard.writeText(text)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.5s ease, transform 0.5s ease', width: '100%' }}>
            <p style={{ color: '#888', textAlign: 'center', margin: 0 }}>Your contribution makes a difference.</p>
            <img src={donateQr} alt="Donation QR Code" onLoad={() => setIsLoaded(true)} style={{ width: '200px', height: 'auto', display: 'block' }} />
            <div style={{ width: '100%', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                        <span style={{ color: '#999' }}>Account Name</span>
                        <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>STUDENTS ISLAMIC ORGANISATION OF INDIA-Delhi</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                        <span style={{ color: '#999' }}>Account No</span>
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            10128891237
                            <button onClick={() => copyToClipboard('10128891237')} style={{ background: 'none', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: 0 }} title="Copy"><Copy size={14} /></button>
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                        <span style={{ color: '#999' }}>IFSC</span>
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            IDFB0020197
                            <button onClick={() => copyToClipboard('IDFB0020197')} style={{ background: 'none', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: 0 }} title="Copy"><Copy size={14} /></button>
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                        <span style={{ color: '#999' }}>SWIFT</span>
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            IDFBINBBMUM
                            <button onClick={() => copyToClipboard('IDFBINBBMUM')} style={{ background: 'none', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: 0 }} title="Copy"><Copy size={14} /></button>
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                        <span style={{ color: '#999' }}>UPI ID</span>
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Stude05.07@cmsidfc
                            <button onClick={() => copyToClipboard('Stude05.07@cmsidfc')} style={{ background: 'none', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: 0 }} title="Copy"><Copy size={14} /></button>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SidebarReportForm({ pageUrl, onClose }: { pageUrl: string; onClose: () => void }) {
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
                    style={{ marginTop: '8px', padding: '10px 24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    Close
                </button>
            </div>
        )
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white',
        fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', animation: 'fadeIn 0.4s ease' }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', textAlign: 'center' }}>Report an Issue</h3>
            <p style={{ color: '#888', textAlign: 'center', margin: 0, fontSize: '0.85rem' }}>Help us improve by reporting bugs or suggestions.</p>

            <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,59,59,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'} />

            <input type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,59,59,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'} />

            <select value={issueType} onChange={(e) => setIssueType(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23999\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                <option value="bug" style={{ background: '#1a1a1a' }}>Bug Report</option>
                <option value="suggestion" style={{ background: '#1a1a1a' }}>Suggestion</option>
                <option value="question" style={{ background: '#1a1a1a' }}>Question</option>
                <option value="other" style={{ background: '#1a1a1a' }}>Other</option>
            </select>

            <textarea placeholder="Describe the issue in detail..." value={description} onChange={(e) => setDescription(e.target.value)}
                required minLength={10} maxLength={5000} rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,59,59,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'} />

            <div style={{ fontSize: '0.75rem', color: '#666', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                Page: {pageUrl}
            </div>

            {status === 'error' && (
                <p style={{ color: '#ff3b3b', margin: 0, fontSize: '0.85rem', textAlign: 'center' }}>{errorMsg}</p>
            )}

            <button type="submit" disabled={status === 'loading'}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px',
                    background: status === 'loading' ? 'rgba(255,59,59,0.3)' : 'rgba(255,59,59,0.8)',
                    border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.9rem', fontWeight: 600,
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => { if (status !== 'loading') e.currentTarget.style.background = 'rgba(255,59,59,1)' }}
                onMouseLeave={(e) => { if (status !== 'loading') e.currentTarget.style.background = 'rgba(255,59,59,0.8)' }}>
                {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
                {status === 'loading' ? 'Submitting...' : 'Submit Report'}
            </button>
        </form>
    )
}
