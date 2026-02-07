import { useEffect } from 'react'
import { UserProfile } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

/**
 * Clerk's UserProfile — stripped down to Security (password change) only.
 * Uses routing="hash" + useEffect to open Security page directly.
 */
export function MemberAccountPage() {
  useEffect(() => {
    window.location.hash = '/security'
  }, [])

  return (
    <div className="portal-page portal-page-narrow">
      <Link to="/portal/member/profile" className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start">
        <ArrowLeft size={16} /> Back to Profile
      </Link>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Shield size={22} style={{ color: 'var(--p-red)' }} />
          <div>
            <h2 className="portal-heading" style={{ margin: 0 }}>Security</h2>
            <p className="portal-subheading" style={{ margin: 0 }}>Update your password and manage active sessions.</p>
          </div>
        </div>

        <div className="portal-clerk-overrides portal-clerk-security-only">
          <UserProfile
            appearance={{
              baseTheme: dark,
              variables: { colorPrimary: '#ff3b3b', colorBackground: '#0a0a0a' },
              elements: {
                navbarButton__account: { display: 'none' },
                profileSection__profile: { display: 'none' },
                profileSection__username: { display: 'none' },
                profileSection__emailAddresses: { display: 'none' },
                profileSection__phoneNumbers: { display: 'none' },
                profileSection__connectedAccounts: { display: 'none' },
                profileSection__enterpriseAccounts: { display: 'none' },
                profileSection__web3Wallets: { display: 'none' },
                profileSection__danger: { display: 'none' },
                footer: { display: 'none' },
                footerAction: { display: 'none' },
                navbar: { display: 'none' },
                navbarMobileMenuButton: { display: 'none' },
                // Hide Clerk's own "Security" heading since we add our own above
                headerTitle: { display: 'none' },
                headerSubtitle: { display: 'none' },
              },
            }}
            routing="hash"
          />
        </div>
      </div>
    </div>
  )
}
