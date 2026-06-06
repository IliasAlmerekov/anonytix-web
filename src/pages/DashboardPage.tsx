import { useEffect, useState } from 'react'
import { getDashboardOverview } from '@/lib/api'
import type { DashboardOverview } from '@/lib/types'
import { KpiCards } from '@/components/charts/KpiCards'
import { SentimentChart } from '@/components/charts/SentimentChart'
import { CategoryScoresChart } from '@/components/charts/CategoryScoresChart'
import { SatisfactionTrendChart } from '@/components/charts/SatisfactionTrendChart'
import { DepartmentHeatmap } from '@/components/charts/DepartmentHeatmap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null)

  useEffect(() => {
    getDashboardOverview().then(setData)
  }, [])

  if (!data) return <p className="text-muted-foreground">Lädt …</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{data.campaign.name}</h1>
        <p className="text-muted-foreground">
          {data.company.name} · {data.sampleSize} Antworten
        </p>
      </div>

      <KpiCards kpis={data.kpis} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SentimentChart data={data.sentimentDistribution} />
        <CategoryScoresChart data={data.categoryScores} />
      </div>

      <SatisfactionTrendChart data={data.satisfactionTrend} />
      <DepartmentHeatmap rows={data.departmentHeatmap} />

      <Card>
        <CardHeader>
          <CardTitle>KI-Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p>{data.aiSummary.summary}</p>
          <p className="text-xs text-muted-foreground">{data.aiSummary.disclaimer}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empfohlene Maßnahmen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.recommendedActions.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 border-b pb-3 last:border-0">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Badge variant={a.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                  {a.priority}
                </Badge>
                <Badge variant="outline">{a.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
