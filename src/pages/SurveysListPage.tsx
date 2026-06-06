import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { listSurveys } from '@/lib/api'
import type { Survey } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PublishState {
  publishedUrl?: string
}

export default function SurveysListPage() {
  const [surveys, setSurveys] = useState<Survey[] | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const publishedUrl = (location.state as PublishState | null)?.publishedUrl ?? null
  const [link, setLink] = useState<string | null>(publishedUrl)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    listSurveys().then(setSurveys)
  }, [])

  // Clear router state so the overlay doesn't reopen on refresh/back.
  useEffect(() => {
    if (publishedUrl) {
      window.history.replaceState({}, '')
    }
  }, [publishedUrl])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Umfragen</h1>
        <Button onClick={() => navigate('/surveys/new')}>
          Umfrage erstellen
        </Button>
      </div>

      {!surveys ? (
        <p className="text-muted-foreground">Lädt …</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-base">{s.title}</CardTitle>
                <Badge variant={s.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                  {s.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/surveys/${s.id}`}>Bearbeiten</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/dashboard">Ergebnisse</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={link !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLink(null)
            setCopied(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Umfrage veröffentlicht</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Teile diesen einen allgemeinen Link mit den Mitarbeitern:
          </p>
          <div className="flex gap-2">
            <Input readOnly value={link ?? ''} />
            <Button
              onClick={() => {
                if (link) navigator.clipboard.writeText(link)
                setCopied(true)
              }}
            >
              {copied ? 'Kopiert' : 'Kopieren'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
