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
    variant?: 'default' | 'media'
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
    label,
    labelColor,
    title,
    description,
    publishedDate,
    onClick,
    className,
    image,
    width,
    variant = 'default'
}: SectionCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)

    // Parse image URL
    const imageUrl = getFirstImageUrl(image)

    const formattedDate = publishedDate
        ? new Date(publishedDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).toUpperCase()
        : null

    const isMedia = variant === 'media'

    return (
        <div
            ref={cardRef}
            className={`${className || ''} section-card-shine cursor-view`}
            data-cursor="view"
            onClick={onClick}
            style={{
                background: isMedia ? 'rgba(0, 0, 0, 0.4)' : 'rgba(20, 20, 25, 0.65)', // Glassy dark for media
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: isMedia ? '2px solid #ff3b3b' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: isMedia ? '24px' : '16px',
                padding: '24px',
                boxSizing: 'border-box',
                boxShadow: isMedia
                    ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                    : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
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
                zIndex: 5
            }}
            onMouseEnter={(e) => {
                if (isMedia) {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(255, 59, 59, 0.15)'
                } else {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)'
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.zIndex = '10'
                }
            }}
            onMouseLeave={(e) => {
                if (isMedia) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)'
                } else {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.zIndex = '5'
                }
            }}
        >
            {/* Header: Date Badge for Media (Top Left Pill) or Standard Dot */}
            < div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMedia ? 'flex-start' : 'flex-start',
                marginBottom: isMedia ? '20px' : '12px'
            }}>
                {
                    isMedia ? (
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }} >
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff3b3b' }} />
                            <span style={{ color: '#000000', fontSize: '0.75rem', fontWeight: 700 }}>
                                {formattedDate}
                            </span>
                        </div >
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: labelColor, boxShadow: `0 0 8px ${labelColor}`
                            }} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: labelColor, letterSpacing: '0.08em' }}>
                                {formattedDate}
                            </span>
                        </div>
                    )}
            </div >

            {/* Media Image (Middle Square) */}
            {
                isMedia && (
                    <div style={{
                        width: '100%',
                        aspectRatio: '1/1',
                        background: '#1a1a1a',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '20px',
                        border: '1px solid #333'
                    }}>
                        {imageUrl ? (
                            <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', background: '#222' }} />
                        )}
                    </div>
                )
            }

            {/* Title */}
            <h3 style={{
                fontSize: isMedia ? '1.75rem' : '1.5rem',
                fontWeight: 700,
                margin: '0 0 12px 0',
                fontFamily: '"Geist", sans-serif',
                lineHeight: 1.1,
                color: isMedia ? '#ff3b3b' : '#ffffff',
                letterSpacing: '-0.02em',
                display: '-webkit-box',
                WebkitLineClamp: isMedia ? 2 : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {title}
            </h3>

            {/* Default Layout: Description & Bottom Image */}
            {
                !isMedia && (
                    <>
                        <p style={{
                            fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', margin: '0 0 16px 0',
                            lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                            {description.replace(/<[^>]+>/g, '')}
                        </p>

                        {onClick && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '16px', cursor: 'pointer' }}>
                                <span>Read More</span>
                                <span style={{ color: labelColor, transition: 'transform 0.2s ease' }}>→</span>
                            </div>
                        )}

                        <div style={{
                            marginTop: 'auto', borderRadius: '10px', overflow: 'hidden', height: '140px', width: '100%',
                            flexShrink: 0, position: 'relative', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: imageUrl ? 'none' : '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {imageUrl ? (
                                <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', opacity: 0.3 }} />
                            )}
                        </div>
                    </>
                )
            }

            {/* Media Layout: Description at bottom */}
            {isMedia && (
                <div style={{ position: 'relative' }}>
                    <p style={{
                        fontSize: '0.85rem', color: '#ffffff', margin: '0 0 4px 0',
                        lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        fontFamily: '"Geist", sans-serif',
                        textOverflow: 'ellipsis'
                    }}>
                        {description.replace(/<[^>]+>/g, '')}
                    </p>
                    <span style={{
                        fontSize: '0.75rem', fontWeight: 700, color: '#ff3b3b',
                        textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer'
                    }}>
                        Read More
                    </span>
                </div>
            )}
        </div >
    )
}
