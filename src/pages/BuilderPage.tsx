import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { getSurvey, getSurveyTemplate, publishAndGetLink, saveSurvey } from '@/lib/api'
import { USE_MOCKS } from '@/lib/config'
import type { PublicForm, Question, SurveyWithQuestions } from '@/lib/types'
import { QuestionEditor } from '@/components/QuestionEditor'
import { FormRenderer } from '@/components/FormRenderer'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** Turn the standard template into a fresh, independently editable survey. */
function instantiateTemplate(template: SurveyWithQuestions): SurveyWithQuestions {
  return {
    ...template,
    id: crypto.randomUUID(),
    title: 'New survey',
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
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id === 'new') {
      // In live mode getSurveyTemplate already creates a real DRAFT with real
      // survey/question ids — use it as-is so edits map to the backend. In mock
      // mode it's a static template, so clone it into a fresh editable survey.
      getSurveyTemplate().then((tpl) =>
        setSurvey(USE_MOCKS ? instantiateTemplate(tpl) : tpl),
      )
      return
    }
    getSurvey(id).then(setSurvey)
  }, [id])

  const sensors = useSensors(
    // Small threshold so clicks on fields inside the card don't start a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!survey) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  function update(next: SurveyWithQuestions) {
    setSurvey(next)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!survey || !over || active.id === over.id) return
    const oldIndex = survey.questions.findIndex((q) => q.id === active.id)
    const newIndex = survey.questions.findIndex((q) => q.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(survey.questions, oldIndex, newIndex).map(
      (q, i) => ({ ...q, position: i + 1 }),
    )
    update({ ...survey, questions: reordered })
  }

  const previewForm: PublicForm = {
    campaignId: 'preview',
    surveyId: survey.id,
    title: survey.title,
    description: survey.description,
    surveyType: survey.type,
    expiresAt: '',
    departments: [{ id: 'preview-dept', name: 'Preview department' }],
    selectedDepartmentId: 'preview-dept',
    questions: survey.questions,
  }

  async function handlePublish() {
    if (!survey) return
    setPublishing(true)
    setError(null)
    try {
      // Persist edits (mock → localStorage; live → reconcile questions on the
      // draft), then publish + create a campaign + invitation to get the link.
      await saveSurvey({ ...survey, status: 'PUBLISHED' })
      const result = await publishAndGetLink(survey.id)
      // Hand off to the Surveys list, which shows the link overlay.
      navigate('/', { state: { publishedUrl: result.url } })
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : 'Could not publish the survey.',
      )
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="flex flex-col gap-4">
        <Input
          value={survey.title}
          onChange={(e) => update({ ...survey, title: e.target.value })}
          className="text-lg font-semibold"
        />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={survey.questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-4">
              {survey.questions.map((q, i) => (
                <Reveal key={q.id} index={i} step={45}>
                  <QuestionEditor
                    question={q}
                    onChange={(next) =>
                      update({
                        ...survey,
                        questions: survey.questions.map((x, j) =>
                          j === i ? next : x,
                        ),
                      })
                    }
                    onDelete={() =>
                      update({
                        ...survey,
                        questions: survey.questions.filter((_, j) => j !== i),
                      })
                    }
                  />
                </Reveal>
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
            Add question
          </Button>
          <Button onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Publishing...' : 'Publish and get link'}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </section>

      <section className="rounded-lg border bg-muted/30 p-4">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Live preview</h2>
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
