import { useState, useRef } from 'react'
import {
  User, Phone, Building2, Activity, Save, CheckCircle, Award,
  Camera, Trash2, Lock, MapPin, Shield, Calendar, ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePortalAuth } from '../context/PortalAuthContext'
import { StatusBadge } from '../components/StatusBadge'
import { UserAvatar } from '../components/UserAvatar'
import { HeroAgeBar } from '../components/AgeBar'
import { ROLE_LABELS } from '../constants'
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

  const displayName = user.full_name || [firstName, middleName, lastName].filter(Boolean).join(' ').trim()
  const isMember = user.role === 'member'
  const canEditProfileDetails = !isMember

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); if (!user || !canEditProfileDetails) return; setError(null); setSuccess(false)
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
    <div className="portal-page">
      <div>
        <h1 className="portal-heading">My Profile</h1>
        <p className="portal-subheading">
          {isMember ? 'View your profile. You can change your photo and password.' : 'View and update your personal information.'}
        </p>
      </div>

      {/* Status messages */}
      {success && <div className="portal-alert portal-alert-success"><CheckCircle size={16} /> <p>Profile updated successfully!</p></div>}
      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      {/* ── Hero card: avatar + identity ── */}
      <div className="portal-profile-hero">
        <div className="portal-profile-hero-accent" />
        <div className="portal-profile-hero-body">
          <div className="portal-profile-hero-avatar-wrap">
            <UserAvatar name={displayName} avatarUrl={avatarUrl} size="xl" />
            <label className="portal-profile-hero-avatar-overlay" aria-label="Change photo">
              <Camera size={20} />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarSelect}
                hidden
              />
            </label>
          </div>
          <div className="portal-profile-hero-info">
            <h2 className="portal-profile-hero-name">{displayName}</h2>
            <div className="portal-profile-hero-role">
              <Shield size={14} />
              <span>{ROLE_LABELS[user.role]}</span>
              <StatusBadge status={user.status} />
            </div>
            <HeroAgeBar dob={user.date_of_birth} />
            <div className="portal-profile-hero-actions">
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
            <p className="portal-profile-hero-hint">JPG, PNG, WebP, or GIF — max 5 MB</p>
          </div>
        </div>
      </div>

      {/* ── Info details grid ── */}
      <div className="portal-profile-details">
        <h3 className="portal-section-title">Personal Information</h3>
        <div className="portal-profile-details-grid">
          <div className="portal-profile-detail-item">
            <div className="portal-profile-detail-icon"><User size={16} /></div>
            <div>
              <span className="portal-profile-detail-label">Full Name</span>
              <span className="portal-profile-detail-value">{displayName}</span>
            </div>
          </div>
          <div className="portal-profile-detail-item">
            <div className="portal-profile-detail-icon"><Phone size={16} /></div>
            <div>
              <span className="portal-profile-detail-label">Phone Number</span>
              <span className="portal-profile-detail-value">{user.phone}</span>
            </div>
          </div>
          {user.unit_name && (
            <div className="portal-profile-detail-item">
              <div className="portal-profile-detail-icon"><Building2 size={16} /></div>
              <div>
                <span className="portal-profile-detail-label">Unit</span>
                <span className="portal-profile-detail-value">{user.unit_name}</span>
              </div>
            </div>
          )}
          <div className="portal-profile-detail-item">
            <div className="portal-profile-detail-icon"><MapPin size={16} /></div>
            <div>
              <span className="portal-profile-detail-label">Zone</span>
              <span className="portal-profile-detail-value">Delhi</span>
            </div>
          </div>
          <div className="portal-profile-detail-item">
            <div className="portal-profile-detail-icon"><Activity size={16} /></div>
            <div>
              <span className="portal-profile-detail-label">Status</span>
              <span className="portal-profile-detail-value portal-profile-detail-value-cap">{user.status}</span>
            </div>
          </div>
          {user.created_at && (
            <div className="portal-profile-detail-item">
              <div className="portal-profile-detail-icon"><Calendar size={16} /></div>
              <div>
                <span className="portal-profile-detail-label">Joined</span>
                <span className="portal-profile-detail-value">{new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          )}
          {user.title && (
            <div className="portal-profile-detail-item portal-profile-detail-title">
              <div className="portal-profile-detail-icon portal-profile-detail-icon-title"><Award size={16} /></div>
              <div>
                <span className="portal-profile-detail-label">Title / Designation</span>
                <span className="portal-profile-detail-value">{user.title}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Password & Security ── */}
      <div className="portal-profile-security">
        <div className="portal-profile-security-left">
          <div className="portal-profile-security-icon"><Lock size={18} /></div>
          <div>
            <h3 className="portal-section-title" style={{ marginBottom: 4 }}>Password &amp; Security</h3>
            <p className="portal-profile-security-desc">Change your login password or set a custom one after your first sign-in.</p>
          </div>
        </div>
        <Link to="/portal/member/account" className="portal-btn portal-btn-secondary portal-btn-sm">
          Manage <ChevronRight size={14} />
        </Link>
      </div>

      {/* ── Editable form (only for non-members) ── */}
      {canEditProfileDetails && (
        <div className="portal-card portal-card-body">
          <h3 className="portal-section-title" style={{ marginBottom: 20 }}>Edit Profile</h3>
          <form onSubmit={handleSave} className="portal-form-stack">
            <div className="portal-form-row">
              <div style={{ flex: 1 }}>
                <label className="portal-label portal-label-icon"><User size={14} /> First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="portal-input" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="portal-label portal-label-icon"><User size={14} /> Middle Name</label>
                <input type="text" value={middleName} onChange={e => setMiddleName(e.target.value)} className="portal-input" placeholder="Optional" />
              </div>
            </div>
            <div className="portal-form-row">
              <div style={{ flex: 1 }}>
                <label className="portal-label portal-label-icon"><User size={14} /> Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="portal-input" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="portal-label portal-label-icon"><Phone size={14} /> Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="portal-input" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="portal-btn portal-btn-primary portal-self-start">
              <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
