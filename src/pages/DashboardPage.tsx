import { useEffect, useMemo, useState } from 'react'
import { getDashboardOverview } from '@/lib/api'
import type { DashboardOverview } from '@/lib/types'
import { KpiCards } from '@/components/charts/KpiCards'
import { SentimentChart } from '@/components/charts/SentimentChart'
import { MonthlyFeedbackChart } from '@/components/charts/MonthlyFeedbackChart'
import { SatisfactionByYearChart } from '@/components/charts/SatisfactionByYearChart'
import { DepartmentHeatmap } from '@/components/charts/DepartmentHeatmap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [year, setYear] = useState<string>('')

  useEffect(() => {
    getDashboardOverview().then((d) => {
      setData(d)
      // default to the most recent year
      const years = d.years ?? []
      setYear(years[years.length - 1] ?? '')
    })
  }, [])

  const years = data?.years ?? []
  // Per-year slice overrides the top-level snapshot when available.
  const view = useMemo(() => {
    const slice = data?.byYear?.[year]
    return {
      sampleSize: slice?.sampleSize ?? data?.sampleSize ?? 0,
      kpis: (slice?.kpis ?? data?.kpis ?? []).slice(0, 4),
      sentiment: slice?.sentimentDistribution ?? data?.sentimentDistribution ?? [],
      feedbackByMonth: slice?.feedbackByMonth ?? data?.feedbackByMonth,
    }
  }, [data, year])

  if (!data) return <p className="text-muted-foreground">Lädt …</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{data.campaign.name}</h1>
          <p className="text-muted-foreground">
            {data.company.name} · {view.sampleSize} Antworten
            {year && ` · ${year}`}
          </p>
        </div>
        {years.length > 0 && (
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[140px]" aria-label="Jahr auswählen">
              <SelectValue placeholder="Jahr" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="end">
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <KpiCards kpis={view.kpis} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SentimentChart data={view.sentiment} />
        {view.feedbackByMonth && <MonthlyFeedbackChart data={view.feedbackByMonth} />}
      </div>

      {data.satisfactionByYear && (
        <SatisfactionByYearChart data={data.satisfactionByYear} />
      )}
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
