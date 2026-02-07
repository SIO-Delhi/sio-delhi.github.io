import { useState, useRef } from 'react'
import { User, Phone, Building2, Activity, Save, CheckCircle, Award, Camera, Trash2, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePortalAuth } from '../context/PortalAuthContext'
import { StatusBadge } from '../components/StatusBadge'
import { UserAvatar } from '../components/UserAvatar'
import * as api from '../api'

export function MemberProfilePage() {
  const { user } = usePortalAuth()
  const [firstName, setFirstName] = useState(user ? user.first_name : '')
  const [middleName, setMiddleName] = useState(user ? (user.middle_name ?? '') : '')
  const [lastName, setLastName] = useState(user ? user.last_name : '')
  const [phone, setPhone] = useState(user ? user.phone : '')
  const [avatarUrl, setAvatarUrl] = useState(user ? user.avatar_url : null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const displayName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim() || user.full_name

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); if (!user) return; setError(null); setSuccess(false)
    if (!firstName.trim()) { setError('First name is required.'); return }
    if (!lastName.trim()) { setError('Last name is required.'); return }
    if (!phone.trim()) { setError('Phone number is required.'); return }
    setSaving(true)
    try {
      await api.updateUser(user.id, {
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
        phone: phone.trim(),
      })
      setSuccess(true)
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed.') }
    finally { setSaving(false) }
  }

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type & size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) { setError('Please upload a JPG, PNG, WebP, or GIF image.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be smaller than 5 MB.'); return }

    setUploading(true); setError(null); setSuccess(false)
    try {
      const url = await api.uploadAvatar(user.id, file)
      setAvatarUrl(url)
      user.avatar_url = url
      setSuccess(true)
    } catch (err) { setError(err instanceof Error ? err.message : 'Upload failed.') }
    finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveAvatar() {
    if (!user) return
    setUploading(true); setError(null)
    try {
      await api.removeAvatar(user.id)
      setAvatarUrl(null)
      user.avatar_url = null
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to remove photo.') }
    finally { setUploading(false) }
  }

  return (
    <div className="portal-page portal-page-narrow">
      <div>
        <h1 className="portal-heading">My Profile</h1>
        <p className="portal-subheading">View and update your personal information.</p>
      </div>

      <div className="portal-card portal-card-body">
        {/* Avatar + name */}
        <div className="portal-profile-header">
          <div className="portal-profile-avatar-wrap">
            <UserAvatar name={displayName} avatarUrl={avatarUrl} size="xl" />
            <label className="portal-profile-avatar-upload" aria-label="Change photo">
              <Camera size={22} />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarSelect}
                hidden
              />
            </label>
          </div>
          <div>
            <h2 className="portal-profile-name">{displayName}</h2>
            <div className="portal-profile-contact">
              <span className="portal-profile-contact-phone">{user.phone}</span>
              <StatusBadge status={user.status} />
            </div>
            <div className="portal-profile-avatar-actions">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="portal-btn portal-btn-ghost portal-btn-sm"
              >
                <Camera size={14} /> {uploading ? 'Uploading…' : 'Change Photo'}
              </button>
              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                  className="portal-btn portal-btn-ghost portal-btn-sm portal-text-red"
                >
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
            <p className="portal-profile-avatar-hint">JPG, PNG, WebP, or GIF — max 5 MB</p>
          </div>
        </div>

        {/* Info grid */}
        <div className="portal-grid-info portal-mb-6">
          <div className="portal-card-inset portal-profile-info-item">
            <Building2 size={18} className="portal-profile-info-icon" />
            <div>
              <p className="portal-profile-info-label">Unit</p>
              <p className="portal-profile-info-value">{user.unit_name ?? '—'}</p>
            </div>
          </div>
          <div className="portal-card-inset portal-profile-info-item">
            <Activity size={18} className="portal-profile-info-icon" />
            <div>
              <p className="portal-profile-info-label">Status</p>
              <p className="portal-profile-info-value portal-profile-info-value-cap">{user.status}</p>
            </div>
          </div>
          {user.title && (
            <div className="portal-card-inset portal-profile-info-item portal-profile-title-item">
              <Award size={18} className="portal-profile-title-icon" />
              <div>
                <p className="portal-profile-title-label">Title / Designation</p>
                <p className="portal-profile-title-value">{user.title}</p>
              </div>
            </div>
          )}
        </div>

        {/* Change password */}
        <div className="portal-card-inset portal-mb-6" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Lock size={20} className="portal-profile-info-icon" />
            <div>
              <p className="portal-profile-info-label">Password</p>
              <p className="portal-profile-info-value" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                Change your login password (set a custom one after first sign-in)
              </p>
            </div>
          </div>
          <Link to="/portal/member/account" className="portal-btn portal-btn-secondary portal-btn-sm">
            Account settings &amp; password
          </Link>
        </div>

        {/* Status messages */}
        {success && <div className="portal-alert portal-alert-success portal-mb-4"><CheckCircle size={16} /> <p>Profile updated successfully!</p></div>}
        {error && <div className="portal-alert portal-alert-error portal-mb-4">{error}</div>}

        {/* Editable form */}
        <form onSubmit={handleSave} className="portal-form-stack">
          <div>
            <label className="portal-label portal-label-icon"><User size={14} /> First Name</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="portal-input" />
          </div>
          <div>
            <label className="portal-label portal-label-icon"><User size={14} /> Middle Name</label>
            <input type="text" value={middleName} onChange={e => setMiddleName(e.target.value)} className="portal-input" placeholder="Optional" />
          </div>
          <div>
            <label className="portal-label portal-label-icon"><User size={14} /> Last Name</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="portal-input" />
          </div>
          <div>
            <label className="portal-label portal-label-icon"><Phone size={14} /> Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="portal-input" />
          </div>
          <button type="submit" disabled={saving} className="portal-btn portal-btn-primary portal-self-start">
            <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
