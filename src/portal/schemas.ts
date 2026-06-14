/**
 * Zod schemas for API response validation.
 * Used by safeParse wrapper in api.ts to catch backend mismatches early.
 */
import { z } from 'zod/v4'

// === Enums ===

export const PortalRoleSchema = z.enum([
  'admin',
  'zonal_secretary',
  'regional_president',
  'unit_president',
  'campus_president',
  'member',
])

export const MemberStatusSchema = z.enum(['active', 'inactive', 'migrated', 'revoked'])

export const MigrationStatusSchema = z.enum(['pending', 'approved', 'rejected'])

export const MembershipTypeSchema = z.enum(['unit', 'circle', 'campus'])

export const PerfFieldTypeSchema = z.enum(['mcq', 'msq', 'subjective', 'checkbox', 'number', 'rating'])

// === Core Entities ===

export const PortalUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  region_id: z.string().nullable().optional(),
  region_name: z.string().nullable().optional(),
  is_campus: z.union([z.boolean(), z.number()]).optional(),
  unit_president_name: z.string().nullable().optional(),
})

export const PortalCircleSchema = z.object({
  id: z.string(),
  name: z.string(),
  region_id: z.string().nullable().optional(),
  region_name: z.string().nullable().optional(),
  created_at: z.string(),
})

export const PortalCampusSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  campus_president_name: z.string().nullable().optional(),
})

export const PortalUserSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  middle_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  alt_phone: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  role: PortalRoleSchema,
  unit_id: z.string().nullable().optional(),
  unit_name: z.string().nullable().optional(),
  region_id: z.string().nullable().optional(),
  region_name: z.string().nullable().optional(),
  circle_id: z.string().nullable().optional(),
  circle_name: z.string().nullable().optional(),
  campus_id: z.string().nullable().optional(),
  campus_name: z.string().nullable().optional(),
  membership_type: MembershipTypeSchema.nullable().optional(),
  membership_id: z.string().nullable().optional(),
  permission_overrides: z.record(z.string(), z.boolean()).nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  title_assigned_by: z.string().nullable().optional(),
  title_assigned_at: z.string().nullable().optional(),
  title_color: z.string().nullable().optional(),
  status: MemberStatusSchema.optional(),
  inactivated_by: z.string().nullable().optional(),
  inactive_reason: z.unknown().nullable().optional(),
  inactivated_at: z.string().nullable().optional(),
  revoked_by: z.string().nullable().optional(),
  revoke_reason: z.string().nullable().optional(),
  revoked_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const PortalMessageSchema = z.object({
  id: z.string(),
  sender_id: z.string(),
  sender_name: z.string().optional(),
  recipient_id: z.string().nullable().optional(),
  recipient_name: z.string().nullable().optional(),
  recipient_role: PortalRoleSchema.nullable().optional(),
  subject: z.string(),
  body: z.string(),
  is_broadcast: z.union([z.boolean(), z.number()]).optional(),
  is_read: z.union([z.boolean(), z.number()]).optional(),
  created_at: z.string(),
})

export const MigrationRequestSchema = z.object({
  id: z.string(),
  member_id: z.string(),
  member_name: z.string().optional(),
  from_unit_id: z.string(),
  from_unit_name: z.string().optional(),
  to_unit_id: z.string().nullable().optional(),
  to_unit_name: z.string().nullable().optional(),
  to_location: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  status: MigrationStatusSchema,
  requested_by: z.string(),
  resolved_by: z.string().nullable().optional(),
  created_at: z.string(),
  resolved_at: z.string().nullable().optional(),
  seen_at: z.string().nullable().optional(),
})

export const PerfFormSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  created_by: z.string(),
  creator_name: z.string().optional(),
  scope_unit_id: z.string().nullable().optional(),
  scope_unit_name: z.string().nullable().optional(),
  period: z.string().nullable().optional(),
  is_active: z.union([z.boolean(), z.number()]).optional(),
  banner_image: z.string().nullable().optional(),
  banner_text: z.string().nullable().optional(),
  banner_zone_text: z.string().nullable().optional(),
  theme_primary_color: z.string().nullable().optional(),
  footer_bg_color: z.string().nullable().optional(),
  footer_text_color: z.string().nullable().optional(),
  footer_pattern_color: z.string().nullable().optional(),
  fields: z.array(z.object({
    id: z.string(),
    form_id: z.string().optional(),
    type: PerfFieldTypeSchema,
    label: z.string(),
    description: z.string().nullable().optional(),
    options: z.unknown().nullable().optional(),
    is_required: z.union([z.boolean(), z.number()]).optional(),
    display_order: z.number().optional(),
    max_value: z.number().nullable().optional(),
  })).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  response_count: z.number().optional(),
  total_members: z.number().optional(),
})

export const DashboardStatsSchema = z.object({
  totalMembers: z.number(),
  totalUnits: z.number(),
  activeMembers: z.number(),
  inactiveMembers: z.number(),
  pendingMigrations: z.number(),
  unreadMessages: z.number(),
  totalCircles: z.number().optional(),
  totalCampuses: z.number().optional(),
  totalRegions: z.number().optional(),
  revokedMembers: z.number().optional(),
  pendingEditRequests: z.number().optional(),
  unitsWithoutPresident: z.number().optional(),
})

// === Validation helper ===

/**
 * Validate API response data against a Zod schema.
 * In dev: logs warnings on validation failure but still returns data.
 * In prod: silently returns data (never crashes).
 */
export function validateResponse<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    if (import.meta.env.DEV) {
      console.warn(`[API Validation] ${label} response failed validation:`, result.error.issues)
    }
    // Return data as-is even on failure — graceful degradation
    return data as T
  }
  return result.data
}

/**
 * Validate an array response.
 */
export function validateArrayResponse<T>(schema: z.ZodType<T>, data: unknown, label: string): T[] {
  if (!Array.isArray(data)) {
    if (import.meta.env.DEV) {
      console.warn(`[API Validation] ${label} expected array, got:`, typeof data)
    }
    return (data ?? []) as T[]
  }
  return data.map((item, i) => validateResponse(schema, item, `${label}[${i}]`))
}
