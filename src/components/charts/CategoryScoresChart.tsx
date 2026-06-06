import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { CategoryScore } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const config = {
  score: { label: 'Aktuell', color: 'var(--chart-1)' },
  previousScore: { label: 'Vorher', color: 'var(--chart-3)' },
} satisfies ChartConfig

export function CategoryScoresChart({
  data,
  title = 'Kategorie-Bewertungen',
}: {
  data: CategoryScore[]
  title?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="max-h-72 w-full">
          <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 16 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" domain={[0, 5]} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="score" fill="var(--color-score)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
