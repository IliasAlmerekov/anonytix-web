import { describe, it, expect } from 'vitest'
import { buildPublicForm } from '@/lib/api'
import type { SurveyWithQuestions, Department } from '@/lib/types'

const departments: Department[] = [
  { id: 'dev', name: 'Dev' },
  { id: 'sales', name: 'Sales' },
]

const survey: SurveyWithQuestions = {
  id: 's1',
  title: 'T',
  description: 'D',
  type: 'PULSE',
  status: 'PUBLISHED',
  createdAt: '2026-06-01T00:00:00Z',
  questions: [
    {
      id: 'g', text: 'general', helpText: null, type: 'TEXT', category: 'C',
      required: false, position: 1, minimumValue: null, maximumValue: null,
      maximumLength: null, analyzeWithAi: false, departmentIds: [], options: [],
    },
    {
      id: 'd', text: 'dev only', helpText: null, type: 'TEXT', category: 'C',
      required: false, position: 2, minimumValue: null, maximumValue: null,
      maximumLength: null, analyzeWithAi: false, departmentIds: ['dev'], options: [],
    },
  ],
}

describe('buildPublicForm', () => {
  it('without department: general questions only, selectedDepartmentId null', () => {
    const form = buildPublicForm('camp-1', survey, departments, null)
    expect(form.selectedDepartmentId).toBeNull()
    expect(form.departments).toEqual(departments)
    expect(form.questions.map((q) => q.id)).toEqual(['g'])
    expect(form.surveyType).toBe('PULSE')
  })

  it('with department: general + matching questions', () => {
    const form = buildPublicForm('camp-1', survey, departments, 'dev')
    expect(form.selectedDepartmentId).toBe('dev')
    expect(form.questions.map((q) => q.id)).toEqual(['g', 'd'])
  })
})
