import type { ReactNode, ComponentType } from 'react'

export type PortalRole = 'admin' | 'zonal_secretary' | 'regional_president' | 'unit_president' | 'member'

export type MemberStatus = 'active' | 'inactive' | 'migrated'

export type MigrationStatus = 'pending' | 'approved' | 'rejected'

export interface PortalUnit {
  id: string
  name: string
  created_at: string
}

export interface PortalCircle {
  id: string
  name: string
  created_at: string
}

export interface PortalUser {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  full_name: string
  username?: string | null
  phone: string
  role: PortalRole
  unit_id: string | null
  unit_name?: string
  date_of_birth: string | null
  avatar_url: string | null
  title: string | null
  title_assigned_by: string | null
  title_assigned_at: string | null
  status: MemberStatus
  created_at: string
  updated_at: string
}

export interface RegionUnit {
  id: string
  regional_president_id: string
  unit_id: string
  unit_name?: string
}

export interface MigrationRequest {
  id: string
  member_id: string
  member_name?: string
  from_unit_id: string
  from_unit_name?: string
  to_unit_id: string
  to_unit_name?: string
  status: MigrationStatus
  requested_by: string
  requested_by_name?: string
  resolved_by: string | null
  created_at: string
  resolved_at: string | null
}

export interface PortalMessage {
  id: string
  sender_id: string
  sender_name?: string
  sender_role?: PortalRole
  recipient_id: string | null
  recipient_name?: string
  recipient_role: PortalRole | null
  subject: string
  body: string
  is_broadcast: boolean
  is_read: boolean
  created_at: string
}

/* ── Performance Form Builder ── */

export type PerfFieldType = 'mcq' | 'msq' | 'subjective' | 'checkbox' | 'number' | 'rating'

export interface PerfField {
  id: string
  form_id: string
  type: PerfFieldType
  label: string
  description: string | null
  options: string[] | null
  is_required: boolean | number
  display_order: number
  max_value: number | null
  created_at: string
}

export interface PerfForm {
  id: string
  title: string
  description: string | null
  created_by: string
  creator_name?: string
  scope_unit_id: string | null
  scope_unit_name?: string
  period: string | null
  is_active: boolean | number
  field_count?: number
  response_count?: number
  fields?: PerfField[]
  created_at: string
  updated_at: string
}

export interface PerfResponse {
  id: string
  form_id: string
  member_id: string
  member_name?: string
  member_phone?: string
  unit_name?: string
  response_data: Record<string, unknown>
  submitted_at: string
  updated_at: string
}

export interface PerfReview {
  id: string
  response_id: string
  reviewer_id: string
  reviewer_name?: string
  comment: string | null
  rating: number | null
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  totalUnits: number
  totalMembers: number
  activeMembers: number
  inactiveMembers: number
  migratedMembers: number
  totalUnitPresidents: number
  totalZonalSecretaries: number
  pendingMigrations: number
  unreadMessages: number
}

/* ── Shared component prop types ── */

export interface TableColumn<T = Record<string, unknown>> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
}

export interface EditField {
  key: string
  label: string
  type: 'text' | 'select' | 'tel' | 'permissions'
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
}

export interface CSVFieldDef {
  key: string
  label: string
  required: boolean
  example: string
}

export interface DashboardStat {
  label: string
  value: number | string
  icon: ComponentType<{ size?: number }>
  color: 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'indigo'
  change?: string
}

export type EntityType = 'units' | 'circles' | 'zonal-secretaries' | 'regional-presidents' | 'unit-presidents' | 'members'

/* ── RBAC Permissions ── */

export type Permission =
  | 'view_all_units'
  | 'manage_units'
  | 'view_all_users'
  | 'manage_users'
  | 'assign_titles'
  | 'approve_migrations'
  | 'initiate_migrations'
  | 'view_performance'
  | 'send_messages'
  | 'broadcast_messages'
  | 'view_own_profile'
  | 'edit_own_profile'
