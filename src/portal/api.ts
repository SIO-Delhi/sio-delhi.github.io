import { api, API_BASE, authFetch } from '../lib/api'
import type {
  PortalUnit,
  PortalCircle,
  PortalCampus,
  PortalUser,
  PortalRole,
  MembershipType,
  MigrationRequest,
  PortalMessage,
  DashboardStats,
  RetiringMember,
  IncompleteDetailsMember,
  PortalSearchResult,
  PerfForm,
  PerfScopeType,
  PerfResponse,
  PerfReview,
} from './types'

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */

async function get<T>(path: string): Promise<T> {
  const res = await api.get<T>(`/api/portal${path}`)
  if (res.error) throw new Error(res.error)
  return res.data!
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await api.post<T>(`/api/portal${path}`, body)
  if (res.error) throw new Error(res.error)
  return res.data!
}

async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/portal${path}`)
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? 'Request failed')
  return data
}

async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api/portal${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? 'Request failed')
  return data
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await api.put<T>(`/api/portal${path}`, body)
  if (res.error) throw new Error(res.error)
  return res.data!
}

async function del<T>(path: string): Promise<T> {
  const res = await api.delete<T>(`/api/portal${path}`)
  if (res.error) throw new Error(res.error)
  return res.data!
}

/* ═══════════════════════════════════════════
   Auth
   ═══════════════════════════════════════════ */

export async function lookupPortalUserByPhone(phone: string): Promise<PortalUser | null> {
  try {
    const user = await post<PortalUser>('/auth/me', { phone })
    return user
  } catch (err) {
    console.error('[PortalAuth] Phone lookup error:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function lookupPortalUserByUsername(username: string): Promise<PortalUser | null> {
  try {
    const user = await post<PortalUser>('/auth/me', { username })
    return user
  } catch (err) {
    console.error('[PortalAuth] Username lookup error:', err instanceof Error ? err.message : err)
    return null
  }
}

/* ═══════════════════════════════════════════
   Units
   ═══════════════════════════════════════════ */

export async function fetchUnits(options?: { excludeCampusUnits?: boolean }): Promise<PortalUnit[]> {
  const params = new URLSearchParams()
  if (options?.excludeCampusUnits) params.set('excludeCampusUnits', 'true')
  const query = params.toString()
  return get<PortalUnit[]>(`/units${query ? `?${query}` : ''}`)
}

export async function fetchUnit(id: string): Promise<PortalUnit> {
  return get<PortalUnit>(`/units/${id}`)
}

export async function fetchUnitMembers(unitId: string): Promise<PortalUser[]> {
  return get<PortalUser[]>(`/units/${unitId}/members`)
}

export async function createUnits(units: { name: string; region_id?: string }[]): Promise<void> {
  await post('/units', { units })
}

export async function updateUnit(id: string, updates: Partial<PortalUnit>): Promise<void> {
  await put(`/units/${id}`, updates)
}

export async function deleteUnit(id: string): Promise<void> {
  await del(`/units/${id}`)
}

/* ═══════════════════════════════════════════
   Circles
   ═══════════════════════════════════════════ */

export async function fetchCircles(): Promise<PortalCircle[]> {
  return get<PortalCircle[]>('/circles')
}

export async function fetchCircle(id: string): Promise<PortalCircle> {
  return get<PortalCircle>(`/circles/${id}`)
}

export async function fetchCircleMembers(circleId: string): Promise<PortalUser[]> {
  return get<PortalUser[]>(`/circles/${circleId}/members`)
}

export async function createCircles(circles: { name: string }[]): Promise<void> {
  await post('/circles', { circles })
}

export async function updateCircle(id: string, updates: Partial<PortalCircle>): Promise<void> {
  await put(`/circles/${id}`, updates)
}

export async function deleteCircle(id: string): Promise<void> {
  await del(`/circles/${id}`)
}

/* ═══════════════════════════════════════════
   Campuses
   ═══════════════════════════════════════════ */

export async function fetchCampuses(): Promise<PortalCampus[]> {
  return get<PortalCampus[]>('/campuses')
}

export async function fetchCampus(id: string): Promise<PortalCampus> {
  return get<PortalCampus>(`/campuses/${id}`)
}

export async function fetchCampusMembers(campusId: string): Promise<PortalUser[]> {
  return get<PortalUser[]>(`/campuses/${campusId}/members`)
}

export async function createCampuses(campuses: { name: string }[]): Promise<void> {
  await post('/campuses', { campuses })
}

export async function updateCampus(id: string, updates: Partial<PortalCampus>): Promise<void> {
  await put(`/campuses/${id}`, updates)
}

export async function deleteCampus(id: string): Promise<void> {
  await del(`/campuses/${id}`)
}

/* ═══════════════════════════════════════════
   Users
   ═══════════════════════════════════════════ */

export async function fetchUsers(
  role?: PortalRole | string,
  unitId?: string,
  options?: { excludeCampusUnits?: boolean; campusUnitsOnly?: boolean; regionId?: string; requestingRole?: string },
): Promise<PortalUser[]> {
  const params = new URLSearchParams()
  if (role) params.append('role', role)
  if (unitId) params.append('unitId', unitId)
  if (options?.regionId) params.append('regionId', options.regionId)
  if (options?.excludeCampusUnits) params.append('excludeCampusUnits', '1')
  if (options?.campusUnitsOnly) params.append('campusUnitsOnly', '1')
  if (options?.requestingRole) params.append('requestingRole', options.requestingRole)
  const qs = params.toString()
  return get<PortalUser[]>(`/users${qs ? `?${qs}` : ''}`)
}

export async function fetchUser(id: string): Promise<PortalUser> {
  return get<PortalUser>(`/users/${id}`)
}

export async function createUsers(
  users: { first_name: string; middle_name?: string; last_name: string; phone: string; alt_phone?: string; password?: string; date_of_birth?: string; role: PortalRole; membership_type?: MembershipType; membership_id?: string }[],
): Promise<{ success: boolean; count: number; message?: string; clerk_warnings?: string[] }> {
  return post('/users', { users })
}

export async function updateUser(id: string, updates: Record<string, unknown>): Promise<void> {
  await put(`/users/${id}`, updates)
}

export async function deleteUser(id: string): Promise<void> {
  await del(`/users/${id}`)
}

/* ═══════════════════════════════════════════
   Titles
   ═══════════════════════════════════════════ */

export async function assignTitle(
  userId: string,
  title: string,
  assignedBy: string,
  titleColor?: string | null,
): Promise<void> {
  const body: { title: string; assigned_by: string; title_color?: string } = { title, assigned_by: assignedBy }
  if (titleColor != null && titleColor !== '') body.title_color = titleColor
  await put(`/users/${userId}/title`, body)
}

export async function revokeTitle(userId: string): Promise<void> {
  await del(`/users/${userId}/title`)
}

export async function fetchUsersWithTitles(): Promise<PortalUser[]> {
  return get<PortalUser[]>('/users?titleOnly=1')
}

/* ═══════════════════════════════════════════
   Dashboard Stats
   ═══════════════════════════════════════════ */

export async function fetchRegionUnitsWithoutPresident(): Promise<{ id: string; name: string }[]> {
  return get<{ id: string; name: string }[]>('/region-units-without-president')
}

export async function fetchDashboardStats(
  role: PortalRole,
  userId: string,
  unitId?: string | null,
  regionId?: string | null,
): Promise<DashboardStats> {
  const params = new URLSearchParams({ role, userId })
  if (unitId) params.append('unitId', unitId)
  if (regionId) params.append('regionId', regionId)
  return get<DashboardStats>(`/dashboard/stats?${params.toString()}`)
}

export async function fetchRetiringMembers(): Promise<RetiringMember[]> {
  return get<RetiringMember[]>('/retiring-members')
}

export async function fetchMembersWithIncompleteDetails(
  role: string,
  regionId?: string | null,
  unitId?: string | null,
): Promise<IncompleteDetailsMember[]> {
  const params = new URLSearchParams({ role })
  if (regionId) params.set('regionId', regionId)
  if (unitId) params.set('unitId', unitId)
  return get(`/members-incomplete-details?${params.toString()}`)
}

export async function searchPortal(q: string): Promise<PortalSearchResult> {
  if (!q.trim()) return { members: [], units: [], regions: [], circles: [], campuses: [] }
  const params = new URLSearchParams({ q: q.trim() })
  return get<PortalSearchResult>(`/search?${params}`)
}

export async function lockUser(
  id: string,
  locked: boolean,
  actor?: { userId: string; role: string; unitId?: string | null },
  reasons?: string[],
): Promise<void> {
  const body: { locked: boolean; actorUserId?: string; actorRole?: string; actorUnitId?: string | null; reasons?: string[] } = { locked }
  if (actor) {
    body.actorUserId = actor.userId
    body.actorRole = actor.role
    body.actorUnitId = actor.unitId ?? undefined
  }
  if (reasons && reasons.length > 0) {
    body.reasons = reasons
  }
  await put(`/users/${id}/lock`, body)
}

export async function revokeUser(id: string, reason: string, actorUserId: string): Promise<void> {
  await put(`/users/${id}/revoke`, { revoke: true, reason, actorUserId })
}

export async function unrevokeUser(id: string): Promise<void> {
  await put(`/users/${id}/revoke`, { revoke: false })
}

/**
 * Reset a user's Clerk password back to their stored default password.
 * This is admin-only functionality.
 */
export async function resetUserPassword(userId: string): Promise<void> {
  await post(`/users/${userId}/reset-password`, {})
}

/* ═══════════════════════════════════════════
   Migrations
   ═══════════════════════════════════════════ */

export async function fetchMigrations(filters?: {
  status?: string
  role?: string
  userId?: string
  unitId?: string
}): Promise<MigrationRequest[]> {
  const params = new URLSearchParams()
  if (filters?.status && filters.status !== 'all') params.set('status', filters.status)
  if (filters?.role) params.set('role', filters.role)
  if (filters?.userId) params.set('userId', filters.userId)
  if (filters?.unitId) params.set('unitId', filters.unitId)
  const qs = params.toString() ? `?${params}` : ''
  return get<MigrationRequest[]>(`/migrations${qs}`)
}

export async function createMigration(data: {
  member_id: string
  from_unit_id: string
  to_unit_id?: string
  to_location?: string
  reason?: string
  requested_by: string
}): Promise<void> {
  await post('/migrations', data)
}

export async function resolveMigration(
  id: string,
  status: 'approved' | 'rejected',
  resolvedBy: string,
): Promise<void> {
  await put(`/migrations/${id}`, { status, resolved_by: resolvedBy })
}

/** Mark all resolved migrations as "seen" for a member (clears their notification badge) */
export async function markMigrationsSeen(memberId: string): Promise<void> {
  await post('/migrations/mark-seen', { member_id: memberId })
}

/* ═══════════════════════════════════════════
   Messages
   ═══════════════════════════════════════════ */

/** Helper: coerce PHP TINYINT values ("0"/"1", 0/1) to real booleans */
function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === '1'
}

export async function fetchMessages(
  userId: string,
  type: 'inbox' | 'sent',
): Promise<PortalMessage[]> {
  const rows = await get<PortalMessage[]>(`/messages?userId=${userId}&type=${type}`)
  // Normalize TINYINT fields to real JS booleans
  return rows.map(m => ({ ...m, is_broadcast: toBool(m.is_broadcast), is_read: toBool(m.is_read) }))
}

export async function sendMessage(msg: {
  sender_id: string
  recipient_id?: string | null
  recipient_role?: PortalRole | null
  subject: string
  body: string
  is_broadcast: boolean
}): Promise<void> {
  await post('/messages', msg)
}

export async function markMessageAsRead(id: string): Promise<void> {
  await put(`/messages/${id}/read`, {})
}

/* ═══════════════════════════════════════════
   Performance Forms
   ═══════════════════════════════════════════ */

export async function fetchPerfForms(opts?: { role?: string; userId?: string; unitId?: string }): Promise<PerfForm[]> {
  const params = new URLSearchParams()
  if (opts?.role) params.append('role', opts.role)
  if (opts?.userId) params.append('userId', opts.userId)
  if (opts?.unitId) params.append('unitId', opts.unitId)
  const qs = params.toString()
  return get<PerfForm[]>(`/performance/forms${qs ? `?${qs}` : ''}`)
}

export async function fetchPerfForm(id: string): Promise<PerfForm> {
  return get<PerfForm>(`/performance/forms/${id}`)
}

export async function fetchPublicPerfForm(id: string): Promise<PerfForm> {
  return publicGet<PerfForm>(`/performance/public/forms/${id}`)
}

export async function createPerfForm(data: {
  title: string
  description?: string
  created_by: string
  scope_type?: PerfScopeType
  scope_unit_id?: string | null
  scope_region_id?: string | null
  scope_circle_id?: string | null
  scope_campus_id?: string | null
  period?: string
  is_template?: boolean
  is_public?: boolean
  template_key?: string | null
  fields: { type: string; label: string; description?: string; options?: string[]; is_required?: boolean; max_value?: number }[]
}): Promise<{ id: string }> {
  return post<{ id: string }>('/performance/forms', data)
}

export async function updatePerfForm(id: string, data: Record<string, unknown>): Promise<void> {
  await put(`/performance/forms/${id}`, data)
}

type PerfFormLinkKind = 'public' | 'internal'

function perfFormResourceType(kind: PerfFormLinkKind): string {
  return kind === 'public' ? 'portal_perf_form_public' : 'portal_perf_form_internal'
}

export async function getPerfFormShortLink(formId: string, kind: PerfFormLinkKind): Promise<{ shortUrl: string; fullUrl: string; clickCount: number } | null> {
  const res = await api.shortLinks.getByForm(formId, perfFormResourceType(kind))
  if (res.error) {
    if (res.error.toLowerCase().includes('no short link')) return null
    throw new Error(res.error)
  }
  return res.data ?? null
}

export async function createPerfFormShortLink(formId: string, fullUrl: string, kind: PerfFormLinkKind): Promise<{ shortUrl: string; fullUrl: string; clickCount: number }> {
  const res = await api.shortLinks.create(fullUrl, undefined, { type: perfFormResourceType(kind), id: formId })
  if (res.error) throw new Error(res.error)
  if (!res.data) throw new Error('Failed to create short link.')
  return res.data
}

export async function deletePerfForm(id: string): Promise<void> {
  await del(`/performance/forms/${id}`)
}

export async function fetchPerfResponses(formId: string): Promise<PerfResponse[]> {
  return get<PerfResponse[]>(`/performance/forms/${formId}/responses`)
}

export async function submitPerfResponse(formId: string, memberId: string, responseData: Record<string, unknown>): Promise<void> {
  await post(`/performance/forms/${formId}/respond`, { member_id: memberId, response_data: responseData })
}

export async function submitPublicPerfResponse(formId: string, responseData: Record<string, unknown>): Promise<void> {
  await publicPost(`/performance/public/forms/${formId}/respond`, { response_data: responseData })
}

/** Record that a member has opened/seen a performance form (clears its notification badge) */
export async function markPerfFormSeen(formId: string, memberId: string): Promise<void> {
  await post(`/performance/forms/${formId}/seen`, { member_id: memberId })
}

/** Mark response-review notifications as seen for a reviewer. */
export async function markPerfResponseNotificationsSeen(userId: string): Promise<void> {
  await post('/performance/responses/notifications/seen', { user_id: userId })
}

export async function fetchPerfResponseReviews(formId: string, responseId: string): Promise<PerfReview[]> {
  return get<PerfReview[]>(`/performance/forms/${formId}/responses/${responseId}/reviews`)
}

export async function upsertPerfResponseReview(
  formId: string,
  responseId: string,
  reviewerId: string,
  data: { comment?: string | null; rating?: number | null },
): Promise<{ id: string; updated?: boolean }> {
  return post<{ id: string; updated?: boolean }>(`/performance/forms/${formId}/responses/${responseId}/reviews`, {
    reviewer_id: reviewerId,
    comment: data.comment ?? null,
    rating: data.rating ?? null,
  })
}

export async function updatePerfReview(reviewId: string, reviewerId: string, data: { comment?: string | null; rating?: number | null }): Promise<void> {
  await put(`/performance/reviews/${reviewId}`, { reviewer_id: reviewerId, comment: data.comment ?? null, rating: data.rating ?? null })
}

export async function deletePerfReview(reviewId: string, reviewerId: string): Promise<void> {
  await del(`/performance/reviews/${reviewId}?reviewer_id=${encodeURIComponent(reviewerId)}`)
}

/* ═══════════════════════════════════════════
   Profile Edit Verification Requests
   ═══════════════════════════════════════════ */

export interface EditRequest {
  id: string
  member_id: string
  member_name?: string
  member_phone?: string
  unit_id?: string
  changes: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string | null
  created_at: string
  reviewed_at?: string | null
}

export async function createEditRequest(memberId: string, changes: Record<string, unknown>): Promise<{ id: string }> {
  return post<{ id: string }>('/edit-requests', { member_id: memberId, changes })
}

export async function fetchEditRequests(filters?: { unitId?: string; status?: string }): Promise<EditRequest[]> {
  const params = new URLSearchParams()
  if (filters?.unitId) params.set('unitId', filters.unitId)
  if (filters?.status) params.set('status', filters.status)
  const qs = params.toString()
  return get<EditRequest[]>(`/edit-requests${qs ? `?${qs}` : ''}`)
}

export async function resolveEditRequest(id: string, status: 'approved' | 'rejected', reviewedBy: string): Promise<void> {
  await put(`/edit-requests/${id}`, { status, reviewed_by: reviewedBy })
}

export async function fetchMemberEditRequests(memberId: string): Promise<EditRequest[]> {
  return get<EditRequest[]>(`/users/${memberId}/edit-requests`)
}

/* ═══════════════════════════════════════════
   Member Profile Activity
   ═══════════════════════════════════════════ */

/** Fetch all messages sent to/from a specific user (leader view) */
export async function fetchUserMessages(userId: string): Promise<PortalMessage[]> {
  const rows = await get<PortalMessage[]>(`/users/${userId}/messages`)
  return rows.map(m => ({ ...m, is_broadcast: toBool(m.is_broadcast), is_read: toBool(m.is_read) }))
}

/** Fetch migration requests involving a specific user */
export async function fetchUserMigrations(userId: string): Promise<MigrationRequest[]> {
  return get<MigrationRequest[]>(`/users/${userId}/migrations`)
}

/** Fetch performance responses submitted by a specific user */
export async function fetchUserPerformance(userId: string): Promise<(PerfResponse & { form_title?: string; form_description?: string; form_period?: string })[]> {
  return get<(PerfResponse & { form_title?: string; form_description?: string; form_period?: string })[]>(`/users/${userId}/performance`)
}

/* ═══════════════════════════════════════════
   Avatars
   ═══════════════════════════════════════════ */

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await authFetch(`${API_BASE}/api/portal/users/${userId}/avatar`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || 'Upload failed')
  }
  const data = await res.json()
  return data.url
}

export async function removeAvatar(userId: string): Promise<void> {
  await del(`/users/${userId}/avatar`)
}

/* ═══════════════════════════════════════════
   Region Units
   ═══════════════════════════════════════════ */

export async function fetchRegionUnits(regionalPresidentId: string): Promise<string[]> {
  return get<string[]>(`/regions/${regionalPresidentId}/units`)
}

export interface RegionWithUnits {
  region_id: string
  region_name: string
  regional_president_id: string | null
  regional_president_name: string | null
  phone?: string | null
  units: { id: string; name: string }[]
}

export async function fetchRegions(): Promise<RegionWithUnits[]> {
  return get<RegionWithUnits[]>('/regions')
}

export async function createRegions(regions: { name: string }[]): Promise<void> {
  await post('/regions', { regions })
}

export async function updateRegion(id: string, updates: { name?: string }): Promise<void> {
  await put(`/regions/${id}`, updates)
}

export async function deleteRegion(id: string): Promise<void> {
  await del(`/regions/${id}`)
}

/* ═══════════════════════════════════════════
   Notification Counts (sidebar badges)
   ═══════════════════════════════════════════ */

export interface NotificationCounts {
  unreadMessages: number
  pendingMigrations: number
  pendingForms: number
}

export async function fetchNotificationCounts(filters: {
  userId: string
  role: string
  unitId?: string
}): Promise<NotificationCounts> {
  const params = new URLSearchParams({ userId: filters.userId, role: filters.role })
  if (filters.unitId) params.set('unitId', filters.unitId)
  return get<NotificationCounts>(`/notifications?${params}`)
}
