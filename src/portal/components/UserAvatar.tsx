interface UserAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function UserAvatar({ name, avatarUrl, size = 'md', className = '' }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase()
  const cls = `portal-avatar portal-avatar-${size} ${className}`.trim()

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={cls} />
  }

  return <div className={cls}>{initial}</div>
}
