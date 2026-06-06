// Question types per backend contract
export type QuestionType =
  | 'RATING'
  | 'TEXT'
  | 'BOOLEAN'
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'

export type SurveyStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type SurveyType = 'PULSE' | 'EXIT'
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Department {
  id: string
  name: string
}

export interface QuestionOption {
  id: string
  label: string
  value: string
  position: number
}

export interface Question {
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
  // empty array => question applies to ALL departments
  departmentIds: string[]
  options: QuestionOption[]
}

export interface Survey {
  id: string
  title: string
  description: string | null
  type: SurveyType
  status: SurveyStatus
  createdAt: string
}

export interface SurveyWithQuestions extends Survey {
  questions: Question[]
}

// ----- public form (frontend model, see spec §2 deviation) -----
export interface PublicForm {
  campaignId: string
  surveyId: string
  title: string
  description: string | null
  surveyType: SurveyType
  expiresAt: string
  departments: Department[]
  selectedDepartmentId: string | null
  questions: Question[]
}

// ----- submissions -----
export interface AnswerRequest {
  questionId: string
  numericValue: number | null
  textValue: string | null
  booleanValue: boolean | null
  selectedOptionIds: string[]
}

export interface SubmitFeedbackRequest {
  departmentId: string
  answers: AnswerRequest[]
}

export interface SubmissionResponse {
  submissionId: string
  status: string
  submittedAt: string
  message: string
}

export interface PublishResult {
  campaignId: string
  url: string
  token: string
  expiresAt: string
}

// ----- dashboard -----
export interface Kpi {
  key: string
  label: string
  value: number
  unit: 'OUT_OF_5' | 'PERCENT' | 'COUNT'
  change?: number
  changeLabel?: string
  detail?: string
}

export interface SentimentSlice {
  sentiment: Sentiment
  percentage: number
  count: number
}

export interface CategoryScore {
  category: string
  label: string
  score: number
  previousScore?: number
  companyScore?: number | null
  sampleSize?: number
}

export interface TrendPoint {
  period: string
  label?: string
  score: number
  sampleSize?: number
}

export interface HeatmapRow {
  departmentId: string
  departmentName: string
  sampleSize: number
  suppressed?: boolean
  suppressionReason?: string
  scores: Record<string, number> | null
}

export interface TopTopic {
  id?: string
  category?: string
  label: string
  mentions: number
  sentiment: Sentiment
  priority: Priority
  trendPercentage?: number
}

export interface AiSummary {
  summary: string
  generatedAt: string
  model: string
  disclaimer: string
}

export interface RecommendedAction {
  id: string
  title: string
  description: string
  category: string
  priority: Priority
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE'
  source: string
}

export interface DashboardOverview {
  company: { id: string; name: string }
  campaign: { id: string; name: string; startsAt: string; endsAt: string }
  sampleSize: number
  minimumGroupSize: number
  kpis: Kpi[]
  sentimentDistribution: SentimentSlice[]
  categoryScores: CategoryScore[]
  satisfactionTrend: TrendPoint[]
  departmentHeatmap: HeatmapRow[]
  topTopics: TopTopic[]
  aiSummary: AiSummary
  recommendedActions: RecommendedAction[]
}

export interface DepartmentDashboard {
  department: { id: string; name: string }
  campaignId: string
  sampleSize: number
  minimumGroupSize: number
  visible: boolean
  suppressionReason?: string
  overallSatisfaction?: number
  companyAverage?: number
  categoryScores?: CategoryScore[]
  trend?: TrendPoint[]
  topTopics?: TopTopic[]
}

// ----- errors -----
export interface FieldError {
  field: string
  message: string
}

export interface ApiError {
  timestamp: string
  status: number
  code: string
  message: string
  path: string
  fieldErrors?: FieldError[]
}
