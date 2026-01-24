import { useRef } from 'react'
import { FileText, Link, Download, ExternalLink, File, Folder, Book, Globe, MapPin, Phone, Mail, Award, Briefcase, Calendar, Clock, Lock, Unlock, Settings, ShoppingBag, ShoppingCart, User, Users, Video, Mic, Music, Layout, Grid, PieChart, BarChart, Heart, Star, Zap, Shield, Flag, Bell, Search, Home, Menu, ArrowRight, ArrowUpRight, CheckCircle, AlertTriangle, Info } from 'lucide-react'

// Icon map for Resource card
const ICON_MAP: Record<string, any> = {
    FileText, Link, Download, ExternalLink, File, Folder, Book, Globe, MapPin, Phone, Mail, Award, Briefcase, Calendar, Clock, Lock, Unlock, Settings, ShoppingBag, ShoppingCart, User, Users, Video, Mic, Music, Layout, Grid, PieChart, BarChart, Heart, Star, Zap, Shield, Flag, Bell, Search, Home, Menu, ArrowRight, ArrowUpRight, CheckCircle, AlertTriangle, Info
}

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
    icon?: string
    width?: string
    variant?: 'default' | 'media' | 'leadership' | 'resource' | 'standard' // 'standard' alias for default
    cardId?: string // Used for DOM ID to enable scroll restoration
}

// Helper to get the first image URL from an image field
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
    subtitle,
    description,
    publishedDate,
    onClick,
    className,
    image,
    icon,
    width,
    variant = 'default',
    cardId
}: SectionCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)

    // Normalize variant
    const currentVariant = variant === 'standard' ? 'default' : variant
    const isMedia = currentVariant === 'media'
    const isLeadership = currentVariant === 'leadership'
    const isResource = currentVariant === 'resource'

    // Parse image URL
    const imageUrl = getFirstImageUrl(image)

    const formattedDate = publishedDate
        ? new Date(publishedDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).toUpperCase()
        : null

    // --- RENDERERS ---

    // 1. Leadership Variant
    if (isLeadership) {
        return (
            <div
                ref={cardRef}
                id={cardId}
                className={`section-card-shine ${className || ''}`}
                data-cursor="view"
                onClick={onClick}
                style={{
                    background: 'rgba(20, 20, 25, 0.65)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    width: width || '300px',
                    height: '420px',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    cursor: onClick ? 'pointer' : 'default',
                    zIndex: 5,
                    isolation: 'isolate',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    padding: '24px',
                    gap: '20px'
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
            >
                {/* Image */}
                <div style={{
                    flex: 1,
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    borderRadius: '12px',
                }}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            draggable={false}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'top center',
                                filter: 'grayscale(100%)',
                                transition: 'filter 0.3s ease'
                            }}
                            loading="lazy"
                        />
                    ) : (
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
                {/* Info */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    textAlign: 'center'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        fontFamily: '"Geist", sans-serif'
                    }}>
                        {title}
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        color: '#ff3333',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        {subtitle || 'LEADER'}
                    </p>
                </div>
            </div>
        )
    }

    // 2. Resource Variant
    if (isResource) {
        const IconComponent = icon && ICON_MAP[icon] ? ICON_MAP[icon] : FileText
        return (
            <div
                ref={cardRef}
                id={cardId}
                className={`section-card-shine ${className || ''}`}
                data-cursor="view"
                onClick={onClick}
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '280px',
                    flex: 1,
                    maxWidth: width || '360px',
                    height: '260px',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    cursor: onClick ? 'pointer' : 'default',
                    zIndex: 5,
                    isolation: 'isolate',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    padding: '24px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '20px',
                    position: 'relative'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ff3333'
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(255, 51, 51, 0.15)'
                    e.currentTarget.style.zIndex = '10'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 51, 51, 0.1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
                    e.currentTarget.style.zIndex = '5'
                }}
            >
                {/* Icon or Logo */}
                <div style={{
                    color: '#ff3333',
                    marginBottom: '8px',
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {icon && (icon.includes('/') || icon.includes('http') || icon.startsWith('data:')) ? (
                        <img
                            src={icon}
                            alt={title}
                            draggable={false}
                            style={{
                                width: '52px',
                                height: '52px',
                                objectFit: 'contain',
                                filter: 'brightness(0) saturate(100%) invert(34%) sepia(84%) saturate(2985%) hue-rotate(342deg) brightness(100%) contrast(103%)'
                            }}
                            loading="lazy"
                        />
                    ) : IconComponent !== FileText ? (
                        <IconComponent size={40} strokeWidth={1.5} />
                    ) : (
                        <FileText size={40} strokeWidth={1.5} />
                    )}
                </div>

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        fontFamily: '"Geist", sans-serif',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {title}
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {subtitle || description?.replace(/<[^>]+>/g, '').substring(0, 100) || 'Resource'}
                    </p>
                </div>
            </div>
        )
    }

    // 3. Default & Media Variants (Shared Structure)
    return (
        <div
            ref={cardRef}
            id={cardId}
            className={`${className || ''} section-card-shine cursor-view`}
            data-cursor="view"
            onClick={onClick}
            style={{
                background: isMedia ? 'rgba(0, 0, 0, 0.4)' : 'rgba(20, 20, 25, 0.65)',
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
                width: '100%',
                maxWidth: width || '300px',
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
            draggable={false}
        >
            {/* Header: Date Badge for Media or Standard Dot */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                marginBottom: isMedia ? '20px' : '12px'
            }}>
                {isMedia ? (
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff3b3b' }} />
                        <span style={{ color: '#000000', fontSize: '0.75rem', fontWeight: 700 }}>
                            {formattedDate}
                        </span>
                    </div>
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
            </div>

            {/* Media Image */}
            {isMedia && (
                <div style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    background: '#1a1a1a',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '20px',
                    border: '1px solid #333'
                }}>
                    {imageUrl ? (
                        <img src={imageUrl} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    ) : (
                        <div style={{ width: '100%', height: '100%', background: '#222' }} />
                    )}
                </div>
            )}

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
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {title}
            </h3>

            {/* Default Layout: Description & Bottom Image */}
            {!isMedia && (
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
                            <img src={imageUrl} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                        ) : (
                            <div style={{ width: '100%', height: '100%', opacity: 0.3 }} />
                        )}
                    </div>
                </>
            )}

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
        </div>
    )
}
