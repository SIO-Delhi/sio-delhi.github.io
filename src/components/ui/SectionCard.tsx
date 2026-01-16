

interface SectionCardProps {
    label: string
    labelColor: string
    title: string
    subtitle: string
    description: string
    startLabel?: string
    startValue?: string
    endLabel?: string
    endValue?: string
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
    startLabel,
    startValue,
    endLabel,
    endValue,
    linkText,
    onClick,
    className,
    image
}: SectionCardProps) {
    return (
        <div
            className={`${className || ''} section-card-shine`}
            data-cursor={onClick ? "view" : undefined}
            onClick={onClick}
            style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '0',
                boxSizing: 'border-box',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                height: '520px',
                width: '420px',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                position: 'relative',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ffffff'
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = '0 16px 56px rgba(255, 255, 255, 0.12)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
        >
            {/* Image Section - Top ~70% */}
            {image && (
                <div style={{
                    flex: '3',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '68%',
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
                    {/* Gradient overlay at bottom for smooth blend into text */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(to top, rgba(30, 30, 30, 1) 0%, rgba(30, 30, 30, 0.8) 30%, transparent 100%)',
                        pointerEvents: 'none',
                    }} />
                    {/* Color accent at top edge */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: labelColor,
                        pointerEvents: 'none',
                    }} />
                    {/* Label badge overlay */}
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(8px)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${labelColor}40`,
                    }}>
                        <div style={{
                            width: '4px',
                            height: '14px',
                            background: labelColor,
                            borderRadius: '2px',
                        }} />
                        <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: labelColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em'
                        }}>
                            {label}
                        </span>
                    </div>
                </div>
            )}

            {/* Text Content Section - Bottom ~30% */}
            <div style={{
                flex: image ? '1' : '1',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: image ? 'transparent' : 'none',
                position: 'relative',
                zIndex: 2,
            }}>
                {/* If no image, show label here */}
                {!image && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{
                            width: '4px',
                            height: '18px',
                            background: labelColor,
                            borderRadius: '2px',
                            boxShadow: `0 0 12px ${labelColor}60`
                        }} />
                        <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: labelColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em'
                        }}>
                            {label}
                        </span>
                    </div>
                )}

                {/* Main content row - Title/Description left, Stats right */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                    flex: 1,
                }}>
                    {/* Left side - Title & Description */}
                    <div style={{ flex: '1', minWidth: 0 }}>
                        <h3 style={{
                            fontSize: '1.4rem',
                            fontWeight: 800,
                            margin: 0,
                            fontFamily: '"Geist", sans-serif',
                            lineHeight: 1.1,
                            textTransform: 'uppercase',
                            color: '#ffffff',
                            letterSpacing: '-0.02em',
                        }}>
                            {title}
                        </h3>
                        <span style={{
                            fontSize: '0.9rem',
                            fontWeight: 300,
                            color: 'rgba(255, 255, 255, 0.8)',
                            textTransform: 'uppercase',
                            display: 'block',
                            marginTop: '2px'
                        }}>
                            {subtitle}
                        </span>
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            margin: '6px 0 0 0',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}>
                            {description}
                        </p>
                    </div>

                    {/* Right side - Stats */}
                    {(startLabel || endLabel) && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            textAlign: 'right',
                            flexShrink: 0,
                        }}>
                            {startLabel && (
                                <div>
                                    <span style={{
                                        display: 'block',
                                        fontSize: '0.55rem',
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        textTransform: 'uppercase',
                                        marginBottom: '1px',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {startLabel}
                                    </span>
                                    <span style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: '#ffffff'
                                    }}>
                                        {startValue}
                                    </span>
                                </div>
                            )}
                            {endLabel && (
                                <div>
                                    <span style={{
                                        display: 'block',
                                        fontSize: '0.55rem',
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        textTransform: 'uppercase',
                                        marginBottom: '1px',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {endLabel}
                                    </span>
                                    <span style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: '#ffffff'
                                    }}>
                                        {endValue}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Link at bottom - only show if linkText is provided */}
                {linkText && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        marginTop: '8px',
                    }}>
                        <span style={{
                            color: labelColor,
                            filter: `drop-shadow(0 0 4px ${labelColor}60)`
                        }}>✓</span>
                        {linkText}
                    </div>
                )}
            </div>
        </div>
    )
}
