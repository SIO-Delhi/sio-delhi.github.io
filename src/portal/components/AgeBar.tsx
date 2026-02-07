/** Parse DDMMYYYY DOB string → age this calendar year */
export function getAgeThisYear(dob: string | null | undefined): number | null {
  if (!dob || dob.length !== 8) return null
  const birthYear = parseInt(dob.substring(4, 8), 10)
  if (isNaN(birthYear) || birthYear < 1900) return null
  return new Date().getFullYear() - birthYear
}

/** Inline age + progress bar for hero cards */
export function HeroAgeBar({ dob }: { dob: string | null | undefined }) {
  const age = getAgeThisYear(dob)
  if (age === null) return null

  const min = 18
  const max = 30
  const pct = Math.round((Math.max(min, Math.min(max, age)) - min) / (max - min) * 100)
  const isRetired = age >= 30

  return (
    <div className="portal-hero-age">
      <span className={`portal-hero-age-text ${isRetired ? 'portal-hero-age-gold' : ''}`}>
        Age {age}
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
