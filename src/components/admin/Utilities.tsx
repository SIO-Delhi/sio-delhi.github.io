import { Link } from 'react-router-dom'
import { Frame, ChevronRight, PenTool } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Utilities() {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const utilities = [
        {
            id: 'frame-tool',
            title: 'Frame Tool',
            description: 'Apply branding frames and overlays to photos for social media sharing.',
            icon: <Frame size={24} color="#ff3b3b" />,
            path: '/admin/utilities/frame-tool',
            color: '#ff3b3b'
        },

    ]

    return (
        <div>
            <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
                <h1 style={{
                    fontSize: isMobile ? '1.75rem' : '2.5rem',
                    fontWeight: 800,
                    marginBottom: '8px'
                }}>Utilities</h1>
                <p style={{ color: '#888', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                    Helper tools and utilities for content management.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: isMobile ? '16px' : '24px'
            }}>
                {utilities.map(tool => (
                    <Link
                        key={tool.id}
                        to={tool.path}
                        style={{
                            padding: isMobile ? '20px' : '24px',
                            borderRadius: '16px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.borderColor = '#555'
                            e.currentTarget.style.background = '#222'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.borderColor = '#333'
                            e.currentTarget.style.background = '#1a1a1a'
                        }}
                    >
                        {/* Decorative background glow */}
                        <div style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '-20px',
                            width: '80px',
                            height: '80px',
                            background: `radial-gradient(circle, ${tool.color}15 0%, transparent 70%)`,
                            borderRadius: '50%',
                            pointerEvents: 'none'
                        }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: `${tool.color}15`,
                                border: `1px solid ${tool.color}30`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {tool.icon}
                            </div>
                        </div>

                        <div>
                            <h3 style={{
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                margin: '0 0 8px 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                {tool.title}
                            </h3>
                            <p style={{
                                fontSize: '0.9rem',
                                color: '#888',
                                margin: 0,
                                lineHeight: '1.5'
                            }}>
                                {tool.description}
                            </p>
                        </div>

                        <div style={{
                            marginTop: 'auto',
                            paddingTop: '16px',
                            borderTop: '1px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: tool.color
                        }}>
                            Open Tool <ChevronRight size={16} />
                        </div>
                    </Link>
                ))}

                {/* Coming Soon Placeholder */}
                <div style={{
                    padding: isMobile ? '20px' : '24px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed #333',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    color: '#555',
                    minHeight: '200px'
                }}>
                    <PenTool size={32} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>More tools coming soon</span>
                </div>
            </div>
        </div>
    )
}
