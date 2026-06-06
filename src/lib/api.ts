import {
  API_BASE_URL,
  COMPANY_ID,
  USE_DASHBOARD_MOCKS,
  USE_MOCKS,
} from '@/lib/config'
import { filterQuestionsForDepartment } from '@/lib/form-logic'
import {
  countSubmissions,
  getSavedSurvey,
  listSavedSurveys,
  saveSubmission,
  saveSurvey as saveSurveyToStore,
} from '@/lib/mock-store'
import type {
  ApiError,
  Campaign,
  DashboardOverview,
  Department,
  DepartmentDashboard,
  PublicForm,
  PublishResult,
  Question,
  QuestionType,
  SubmissionResponse,
  SubmitFeedbackRequest,
  Survey,
  SurveyStatus,
  SurveyType,
  SurveyWithQuestions,
} from '@/lib/types'

// ---------- shared helpers ----------

export class ApiException extends Error {
  readonly error: ApiError
  constructor(error: ApiError) {
    super(error.message)
    this.error = error
  }
}

async function loadMock<T>(file: string): Promise<T> {
  const res = await fetch(`/mocks/${file}`)
  if (!res.ok) {
    throw new ApiException({
      timestamp: '',
      status: res.status,
      code: 'RESOURCE_NOT_FOUND',
      message: `Mock ${file} fehlt`,
      path: file,
    })
  }
  return (await res.json()) as T
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiException(body as ApiError)
  return body as T
}

// ---------- pure composition (tested) ----------

export function buildPublicForm(
  campaignId: string,
  survey: SurveyWithQuestions,
  departments: Department[],
  departmentId: string | null,
): PublicForm {
  return {
    campaignId,
    surveyId: survey.id,
    title: survey.title,
    description: survey.description,
    surveyType: survey.type,
    expiresAt: '2026-06-20T21:59:59Z',
    departments,
    selectedDepartmentId: departmentId,
    questions: filterQuestionsForDepartment(survey.questions, departmentId),
  }
}

const DEMO_CAMPAIGN_ID = '93b6108f-f005-4f4b-8ce9-952fa0a7ddc4'

// Default server-side template used to seed a brand-new survey in live mode.
const DEFAULT_TEMPLATE_KEY = 'EMPLOYEE_SATISFACTION'

// ---------- live <-> model mapping for the survey builder ----------

interface QuestionApiResponse {
  id: string
  text: string
  helpText: string | null
  type: QuestionType
  category: string
  required: boolean
  position: number
  minimumValue: number | null
  maximumValue: number | null
  maximumLength: number | null
  analyzeWithAi: boolean
  departmentIds: string[]
  options: { id: string; label: string; value: string; position: number }[]
}

interface SurveyApiResponse {
  id: string
  title: string
  type: SurveyType
  status: SurveyStatus
  version: number
  description: string | null
  questions: QuestionApiResponse[]
}

/** Map a backend SurveyResponse to the frontend SurveyWithQuestions model. */
function toSurveyModel(r: SurveyApiResponse): SurveyWithQuestions {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    type: r.type,
    status: r.status,
    // SurveyResponse has no createdAt; the builder doesn't display it.
    createdAt: new Date().toISOString(),
    questions: (r.questions ?? []).map((q) => ({
      id: q.id,
      text: q.text,
      helpText: q.helpText ?? null,
      type: q.type,
      category: q.category,
      required: q.required,
      position: q.position,
      minimumValue: q.minimumValue ?? null,
      maximumValue: q.maximumValue ?? null,
      maximumLength: q.maximumLength ?? null,
      analyzeWithAi: q.analyzeWithAi,
      departmentIds: q.departmentIds ?? [],
      options: (q.options ?? []).map((o) => ({
        id: o.id,
        label: o.label,
        value: o.value,
        position: o.position,
      })),
    })),
  }
}

/** Map a frontend Question to the backend QuestionWriteRequest body. */
function toQuestionWriteRequest(q: Question) {
  return {
    text: q.text,
    helpText: q.helpText,
    type: q.type,
    category: q.category,
    required: q.required,
    minimumValue: q.minimumValue,
    maximumValue: q.maximumValue,
    maximumLength: q.maximumLength,
    analyzeWithAi: q.analyzeWithAi,
    departmentIds: q.departmentIds,
    options: q.options.map((o, i) => ({
      label: o.label,
      value: o.value,
      position: o.position || i + 1,
    })),
  }
}

// ---------- HR: surveys + departments ----------

export async function listSurveys(): Promise<Survey[]> {
  if (USE_MOCKS) {
    const seed = await loadMock<Survey[]>('surveys.json')
    const saved = listSavedSurveys(seed.map((s) => s.id))
    // saved (created in the builder) on top, seed surveys below
    return [...saved, ...seed]
  }
  return apiFetch(`/companies/${COMPANY_ID}/surveys`)
}

export async function getSurvey(id: string): Promise<SurveyWithQuestions> {
  if (USE_MOCKS) {
    return getSavedSurvey(id) ?? loadMock<SurveyWithQuestions>('survey-detail.json')
  }
  return toSurveyModel(
    await apiFetch<SurveyApiResponse>(`/companies/${COMPANY_ID}/surveys/${id}`),
  )
}

/**
 * Seed a new survey for the builder.
 * Mock mode → static template JSON. Live mode → the backend has no template
 * GET endpoint; it materialises a template only when a survey is created, so we
 * create a real DRAFT survey from the standard template and return it (with
 * real survey + question ids the builder then edits in place).
 */
export async function getSurveyTemplate(): Promise<SurveyWithQuestions> {
  if (USE_MOCKS) return loadMock<SurveyWithQuestions>('survey-detail.json')
  const created = await apiFetch<SurveyApiResponse>(
    `/companies/${COMPANY_ID}/surveys`,
    {
      method: 'POST',
      body: JSON.stringify({
        title: 'New survey',
        description: null,
        type: 'PULSE',
        templateKey: DEFAULT_TEMPLATE_KEY,
      }),
    },
  )
  return toSurveyModel(created)
}

/**
 * Persist a survey created/edited in the builder.
 * Mock mode → localStorage. Live mode → reconcile the draft on the backend:
 * delete the current questions, re-create them from the edited state in order,
 * then patch the survey meta. The survey must already exist (created via
 * getSurveyTemplate / getSurvey) and still be a DRAFT.
 */
export async function saveSurvey(survey: SurveyWithQuestions): Promise<void> {
  if (USE_MOCKS) {
    saveSurveyToStore(survey)
    return
  }

  const base = `/companies/${COMPANY_ID}/surveys/${survey.id}`
  const current = await apiFetch<SurveyApiResponse>(base)

  // Replace the server-side question set with the edited one (sequential to
  // keep positions deterministic and stay within the draft's active set).
  for (const q of current.questions ?? []) {
    await apiFetch(`${base}/questions/${q.id}`, { method: 'DELETE' })
  }
  const createdIds: string[] = []
  for (const q of survey.questions) {
    const created = await apiFetch<{ id: string }>(`${base}/questions`, {
      method: 'POST',
      body: JSON.stringify(toQuestionWriteRequest(q)),
    })
    createdIds.push(created.id)
  }
  if (createdIds.length > 0) {
    await apiFetch(`${base}/questions/order`, {
      method: 'PUT',
      body: JSON.stringify({ questionIds: createdIds }),
    })
  }

  // Title/description is secondary — don't let a failure here block publishing
  // the questions (older backends 500 on this PATCH; the survey is still usable).
  try {
    await apiFetch(base, {
      method: 'PATCH',
      body: JSON.stringify({
        title: survey.title,
        description: survey.description,
      }),
    })
  } catch (reason) {
    console.warn('Survey title/description not saved:', reason)
  }
}

export async function listDepartments(): Promise<Department[]> {
  if (USE_MOCKS) return loadMock<Department[]>('departments.json')
  return apiFetch(`/companies/${COMPANY_ID}/departments`)
}

export async function listCampaigns(): Promise<Campaign[]> {
  if (USE_DASHBOARD_MOCKS) {
    const dashboard = await loadMock<DashboardOverview>('dashboard-overview.json')
    return [{
      id: dashboard.campaign.id,
      surveyId: '',
      name: dashboard.campaign.name,
      startsAt: dashboard.campaign.startsAt,
      endsAt: dashboard.campaign.endsAt,
      status: 'ACTIVE',
    }]
  }
  return apiFetch(`/companies/${COMPANY_ID}/campaigns`)
}

/** publish → create campaign → activate → generate ONE invitation → return link. */
export async function publishAndGetLink(surveyId: string): Promise<PublishResult> {
  if (USE_MOCKS) {
    const token = 'demo-token'
    return {
      campaignId: DEMO_CAMPAIGN_ID,
      url: `${window.location.origin}/feedback/${token}`,
      token,
      expiresAt: '2026-06-20T21:59:59Z',
    }
  }
  // Campaign window: now .. +90d. Both dates are required by the backend and
  // endsAt must be strictly after startsAt; the invitation must expire no later
  // than endsAt and in the future — so we reuse endsAt for the invitation.
  const startsAt = new Date().toISOString()
  const endsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  await apiFetch(`/companies/${COMPANY_ID}/surveys/${surveyId}/publish`, { method: 'POST' })
  const campaign = await apiFetch<{ id: string }>(`/companies/${COMPANY_ID}/campaigns`, {
    method: 'POST',
    body: JSON.stringify({ surveyId, name: 'Campaign', startsAt, endsAt }),
  })
  await apiFetch(`/companies/${COMPANY_ID}/campaigns/${campaign.id}/activate`, { method: 'POST' })
  // The endpoint returns a single InvitationResponse: { campaignId, token, url, expiresAt }.
  const invitation = await apiFetch<{
    campaignId: string
    token: string
    url: string
    expiresAt: string
  }>(`/companies/${COMPANY_ID}/campaigns/${campaign.id}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ expiresAt: endsAt }),
  })
  return {
    campaignId: invitation.campaignId,
    url: invitation.url,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
  }
}

// ---------- public form ----------

export async function getPublicForm(
  token: string,
  departmentId?: string,
): Promise<PublicForm> {
  if (USE_MOCKS) {
    const [survey, departments] = await Promise.all([
      loadMock<SurveyWithQuestions>('survey-detail.json'),
      loadMock<Department[]>('departments.json'),
    ])
    return buildPublicForm(DEMO_CAMPAIGN_ID, survey, departments, departmentId ?? null)
  }
  const query = departmentId ? `?departmentId=${departmentId}` : ''
  return apiFetch(`/public/invitations/${token}/form${query}`)
}

export async function submitFeedback(
  token: string,
  req: SubmitFeedbackRequest,
): Promise<SubmissionResponse> {
  if (USE_MOCKS) {
    saveSubmission(DEMO_CAMPAIGN_ID, req)
    return {
      submissionId: 'mock-submission',
      status: 'RECEIVED',
      submittedAt: new Date().toISOString(),
      message: 'Thank you. Your feedback was submitted successfully and anonymously.',
    }
  }
  return apiFetch(`/public/invitations/${token}/submissions`, {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

// ---------- dashboard ----------

export function buildDashboardQuery(
  campaignId?: string,
  year?: string,
): string {
  const query = new URLSearchParams()
  if (campaignId) query.set('campaignId', campaignId)
  if (year) query.set('year', year)
  const value = query.toString()
  return value ? `?${value}` : ''
}

export async function getDashboardOverview(
  campaignId?: string,
  year?: string,
): Promise<DashboardOverview> {
  if (USE_DASHBOARD_MOCKS) {
    return loadMock<DashboardOverview>('dashboard-overview.json')
  }
  return apiFetch(
    `/companies/${COMPANY_ID}/dashboard/overview${buildDashboardQuery(campaignId, year)}`,
  )
}

export async function getDepartmentDashboard(
  departmentId: string,
  campaignId?: string,
  year?: string,
): Promise<DepartmentDashboard> {
  if (USE_DASHBOARD_MOCKS) {
    return loadMock<DepartmentDashboard>('department-dashboard.json')
  }
  return apiFetch(
    `/companies/${COMPANY_ID}/dashboard/departments/${departmentId}${buildDashboardQuery(campaignId, year)}`,
  )
}

export { countSubmissions }
