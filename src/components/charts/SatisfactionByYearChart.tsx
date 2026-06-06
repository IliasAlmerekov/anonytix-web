import * as React from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import type { SatisfactionYearRow } from '@/lib/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const YEAR_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

const ALL = 'all'

export function SatisfactionByYearChart({ data }: { data: SatisfactionYearRow[] }) {
  const years = React.useMemo(
    () => (data[0] ? Object.keys(data[0]).filter((k) => k !== 'month') : []),
    [data],
  )

  const config = React.useMemo(() => {
    const c: ChartConfig = {}
    years.forEach((y, i) => {
      c[y] = { label: y, color: YEAR_COLORS[i % YEAR_COLORS.length] }
    })
    return c
  }, [years])

  const [selectedYear, setSelectedYear] = React.useState<string>(ALL)

  const visibleYears =
    selectedYear === ALL ? years : years.filter((y) => y === selectedYear)

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-col gap-1">
          <CardTitle>Zufriedenheitstrend</CardTitle>
          <CardDescription>
            Durchschnittliche Zufriedenheit pro Monat im Jahresvergleich
          </CardDescription>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[160px] sm:ml-auto" aria-label="Jahr auswählen">
            <SelectValue placeholder="Jahr" />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" align="end">
            <SelectItem value={ALL}>Alle Jahre</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
            />
            <YAxis domain={[0, 5]} width={32} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent className="w-[160px]" />} />
            {visibleYears.length > 1 && (
              <ChartLegend content={<ChartLegendContent />} />
            )}
            {visibleYears.map((year) => (
              <Line
                key={year}
                dataKey={year}
                type="monotone"
                stroke={`var(--color-${year})`}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
