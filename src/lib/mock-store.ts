import type { SubmitFeedbackRequest } from '@/lib/types'

const SUBMISSIONS_KEY = 'anonytix:submissions'

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
}
