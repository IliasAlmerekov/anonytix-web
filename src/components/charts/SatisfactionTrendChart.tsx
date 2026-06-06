import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import type { TrendPoint } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const config = {
  score: { label: 'Zufriedenheit', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function SatisfactionTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zufriedenheitstrend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="max-h-72 w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => (v ?? '').slice(0, 3)}
            />
            <YAxis domain={[0, 5]} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="score" stroke="var(--color-score)" strokeWidth={2} dot />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
