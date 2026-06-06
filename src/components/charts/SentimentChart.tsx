import { Pie, PieChart } from 'recharts'
import type { SentimentSlice } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const config = {
  POSITIVE: { label: 'Positiv', color: 'var(--chart-2)' },
  NEUTRAL: { label: 'Neutral', color: 'var(--chart-3)' },
  NEGATIVE: { label: 'Negativ', color: 'var(--chart-5)' },
} satisfies ChartConfig

export function SentimentChart({ data }: { data: SentimentSlice[] }) {
  const chartData = data.map((d) => ({
    sentiment: d.sentiment,
    count: d.count,
    fill: `var(--color-${d.sentiment})`,
  }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stimmungsverteilung</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-64">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="sentiment" />} />
            <Pie data={chartData} dataKey="count" nameKey="sentiment" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
