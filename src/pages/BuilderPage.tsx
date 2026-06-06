import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSurvey, publishAndGetLink, saveSurvey } from '@/lib/api'
import type { PublicForm, Question, SurveyWithQuestions } from '@/lib/types'
import { QuestionEditor } from '@/components/QuestionEditor'
import { FormRenderer } from '@/components/FormRenderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function newSurvey(): SurveyWithQuestions {
  return {
    id: crypto.randomUUID(),
    title: 'Neue Umfrage',
    description: null,
    type: 'PULSE',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    questions: [newQuestion(1)],
  }
}

function newQuestion(position: number): Question {
  return {
    id: `q-${position}-${Math.floor(position * 1000)}`,
    text: '',
    helpText: null,
    type: 'TEXT',
    category: 'CUSTOM',
    required: false,
    position,
    minimumValue: 1,
    maximumValue: 5,
    maximumLength: 2000,
    analyzeWithAi: false,
    departmentIds: [],
    options: [],
  }
}

export default function BuilderPage() {
  const { id = '' } = useParams()
  const [survey, setSurvey] = useState<SurveyWithQuestions | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (id === 'new') {
      setSurvey(newSurvey())
      return
    }
    getSurvey(id).then(setSurvey)
  }, [id])

  if (!survey) {
    return <div className="text-muted-foreground">Lädt …</div>
  }

  function update(next: SurveyWithQuestions) {
    setSurvey(next)
  }

  const previewForm: PublicForm = {
    campaignId: 'preview',
    surveyId: survey.id,
    title: survey.title,
    description: survey.description,
    surveyType: survey.type,
    expiresAt: '',
    departments: [{ id: 'preview-dept', name: 'Vorschau-Abteilung' }],
    selectedDepartmentId: 'preview-dept',
    questions: survey.questions,
  }

  async function handlePublish() {
    if (!survey) return
    // persist as a published survey so it shows up on the Umfragen list
    await saveSurvey({ ...survey, status: 'PUBLISHED' })
    const result = await publishAndGetLink(survey.id)
    setLink(result.url)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="flex flex-col gap-4">
        <Input
          value={survey.title}
          onChange={(e) => update({ ...survey, title: e.target.value })}
          className="text-lg font-semibold"
        />
        {survey.questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            onChange={(next) =>
              update({
                ...survey,
                questions: survey.questions.map((x, j) => (j === i ? next : x)),
              })
            }
            onDelete={() =>
              update({
                ...survey,
                questions: survey.questions.filter((_, j) => j !== i),
              })
            }
          />
        ))}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              update({
                ...survey,
                questions: [...survey.questions, newQuestion(survey.questions.length + 1)],
              })
            }
          >
            Frage hinzufügen
          </Button>
          <Button onClick={handlePublish}>Veröffentlichen und Link erhalten</Button>
        </div>
      </section>

      <section className="rounded-lg border bg-muted/30 p-4">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Live-Vorschau</h2>
        <FormRenderer
          form={previewForm}
          answers={{}}
          errors={{}}
          onDepartmentChange={() => {}}
          onAnswerChange={() => {}}
        />
      </section>

      <Dialog open={link !== null} onOpenChange={(open) => !open && setLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Einladungslink</DialogTitle>
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
