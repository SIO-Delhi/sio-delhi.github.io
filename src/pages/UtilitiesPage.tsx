import { Link } from 'react-router-dom'
import { Frame, ChevronRight, PenTool } from 'lucide-react'
import { useState, useEffect } from 'react'
import { UtilitiesSplash } from '../components/ui/UtilitiesSplash'

export function UtilitiesPage() {
    const [isMobile, setIsMobile] = useState(false)
    const [showSplash, setShowSplash] = useState(true)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    if (showSplash) {
        return <UtilitiesSplash onComplete={() => setShowSplash(false)} />
    }

    const utilities = [
        {
            id: 'frame-tool',
            title: 'Frame Tool',
            description: 'Apply branding frames and overlays to photos for social media sharing.',
            icon: <Frame size={24} color="#ff3b3b" />,
            path: '/utilities/frame-tool',
            color: '#ff3b3b'
        },
    ]

    return (
        <div style={{
            padding: isMobile ? '120px 16px 40px' : '140px 40px 60px',
            minHeight: 'calc(100vh - 400px)',
            background: '#09090b',
            color: 'white',
            fontFamily: '"DM Sans", sans-serif'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: isMobile ? '32px' : '48px' }}>
                    <h1 style={{
                        fontSize: isMobile ? '2.5rem' : '4rem',
                        fontWeight: 800,
                        marginBottom: '16px',
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(to right, #ffffff, #888)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>Utilities</h1>
                    <p style={{
                        color: '#a1a1aa',
                        fontSize: isMobile ? '1rem' : '1.2rem',
                        maxWidth: '600px',
                        lineHeight: 1.6
                    }}>
                        Helper tools and utilities for SIO Delhi content management and branding.
                        More tools will be added to this collection.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: isMobile ? '16px' : '32px'
                }}>
                    {utilities.map(tool => (
                        <Link
                            key={tool.id}
                            to={tool.path}
                            style={{
                                padding: isMobile ? '24px' : '32px',
                                borderRadius: '24px',
                                background: 'linear-gradient(145deg, #121215, #0d0d10)',
                                border: '1px solid #27272a',
                                textDecoration: 'none',
                                color: 'inherit',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-6px)'
                                e.currentTarget.style.borderColor = '#3f3f46'
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.borderColor = '#27272a'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '16px',
                                    background: `${tool.color}15`,
                                    border: `1px solid ${tool.color}30`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {tool.icon}
                                </div>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#27272a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#71717a'
                                }}>
                                    <ChevronRight size={16} />
                                </div>
                            </div>

                            <div>
                                <h3 style={{
                                    fontSize: '1.4rem',
                                    fontWeight: 700,
                                    margin: '0 0 8px 0',
                                    color: '#f4f4f5'
                                }}>
                                    {tool.title}
                                </h3>
                                <p style={{
                                    fontSize: '1rem',
                                    color: '#a1a1aa',
                                    margin: 0,
                                    lineHeight: '1.5'
                                }}>
                                    {tool.description}
                                </p>
                            </div>

                            <div style={{
                                marginTop: '12px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: tool.color,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                Open Tool
                            </div>
                        </Link>
                    ))}

                    {/* Coming Soon Placeholder */}
                    <div style={{
                        padding: isMobile ? '24px' : '32px',
                        borderRadius: '24px',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '2px dashed #27272a',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        color: '#52525b',
                        minHeight: '240px'
                    }}>
                        <PenTool size={32} strokeWidth={1.5} />
                        <span style={{ fontSize: '1rem', fontWeight: 500 }}>More tools coming soon</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
