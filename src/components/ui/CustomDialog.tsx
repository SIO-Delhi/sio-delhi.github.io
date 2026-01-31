import { useRef, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react'

interface CustomDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm?: () => void
    title: string
    message: string
    type?: 'info' | 'confirm' | 'warning' | 'success'
    confirmText?: string
    cancelText?: string
}

export function CustomDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
}: CustomDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'auto'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={24} color="#10b981" />
            case 'warning': return <AlertCircle size={24} color="#f59e0b" />
            case 'confirm': return <HelpCircle size={24} color="#a78bfa" />
            default: return <AlertCircle size={24} color="#3b82f6" />
        }
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div
                ref={dialogRef}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                    position: 'relative',
                    animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        color: '#71717a',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                        {getIcon()}
                    </div>
                    <div>
                        <h3 style={{
                            margin: 0,
                            color: 'white',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            marginBottom: '6px'
                        }}>
                            {title}
                        </h3>
                        <p style={{
                            margin: 0,
                            color: '#a1a1aa',
                            fontSize: '0.9rem',
                            lineHeight: 1.5
                        }}>
                            {message}
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    marginTop: '24px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            background: '#27272a',
                            border: 'none',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        {cancelText}
                    </button>
                    {type !== 'info' && (
                        <button
                            onClick={() => {
                                onConfirm?.()
                                onClose()
                            }}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '8px',
                                background: type === 'warning' ? '#ef4444' : '#a78bfa',
                                border: 'none',
                                color: 'white',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'opacity 0.2s'
                            }}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
