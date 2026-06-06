import { useEffect, useState } from 'react'
import { getDashboardOverview, listCampaigns } from '@/lib/api'
import type { Campaign, DashboardOverview } from '@/lib/types'
import { KpiCards } from '@/components/charts/KpiCards'
import { DepartmentParticipationChart } from '@/components/charts/DepartmentParticipationChart'
import { MonthlyFeedbackChart } from '@/components/charts/MonthlyFeedbackChart'
import { SatisfactionByYearChart } from '@/components/charts/SatisfactionByYearChart'
import { AiHighlightsCard } from '@/components/charts/AiHighlightsCard'
import { DepartmentHeatmap } from '@/components/charts/DepartmentHeatmap'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Reveal } from '@/components/motion/Reveal'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignId, setCampaignId] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listCampaigns().then(setCampaigns).catch(() => setCampaigns([]))
  }, [])

  useEffect(() => {
    let ignore = false
    getDashboardOverview(campaignId || undefined, year || undefined)
      .then((result) => {
        if (!ignore) {
          setData(result)
          setError(null)
        }
      })
      .catch((reason: unknown) => {
        if (!ignore) {
          setError(reason instanceof Error ? reason.message : 'Dashboard could not be loaded.')
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [campaignId, year])

  if (loading && !data) return <p className="text-muted-foreground">Loading...</p>
  if (error && !data) return <p className="text-destructive">{error}</p>
  if (!data) return null

  const years = data.years.map(String)
  const displayedYear = year || String(data.selectedYear)

  return (
    <div className="flex flex-col gap-6">
      <Reveal
        variant="fade"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {data.campaign.name}
          </h1>
          <p className="text-muted-foreground">
            {data.company.name} · {data.sampleSize} responses
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={campaignId || 'AUTO'}
            onValueChange={(value) => {
              setLoading(true)
              setError(null)
              setCampaignId(value === 'AUTO' ? '' : value)
              setYear('')
            }}
          >
            <SelectTrigger className="w-[220px]" aria-label="Select campaign">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="end">
              <SelectItem value="AUTO">Current campaign</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {years.length > 0 && (
            <Select
              value={displayedYear}
              onValueChange={(value) => {
                setLoading(true)
                setError(null)
                setYear(value)
              }}
            >
              <SelectTrigger className="w-[140px]" aria-label="Select year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="end">
                {years.map((availableYear) => (
                  <SelectItem key={availableYear} value={availableYear}>
                    {availableYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Reveal>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <KpiCards kpis={data.kpis.slice(0, 4)} />

      <Reveal variant="up" delay={280} className="grid gap-6 lg:grid-cols-2">
        <DepartmentParticipationChart rows={data.departmentHeatmap} />
        {data.feedbackByMonth && <MonthlyFeedbackChart data={data.feedbackByMonth} />}
      </Reveal>

      <Reveal variant="up" delay={360} className="grid gap-6 lg:grid-cols-3">
        {data.satisfactionByYear && (
          <div className="lg:col-span-2">
            <SatisfactionByYearChart data={data.satisfactionByYear} />
          </div>
        )}
        {data.aiHighlights && (
          <div className="lg:col-span-1">
            <AiHighlightsCard highlights={data.aiHighlights} />
          </div>
        )}
      </Reveal>

      <Reveal variant="up" delay={440}>
        <DepartmentHeatmap
          rows={data.departmentHeatmap}
          campaignId={campaignId || undefined}
          year={year || undefined}
        />
      </Reveal>
    </div>
  )
}
