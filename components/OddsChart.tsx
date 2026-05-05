'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'

interface OddsPoint {
  yes_pct: number
  created_at: string
}

interface OddsChartProps {
  history: OddsPoint[]
  status: string
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const yes = payload[0]?.value as number
  const no = 100 - yes
  return (
    <div className="rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-xs shadow-xl">
      <p className="text-[#555] mb-1.5">{label}</p>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 font-bold text-[#22c55e]">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" />
          YES {yes}%
        </span>
        <span className="flex items-center gap-1 font-bold text-[#ef4444]">
          <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block" />
          NO {no}%
        </span>
      </div>
    </div>
  )
}

export default function OddsChart({ history, status }: OddsChartProps) {
  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[#555]">
        No trades yet — odds start at 50/50
      </div>
    )
  }

  const data = history.map(p => ({
    yes: p.yes_pct,
    time: format(parseISO(p.created_at), 'MMM d, h:mm a'),
  }))

  const current = data[data.length - 1].yes
  const lineColor = current > 50 ? '#22c55e' : current < 50 ? '#ef4444' : '#6366f1'
  const fillId = 'odds-fill'

  return (
    <div>
      {/* Current prob header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-xs text-[#555] uppercase tracking-wider mb-1">YES probability</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums" style={{ color: lineColor }}>{current}%</span>
            <Trend history={data.map(d => d.yes)} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#555] uppercase tracking-wider mb-1">NO probability</p>
          <span className="text-2xl font-bold text-[#ef4444] tabular-nums">{100 - current}%</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#1a1a1a" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#555', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#555', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v}%`}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333', strokeWidth: 1 }} />
          <ReferenceLine y={50} stroke="#2a2a2a" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="yes"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${fillId})`}
            dot={false}
            activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-2 text-xs text-[#555]">
        <span>{data.length} data point{data.length !== 1 ? 's' : ''}</span>
        <span>Each point = one bet placed</span>
      </div>
    </div>
  )
}

function Trend({ history }: { history: number[] }) {
  if (history.length < 2) return null
  const delta = history[history.length - 1] - history[0]
  if (delta === 0) return <span className="text-sm text-[#555]">→ flat</span>
  return (
    <span className={`text-sm font-medium ${delta > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
      {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}pp since open
    </span>
  )
}
