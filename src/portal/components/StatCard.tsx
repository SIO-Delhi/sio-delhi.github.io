import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { DashboardStat } from '../types'

const ICON_CLASS: Record<string, string> = {
  blue: 'portal-stat-icon-red',
  green: 'portal-stat-icon-green',
  amber: 'portal-stat-icon-gold',
  red: 'portal-stat-icon-red',
  slate: 'portal-stat-icon-muted',
  indigo: 'portal-stat-icon-gold',
}

export function StatCard({ stat }: { stat: DashboardStat }) {
  const navigate = useNavigate()
  const Icon = stat.icon
  const iconCls = ICON_CLASS[stat.color] ?? ICON_CLASS.blue
  const clickable = !!stat.to || !!stat.onClick
  const isTextValue = typeof stat.value === 'string' && isNaN(Number(stat.value))

  function handleClick() {
    if (stat.onClick) stat.onClick()
    else if (stat.to) navigate(stat.to)
  }

  return (
    <div
      className={`portal-stat ${clickable ? 'portal-stat-clickable' : ''}`}
      onClick={clickable ? handleClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() } : undefined}
    >
      <div className={`portal-stat-icon ${iconCls}`}>
        <Icon size={20} />
      </div>
      <div className="portal-stat-body">
        <p className="portal-stat-label">{stat.label}</p>
        <p className={`portal-stat-value ${isTextValue ? 'portal-stat-value-text' : ''}`}>{stat.value}</p>
        {stat.change && <p className="portal-stat-change">{stat.change}</p>}
      </div>
      {clickable && (
        <div className="portal-stat-arrow">
          <ChevronRight size={16} />
        </div>
      )}
    </div>
  )
}
