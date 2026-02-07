import { useCallback } from 'react'
import { CSVUpload } from '../components/CSVUpload'
import { ENTITY_LABELS, ENTITY_CSV_FIELDS, ENTITY_ROLE_MAP } from '../constants'
import * as api from '../api'
import type { EntityType, PortalRole } from '../types'

interface BulkAddPageProps { entity: EntityType }

export function BulkAddPage({ entity }: BulkAddPageProps) {
  const labels = ENTITY_LABELS[entity] ?? { plural: entity, singular: entity }
  const csvFields = ENTITY_CSV_FIELDS[entity] ?? []
  const targetRole = ENTITY_ROLE_MAP[entity]

  const handleUpload = useCallback(async (rows: Record<string, string>[]) => {
    if (entity === 'units') { await api.createUnits(rows.map(r => ({ name: r.name }))); return }
    if (entity === 'circles') { await api.createCircles(rows.map(r => ({ name: r.name }))); return }
    if (entity === 'campuses') { await api.createCampuses(rows.map(r => ({ name: r.name }))); return }
    const [units, circles, campuses] = await Promise.all([api.fetchUnits(), api.fetchCircles(), api.fetchCampuses()])
    const unitMap = new Map(units.map(u => [u.name.toLowerCase(), u.id]))
    const circleMap = new Map(circles.map(c => [c.name.toLowerCase(), c.id]))
    const users = rows.map((r, idx) => {
      const user: { first_name: string; middle_name?: string; last_name: string; phone: string; password?: string; date_of_birth?: string; role: PortalRole; unit_id?: string; circle_id?: string; campus_id?: string } = {
        first_name: (r.first_name ?? '').trim(),
        last_name: (r.last_name ?? '').trim(),
        phone: r.phone,
        role: targetRole as PortalRole,
      }
      if (r.middle_name != null && r.middle_name.trim() !== '') user.middle_name = r.middle_name.trim()
      if (r.password != null && r.password.trim() !== '') user.password = r.password.trim()
      if (r.date_of_birth != null && r.date_of_birth.trim() !== '') user.date_of_birth = r.date_of_birth.trim()
      if (r.unit_name) {
        const unitId = unitMap.get(r.unit_name.toLowerCase())
        if (!unitId) throw new Error(`Row ${idx + 1}: Unit "${r.unit_name}" not found.`)
        user.unit_id = unitId
      }
      if (r.circle_name) {
        const circleId = circleMap.get(r.circle_name.trim().toLowerCase())
        if (circleId) user.circle_id = circleId
      }
      if (r.campus_name) {
        const campusId = campuses.find(c => c.name.toLowerCase() === r.campus_name.trim().toLowerCase())?.id
        if (campusId) user.campus_id = campusId
      }
      return user
    })
    await api.createUsers(users)
  }, [entity, targetRole])

  return (
    <div className="portal-page">
      <div>
        <h1 className="portal-heading">Add {labels.plural}</h1>
        <p className="portal-subheading">Upload a CSV file to add {labels.plural.toLowerCase()} in bulk.</p>
      </div>
      <CSVUpload fields={csvFields} onUpload={handleUpload} entityLabel={labels.plural} />
    </div>
  )
}
