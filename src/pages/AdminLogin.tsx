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
            background: 'radial-gradient(circle at 50% 100%, rgba(220, 38, 38, 0.45) 0%, #000000 75%)',
            backgroundColor: '#000', // Fallback
            fontFamily: '"DM Sans", sans-serif',
            padding: '20px',
        }}>
            {/* Custom Styles for Glossy/Glassy Look */}
            <style>{`
                .cl-card {
                    background: rgba(10, 10, 10, 0.5) !important;
                    backdrop-filter: blur(24px) !important;
                    border: 1px solid rgba(255,255,255,0.08) !important;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4) !important;
                }
                .cl-headerTitle {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                }
                .cl-headerSubtitle {
                    color: #888;
                }
                .cl-footerActionLink {
                    color: #ff3b3b !important;
                }
                .cl-footer {
                    display: none !important;
                }
            `}</style>

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
                            colorBackground: 'transparent', // Let CSS handle it
                            colorInputBackground: '#111',
                            colorInputText: '#fff',
                            colorText: '#fff',
                            colorTextSecondary: '#888',
                            borderRadius: '16px',
                        },
                        elements: {
                            formButtonPrimary: {
                                fontSize: '1rem',
                                textTransform: 'none',
                                fontWeight: 600
                            }
                        }
                    }}
                    forceRedirectUrl="/admin/dashboard"
                />
            </div>
        </div>
    )
}
