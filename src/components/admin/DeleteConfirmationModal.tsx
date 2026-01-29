import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'

// Styles matching AdminSections.tsx modal
const styles = {
    overlay: {
        position: 'fixed' as const, inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    },
    modal: {
        background: '#09090b',
        border: '1px solid rgba(255, 59, 59, 0.2)',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '480px',
        width: '100%',
        display: 'flex', flexDirection: 'column' as const, gap: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center' as const
    },
    iconWrapper: {
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'rgba(255, 59, 59, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#ff3b3b',
        marginBottom: '16px'
    },
    title: { margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 700, color: '#fff' },
    description: { margin: 0, color: '#a1a1aa', lineHeight: '1.6', fontSize: '0.95rem' },
    inputLabel: { fontSize: '0.85rem', color: '#71717a', fontWeight: 500, marginLeft: '4px', textAlign: 'left' as const, display: 'block', marginBottom: '8px' },
    input: {
        padding: '16px', borderRadius: '12px',
        border: '1px solid #27272a',
        background: '#18181b',
        color: 'white', fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.2s',
        width: '100%',
        boxSizing: 'border-box' as const
    },
    buttonContainer: { display: 'flex', gap: '12px' },
    cancelButton: {
        flex: 1,
        padding: '16px', borderRadius: '12px',
        background: 'transparent', border: '1px solid #27272a', color: '#fff',
        cursor: 'pointer', fontWeight: 600,
        transition: 'all 0.2s'
    },
    deleteButton: {
        flex: 1,
        padding: '16px', borderRadius: '12px',
        border: 'none',
        fontWeight: 600, transition: 'all 0.2s'
    }
}

interface DeleteConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    itemName: string // The text user must type
    title?: string
    description?: string
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    title = "Delete Item",
    description = "This action cannot be undone."
}: DeleteConfirmationModalProps) {
    const [inputValue, setInputValue] = useState('')

    useEffect(() => {
        if (isOpen) {
            setInputValue('')
        }
    }, [isOpen])

    if (!isOpen) return null

    const isMatch = inputValue === itemName

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={styles.iconWrapper}>
                        <Trash2 size={32} />
                    </div>
                    <div>
                        <h2 style={styles.title}>{title}</h2>
                        <p style={styles.description}>
                            {description}
                        </p>
                    </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                    <label style={styles.inputLabel}>
                        Type <span style={{ color: '#ff3b3b', userSelect: 'all' }}>{itemName}</span> to confirm
                    </label>
                    <input
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder={itemName}
                        style={styles.input}
                        onFocus={(e) => e.target.style.borderColor = '#ff3b3b'}
                        onBlur={(e) => e.target.style.borderColor = '#27272a'}
                        autoFocus
                    />
                </div>

                <div style={styles.buttonContainer}>
                    <button
                        onClick={onClose}
                        style={styles.cancelButton}
                        onMouseEnter={e => e.currentTarget.style.background = '#27272a'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!isMatch}
                        style={{
                            ...styles.deleteButton,
                            background: isMatch ? '#ff3b3b' : 'rgba(255, 59, 59, 0.1)',
                            color: isMatch ? 'white' : '#ff3b3b',
                            opacity: isMatch ? 1 : 0.5,
                            cursor: isMatch ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}
