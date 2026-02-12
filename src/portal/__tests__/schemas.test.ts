import { describe, it, expect } from 'vitest'
import {
  PortalRoleSchema,
  MemberStatusSchema,
  MembershipTypeSchema,
  PortalUnitSchema,
  PortalUserSchema,
  DashboardStatsSchema,
  validateResponse,
  validateArrayResponse,
} from '../schemas'

describe('Zod Schemas', () => {
  describe('PortalRoleSchema', () => {
    it('accepts valid roles', () => {
      expect(PortalRoleSchema.safeParse('admin').success).toBe(true)
      expect(PortalRoleSchema.safeParse('member').success).toBe(true)
      expect(PortalRoleSchema.safeParse('unit_president').success).toBe(true)
    })

    it('rejects invalid roles', () => {
      expect(PortalRoleSchema.safeParse('superadmin').success).toBe(false)
      expect(PortalRoleSchema.safeParse('').success).toBe(false)
    })
  })

  describe('MemberStatusSchema', () => {
    it('accepts valid statuses', () => {
      expect(MemberStatusSchema.safeParse('active').success).toBe(true)
      expect(MemberStatusSchema.safeParse('inactive').success).toBe(true)
      expect(MemberStatusSchema.safeParse('revoked').success).toBe(true)
    })
  })

  describe('MembershipTypeSchema', () => {
    it('accepts valid types', () => {
      expect(MembershipTypeSchema.safeParse('unit').success).toBe(true)
      expect(MembershipTypeSchema.safeParse('circle').success).toBe(true)
      expect(MembershipTypeSchema.safeParse('campus').success).toBe(true)
    })
  })

  describe('PortalUnitSchema', () => {
    it('validates a complete unit', () => {
      const unit = { id: '1', name: 'Test Unit', created_at: '2024-01-01' }
      expect(PortalUnitSchema.safeParse(unit).success).toBe(true)
    })

    it('validates unit with optional fields', () => {
      const unit = {
        id: '1',
        name: 'Test',
        created_at: '2024-01-01',
        region_id: 'r1',
        region_name: 'Region A',
        is_campus: false,
        unit_president_name: 'John',
      }
      expect(PortalUnitSchema.safeParse(unit).success).toBe(true)
    })

    it('rejects unit without required fields', () => {
      expect(PortalUnitSchema.safeParse({ name: 'Test' }).success).toBe(false)
      expect(PortalUnitSchema.safeParse({ id: '1' }).success).toBe(false)
    })
  })

  describe('PortalUserSchema', () => {
    const minUser = {
      id: 'u1',
      first_name: 'John',
      role: 'member',
    }

    it('validates minimal user', () => {
      expect(PortalUserSchema.safeParse(minUser).success).toBe(true)
    })

    it('validates full user', () => {
      const user = {
        ...minUser,
        last_name: 'Doe',
        phone: '9876543210',
        unit_id: 'u1',
        unit_name: 'Test Unit',
        status: 'active',
        membership_type: 'unit',
        avatar_url: null,
        title: 'Unit President',
      }
      expect(PortalUserSchema.safeParse(user).success).toBe(true)
    })

    it('rejects user without id', () => {
      expect(PortalUserSchema.safeParse({ first_name: 'John', role: 'member' }).success).toBe(false)
    })

    it('rejects invalid role', () => {
      expect(PortalUserSchema.safeParse({ ...minUser, role: 'superadmin' }).success).toBe(false)
    })
  })

  describe('DashboardStatsSchema', () => {
    it('validates complete stats', () => {
      const stats = {
        totalMembers: 100,
        totalUnits: 10,
        activeMembers: 80,
        inactiveMembers: 20,
        pendingMigrations: 5,
        unreadMessages: 3,
      }
      expect(DashboardStatsSchema.safeParse(stats).success).toBe(true)
    })

    it('rejects stats with missing required fields', () => {
      expect(DashboardStatsSchema.safeParse({ totalMembers: 100 }).success).toBe(false)
    })
  })
})

describe('validateResponse', () => {
  it('returns validated data on success', () => {
    const data = { id: '1', name: 'Test', created_at: '2024-01-01' }
    const result = validateResponse(PortalUnitSchema, data, 'test')
    expect(result).toEqual(data)
  })

  it('returns raw data on validation failure (graceful degradation)', () => {
    const badData = { id: 123, name: 'Test' } // id should be string, missing created_at
    const result = validateResponse(PortalUnitSchema, badData, 'test')
    expect(result).toEqual(badData)
  })
})

describe('validateArrayResponse', () => {
  it('validates array of items', () => {
    const data = [
      { id: '1', name: 'Unit A', created_at: '2024-01-01' },
      { id: '2', name: 'Unit B', created_at: '2024-01-02' },
    ]
    const result = validateArrayResponse(PortalUnitSchema, data, 'test')
    expect(result).toHaveLength(2)
  })

  it('returns data as-is for non-array input (graceful degradation)', () => {
    const result = validateArrayResponse(PortalUnitSchema, 'not-an-array', 'test')
    // validateArrayResponse returns (data ?? []) for non-arrays — string is truthy so returned as-is
    expect(result).toEqual('not-an-array')
  })

  it('returns empty array for null input', () => {
    const result = validateArrayResponse(PortalUnitSchema, null, 'test')
    expect(result).toEqual([])
  })
})
