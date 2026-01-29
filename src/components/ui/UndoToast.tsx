import { useEffect, useState, useRef } from 'react'
import { Undo } from 'lucide-react'

interface UndoToastProps {
    message: string
    seconds: number
    onUndo: () => void
    onDismiss?: () => void // Called when time expires (optional visual dismissal)
}

export function UndoToast({ message, seconds, onUndo }: UndoToastProps) {
    const [timeLeft, setTimeLeft] = useState(seconds)
    const progressRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setTimeLeft(seconds)

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [seconds])

    // Percentage for progress bar (inverse logic: 100% -> 0%)
    const percentage = (timeLeft / seconds) * 100

    return (
        <div style={{
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            background: '#09090b',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '0', // Padding handled by internal layout for progress bar
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: '300px'
        }}>
            <div style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px'
            }}>
                <span style={{ color: 'white', fontWeight: 500, fontSize: '0.95rem' }}>
                    {message}
                </span>

                <button
                    onClick={onUndo}
                    style={{
                        background: '#ff3b3b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <Undo size={14} />
                    Undo ({timeLeft}s)
                </button>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '3px', background: '#27272a' }}>
                <div
                    ref={progressRef}
                    style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: '#ff3b3b',
                        transition: 'width 1s linear' // Smooth transition matching the timer tick
                    }}
                />
            </div>
        </div>
    )
}
