import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                background: isDark ? 'rgba(30, 30, 32, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '50%',
                color: isDark ? '#fdedcb' : '#111111',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isDark
                    ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                    : '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
            }}
            aria-label="Toggle theme"
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    )
}
