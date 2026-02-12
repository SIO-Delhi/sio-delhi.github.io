import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  canUser,
  getDefaultColorForLevel,
  getTitleBadgeColorClass,
  ROLE_LABELS,
  ROLE_DASHBOARD_PATHS,
  ROLE_PERMISSIONS,
  ALL_PERMISSIONS,
  NAV_CONFIG,
  ENTITY_LABELS,
  STATUS_COLORS,
  TITLE_BADGE_COLORS,
} from '../constants'
import type { PortalRole } from '../types'

describe('hasPermission', () => {
  it('returns true for admin with any permission', () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(hasPermission('admin', perm)).toBe(true)
    }
  })

  it('returns false for member with admin permissions', () => {
    expect(hasPermission('member', 'manage_users')).toBe(false)
    expect(hasPermission('member', 'manage_units')).toBe(false)
  })

  it('returns true for unit_president with expected permissions', () => {
    expect(hasPermission('unit_president', 'view_all_users')).toBe(true)
    expect(hasPermission('unit_president', 'send_messages')).toBe(true)
    expect(hasPermission('unit_president', 'assign_titles')).toBe(true)
  })

  it('returns false for unit_president with admin-only permissions', () => {
    expect(hasPermission('unit_president', 'manage_units')).toBe(false)
    expect(hasPermission('unit_president', 'manage_users')).toBe(false)
  })
})

describe('canUser', () => {
  it('returns role default when no overrides', () => {
    expect(canUser('member', 'send_messages')).toBe(hasPermission('member', 'send_messages'))
    expect(canUser('admin', 'manage_users')).toBe(true)
  })

  it('respects overrides that grant permission', () => {
    expect(canUser('member', 'manage_users', { manage_users: true })).toBe(true)
  })

  it('respects overrides that deny permission', () => {
    expect(canUser('admin', 'manage_users', { manage_users: false })).toBe(false)
  })

  it('falls back to role when override is null', () => {
    expect(canUser('admin', 'manage_users', null)).toBe(true)
  })

  it('falls back to role when override key is missing', () => {
    expect(canUser('admin', 'manage_users', { send_messages: false })).toBe(true)
  })
})

describe('getDefaultColorForLevel', () => {
  it('returns green for regional', () => {
    expect(getDefaultColorForLevel('regional', 'Regional President')).toBe('green')
  })

  it('returns magenta for campus', () => {
    expect(getDefaultColorForLevel('campus', 'Campus President')).toBe('magenta')
  })

  it('returns gold for zonal', () => {
    expect(getDefaultColorForLevel('zonal', 'Zonal Secretary')).toBe('gold')
  })

  it('returns red for unit president', () => {
    expect(getDefaultColorForLevel('unit', 'Unit President')).toBe('red')
  })

  it('returns silver for unit secretary', () => {
    expect(getDefaultColorForLevel('unit', 'Unit Secretary')).toBe('silver')
  })

  it('returns blue for other unit titles', () => {
    expect(getDefaultColorForLevel('unit', 'Treasurer')).toBe('blue')
  })

  it('returns empty string for unknown level', () => {
    expect(getDefaultColorForLevel('unknown', 'Something')).toBe('')
  })
})

describe('getTitleBadgeColorClass', () => {
  it('uses titleColor when valid', () => {
    expect(getTitleBadgeColorClass('Unit President', 'gold')).toBe('gold')
  })

  it('ignores invalid titleColor', () => {
    const result = getTitleBadgeColorClass('Unit President', 'neon')
    expect(result).toBe('red')
  })

  it('returns red for unit president text', () => {
    expect(getTitleBadgeColorClass('Unit President', null)).toBe('red')
  })

  it('returns green for regional president text', () => {
    expect(getTitleBadgeColorClass('Regional President', null)).toBe('green')
  })

  it('returns blue for unrecognized title', () => {
    expect(getTitleBadgeColorClass('Custom Title XYZ', null)).toBe('blue')
  })

  it('handles null/undefined displayTitle', () => {
    expect(getTitleBadgeColorClass(null, null)).toBe('blue')
    expect(getTitleBadgeColorClass(undefined, undefined)).toBe('blue')
  })
})

describe('constants integrity', () => {
  const roles: PortalRole[] = ['admin', 'zonal_secretary', 'regional_president', 'unit_president', 'campus_president', 'member']

  it('ROLE_LABELS has entries for all roles', () => {
    for (const role of roles) {
      expect(ROLE_LABELS[role]).toBeDefined()
      expect(typeof ROLE_LABELS[role]).toBe('string')
    }
  })

  it('ROLE_DASHBOARD_PATHS has entries for all roles', () => {
    for (const role of roles) {
      expect(ROLE_DASHBOARD_PATHS[role]).toBeDefined()
      expect(ROLE_DASHBOARD_PATHS[role]).toMatch(/^\/portal\//)
    }
  })

  it('ROLE_PERMISSIONS has entries for all roles', () => {
    for (const role of roles) {
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true)
    }
  })

  it('admin has the most permissions', () => {
    const adminPerms = ROLE_PERMISSIONS.admin.length
    for (const role of roles) {
      expect(ROLE_PERMISSIONS[role].length).toBeLessThanOrEqual(adminPerms)
    }
  })

  it('NAV_CONFIG has entries for all roles', () => {
    for (const role of roles) {
      expect(Array.isArray(NAV_CONFIG[role])).toBe(true)
      expect(NAV_CONFIG[role].length).toBeGreaterThan(0)
    }
  })

  it('ENTITY_LABELS has expected entities', () => {
    const expected = ['units', 'circles', 'campuses', 'regions', 'members']
    for (const entity of expected) {
      expect(ENTITY_LABELS[entity]).toBeDefined()
      expect(ENTITY_LABELS[entity].plural).toBeDefined()
      expect(ENTITY_LABELS[entity].singular).toBeDefined()
    }
  })

  it('STATUS_COLORS has expected statuses', () => {
    const statuses = ['active', 'inactive', 'migrated', 'pending', 'approved', 'rejected']
    for (const status of statuses) {
      expect(STATUS_COLORS[status]).toBeDefined()
    }
  })

  it('TITLE_BADGE_COLORS has at least 5 colors', () => {
    expect(TITLE_BADGE_COLORS.length).toBeGreaterThanOrEqual(5)
  })
})
