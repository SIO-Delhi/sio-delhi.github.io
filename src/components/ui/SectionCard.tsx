import { useRef } from 'react'

interface SectionCardProps {
    label: string
    labelColor: string
    title: string
    subtitle?: string
    description: string
    publishedDate?: string | number
    linkText?: string
    onClick?: () => void
    className?: string
    image?: string
    width?: string
}

// Helper to get the first image URL from an image field (which may be a JSON array or single URL)
const getFirstImageUrl = (imageField: string | undefined): string | undefined => {
    if (!imageField) return undefined
    try {
        const parsed = JSON.parse(imageField)
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0]
        }
        return imageField
    } catch {
        return imageField // It's a plain URL, not JSON
    }
}

export function SectionCard({
    labelColor,
    title,
    description,
    publishedDate,
    onClick,
    className,
    image,
    width
}: SectionCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)

    // Parse image URL (handles JSON array for carousel cover images)
    const imageUrl = getFirstImageUrl(image)

    const formattedDate = publishedDate
        ? new Date(publishedDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).toUpperCase()
        : null



    return (
        <div
            ref={cardRef}
            className={`${className || ''} section-card-shine cursor-view`}
            data-cursor="view"
            onClick={onClick}
            style={{
                background: 'rgba(20, 20, 25, 0.65)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '24px',
                boxSizing: 'border-box',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                height: '420px',
                width: width || '300px',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0,
                isolation: 'isolate',
                zIndex: 5 // Increased base z-index to prevent overlaps
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)' // Stronger white border
                e.currentTarget.style.transform = 'translateY(-4px)'
                // Removed outer white glow, kept existing shadow
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.zIndex = '10' // Bring to front on hover
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.zIndex = '5' // Reset z-index to base value (5)
            }}
        >
            {/* Date Badge */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
            }}>
                <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: labelColor,
                    boxShadow: `0 0 8px ${labelColor}`
                }} />
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: labelColor,
                    letterSpacing: '0.08em'
                }}>
                    {formattedDate}
                </span>
            </div>

            {/* Title */}
            <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                margin: '0 0 12px 0',
                fontFamily: '"Geist", sans-serif',
                lineHeight: 1.2,
                color: '#ffffff',
                letterSpacing: '-0.01em',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            }}>
                {title}
            </h3>

            {/* Description - Truncated */}
            <p style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: '0 0 16px 0',
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            }}>
                {description.replace(/<[^>]+>/g, '')}
            </p>

            {/* Read More Link */}
            {onClick && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '16px',
                    cursor: 'pointer'
                }}>
                    <span>Read More</span>
                    <span style={{
                        color: labelColor,
                        transition: 'transform 0.2s ease'
                    }}>→</span>
                </div>
            )}

            {/* Image at Bottom - Always uniform height */}
            <div style={{
                marginTop: 'auto', // Always pin to bottom
                borderRadius: '10px',
                overflow: 'hidden',
                height: '140px', // Slightly taller for better proportions
                width: '100%',
                flexShrink: 0,
                position: 'relative',
                background: '#1a1a1a', // Dark background for fallback
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: imageUrl ? 'none' : '1px solid rgba(255,255,255,0.05)'
            }}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            display: 'block',
                        }}
                    />
                ) : (
                    // Placeholder pattern
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(45deg, ${labelColor}11 25%, transparent 25%, transparent 75%, ${labelColor}11 75%, ${labelColor}11), linear-gradient(45deg, ${labelColor}11 25%, transparent 25%, transparent 75%, ${labelColor}11 75%, ${labelColor}11)`,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 10px 10px',
                        opacity: 0.3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '4px',
                            borderRadius: '2px',
                            background: labelColor,
                            opacity: 0.2
                        }} />
                    </div>
                )}
            </div>
        </div>
    )
}
