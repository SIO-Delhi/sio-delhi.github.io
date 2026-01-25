import React from 'react'
import { Link } from 'react-router-dom'
import { Grid, Images } from 'lucide-react'

export type GalleryButtonVariant = 'default' | 'outline' | 'pill' | 'card'

interface ViewGalleryButtonProps {
    to: string
    isDark: boolean
    variant?: GalleryButtonVariant
    className?: string
    style?: React.CSSProperties
}

export const ViewGalleryButton = ({ to, isDark, variant = 'default', className, style }: ViewGalleryButtonProps) => {

    // Default Style (Big Round Pill - Standard Post)
    let baseStyle: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: '12px 24px', borderRadius: '100px',
        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        color: isDark ? 'white' : 'black',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
        transition: 'all 0.2s',
        ...style
    }

    // Outline Style (Small Red Outline - Subsections)
    if (variant === 'outline') {
        baseStyle = {
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '8px',
            background: 'transparent',
            color: '#ff3b3b',
            border: '1px solid #ff3b3b',
            cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            transition: 'all 0.2s',
            ...style
        }
    }

    // Pill Style (Small Pill - Leadership)
    if (variant === 'pill') {
        baseStyle = {
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '100px',
            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: isDark ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
            transition: 'all 0.2s',
            ...style
        }
    }

    // Card Style (Rectangle - Media)
    if (variant === 'card') {
        baseStyle = {
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '12px 24px', borderRadius: '12px',
            background: '#1a1a1a',
            color: 'white',
            border: '1px solid #333',
            cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            ...style
        }
    }

    const Icon = variant === 'pill' ? Images : Grid
    const text = variant === 'pill' ? 'Photos' : (variant === 'card' ? 'View Photo Gallery' : 'View Gallery')

    return (
        <Link
            to={to}
            style={{ ...baseStyle, textDecoration: 'none' }}
            className={`view-gallery-btn-${variant} ${className || ''}`}
            onMouseEnter={e => {
                if (variant === 'outline') {
                    e.currentTarget.style.background = '#ff3b3b';
                    e.currentTarget.style.color = 'white';
                } else if (variant === 'card') {
                    e.currentTarget.style.borderColor = '#ff3b3b';
                    e.currentTarget.style.color = '#ff3b3b';
                } else {
                    e.currentTarget.style.background = '#ff3b3b';
                    e.currentTarget.style.color = 'white';
                    if (variant !== 'pill') e.currentTarget.style.borderColor = '#ff3b3b';
                }
            }}
            onMouseLeave={e => {
                if (variant === 'outline') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#ff3b3b';
                } else if (variant === 'card') {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.color = 'white';
                } else if (variant === 'pill') {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                    e.currentTarget.style.color = isDark ? 'white' : 'black';
                } else {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                    e.currentTarget.style.color = isDark ? 'white' : 'black';
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                }
            }}
        >
            <Icon size={variant === 'pill' || variant === 'outline' ? 16 : 18} color="#ff3b3b" /> {text}
        </Link>
    )
}
