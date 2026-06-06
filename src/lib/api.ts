import { API_BASE_URL, COMPANY_ID, USE_MOCKS } from '@/lib/config'
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
  DashboardOverview,
  Department,
  DepartmentDashboard,
  PublicForm,
  PublishResult,
  SubmissionResponse,
  SubmitFeedbackRequest,
  Survey,
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
  return apiFetch(`/companies/${COMPANY_ID}/surveys/${id}`)
}

/** Persist a survey created/edited in the builder (mock mode → localStorage). */
export async function saveSurvey(survey: SurveyWithQuestions): Promise<void> {
  if (USE_MOCKS) {
    saveSurveyToStore(survey)
    return
  }
  // live mode: granular question CRUD is wired up later (see plan notes §5)
}

export async function listDepartments(): Promise<Department[]> {
  if (USE_MOCKS) return loadMock<Department[]>('departments.json')
  return apiFetch(`/companies/${COMPANY_ID}/departments`)
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
  await apiFetch(`/companies/${COMPANY_ID}/surveys/${surveyId}/publish`, { method: 'POST' })
  const campaign = await apiFetch<{ id: string }>(`/companies/${COMPANY_ID}/campaigns`, {
    method: 'POST',
    body: JSON.stringify({ surveyId, name: 'Kampagne', startsAt: null, endsAt: null }),
  })
  await apiFetch(`/companies/${COMPANY_ID}/campaigns/${campaign.id}/activate`, { method: 'POST' })
  const batch = await apiFetch<{ campaignId: string; invitations: { url: string; expiresAt: string }[] }>(
    `/companies/${COMPANY_ID}/campaigns/${campaign.id}/invitations`,
    { method: 'POST', body: JSON.stringify({ expiresAt: null }) },
  )
  const first = batch.invitations[0]
  const token = first.url.split('/').pop() ?? ''
  return { campaignId: batch.campaignId, url: first.url, token, expiresAt: first.expiresAt }
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
      message: 'Vielen Dank. Dein Feedback wurde erfolgreich und anonym übermittelt.',
    }
  }
  return apiFetch(`/public/invitations/${token}/submissions`, {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

// ---------- dashboard ----------

export async function getDashboardOverview(
  campaignId?: string,
): Promise<DashboardOverview> {
  if (USE_MOCKS) return loadMock<DashboardOverview>('dashboard-overview.json')
  return apiFetch(`/companies/${COMPANY_ID}/dashboard/overview?campaignId=${campaignId ?? ''}`)
}

export async function getDepartmentDashboard(
  departmentId: string,
  campaignId?: string,
): Promise<DepartmentDashboard> {
  if (USE_MOCKS) return loadMock<DepartmentDashboard>('department-dashboard.json')
  return apiFetch(
    `/companies/${COMPANY_ID}/dashboard/departments/${departmentId}?campaignId=${campaignId ?? ''}`,
  )
}

export { countSubmissions }
