import { useRef } from 'react'

/** Date input with DD/MM/YYYY format and a calendar picker button */

interface DateInputProps {
  value: string          // DDMMYYYY format
  onChange: (v: string) => void  // emits DDMMYYYY format
  className?: string
  style?: React.CSSProperties
}

/** Convert DDMMYYYY → YYYY-MM-DD for the hidden native date input */
function toIso(ddmmyyyy: string): string {
  if (!ddmmyyyy || ddmmyyyy.length !== 8) return ''
  const dd = ddmmyyyy.substring(0, 2)
  const mm = ddmmyyyy.substring(2, 4)
  const yyyy = ddmmyyyy.substring(4, 8)
  return `${yyyy}-${mm}-${dd}`
}

/** Convert YYYY-MM-DD → DDMMYYYY for storage */
function fromIso(iso: string): string {
  if (!iso) return ''
  const [yyyy, mm, dd] = iso.split('-')
  return `${dd}${mm}${yyyy}`
}

/** Format DDMMYYYY → DD/MM/YYYY for display */
function formatDisplay(ddmmyyyy: string): string {
  if (!ddmmyyyy || ddmmyyyy.length !== 8) return ''
  const dd = ddmmyyyy.substring(0, 2)
  const mm = ddmmyyyy.substring(2, 4)
  const yyyy = ddmmyyyy.substring(4, 8)
  return `${dd}/${mm}/${yyyy}`
}

export function DateInput({ value, onChange, className = 'portal-input', style }: DateInputProps) {
  const hiddenRef = useRef<HTMLInputElement>(null)

  function openPicker() {
    hiddenRef.current?.showPicker()
  }

  return (
    <div className="portal-date-wrap" style={style}>
      <input
        type="text"
        readOnly
        value={formatDisplay(value)}
        placeholder="DD/MM/YYYY"
        onClick={openPicker}
        className={`${className} portal-date-display`}
      />
      <button type="button" className="portal-date-icon-btn" onClick={openPicker} tabIndex={-1} aria-label="Open calendar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      <input
        ref={hiddenRef}
        type="date"
        value={toIso(value)}
        onChange={e => onChange(fromIso(e.target.value))}
        className="portal-date-hidden"
        tabIndex={-1}
      />
    </div>
  )
}
