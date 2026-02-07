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
  const Icon = stat.icon
  const iconCls = ICON_CLASS[stat.color] ?? ICON_CLASS.blue

  return (
    <div className="portal-stat">
      <div className={`portal-stat-icon ${iconCls}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="portal-stat-label">{stat.label}</p>
        <p className="portal-stat-value">{stat.value}</p>
        {stat.change && <p className="portal-stat-change">{stat.change}</p>}
      </div>
    </div>
  )
}
