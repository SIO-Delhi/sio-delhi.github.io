import React from 'react'

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    href?: string
    children: React.ReactNode
    className?: string // For the inner button/link
    containerClassName?: string // For the outer container
    onClick?: (e: React.MouseEvent) => void
}

export const ShinyButton: React.FC<ShinyButtonProps> = ({
    href,
    children,
    className = '',
    containerClassName = '',
    onClick,
    style,
    ...props
}) => {
    // Internal style mimicking the original usage in Navbar
    const internalStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px 24px',
        borderRadius: '100px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        textDecoration: 'none',
        width: '100%',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.3s ease',
        fontSize: '15px', // slightly bumpy for readibility
        fontWeight: 500,
        ...style // Allow overrides
    }

    if (href) {
        return (
            <div className={`shiny-button-container ${containerClassName}`}>
                <a
                    href={href}
                    className={`shiny-button ${className}`}
                    style={internalStyle as React.CSSProperties}
                    onClick={(e) => {
                        if (onClick) onClick(e as any)
                    }}
                >
                    {children}
                </a>
            </div>
        )
    }

    return (
        <div className={`shiny-button-container ${containerClassName}`}>
            <button
                className={`shiny-button ${className}`}
                style={internalStyle}
                onClick={onClick}
                {...props}
            >
                {children}
            </button>
        </div>
    )
}
