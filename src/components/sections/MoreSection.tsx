
import SectionLayout from '../layout/SectionLayout'
import { FileText } from 'lucide-react'
import { useContent } from '../../context/ContentContext'

import { useNavigate } from 'react-router-dom'

export function MoreSection() {
    const navigate = useNavigate()
    const { getPostsBySection } = useContent()
    const resources = getPostsBySection('more').filter(p => p.isPublished)

    // Only render if we have posts
    // if (resources.length === 0) return null // Removed to keep section visible

    const headerContent = (
        <h1
            style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.1,
                margin: 0,
                fontFamily: '"Geist", sans-serif',
                letterSpacing: '-0.02em'
            }}
        >
            More <span style={{ color: '#ff3333' }}>Resources</span>
        </h1>
    )

    const renderResourceCard = (item: any) => (
        <div
            key={item.id}
            data-cursor="view"
            style={{
                background: 'rgba(20, 20, 25, 0.65)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                width: '300px',
                height: '400px',
                flexShrink: 0,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                zIndex: 5,
                isolation: 'isolate',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                padding: '32px',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                gap: '24px'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)'
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.zIndex = '10'
                // Colorize icon on hover
                const icon = e.currentTarget.querySelector('.icon-container') as HTMLElement
                if (icon) icon.style.borderColor = '#ff3333'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.zIndex = '5'
                // Reset icon color
                const icon = e.currentTarget.querySelector('.icon-container') as HTMLElement
                if (icon) icon.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
            onClick={() => {
                navigate(`/resource/${item.id}`)
            }}
        >
            {/* Icon Circle */}
            <div
                className="icon-container"
                style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden', // Ensure image clips to circle
                    transition: 'border-color 0.3s ease',
                    marginBottom: '16px'
                }}
            >
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <FileText size={48} color="#ffffff" />
                )}
            </div>

            {/* Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    fontFamily: '"Geist", sans-serif'
                }}>
                    {item.title}
                </h3>
                <p style={{
                    margin: 0,
                    fontSize: '1rem',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.5
                }}>
                    {item.subtitle}
                </p>
            </div>
        </div>
    )

    return (
        <SectionLayout id="more" header={headerContent}>
            {resources.length > 0 ? (
                resources.map(renderResourceCard)
            ) : (
                <div style={{
                    padding: '40px',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '1.2rem',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    width: '100%',
                    textAlign: 'center'
                }}>
                    No resources available yet.
                </div>
            )}
        </SectionLayout>
    )
}
