import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
    message: string
    type?: ToastType
    duration?: number
    onDismiss: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onDismiss }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Small delay to trigger entry animation
        requestAnimationFrame(() => setIsVisible(true))

        const timer = setTimeout(() => {
            setIsVisible(false)
            // Wait for exit animation to finish before unmounting
            setTimeout(onDismiss, 300)
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onDismiss])

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
    }
    const Icon = icons[type]

    // "Modal-like" styling for success: Centered, larger, green solid background?
    // User asked for "green color" and "like a modal".
    // Let's go with a solid green card if success.

    const isSuccess = type === 'success'

    return (
        <div
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${isVisible ? 1 : 0.9})`,
                opacity: isVisible ? 1 : 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '32px 48px',
                backgroundColor: isSuccess ? '#059669' : '#18181b', // emerald-600 for success
                border: isSuccess ? 'none' : '1px solid #27272a',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '1.125rem',
                transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: 'auto',
                minWidth: '300px',
                textAlign: 'center',
            }}
        >
            <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                padding: '12px',
                marginBottom: '4px'
            }}>
                <Icon size={32} style={{ color: '#fff' }} />
            </div>
            <span>{message}</span>
            <button
                onClick={() => {
                    setIsVisible(false)
                    setTimeout(onDismiss, 300)
                }}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <X size={20} />
            </button>
        </div>
    )
}
