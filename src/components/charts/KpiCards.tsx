import type { Kpi } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatValue(kpi: Kpi): string {
  if (kpi.unit === 'PERCENT') return `${kpi.value}%`
  if (kpi.unit === 'OUT_OF_5') return `${kpi.value} / 5`
  return String(kpi.value)
}

export function KpiCards({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatValue(kpi)}</div>
            {kpi.change !== undefined && (
              <p
                className={
                  kpi.change < 0 ? 'text-sm text-destructive' : 'text-sm text-emerald-600'
                }
              >
                {kpi.change > 0 ? '+' : ''}
                {kpi.change} {kpi.changeLabel ?? ''}
              </p>
            )}
            {kpi.detail && (
              <p className="text-sm text-muted-foreground">{kpi.detail}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
