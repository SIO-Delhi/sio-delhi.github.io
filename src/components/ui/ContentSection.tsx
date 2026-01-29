import { type ReactNode } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface ContentSectionProps {
    title?: string
    highlight?: string
    highlightColor?: string
    content: ReactNode
    image?: string
    imageAlt?: string
    imagePosition?: 'left' | 'right'
    children?: ReactNode // For extra elements like buttons
    className?: string
}

export function ContentSection({
    title,
    highlight,
    highlightColor = '#ff3b3b',
    content,
    image,
    imageAlt = '',
    imagePosition = 'right',
    children,
    className
}: ContentSectionProps) {
    const { isDark } = useTheme()

    const isImageLeft = imagePosition === 'left'

    return (
        <div
            className={`section-row ${className || ''}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '60px',
                flexDirection: isImageLeft ? 'row-reverse' : 'row', // Image Left = row-reverse?? No wait.
                // If usage is: Image Left -> Text Right.
                // Row: Text (Left) -> Image (Right).
                // Row-Reverse: Image (Right->Left visual depending on dom order?)
                // Let's stick to explicit flex order or simple row direction based on logic.
                // Actually easiest is just conditionally rendering Order or using flexDirection.
            }}
        >
            {/* Logic check:
               Row: [1] [2]  --> 1 is Left, 2 is Right.
               If we want Image Left, Text Right:
               We should structure DOM based on props? 
               Or use flex-direction: row vs row-reverse.
               
               Let's standardize DOM: Text Element | Image Element
               If imagePosition === 'right' -> flex-direction: row (Text Left, Image Right)
               If imagePosition === 'left' -> flex-direction: row-reverse (Text Right, Image Left) 
               Wait, row-reverse puts 2nd child first.
               So:
               DOM: [Text] [Image]
               Right: row -> [Text] [Image]
               Left: row-reverse -> [Image] [Text] -> Text is on Right.
               Perfect.
            */}

            {/* Text Side (Flex 1) */}
            <div style={{
                flex: 1,
                textAlign: isImageLeft ? 'right' : 'left',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isImageLeft ? 'flex-end' : 'flex-start'
            }}>
                {title && (
                    <>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: 700,
                            color: isDark ? '#fdedcb' : '#000000',
                            marginBottom: '24px',
                            fontFamily: '"DM Sans", sans-serif',
                        }}>
                            {title} <span style={{ color: highlightColor }}>{highlight}</span>
                        </h2>
                        <div style={{
                            width: '60px',
                            height: '4px',
                            background: highlightColor,
                            marginBottom: '32px',
                            borderRadius: '2px'
                        }} />
                    </>
                )}

                <div
                    className={isDark ? "glass-dark" : "glass"}
                    style={{
                        padding: '40px',
                        borderRadius: '32px',
                        textAlign: isImageLeft ? 'left' : 'left', // Text inside card usually looks best left aligned
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Dynamic Gradient Background */}
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        left: '-50%',
                        width: '200%',
                        height: '200%',
                        background: `radial-gradient(circle at center, ${highlightColor}26 0%, transparent 70%)`,
                        pointerEvents: 'none',
                        zIndex: -1
                    }} />
                    <div style={{
                        fontSize: '1.1rem',
                        lineHeight: 1.7,
                        color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        {content}
                    </div>

                    {/* Extra children (buttons) */}
                    {children && (
                        <div style={{ marginTop: '32px' }}>
                            {children}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Side (Flex 1) */}
            {image && (
                <div style={{ flex: 1, pointerEvents: 'none' }}>
                    <div className="section-card-shine" style={{
                        borderRadius: '32px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        aspectRatio: '16/10' // Standard aspect ratio for consistency
                    }}>
                        <img
                            src={image}
                            alt={imageAlt}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
