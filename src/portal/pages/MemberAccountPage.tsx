import { UserProfile } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Clerk's UserProfile component: account settings, security, and change password.
 * Linked from MemberProfilePage so users can set a custom password after first login.
 */
export function MemberAccountPage() {
  return (
    <div className="portal-page portal-page-narrow">
      <Link to="/portal/member/profile" className="portal-btn portal-btn-ghost portal-btn-sm portal-self-start">
        <ArrowLeft size={16} /> Back to Profile
      </Link>
      <div className="portal-clerk-overrides" style={{ marginTop: 16 }}>
        <UserProfile
          appearance={{
            baseTheme: dark,
            variables: { colorPrimary: '#ff3b3b', colorBackground: '#0a0a0a' },
          }}
          routing="path"
          path="/portal/member/account"
        />
      </div>
    </div>
  )
}
