import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiException, getPublicForm, submitFeedback } from '@/lib/api'
import { buildAnswerRequests, validateAnswers } from '@/lib/form-logic'
import type { FormAnswers, FormAnswerValue } from '@/lib/form-logic'
import type { PublicForm } from '@/lib/types'
import { FormRenderer } from '@/components/FormRenderer'
import { AnonymityPanel } from '@/components/AnonymityPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PublicFormPage() {
  const { token = '' } = useParams()
  const [form, setForm] = useState<PublicForm | null>(null)
  const [answers, setAnswers] = useState<FormAnswers>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getPublicForm(token)
      .then(setForm)
      .catch((e) =>
        setLoadError(
          e instanceof ApiException ? e.error.code : 'INTERNAL_ERROR',
        ),
      )
  }, [token])

  async function handleDepartmentChange(departmentId: string) {
    setErrors({})
    setAnswers({}) // discard answers to questions that may no longer be visible
    const next = await getPublicForm(token, departmentId)
    setForm(next)
  }

  function handleAnswerChange(questionId: string, value: FormAnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    if (!form?.selectedDepartmentId) return
    const validation = validateAnswers(form.questions, answers)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return
    setSubmitting(true)
    try {
      await submitFeedback(token, {
        departmentId: form.selectedDepartmentId,
        answers: buildAnswerRequests(form.questions, answers),
      })
      setDone(true)
    } catch (e) {
      setLoadError(e instanceof ApiException ? e.error.code : 'INTERNAL_ERROR')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    const messages: Record<string, string> = {
      INVITATION_NOT_FOUND: 'Dieser Link ist ungültig.',
      INVITATION_EXPIRED: 'Dieser Link ist abgelaufen.',
      INVITATION_ALREADY_USED: 'Dieser Link wurde bereits verwendet.',
      INTERNAL_ERROR: 'Etwas ist schiefgelaufen. Bitte später erneut versuchen.',
    }
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <h1 className="text-xl font-semibold">Formular nicht verfügbar</h1>
        <p className="mt-2 text-muted-foreground">
          {messages[loadError] ?? messages.INTERNAL_ERROR}
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold">Danke!</h1>
        <p className="mt-2 text-muted-foreground">
          Dein Feedback wurde erfolgreich und anonym übermittelt.
        </p>
      </div>
    )
  }

  if (!form) {
    return <div className="px-4 py-12 text-center text-muted-foreground">Lädt …</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          {form.description && (
            <p className="text-sm text-muted-foreground">{form.description}</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <AnonymityPanel />
          <FormRenderer
            form={form}
            answers={answers}
            errors={errors}
            onDepartmentChange={handleDepartmentChange}
            onAnswerChange={handleAnswerChange}
          />
          <Button
            onClick={handleSubmit}
            disabled={!form.selectedDepartmentId || submitting}
            className="self-start"
          >
            {submitting ? 'Sendet …' : 'Anonym absenden'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
