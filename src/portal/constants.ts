import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  UserCheck,
  ArrowRightLeft,
  MessageSquare,
  Send,
  Inbox,
  BarChart3,
  User,
  Award,
  Globe,
  CircleDot,
} from 'lucide-react'
import type { PortalRole, CSVFieldDef, EditField, Permission } from './types'

/* ── Navigation ── */

export interface NavItem {
  label: string
  path: string
  icon: typeof LayoutDashboard
  children?: NavItem[]
}

export const NAV_CONFIG: Record<PortalRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard', path: '/portal/admin/dashboard', icon: LayoutDashboard },
    {
      label: 'Units', path: '#', icon: Building2,
      children: [
        { label: 'Add Units', path: '/portal/admin/units/add', icon: Building2 },
        { label: 'Manage Units', path: '/portal/admin/units/manage', icon: Building2 },
      ],
    },
    {
      label: 'Circles', path: '#', icon: CircleDot,
      children: [
        { label: 'Add Circles', path: '/portal/admin/circles/add', icon: CircleDot },
        { label: 'Manage Circles', path: '/portal/admin/circles/manage', icon: CircleDot },
      ],
    },
    {
      label: 'Zonal Secretaries', path: '#', icon: UserCog,
      children: [
        { label: 'Add', path: '/portal/admin/zonal-secretaries/add', icon: UserCog },
        { label: 'Manage', path: '/portal/admin/zonal-secretaries/manage', icon: UserCog },
      ],
    },
    {
      label: 'Regional Presidents', path: '#', icon: Globe,
      children: [
        { label: 'Add', path: '/portal/admin/regional-presidents/add', icon: Globe },
        { label: 'Manage', path: '/portal/admin/regional-presidents/manage', icon: Globe },
      ],
    },
    {
      label: 'Unit Presidents', path: '#', icon: UserCheck,
      children: [
        { label: 'Add', path: '/portal/admin/unit-presidents/add', icon: UserCheck },
        { label: 'Manage', path: '/portal/admin/unit-presidents/manage', icon: UserCheck },
      ],
    },
    {
      label: 'Members', path: '#', icon: Users,
      children: [
        { label: 'Add', path: '/portal/admin/members/add', icon: Users },
        { label: 'Manage', path: '/portal/admin/members/manage', icon: Users },
      ],
    },
    { label: 'Titles', path: '/portal/admin/titles', icon: Award },
    { label: 'Performance', path: '/portal/admin/performance', icon: BarChart3 },
    { label: 'Migrations', path: '/portal/admin/migrations', icon: ArrowRightLeft },
    {
      label: 'Messages', path: '#', icon: MessageSquare,
      children: [
        { label: 'Compose', path: '/portal/admin/messages/compose', icon: Send },
        { label: 'Inbox', path: '/portal/admin/messages/inbox', icon: Inbox },
      ],
    },
  ],
  zonal_secretary: [
    { label: 'Dashboard', path: '/portal/zonal/dashboard', icon: LayoutDashboard },
    { label: 'Units', path: '/portal/zonal/units', icon: Building2 },
    { label: 'Circles', path: '/portal/zonal/circles', icon: CircleDot },
    { label: 'Regional Presidents', path: '/portal/zonal/regional-presidents', icon: Globe },
    { label: 'Unit Presidents', path: '/portal/zonal/unit-presidents', icon: UserCheck },
    { label: 'Members', path: '/portal/zonal/members', icon: Users },
    { label: 'Titles', path: '/portal/zonal/titles', icon: Award },
    { label: 'Performance', path: '/portal/zonal/performance', icon: BarChart3 },
    { label: 'Migrations', path: '/portal/zonal/migrations', icon: ArrowRightLeft },
    {
      label: 'Messages', path: '#', icon: MessageSquare,
      children: [
        { label: 'Compose', path: '/portal/zonal/messages/compose', icon: Send },
        { label: 'Inbox', path: '/portal/zonal/messages/inbox', icon: Inbox },
      ],
    },
  ],
  regional_president: [
    { label: 'Dashboard', path: '/portal/regional/dashboard', icon: LayoutDashboard },
    { label: 'Units', path: '/portal/regional/units', icon: Building2 },
    { label: 'Unit Presidents', path: '/portal/regional/unit-presidents', icon: UserCheck },
    { label: 'Members', path: '/portal/regional/members', icon: Users },
    { label: 'Performance', path: '/portal/regional/performance', icon: BarChart3 },
    { label: 'Migrations', path: '/portal/regional/migrations', icon: ArrowRightLeft },
    {
      label: 'Messages', path: '#', icon: MessageSquare,
      children: [
        { label: 'Compose', path: '/portal/regional/messages/compose', icon: Send },
        { label: 'Inbox', path: '/portal/regional/messages/inbox', icon: Inbox },
      ],
    },
  ],
  unit_president: [
    { label: 'Dashboard', path: '/portal/unit/dashboard', icon: LayoutDashboard },
    { label: 'Members', path: '/portal/unit/members', icon: Users },
    { label: 'Titles', path: '/portal/unit/titles', icon: Award },
    { label: 'Performance', path: '/portal/unit/performance', icon: BarChart3 },
    {
      label: 'Messages', path: '#', icon: MessageSquare,
      children: [
        { label: 'Compose', path: '/portal/unit/messages/compose', icon: Send },
        { label: 'Inbox', path: '/portal/unit/messages/inbox', icon: Inbox },
      ],
    },
  ],
  member: [
    { label: 'Dashboard', path: '/portal/member/dashboard', icon: LayoutDashboard },
    { label: 'Profile', path: '/portal/member/profile', icon: User },
    { label: 'Performance', path: '/portal/member/performance', icon: BarChart3 },
    { label: 'Migrations', path: '/portal/member/migrations', icon: ArrowRightLeft },
    {
      label: 'Messages', path: '#', icon: MessageSquare,
      children: [
        { label: 'Compose', path: '/portal/member/messages/compose', icon: Send },
        { label: 'Inbox', path: '/portal/member/messages/inbox', icon: Inbox },
      ],
    },
  ],
}

/* ── Role display helpers ── */

export const ROLE_LABELS: Record<PortalRole, string> = {
  admin: 'Admin',
  zonal_secretary: 'Zonal Secretary',
  regional_president: 'Regional President',
  unit_president: 'Unit President',
  member: 'Member',
}

export const ROLE_DASHBOARD_PATHS: Record<PortalRole, string> = {
  admin: '/portal/admin/dashboard',
  zonal_secretary: '/portal/zonal/dashboard',
  regional_president: '/portal/regional/dashboard',
  unit_president: '/portal/unit/dashboard',
  member: '/portal/member/dashboard',
}

/* ── RBAC Permissions ── */

export const ROLE_PERMISSIONS: Record<PortalRole, Permission[]> = {
  admin: [
    'view_all_units', 'manage_units', 'view_all_users', 'manage_users',
    'assign_titles', 'approve_migrations', 'initiate_migrations',
    'view_performance', 'send_messages', 'broadcast_messages',
    'view_own_profile', 'edit_own_profile',
  ],
  zonal_secretary: [
    'view_all_units', 'view_all_users', 'assign_titles',
    'approve_migrations', 'initiate_migrations', 'view_performance',
    'send_messages', 'broadcast_messages', 'view_own_profile', 'edit_own_profile',
  ],
  regional_president: [
    'view_all_units', 'view_all_users', 'initiate_migrations',
    'view_performance', 'send_messages', 'broadcast_messages',
    'view_own_profile', 'edit_own_profile',
  ],
  unit_president: [
    'view_all_units', 'view_all_users', 'assign_titles',
    'view_performance', 'send_messages', 'broadcast_messages',
    'view_own_profile', 'edit_own_profile',
  ],
  member: [
    'initiate_migrations', 'view_performance', 'send_messages',
    'view_own_profile', 'edit_own_profile',
  ],
}

/** All permission keys for admin toggles. */
export const ALL_PERMISSIONS: Permission[] = [
  'view_all_units', 'manage_units', 'view_all_users', 'manage_users',
  'assign_titles', 'approve_migrations', 'initiate_migrations',
  'view_performance', 'send_messages', 'broadcast_messages',
  'view_own_profile', 'edit_own_profile',
]

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_all_units: 'View all units',
  manage_units: 'Manage units (CRUD)',
  view_all_users: 'View all users',
  manage_users: 'Manage users (CRUD)',
  assign_titles: 'Assign titles',
  approve_migrations: 'Approve migrations',
  initiate_migrations: 'Initiate migrations',
  view_performance: 'View performance',
  send_messages: 'Send messages',
  broadcast_messages: 'Broadcast messages',
  view_own_profile: 'View own profile',
  edit_own_profile: 'Edit own profile',
}

/** Check if a role has a specific permission (ignores overrides). */
export function hasPermission(role: PortalRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/** Check if user has permission (role default + admin-set overrides). */
export function canUser(
  role: PortalRole,
  permission: Permission,
  overrides?: Record<string, boolean> | null,
): boolean {
  if (overrides && typeof overrides[permission] === 'boolean') return overrides[permission]
  return hasPermission(role, permission)
}

/* ── Entity configurations for manage / add pages ── */

export const ENTITY_EDIT_FIELDS: Record<string, EditField[]> = {
  units: [
    { key: 'name', label: 'Unit Name', type: 'text', required: true, placeholder: 'e.g. Jamia Unit' },
  ],
  circles: [
    { key: 'name', label: 'Circle Name', type: 'text', required: true, placeholder: 'e.g. Study Circle A' },
  ],
  'zonal-secretaries': [
    { key: 'first_name', label: 'First Name', type: 'text', required: true },
    { key: 'middle_name', label: 'Middle Name', type: 'text', required: false },
    { key: 'last_name', label: 'Last Name', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'tel', required: true },
    { key: 'unit_id', label: 'Unit', type: 'select', required: true },
    { key: 'circle_id', label: 'Circle', type: 'select', required: false },
  ],
  'regional-presidents': [
    { key: 'first_name', label: 'First Name', type: 'text', required: true },
    { key: 'middle_name', label: 'Middle Name', type: 'text', required: false },
    { key: 'last_name', label: 'Last Name', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'tel', required: true },
    { key: 'unit_id', label: 'Unit', type: 'select', required: true },
    { key: 'circle_id', label: 'Circle', type: 'select', required: false },
  ],
  'unit-presidents': [
    { key: 'first_name', label: 'First Name', type: 'text', required: true },
    { key: 'middle_name', label: 'Middle Name', type: 'text', required: false },
    { key: 'last_name', label: 'Last Name', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'tel', required: true },
    { key: 'unit_id', label: 'Unit', type: 'select', required: true },
    { key: 'circle_id', label: 'Circle', type: 'select', required: false },
  ],
  members: [
    { key: 'first_name', label: 'First Name', type: 'text', required: true },
    { key: 'middle_name', label: 'Middle Name', type: 'text', required: false },
    { key: 'last_name', label: 'Last Name', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'tel', required: true },
    { key: 'date_of_birth', label: 'Date of Birth (DDMMYYYY)', type: 'text', required: true, placeholder: 'e.g. 25031999' },
    { key: 'unit_id', label: 'Unit', type: 'select', required: true },
    { key: 'circle_id', label: 'Circle', type: 'select', required: false },
    { key: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'migrated', label: 'Migrated' },
    ] },
  ],
}

export const ENTITY_CSV_FIELDS: Record<string, CSVFieldDef[]> = {
  units: [
    { key: 'name', label: 'Unit Name', required: true, example: 'Jamia Unit' },
  ],
  'zonal-secretaries': [
    { key: 'first_name', label: 'First Name', required: true, example: 'Ramesh' },
    { key: 'middle_name', label: 'Middle Name', required: false, example: '' },
    { key: 'last_name', label: 'Last Name', required: true, example: 'Gautam' },
    { key: 'phone', label: 'Phone', required: true, example: '9847263851' },
    { key: 'unit_name', label: 'Unit Name', required: true, example: 'SIO Delhi HQ' },
    { key: 'password', label: 'Password', required: true, example: '37LmZ#FdzLE' },
  ],
  'regional-presidents': [
    { key: 'first_name', label: 'First Name', required: true, example: 'Vikram' },
    { key: 'middle_name', label: 'Middle Name', required: false, example: '' },
    { key: 'last_name', label: 'Last Name', required: true, example: 'Tandon' },
    { key: 'phone', label: 'Phone', required: true, example: '9312456780' },
    { key: 'unit_name', label: 'Unit Name', required: true, example: 'SIO Delhi HQ' },
    { key: 'password', label: 'Password', required: true, example: 'rP4#mKz8vXw' },
  ],
  'unit-presidents': [
    { key: 'first_name', label: 'First Name', required: true, example: 'Priya' },
    { key: 'middle_name', label: 'Middle Name', required: false, example: '' },
    { key: 'last_name', label: 'Last Name', required: true, example: 'Jain' },
    { key: 'unit_name', label: 'Unit Name', required: true, example: 'Jamia Unit' },
    { key: 'phone', label: 'Phone', required: true, example: '9652748391' },
    { key: 'password', label: 'Password', required: true, example: 'ghMlCiih9#Y' },
  ],
  members: [
    { key: 'first_name', label: 'First Name', required: true, example: 'Nandini' },
    { key: 'middle_name', label: 'Middle Name', required: false, example: '' },
    { key: 'last_name', label: 'Last Name', required: true, example: 'Bhatt' },
    { key: 'unit_name', label: 'Unit Name', required: true, example: 'Jamia Unit' },
    { key: 'phone', label: 'Phone', required: true, example: '8546392500' },
    { key: 'date_of_birth', label: 'Date of Birth (DDMMYYYY)', required: true, example: '25031999' },
    { key: 'password', label: 'Password', required: false, example: '(leave empty for default: first name + last 4 digits of mobile)' },
  ],
}

export const ENTITY_LABELS: Record<string, { plural: string; singular: string }> = {
  units: { plural: 'Units', singular: 'Unit' },
  circles: { plural: 'Circles', singular: 'Circle' },
  'zonal-secretaries': { plural: 'Zonal Secretaries', singular: 'Zonal Secretary' },
  'regional-presidents': { plural: 'Regional Presidents', singular: 'Regional President' },
  'unit-presidents': { plural: 'Unit Presidents', singular: 'Unit President' },
  members: { plural: 'Members', singular: 'Member' },
}

export const ENTITY_ROLE_MAP: Record<string, PortalRole | null> = {
  units: null,
  circles: null,
  'zonal-secretaries': 'zonal_secretary',
  'regional-presidents': 'regional_president',
  'unit-presidents': 'unit_president',
  members: 'member',
}

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-50 text-slate-600 border-slate-200',
  migrated: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

