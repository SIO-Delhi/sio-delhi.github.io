import React from 'react'
import { Undo2, Redo2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

interface UndoRedoGroupProps {
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean
    className?: string
    style?: React.CSSProperties
    variant?: 'glass' | 'solid'
}

export const UndoRedoGroup: React.FC<UndoRedoGroupProps> = ({
    undo,
    redo,
    canUndo,
    canRedo,
    className = '',
    style = {},
    variant = 'glass'
}) => {
    const { isDark } = useTheme()

    const baseContainerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        borderRadius: '24px',
        padding: '4px',
        zIndex: 100,
        ...style
    }

    const glassStyle: React.CSSProperties = {
        background: isDark ? 'rgba(25, 25, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: `0 4px 12px rgba(0,0,0,0.15), inset 0 1px 1px ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)'}`
    }

    const solidStyle: React.CSSProperties = {
        background: isDark ? '#18181b' : '#f4f4f5',
        border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`
    }

    const containerStyle = {
        ...baseContainerStyle,
        ...(variant === 'glass' ? glassStyle : solidStyle)
    }

    const dividerStyle: React.CSSProperties = {
        width: '1px',
        height: '18px',
        background: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
        margin: '0 2px'
    }

    const buttonBaseStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minWidth: '90px',
        height: '36px',
        borderRadius: '20px',
        padding: '0 12px',
        transition: 'all 0.2s ease',
        border: 'none',
        background: 'transparent',
    }

    const renderButton = (action: () => void, enabled: boolean, isUndo: boolean) => {
        const color = enabled
            ? (isDark ? 'white' : '#18181b')
            : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)')

        const cursor = enabled ? 'pointer' : 'not-allowed'

        return (
            <button
                onClick={action}
                disabled={!enabled}
                title={`${isUndo ? 'Undo' : 'Redo'} (${isUndo ? 'Ctrl+Z' : 'Ctrl+Y'})`}
                style={{
                    ...buttonBaseStyle,
                    color,
                    cursor,
                }}
                className={`group ${enabled ? 'active:scale-95' : ''}`}
                onMouseOver={(e) => {
                    if (enabled) {
                        e.currentTarget.style.backgroundColor = isDark
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.05)'
                    }
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                }}
            >
                {isUndo ? (
                    <>
                        <Undo2 size={15} strokeWidth={2.5} style={{ display: 'block' }} />
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'block',
                            lineHeight: '1'
                        }}>Undo</span>
                    </>
                ) : (
                    <>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'block',
                            lineHeight: '1'
                        }}>Redo</span>
                        <Redo2 size={15} strokeWidth={2.5} style={{ display: 'block' }} />
                    </>
                )}
            </button>
        )
    }

    return (
        <div className={`undo-redo-group ${className}`} style={containerStyle}>
            {renderButton(undo, canUndo, true)}
            <div style={dividerStyle} />
            {renderButton(redo, canRedo, false)}
        </div>
    )
}
