import type { SubmitFeedbackRequest, Survey, SurveyWithQuestions } from '@/lib/types'

const SUBMISSIONS_KEY = 'anonytix:submissions'
const SURVEYS_KEY = 'anonytix:surveys'

interface StoredSubmission {
  campaignId: string
  departmentId: string
  submittedAt: string
}

function read(): StoredSubmission[] {
  const raw = localStorage.getItem(SUBMISSIONS_KEY)
  return raw ? (JSON.parse(raw) as StoredSubmission[]) : []
}

function write(items: StoredSubmission[]): void {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(items))
}

export function saveSubmission(
  campaignId: string,
  req: SubmitFeedbackRequest,
  submittedAt = '2026-06-06T12:30:00Z',
): void {
  const items = read()
  items.push({ campaignId, departmentId: req.departmentId, submittedAt })
  write(items)
}

export function countSubmissions(campaignId: string): number {
  return read().filter((s) => s.campaignId === campaignId).length
}

export function resetStore(): void {
  localStorage.removeItem(SUBMISSIONS_KEY)
  localStorage.removeItem(SURVEYS_KEY)
}

// ----- surveys created/published in the builder -----

function readSurveys(): SurveyWithQuestions[] {
  const raw = localStorage.getItem(SURVEYS_KEY)
  return raw ? (JSON.parse(raw) as SurveyWithQuestions[]) : []
}

/** Upsert a survey by id, so it shows up on the Umfragen list. */
export function saveSurvey(survey: SurveyWithQuestions): void {
  const items = readSurveys()
  const idx = items.findIndex((s) => s.id === survey.id)
  if (idx >= 0) items[idx] = survey
  else items.push(survey)
  localStorage.setItem(SURVEYS_KEY, JSON.stringify(items))
}

export function getSavedSurvey(id: string): SurveyWithQuestions | undefined {
  return readSurveys().find((s) => s.id === id)
}

/** Saved surveys as list items (newest first), excluding any in `excludeIds`. */
export function listSavedSurveys(excludeIds: string[] = []): Survey[] {
  return readSurveys()
    .filter((s) => !excludeIds.includes(s.id))
    .map(({ questions: _questions, ...survey }) => survey)
    .reverse()
}
