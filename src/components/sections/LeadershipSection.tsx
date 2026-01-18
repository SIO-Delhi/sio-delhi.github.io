import { useTheme } from '../../context/ThemeContext'
import SectionLayout from '../layout/SectionLayout'
import { useContent } from '../../context/ContentContext'

export function LeadershipSection() {
    const { isDark } = useTheme()
    const { localLeaders } = useContent()

    const hasContent = localLeaders.length > 0

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
            Our <span style={{ color: '#ff3333' }}>Leaders</span>
        </h1>
    )

    // Helper for rendering leader cards
    const renderLeaderCard = (leader: any) => (
        <div
            key={leader.id}
            style={{
                background: 'rgba(40, 40, 40, 0.6)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minWidth: '260px',
                maxWidth: '280px',
                flexShrink: 0,
                transition: 'all 0.3s ease',
                cursor: 'default'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
            }}
        >
            {/* Image */}
            <div style={{ height: '280px', width: '100%', overflow: 'hidden' }}>
                <img
                    src={leader.image}
                    alt={leader.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
            </div>
            {/* Info */}
            <div style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#ffffff'
                }}>
                    {leader.name}
                </h3>
                <p style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: '#ff3333',
                    fontWeight: 600
                }}>
                    {leader.role}
                </p>
            </div>
        </div>
    )

    return (
        <SectionLayout
            id="leadership"
            header={headerContent}
            subtitle="Meet the team leading SIO Delhi"
        >
            {hasContent ? (
                localLeaders.map(renderLeaderCard)
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
