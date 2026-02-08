/** Parse DDMMYYYY DOB string into a Date object */
function parseDob(dob: string): Date | null {
  if (!dob || dob.length !== 8) return null
  const day = parseInt(dob.substring(0, 2), 10)
  const month = parseInt(dob.substring(2, 4), 10)
  const year = parseInt(dob.substring(4, 8), 10)
  if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1900) return null
  return new Date(year, month - 1, day)
}

/** Calculate precise age from DOB to today */
export function getPreciseAge(dob: string | null | undefined): { years: number; months: number; days: number } | null {
  if (!dob) return null
  const birth = parseDob(dob)
  if (!birth) return null

  const today = new Date()
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()

  if (days < 0) {
    months--
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years--
    months += 12
  }

  return { years, months, days }
}

/** Format precise age: compact "28y 3m 4d" or full "28 years 3 months 4 days" */
export function formatPreciseAge(dob: string | null | undefined, compact = false): string | null {
  const age = getPreciseAge(dob)
  if (!age) return null

  if (compact) {
    return `${age.years}y ${age.months}m ${age.days}d`
  }
  const parts: string[] = []
  parts.push(`${age.years} year${age.years !== 1 ? 's' : ''}`)
  parts.push(`${age.months} month${age.months !== 1 ? 's' : ''}`)
  parts.push(`${age.days} day${age.days !== 1 ? 's' : ''}`)
  return parts.join(' ')
}

/** Parse DDMMYYYY DOB string → age this calendar year (used for progress bar %) */
export function getAgeThisYear(dob: string | null | undefined): number | null {
  if (!dob || dob.length !== 8) return null
  const birthYear = parseInt(dob.substring(4, 8), 10)
  if (isNaN(birthYear) || birthYear < 1900) return null
  return new Date().getFullYear() - birthYear
}

/** Inline age + progress bar for hero cards */
export function HeroAgeBar({ dob }: { dob: string | null | undefined }) {
  const age = getAgeThisYear(dob)
  const preciseAge = formatPreciseAge(dob, true)
  if (age === null) return null

  const min = 18
  const max = 30
  const pct = Math.round((Math.max(min, Math.min(max, age)) - min) / (max - min) * 100)
  const isRetired = age >= 30

  return (
    <div className="portal-hero-age">
      <span className={`portal-hero-age-text ${isRetired ? 'portal-hero-age-gold' : ''}`}>
        {preciseAge ?? `Age ${age}`}
      </span>
      <div className="portal-hero-age-bar">
        <div
          className={`portal-hero-age-bar-fill ${isRetired ? 'portal-hero-age-bar-gold' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isRetired && <span className="portal-hero-age-tag">Retired</span>}
    </div>
  )
}
