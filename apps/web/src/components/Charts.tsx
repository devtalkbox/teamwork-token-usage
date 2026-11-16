import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyPoint } from '@ttu/core'
import { formatTokens, formatUsd, shortDate } from '../format'

const AXIS = { fontSize: 11, fill: '#8b95a7' }
const TOOLTIP = { borderRadius: 10, border: '1px solid #e6eaf2', fontSize: 12 }

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          className={option.value === value ? 'segmented__btn segmented__btn--on' : 'segmented__btn'}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** 按 source 摊平，用于「详细」模式的堆叠面积 */
function pivotBySource(data: DailyPoint[]): Array<Record<string, number | string>> {
  const sources = [...new Set(data.flatMap((d) => d.sources.map((s) => s.source)))]
  return data.map((point) => {
    const row: Record<string, number | string> = { date: point.date }
    for (const source of sources) {
      row[source] = point.sources.find((s) => s.source === source)?.tokens ?? 0
    }
    return row
  })
}

const SOURCE_COLORS: Record<string, string> = {
  codex: '#2f6fed',
  dsh: '#34a853',
  claude: '#d97757',
  cursor: '#8b95a7',
}
const colorOf = (source: string) => SOURCE_COLORS[source] ?? '#94a3b8'

export function TrendChart({ data, mode }: { data: DailyPoint[]; mode: 'all' | 'detail' }) {
  if (mode === 'detail') {
    const rows = pivotBySource(data)
    const sources = [...new Set(data.flatMap((d) => d.sources.map((s) => s.source)))]
    return (
      <ResponsiveContainer width="100%" height={248}>
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#eef1f6" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis tickFormatter={formatTokens} tick={AXIS} axisLine={false} tickLine={false} width={48} />
          <Tooltip formatter={(value: number, name: string) => [formatTokens(value), name]} contentStyle={TOOLTIP} />
          {sources.map((source) => (
            <Area
              key={source}
              type="monotone"
              dataKey={source}
              stackId="1"
              stroke={colorOf(source)}
              fill={colorOf(source)}
              fillOpacity={0.55}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={248}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f6fed" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#2f6fed" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#eef1f6" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis tickFormatter={formatTokens} tick={AXIS} axisLine={false} tickLine={false} width={48} />
        <Tooltip formatter={(value: number) => [formatTokens(value), 'Token']} contentStyle={TOOLTIP} />
        <Area
          type="monotone"
          dataKey="tokens"
          stroke="#2f6fed"
          strokeWidth={2}
          fill="url(#trendFill)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function DailyChart({ data, mode }: { data: DailyPoint[]; mode: 'token' | 'cost' }) {
  return (
    <ResponsiveContainer width="100%" height={248}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="34%">
        <CartesianGrid stroke="#eef1f6" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={mode === 'cost' ? (v: number) => `$${v.toFixed(0)}` : formatTokens}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            mode === 'cost' ? formatUsd(value) : formatTokens(value),
            name,
          ]}
          contentStyle={TOOLTIP}
        />
        {mode === 'cost' ? (
          <Bar dataKey="costUsd" name="费用" fill="#f5a524" radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive={false} />
        ) : (
          <>
            <Bar dataKey="cachedInputTokens" name="缓存读" stackId="a" fill="#f5a524" maxBarSize={26} isAnimationActive={false} />
            <Bar dataKey="inputTokens" name="输入" stackId="a" fill="#34a853" maxBarSize={26} isAnimationActive={false} />
            <Bar
              dataKey="outputTokens"
              name="输出"
              stackId="a"
              fill="#2f6fed"
              radius={[3, 3, 0, 0]}
              maxBarSize={26}
              isAnimationActive={false}
            />
          </>
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}
