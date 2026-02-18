import { Link } from 'react-router-dom'
import { Frame, Sliders, ChevronRight, PenTool } from 'lucide-react'
import { useState, useEffect } from 'react'
import { SEOHead } from '../components/seo/SEOHead'

export function UtilitiesPage() {
    const [isMobile, setIsMobile] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        // Simulate brief load for smooth skeleton transition
        const timer = requestAnimationFrame(() => setLoading(false))
        return () => cancelAnimationFrame(timer)
    }, [])

    if (loading) {
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
                        <div style={{ width: '240px', height: isMobile ? '40px' : '56px', borderRadius: '12px', background: 'linear-gradient(90deg, #18181b 25%, #27272a 50%, #18181b 75%)', backgroundSize: '200% 100%', animation: 'utilitySkeleton 1.5s ease-in-out infinite', marginBottom: '16px' }} />
                        <div style={{ width: '400px', maxWidth: '100%', height: '18px', borderRadius: '8px', background: 'linear-gradient(90deg, #18181b 25%, #27272a 50%, #18181b 75%)', backgroundSize: '200% 100%', animation: 'utilitySkeleton 1.5s ease-in-out infinite', animationDelay: '0.1s', marginBottom: '8px' }} />
                        <div style={{ width: '300px', maxWidth: '80%', height: '18px', borderRadius: '8px', background: 'linear-gradient(90deg, #18181b 25%, #27272a 50%, #18181b 75%)', backgroundSize: '200% 100%', animation: 'utilitySkeleton 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: isMobile ? '16px' : '32px'
                    }}>
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} style={{
                                padding: isMobile ? '24px' : '32px',
                                borderRadius: '24px',
                                background: 'linear-gradient(145deg, #121215, #0d0d10)',
                                border: '1px solid #27272a',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                minHeight: '240px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(90deg, #18181b 25%, #27272a 50%, #18181b 75%)', backgroundSize: '200% 100%', animation: 'utilitySkeleton 1.5s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a1a1e' }} />
                                </div>
                                <div>
                                    <div style={{ width: '60%', height: '24px', borderRadius: '8px', background: 'linear-gradient(90deg, #18181b 25%, #27272a 50%, #18181b 75%)', backgroundSize: '200% 100%', animation: 'utilitySkeleton 1.5s ease-in-out infinite', animationDelay: `${i * 0.15 + 0.1}s`, marginBottom: '12px' }} />
                                    <div style={{ width: '100%', height: '14px', borderRadius: '6px', background: 'linear-gradient(90deg, #18181b 25%, #27272a 50%, #18181b 75%)', backgroundSize: '200% 100%', animation: 'utilitySkeleton 1.5s ease-in-out infinite', animationDelay: `${i * 0.15 + 0.2}s`, marginBottom: '8px' }} />
                                    <div style={{ width: '80%', height: '14px', borderRadius: '6px', background: 'linear-gradient(90deg, #18181b 25%, #27272a 50%, #18181b 75%)', backgroundSize: '200% 100%', animation: 'utilitySkeleton 1.5s ease-in-out infinite', animationDelay: `${i * 0.15 + 0.3}s` }} />
                                </div>
                                <div style={{ width: '80px', height: '14px', borderRadius: '6px', background: 'linear-gradient(90deg, #18181b 25%, #27272a 50%, #18181b 75%)', backgroundSize: '200% 100%', animation: 'utilitySkeleton 1.5s ease-in-out infinite', animationDelay: `${i * 0.15 + 0.4}s`, marginTop: '12px' }} />
                            </div>
                        ))}
                    </div>
                </div>
                <style>{`
                    @keyframes utilitySkeleton {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}</style>
            </div>
        )
    }

    const utilities = [
        {
            id: 'poster-tool',
            title: 'Poster Maker',
            description: 'Create professional weekly program posters with customizable details and themes.',
            icon: <PenTool size={24} color="#f59e0b" />,
            path: '/utilities/poster-tool',
            color: '#f59e0b'
        },
        {
            id: 'frame-tool',
            title: 'Frame Tool',
            description: 'Apply branding frames and overlays to photos in bulk for social media sharing.',
            icon: <Frame size={24} color="#ff3b3b" />,
            path: '/utilities/frame-tool',
            color: '#ff3b3b'
        },
        {
            id: 'filter-tool',
            title: 'Filter Tool',
            description: 'Batch image processing with LUT profiles, color grading, and export in bulk.',
            icon: <Sliders size={24} color="#a78bfa" />,
            path: '/utilities/filter-tool',
            color: '#a78bfa'
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
            <SEOHead title="Utilities" description="SIO Delhi creative tools - frame tool, filter tool, and poster tool." />
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
                        Helper tools and utilities for content management and branding.
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

                </div>
            </div>
        </div>
    )
}
