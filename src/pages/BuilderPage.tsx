import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSurvey, getSurveyTemplate, publishAndGetLink, saveSurvey } from '@/lib/api'
import type { PublicForm, Question, SurveyWithQuestions } from '@/lib/types'
import { QuestionEditor } from '@/components/QuestionEditor'
import { FormRenderer } from '@/components/FormRenderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** Turn the standard template into a fresh, independently editable survey. */
function instantiateTemplate(template: SurveyWithQuestions): SurveyWithQuestions {
  return {
    ...template,
    id: crypto.randomUUID(),
    title: 'Neue Umfrage',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    questions: template.questions.map((q) => ({
      ...q,
      id: crypto.randomUUID(),
      options: q.options.map((o) => ({ ...o, id: crypto.randomUUID() })),
    })),
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
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<SurveyWithQuestions | null>(null)

  useEffect(() => {
    if (id === 'new') {
      getSurveyTemplate().then((tpl) => setSurvey(instantiateTemplate(tpl)))
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
    // hand off to the Umfragen list, which shows the link overlay
    navigate('/', { state: { publishedUrl: result.url } })
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
    </div>
  )
}
