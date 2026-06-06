import { Link } from 'react-router-dom'
import type { HeatmapRow } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const CATEGORIES = ['LEADERSHIP', 'WORKLOAD', 'COMMUNICATION', 'TEAMWORK'] as const
const LABELS: Record<string, string> = {
  LEADERSHIP: 'Führung',
  WORKLOAD: 'Belastung',
  COMMUNICATION: 'Kommunikation',
  TEAMWORK: 'Team',
}

function cellColor(score: number): string {
  if (score >= 4) return 'bg-emerald-500/20 text-emerald-700'
  if (score >= 3) return 'bg-amber-500/20 text-amber-700'
  return 'bg-red-500/20 text-red-700'
}

export function DepartmentHeatmap({ rows }: { rows: HeatmapRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Abteilungs-Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="p-2">Abteilung</th>
              {CATEGORIES.map((c) => (
                <th key={c} className="p-2">{LABELS[c]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.departmentId} className="border-t">
                <td className="p-2 font-medium">
                  {row.suppressed ? (
                    row.departmentName
                  ) : (
                    <Link
                      className="hover:underline"
                      to={`/dashboard/departments/${row.departmentId}`}
                    >
                      {row.departmentName}
                    </Link>
                  )}
                </td>
                {row.suppressed || !row.scores ? (
                  <td colSpan={CATEGORIES.length} className="p-2 text-muted-foreground">
                    Nicht genügend Daten
                  </td>
                ) : (
                  CATEGORIES.map((c) => (
                    <td key={c} className="p-2">
                      <span className={cn('rounded px-2 py-1', cellColor(row.scores![c] ?? 0))}>
                        {row.scores![c]?.toFixed(1) ?? '–'}
                      </span>
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
