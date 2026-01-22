import { SignIn } from '@clerk/clerk-react'
import logo from '../assets/logo.png'
import { dark } from '@clerk/themes'

export function AdminLogin() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 100%, rgba(255, 59, 59, 0.2) 0%, #000000 60%)',
            backgroundColor: '#000', // Fallback
            fontFamily: '"Geist", sans-serif',
            padding: '20px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '430px', // Slightly wider for Clerk card
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {/* Custom Header with Logo */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ margin: '0 auto 24px', width: '80px' }}>
                        <img src={logo} alt="SIO Logo" style={{ width: '100%', height: 'auto' }} />
                    </div>
                </div>

                <SignIn
                    appearance={{
                        baseTheme: dark,
                        variables: {
                            colorPrimary: '#ff3b3b',
                            colorBackground: '#0a0a0a',
                            colorInputBackground: '#111',
                            colorInputText: '#fff',
                            colorText: '#fff',
                            colorTextSecondary: '#888',
                            borderRadius: '16px',
                        },
                        elements: {
                            card: {
                                border: '1px solid #222',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                padding: '32px'
                            },
                            headerTitle: { fontSize: '1.5rem', fontWeight: 700 }, // Adjust Clerk's title
                            headerSubtitle: { color: '#888' },
                            formButtonPrimary: {
                                fontSize: '1rem',
                                textTransform: 'none',
                                fontWeight: 600
                            },
                            footerActionLink: { color: '#ff3b3b' },
                            footer: { display: 'none' } // Hide sign up and watermark footer
                        }
                    }}
                    forceRedirectUrl="/admin/dashboard"
                />
            </div>
        </div>
    )
}
