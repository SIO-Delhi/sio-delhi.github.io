import { ArrowUpRight } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'


export function ContactSection() {
    const { isDark } = useTheme()

    return (
        <section
            id="contact"
            style={{
                padding: '120px 0',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                position: 'relative',
                zIndex: 10
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start', // Left align
                    textAlign: 'left', // Left align text
                    gap: '24px', // Reduced gap
                    width: '100%',
                    paddingLeft: '8%', // Match SectionLayout
                    paddingRight: '8%'
                }}
            >
                {/* Header Block */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <span className="animate-up" style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: isDark ? '#fdedcb' : '#000000',
                        opacity: 0.8,
                        marginLeft: '4px' // Subtle alignment correction
                    }}>
                    </span>

                    <h2 className="animate-up" style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', // Matched other sections
                        fontWeight: 700,
                        color: isDark ? '#efc676' : '#111111',
                        margin: 0,
                        lineHeight: 1, // Tighter line height
                        letterSpacing: '-0.02em',
                        fontFamily: '"DM Sans", sans-serif',
                        textShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                        Connect <span style={{ color: '#ff3333' }}>with us</span>
                    </h2>

                    <p className="animate-up" style={{
                        marginTop: '12px',
                        fontSize: '1.2rem',
                        color: isDark ? '#fdedcb' : '#333333',
                        maxWidth: '600px',
                        lineHeight: 1.4, // Reduced line spacing
                        fontWeight: 400,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        Interested in collaborating on research, initiatives, or just want to say salam? We'd love to hear from you.
                    </p>
                </div>

                {/* Email Button */}
                <a
                    href="mailto:zs.del@sio-india.org"
                    className="animate-up group"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: 'clamp(16px, 4vw, 24px) clamp(24px, 6vw, 48px)', // Responsive padding
                        borderRadius: '100px',
                        background: 'rgba(20, 20, 20, 0.6)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#efc676',
                        fontSize: 'clamp(1rem, 4vw, 1.35rem)', // Responsive font size
                        fontWeight: 500,
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        marginTop: '16px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        whiteSpace: 'nowrap', // Prevent line breaking
                        maxWidth: '100%', // Prevent overflow
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.background = 'rgba(30, 30, 30, 0.8)'
                        e.currentTarget.style.borderColor = '#fdedcb'
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.background = 'rgba(20, 20, 20, 0.6)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'
                    }}
                >
                    zs.del@sio-india.org
                    <ArrowUpRight size={24} />
                </a>

                {/* Social Links */}
                {/* Social Links Removed */}
            </div >
        </section >
    )
}
