interface OddsSparklineProps {
  history: number[] // yes_pct values chronologically
  width?: number
  height?: number
}

export default function OddsSparkline({ history, width = 120, height = 36 }: OddsSparklineProps) {
  if (history.length < 2) {
    // Just a flat 50% line
    const mid = height / 2
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1={0} y1={mid} x2={width} y2={mid} stroke="#3f3f46" strokeWidth={1} strokeDasharray="3 3" />
      </svg>
    )
  }

  const pad = 2
  const w = width - pad * 2
  const h = height - pad * 2

  const pts = history.map((v, i) => {
    const x = pad + (i / (history.length - 1)) * w
    const y = pad + (1 - v / 100) * h
    return [x, y] as [number, number]
  })

  const pathD = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L${pts[pts.length - 1][0].toFixed(1)},${(pad + h).toFixed(1)} L${pad},${(pad + h).toFixed(1)} Z`

  const last = history[history.length - 1]
  const trend = last > 50 ? 'yes' : last < 50 ? 'no' : 'even'
  const lineColor = trend === 'yes' ? '#22c55e' : trend === 'no' ? '#ef4444' : '#6366f1'
  const fillId = `fill-${Math.random().toString(36).slice(2)}`
  const midY = pad + (1 - 0.5) * h

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} overflow="visible">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {/* 50% reference */}
      <line x1={pad} y1={midY} x2={pad + w} y2={midY} stroke="#2a2a2a" strokeWidth={1} strokeDasharray="3 3" />
      {/* Area fill */}
      <path d={areaD} fill={`url(#${fillId})`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Current dot */}
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill={lineColor} />
    </svg>
  )
}
