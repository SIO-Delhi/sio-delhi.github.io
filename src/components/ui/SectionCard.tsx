

interface SectionCardProps {
    label: string
    labelColor: string
    title: string
    subtitle: string
    description: string
    publishedDate?: string | number // New: publication date
    linkText?: string
    onClick?: () => void
    className?: string
    image?: string
}

export function SectionCard({
    label,
    labelColor,
    title,
    subtitle,
    description,
    publishedDate,
    linkText,
    onClick,
    className,
    image
}: SectionCardProps) {
    const formattedDate = publishedDate
        ? new Date(publishedDate).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
        : null

    return (
        <div
            className={`${className || ''} section-card-shine`}
            data-cursor={onClick ? "view" : undefined}
            onClick={onClick}
            style={{
                background: 'rgba(80, 80, 80, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '24px',
                boxSizing: 'border-box',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                height: '520px',
                width: '360px',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                position: 'relative',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
        >
            {/* Top: Label with date */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
            }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: labelColor,
                    boxShadow: `0 0 8px ${labelColor}`
                }} />
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: labelColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    {formattedDate || label}
                </span>
            </div>

            {/* Title - Large and bold */}
            <h3 style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                margin: '0 0 16px 0',
                fontFamily: '"Geist", sans-serif',
                lineHeight: 1.1,
                color: '#ffffff',
                letterSpacing: '-0.02em',
            }}>
                {title}
            </h3>

            {/* Description */}
            <p style={{
                fontSize: '0.95rem',
                color: 'rgba(255, 255, 255, 0.7)',
                margin: '0 0 auto 0',
                lineHeight: 1.6,
                fontStyle: 'italic',
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
            }}>
                {description || subtitle}
            </p>

            {/* Image at Bottom */}
            {image && (
                <div style={{
                    marginTop: '20px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    height: '180px',
                    flexShrink: 0,
                }}>
                    <img
                        src={image}
                        alt=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                        }}
                    />
                </div>
            )}

            {/* Link text if provided */}
            {linkText && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    marginTop: '16px',
                }}>
                    <span style={{
                        color: labelColor,
                        filter: `drop-shadow(0 0 4px ${labelColor}60)`
                    }}>→</span>
                    {linkText}
                </div>
            )}
        </div>
    )
}

