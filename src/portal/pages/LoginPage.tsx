import { SignIn, useAuth } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import { dark } from '@clerk/themes'
import logo from '../../assets/logo.svg'

export function LoginPage() {
  const { isSignedIn, isLoaded } = useAuth()
  if (isLoaded && isSignedIn) return <Navigate to="/portal" replace />

  return (
    <div className="portal-app portal-login-bg portal-clerk-overrides">
      <div className="portal-login-wrapper">
        <div className="portal-login-logo">
          <img src={logo} alt="SIO Delhi" />
        </div>

        <SignIn
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#ff3b3b',
              colorBackground: 'transparent',
              colorInputBackground: '#111',
              colorInputText: '#fff',
              colorText: '#fff',
              colorTextSecondary: '#888',
              borderRadius: '16px',
            },
            elements: {
              formButtonPrimary: {
                fontSize: '1rem',
                textTransform: 'none' as const,
                fontWeight: 600,
              },
            },
          }}
          forceRedirectUrl="/portal"
        />
      </div>
    </div>
  )
}
