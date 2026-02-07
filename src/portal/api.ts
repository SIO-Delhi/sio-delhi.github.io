import { api, API_BASE, authFetch } from '../lib/api'
import type {
  PortalUnit,
  PortalUser,
  PortalRole,
  MigrationRequest,
  PortalMessage,
  DashboardStats,
  PerfForm,
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
  } catch {
    return null
  }
}

export async function lookupPortalUserByUsername(username: string): Promise<PortalUser | null> {
  try {
    const user = await post<PortalUser>('/auth/me', { username })
    return user
  } catch {
    return null
  }
}

/* ═══════════════════════════════════════════
   Units
   ═══════════════════════════════════════════ */

export async function fetchUnits(): Promise<PortalUnit[]> {
  return get<PortalUnit[]>('/units')
}

export async function createUnits(units: { name: string }[]): Promise<void> {
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
   Users
   ═══════════════════════════════════════════ */

export async function fetchUsers(role?: PortalRole | string, unitId?: string): Promise<PortalUser[]> {
  const params = new URLSearchParams()
  if (role) params.append('role', role)
  if (unitId) params.append('unitId', unitId)
  const qs = params.toString()
  return get<PortalUser[]>(`/users${qs ? `?${qs}` : ''}`)
}

export async function fetchUser(id: string): Promise<PortalUser> {
  return get<PortalUser>(`/users/${id}`)
}

export async function createUsers(
  users: { first_name: string; middle_name?: string; last_name: string; phone: string; password?: string; date_of_birth?: string; role: PortalRole; unit_id?: string; circle_id?: string }[],
): Promise<void> {
  await post('/users', { users })
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

export async function assignTitle(userId: string, title: string, assignedBy: string): Promise<void> {
  await put(`/users/${userId}/title`, { title, assigned_by: assignedBy })
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

export async function fetchDashboardStats(
  role: PortalRole,
  userId: string,
  unitId?: string | null,
): Promise<DashboardStats> {
  const params = new URLSearchParams({ role, userId })
  if (unitId) params.append('unitId', unitId)
  return get<DashboardStats>(`/dashboard/stats?${params.toString()}`)
}

/* ═══════════════════════════════════════════
   Migrations
   ═══════════════════════════════════════════ */

export async function fetchMigrations(statusFilter?: string): Promise<MigrationRequest[]> {
  const qs = statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : ''
  return get<MigrationRequest[]>(`/migrations${qs}`)
}

export async function createMigration(data: {
  member_id: string
  from_unit_id: string
  to_unit_id: string
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

/* ═══════════════════════════════════════════
   Messages
   ═══════════════════════════════════════════ */

export async function fetchMessages(
  userId: string,
  type: 'inbox' | 'sent',
): Promise<PortalMessage[]> {
  return get<PortalMessage[]>(`/messages?userId=${userId}&type=${type}`)
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

export async function createPerfForm(data: {
  title: string
  description?: string
  created_by: string
  scope_unit_id?: string | null
  period?: string
  fields: { type: string; label: string; description?: string; options?: string[]; is_required?: boolean; max_value?: number }[]
}): Promise<{ id: string }> {
  return post<{ id: string }>('/performance/forms', data)
}

export async function updatePerfForm(id: string, data: Record<string, unknown>): Promise<void> {
  await put(`/performance/forms/${id}`, data)
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
