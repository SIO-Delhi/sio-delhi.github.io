import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import SectionLayout from '../layout/SectionLayout'
import { useContent } from '../../context/ContentContext'
import { slugify } from '../../utils/slugify'

export function LeadershipSection() {
    const { isDark } = useTheme()
    const navigate = useNavigate()
    const { getPostsBySection } = useContent()
    // Filter for published leadership posts
    const leaders = getPostsBySection('leadership')
        .filter(p => p.isPublished)
    const hasContent = leaders.length > 0

    const headerContent = (
        <h1
            style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 700,
                color: '#efc676',
                lineHeight: 1.1,
                margin: 0,
                fontFamily: '"DM Sans", sans-serif',
                letterSpacing: '-0.02em'
            }}
        >
            Our <span style={{ color: '#ff3333' }}>Leaders</span>
        </h1>
    )

    // Helper for rendering leader cards
    const renderLeaderCard = (leader: any) => (
        <div
            key={leader.id}
            id={`card-${slugify(leader.title)}`}
            data-cursor="view"
            className="section-card-shine"
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
                height: '420px', // Slightly taller to accommodate margins
                flexShrink: 0,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                zIndex: 5,
                isolation: 'isolate',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                padding: '24px', // Increased padding for "more margin" around everything
                gap: '20px' // Increased gap between image and text
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)'
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.zIndex = '10'
                const img = e.currentTarget.querySelector('img')
                if (img) img.style.filter = 'grayscale(0%)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.zIndex = '5'
                const img = e.currentTarget.querySelector('img')
                if (img) img.style.filter = 'grayscale(100%)'
            }}
            onClick={() => {
                const slug = slugify(leader.title)
                window.history.replaceState(null, '', `#leadership:${slug}`)
                navigate(`/leader/${slug}`)
            }}
            draggable={false}
        >
            {/* Image - Takes majority of space */}
            <div style={{
                flex: 1,
                width: '100%',
                overflow: 'hidden',
                position: 'relative',
                borderRadius: '12px',
                // Adding a bit of extra "frame" look if needed, but padding handles the margin around the card edge.
                // Depending on "margin around the image", user might mean space between image edge and card edge.
                // The padding: 24px on parent achieves this.
            }}>
                {leader.image ? (
                    <img
                        src={leader.image}
                        alt={leader.title}
                        draggable={false}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'top center',
                            filter: 'grayscale(100%)', // Default to black/white
                            transition: 'filter 0.3s ease' // Smooth transition for color
                        }}
                    />
                ) : (
                    // Fallback placeholder
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.2)'
                    }}>
                        <span>No Image</span>
                    </div>
                )}
            </div>
            {/* Info - Pinned to bottom, Centered */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                justifyContent: 'flex-end',
                alignItems: 'center', // Center text horizontally
                textAlign: 'center'   // Ensure text alignment is centered
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: '#fdedcb',
                    fontFamily: '"DM Sans", sans-serif'
                }}>
                    {leader.title}
                </h3>
                <p style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    color: '#ff3333', // Red color as requested
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    {leader.subtitle}
                </p>
            </div>
        </div>
    )

    return (
        <SectionLayout
            id="leadership"
            header={headerContent}
        >
            {hasContent ? (
                leaders.map(renderLeaderCard)
            ) : (
                <div style={{
                    minWidth: '100%',
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    fontSize: '1.1rem'
                }}>
                    No leaders content available
                </div>
            )}
        </SectionLayout>
    )
}
