# Anonytix Frontend MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Anonytix frontend MVP — an HR survey builder + dashboard and an anonymous public feedback form — running fully on mocks, ready to swap to the Spring Boot API later.

**Architecture:** React 19 + Vite + Tailwind 4 + shadcn/ui, routed with `react-router-dom`. All data flows through one isolated module `src/lib/api.ts` (mock mode reads `public/mocks/*.json` + `localStorage`; live mode uses `fetch`). Charts use shadcn `chart` (recharts). The frontend model uses ONE general invitation link per campaign; the employee picks a department via a required dropdown in the form (deviation from the current backend contract — see spec §2).

**Tech Stack:** React 19, TypeScript (verbatimModuleSyntax — always use `import type`), Vite, Tailwind CSS 4, shadcn/ui, react-router-dom, recharts, lucide-react, Vitest (pure-function tests only).

**Spec:** `docs/superpowers/specs/2026-06-06-anonytix-frontend-design.md`

---

## File Structure

```
src/
  main.tsx                 # router root (replaces current)
  App.tsx                  # layout shell (header + <Outlet/>) (replaces starter)
  index.css                # Tailwind 4 + shadcn theme tokens (replaces starter theme)
  lib/
    utils.ts               # cn() helper for shadcn
    types.ts               # all contract types
    config.ts              # USE_MOCKS flag + API base URL
    mock-store.ts          # localStorage CRUD for surveys + submissions
    form-logic.ts          # pure: buildAnswerRequests(), validateAnswers(), filterQuestionsForDepartment()
    api.ts                 # all endpoint functions (mock ↔ fetch)
  components/
    ui/                    # shadcn-generated (button, card, input, ...)
    AppHeader.tsx          # top nav
    QuestionEditor.tsx     # edit one question (5 types)
    FormRenderer.tsx       # department dropdown + questions → answers
    charts/
      KpiCards.tsx
      SentimentChart.tsx
      CategoryScoresChart.tsx
      SatisfactionTrendChart.tsx
      DepartmentHeatmap.tsx
  pages/
    SurveysListPage.tsx    # /
    BuilderPage.tsx        # /surveys/:id
    PublicFormPage.tsx     # /feedback/:token
    DashboardPage.tsx      # /dashboard
    DepartmentPage.tsx     # /dashboard/departments/:id
public/
  mocks/
    surveys.json
    survey-detail.json
    departments.json
    public-form.json
    dashboard-overview.json
    department-dashboard.json
src/lib/__tests__/
  mock-store.test.ts
  form-logic.test.ts
  api.test.ts
```

---

## Task 1: Project setup — deps, path alias, clean starter

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.app.json`
- Modify: `vite.config.ts`
- Create: `.env`
- Create: `src/lib/utils.ts`
- Delete: `src/App.css`, `src/assets/*` (starter assets)

- [ ] **Step 1: Install runtime + dev dependencies**

Run:
```bash
npm install react-router-dom recharts lucide-react class-variance-authority clsx tailwind-merge tw-animate-css
npm install -D vitest
```
Expected: installs succeed, `package.json` updated.

- [ ] **Step 2: Add path alias to `tsconfig.app.json`**

Add `baseUrl` + `paths` inside `compilerOptions` (after `"skipLibCheck": true,`):
```json
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
```

- [ ] **Step 3: Add alias + vitest config to `vite.config.ts`**

Replace the whole file with:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Create `.env`**

```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

- [ ] **Step 5: Create `src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 6: Add a test script to `package.json`**

In `"scripts"`, add:
```json
    "test": "vitest run",
```

- [ ] **Step 7: Remove starter assets**

Run:
```bash
rm -f src/App.css src/assets/react.svg src/assets/hero.png
```
Expected: files gone (App.tsx will be rewritten in Task 5; leave it for now so the project still type-checks references later — we rewrite it before building).

- [ ] **Step 8: Verify install + alias resolve**

Run: `npx tsc -b --noEmit`
Expected: may still error on `App.tsx` importing deleted `./App.css` — that's fine; it is rewritten in Task 5. Confirm no errors about missing `@/*` resolution or missing packages.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.app.json vite.config.ts .env src/lib/utils.ts
git commit -m "chore: project setup — deps, path alias, vitest"
```

---

## Task 2: Tailwind 4 theme + shadcn base tokens

**Files:**
- Modify: `src/index.css`
- Create: `components.json`

- [ ] **Step 1: Replace `src/index.css` with Tailwind 4 + shadcn theme**

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.55 0.22 300);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.55 0.22 300);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.7 0.18 300);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.7 0.18 300);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 2: Create `components.json` for shadcn**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3: Commit**

```bash
git add src/index.css components.json
git commit -m "feat: tailwind 4 theme + shadcn config"
```

---

## Task 3: Add shadcn UI components

**Files:**
- Create: `src/components/ui/*` (generated)

- [ ] **Step 1: Add the components used across the app**

Run:
```bash
npx shadcn@latest add button card input textarea label select checkbox radio-group dialog badge separator sonner chart --yes
```
Expected: files created under `src/components/ui/`. If a prompt about overwriting `index.css` appears, choose No (we already configured it).

- [ ] **Step 2: Verify they type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors originating from `src/components/ui/*`. (App.tsx may still error — rewritten in Task 5.)

- [ ] **Step 3: Commit**

```bash
git add src/components/ui components.json package.json package-lock.json
git commit -m "feat: add shadcn ui components"
```

---

## Task 4: Contract types + config

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/config.ts`

- [ ] **Step 1: Create `src/lib/types.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/lib/config.ts`**

```ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

// Mock mode is on until a real backend is wired up.
export const USE_MOCKS = true

// Single demo company id used in mock paths.
export const COMPANY_ID = '10729623-735e-4382-854f-33e3450bdac7'
```

- [ ] **Step 3: Verify type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors from `src/lib/types.ts` or `src/lib/config.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/config.ts
git commit -m "feat: contract types + config"
```

---

## Task 5: Router shell + App layout (make the app boot)

**Files:**
- Create: `src/components/AppHeader.tsx`
- Modify: `src/App.tsx` (full rewrite)
- Modify: `src/main.tsx` (full rewrite)
- Create: `src/pages/SurveysListPage.tsx` (placeholder, replaced in Task 9)
- Create: `src/pages/BuilderPage.tsx` (placeholder, replaced in Task 8)
- Create: `src/pages/PublicFormPage.tsx` (placeholder, replaced in Task 7)
- Create: `src/pages/DashboardPage.tsx` (placeholder, replaced in Task 11)
- Create: `src/pages/DepartmentPage.tsx` (placeholder, replaced in Task 12)

- [ ] **Step 1: Create `src/components/AppHeader.tsx`**

```tsx
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Umfragen' },
  { to: '/dashboard', label: 'Dashboard' },
]

export function AppHeader() {
  const { pathname } = useLocation()
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="font-semibold tracking-tight">
          Anonytix
        </Link>
        <nav className="flex gap-4 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'text-muted-foreground hover:text-foreground',
                pathname === item.to && 'text-foreground font-medium',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Rewrite `src/App.tsx`**

```tsx
import { Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'

export default function App() {
  // Public feedback form is a standalone page without HR chrome.
  const isPublic = useLocation().pathname.startsWith('/feedback/')
  return (
    <div className="min-h-svh bg-background">
      {!isPublic && <AppHeader />}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Create five placeholder pages**

Create each file with a minimal component so routing works. `src/pages/SurveysListPage.tsx`:
```tsx
export default function SurveysListPage() {
  return <div>Umfragen</div>
}
```
`src/pages/BuilderPage.tsx`:
```tsx
export default function BuilderPage() {
  return <div>Builder</div>
}
```
`src/pages/PublicFormPage.tsx`:
```tsx
export default function PublicFormPage() {
  return <div>Formular</div>
}
```
`src/pages/DashboardPage.tsx`:
```tsx
export default function DashboardPage() {
  return <div>Dashboard</div>
}
```
`src/pages/DepartmentPage.tsx`:
```tsx
export default function DepartmentPage() {
  return <div>Abteilung</div>
}
```

- [ ] **Step 4: Rewrite `src/main.tsx` with the router**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import SurveysListPage from '@/pages/SurveysListPage.tsx'
import BuilderPage from '@/pages/BuilderPage.tsx'
import PublicFormPage from '@/pages/PublicFormPage.tsx'
import DashboardPage from '@/pages/DashboardPage.tsx'
import DepartmentPage from '@/pages/DepartmentPage.tsx'

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <SurveysListPage /> },
      { path: '/surveys/:id', element: <BuilderPage /> },
      { path: '/feedback/:token', element: <PublicFormPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/dashboard/departments/:id', element: <DepartmentPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

- [ ] **Step 5: Verify it builds and boots**

Run: `npx tsc -b --noEmit && npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 6: Manual check**

Run `npm run dev`, open `http://localhost:5173/`. Expected: header with "Anonytix / Umfragen / Dashboard", body shows "Umfragen". Navigate to `/dashboard` → "Dashboard". Open `/feedback/abc` → "Formular" with NO header. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/main.tsx src/components/AppHeader.tsx src/pages
git commit -m "feat: router shell + app layout"
```

---

## Task 6: Mock JSON fixtures

**Files:**
- Create: `public/mocks/departments.json`
- Create: `public/mocks/surveys.json`
- Create: `public/mocks/survey-detail.json`
- Create: `public/mocks/public-form.json`
- Create: `public/mocks/dashboard-overview.json`
- Create: `public/mocks/department-dashboard.json`

- [ ] **Step 1: Copy the two dashboard mocks verbatim from the backend repo**

Run:
```bash
cp ../anonytix-backend/frontend-mocks/dashboard-overview.json public/mocks/dashboard-overview.json
cp ../anonytix-backend/frontend-mocks/department-dashboard.json public/mocks/department-dashboard.json
```
Expected: both files exist under `public/mocks/`.

- [ ] **Step 2: Create `public/mocks/departments.json`**

```json
[
  { "id": "ac38af63-dc5a-416e-b5d7-c237535ec37b", "name": "Softwareentwicklung" },
  { "id": "6a095a71-c076-4f35-98bd-4ec01937be84", "name": "Vertrieb" },
  { "id": "fedc9e7d-d917-4626-ab79-ec69c583814e", "name": "Marketing" },
  { "id": "d2f7524e-6e27-48dc-83ea-4ba9bfe716ca", "name": "Personal" }
]
```

- [ ] **Step 3: Create `public/mocks/surveys.json`**

```json
[
  {
    "id": "26c98d0d-95f7-492b-a95d-a9bce4409f03",
    "title": "Mitarbeiterbefragung Juni 2026",
    "description": "Monatliche anonyme Pulsbefragung",
    "type": "PULSE",
    "status": "PUBLISHED",
    "createdAt": "2026-06-01T09:00:00Z"
  }
]
```

- [ ] **Step 4: Create `public/mocks/survey-detail.json`** (seed survey loaded by the builder; questions carry `departmentIds` for filtering)

```json
{
  "id": "26c98d0d-95f7-492b-a95d-a9bce4409f03",
  "title": "Mitarbeiterbefragung Juni 2026",
  "description": "Monatliche anonyme Pulsbefragung",
  "type": "PULSE",
  "status": "PUBLISHED",
  "createdAt": "2026-06-01T09:00:00Z",
  "questions": [
    {
      "id": "84b9c571-a11c-4fd4-84e5-76ec5f6055f0",
      "text": "Wie zufrieden bist du insgesamt mit deiner Arbeit?",
      "helpText": "1 bedeutet sehr unzufrieden, 5 bedeutet sehr zufrieden.",
      "type": "RATING",
      "category": "OVERALL_SATISFACTION",
      "required": true,
      "position": 1,
      "minimumValue": 1,
      "maximumValue": 5,
      "maximumLength": null,
      "analyzeWithAi": false,
      "departmentIds": [],
      "options": []
    },
    {
      "id": "39f96f91-9ad4-4884-97fd-9dd2603fe409",
      "text": "Wie bewertest du die Kommunikation deiner Führungskraft?",
      "helpText": null,
      "type": "RATING",
      "category": "LEADERSHIP",
      "required": true,
      "position": 2,
      "minimumValue": 1,
      "maximumValue": 5,
      "maximumLength": null,
      "analyzeWithAi": false,
      "departmentIds": [],
      "options": []
    },
    {
      "id": "99f2ed06-50c2-423a-a864-5713d89da83b",
      "text": "Wie empfindest du deine aktuelle Arbeitsbelastung?",
      "helpText": null,
      "type": "SINGLE_CHOICE",
      "category": "WORKLOAD",
      "required": true,
      "position": 3,
      "minimumValue": null,
      "maximumValue": null,
      "maximumLength": null,
      "analyzeWithAi": false,
      "departmentIds": [],
      "options": [
        { "id": "bed4cbe1-38dc-4f37-b91c-c28570bc7fc6", "label": "Zu niedrig", "value": "TOO_LOW", "position": 1 },
        { "id": "00c6a586-378f-46a9-b82c-bd15cb5cb17c", "label": "Angemessen", "value": "BALANCED", "position": 2 },
        { "id": "53d661ac-031d-44c7-82ff-b2c884394262", "label": "Zu hoch", "value": "TOO_HIGH", "position": 3 }
      ]
    },
    {
      "id": "cc36621b-c076-451b-923c-3e5580d94031",
      "text": "Wie zufrieden bist du mit unseren Entwicklungsprozessen?",
      "helpText": "Diese Frage wird nur der Abteilung Softwareentwicklung angezeigt.",
      "type": "RATING",
      "category": "PROCESSES",
      "required": false,
      "position": 4,
      "minimumValue": 1,
      "maximumValue": 5,
      "maximumLength": null,
      "analyzeWithAi": false,
      "departmentIds": ["ac38af63-dc5a-416e-b5d7-c237535ec37b"],
      "options": []
    },
    {
      "id": "a53104ae-c34f-4248-af72-68c84cac07bc",
      "text": "Was funktioniert aktuell besonders gut?",
      "helpText": "Bitte nenne keine Namen oder andere identifizierende Informationen.",
      "type": "TEXT",
      "category": "POSITIVE_FEEDBACK",
      "required": false,
      "position": 5,
      "minimumValue": null,
      "maximumValue": null,
      "maximumLength": 2000,
      "analyzeWithAi": true,
      "departmentIds": [],
      "options": []
    },
    {
      "id": "5a369b24-8da8-48d3-a274-a9530fceae46",
      "text": "Was sollte das Unternehmen verbessern?",
      "helpText": "Dein Text wird vor der Auswertung durch KI anonymisiert.",
      "type": "TEXT",
      "category": "IMPROVEMENT",
      "required": false,
      "position": 6,
      "minimumValue": null,
      "maximumValue": null,
      "maximumLength": 2000,
      "analyzeWithAi": true,
      "departmentIds": [],
      "options": []
    }
  ]
}
```

- [ ] **Step 5: Create `public/mocks/public-form.json`** (base shape; `api.getPublicForm` fills `departments`, filters `questions`, sets `selectedDepartmentId`)

```json
{
  "campaignId": "93b6108f-f005-4f4b-8ce9-952fa0a7ddc4",
  "surveyId": "26c98d0d-95f7-492b-a95d-a9bce4409f03",
  "title": "Mitarbeiterbefragung Juni 2026",
  "description": "Dein Feedback wird anonymisiert und nur zusammengefasst ausgewertet.",
  "surveyType": "PULSE",
  "expiresAt": "2026-06-20T21:59:59Z",
  "departments": [],
  "selectedDepartmentId": null,
  "questions": []
}
```

- [ ] **Step 6: Commit**

```bash
git add public/mocks
git commit -m "feat: mock json fixtures"
```

---

## Task 7: form-logic.ts (pure functions, TDD)

**Files:**
- Create: `src/lib/form-logic.ts`
- Test: `src/lib/__tests__/form-logic.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/form-logic.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  filterQuestionsForDepartment,
  buildAnswerRequests,
  validateAnswers,
  type FormAnswers,
} from '@/lib/form-logic'
import type { Question } from '@/lib/types'

function q(partial: Partial<Question> & Pick<Question, 'id' | 'type'>): Question {
  return {
    text: 't',
    helpText: null,
    category: 'C',
    required: false,
    position: 1,
    minimumValue: null,
    maximumValue: null,
    maximumLength: null,
    analyzeWithAi: false,
    departmentIds: [],
    options: [],
    ...partial,
  }
}

describe('filterQuestionsForDepartment', () => {
  const general = q({ id: 'g', type: 'TEXT', departmentIds: [] })
  const devOnly = q({ id: 'd', type: 'TEXT', departmentIds: ['dev'] })

  it('returns only general questions when no department selected', () => {
    const result = filterQuestionsForDepartment([general, devOnly], null)
    expect(result.map((x) => x.id)).toEqual(['g'])
  })

  it('includes department-specific questions when selected', () => {
    const result = filterQuestionsForDepartment([general, devOnly], 'dev')
    expect(result.map((x) => x.id)).toEqual(['g', 'd'])
  })

  it('excludes other departments questions', () => {
    const result = filterQuestionsForDepartment([general, devOnly], 'sales')
    expect(result.map((x) => x.id)).toEqual(['g'])
  })
})

describe('buildAnswerRequests', () => {
  it('maps each type to only its value field', () => {
    const questions: Question[] = [
      q({ id: 'r', type: 'RATING' }),
      q({ id: 't', type: 'TEXT' }),
      q({ id: 'b', type: 'BOOLEAN' }),
      q({ id: 's', type: 'SINGLE_CHOICE' }),
      q({ id: 'm', type: 'MULTI_CHOICE' }),
    ]
    const answers: FormAnswers = {
      r: 4,
      t: 'hallo',
      b: true,
      s: ['opt1'],
      m: ['opt1', 'opt2'],
    }
    expect(buildAnswerRequests(questions, answers)).toEqual([
      { questionId: 'r', numericValue: 4, textValue: null, booleanValue: null, selectedOptionIds: [] },
      { questionId: 't', numericValue: null, textValue: 'hallo', booleanValue: null, selectedOptionIds: [] },
      { questionId: 'b', numericValue: null, textValue: null, booleanValue: true, selectedOptionIds: [] },
      { questionId: 's', numericValue: null, textValue: null, booleanValue: null, selectedOptionIds: ['opt1'] },
      { questionId: 'm', numericValue: null, textValue: null, booleanValue: null, selectedOptionIds: ['opt1', 'opt2'] },
    ])
  })

  it('omits questions with no answer', () => {
    const questions: Question[] = [q({ id: 't', type: 'TEXT' })]
    expect(buildAnswerRequests(questions, {})).toEqual([])
  })
})

describe('validateAnswers', () => {
  it('flags missing required answers', () => {
    const questions: Question[] = [q({ id: 't', type: 'TEXT', required: true })]
    const errors = validateAnswers(questions, {})
    expect(errors).toEqual({ t: 'Pflichtfeld' })
  })

  it('passes when required answers are present', () => {
    const questions: Question[] = [q({ id: 't', type: 'TEXT', required: true })]
    expect(validateAnswers(questions, { t: 'x' })).toEqual({})
  })

  it('treats empty string and empty array as missing', () => {
    const questions: Question[] = [
      q({ id: 't', type: 'TEXT', required: true }),
      q({ id: 'm', type: 'MULTI_CHOICE', required: true }),
    ]
    expect(validateAnswers(questions, { t: '', m: [] })).toEqual({
      t: 'Pflichtfeld',
      m: 'Pflichtfeld',
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/form-logic'`.

- [ ] **Step 3: Implement `src/lib/form-logic.ts`**

```ts
import type { AnswerRequest, Question } from '@/lib/types'

export type FormAnswerValue = number | string | boolean | string[]
export type FormAnswers = Record<string, FormAnswerValue>

/** Keep general questions (empty departmentIds) plus those matching the selection. */
export function filterQuestionsForDepartment(
  questions: Question[],
  departmentId: string | null,
): Question[] {
  return questions.filter(
    (q) =>
      q.departmentIds.length === 0 ||
      (departmentId !== null && q.departmentIds.includes(departmentId)),
  )
}

function isEmpty(value: FormAnswerValue | undefined): boolean {
  if (value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/** Build the contract answer payload — only the field matching each type is set. */
export function buildAnswerRequests(
  questions: Question[],
  answers: FormAnswers,
): AnswerRequest[] {
  const result: AnswerRequest[] = []
  for (const q of questions) {
    const value = answers[q.id]
    if (isEmpty(value)) continue
    const base: AnswerRequest = {
      questionId: q.id,
      numericValue: null,
      textValue: null,
      booleanValue: null,
      selectedOptionIds: [],
    }
    switch (q.type) {
      case 'RATING':
        base.numericValue = value as number
        break
      case 'TEXT':
        base.textValue = value as string
        break
      case 'BOOLEAN':
        base.booleanValue = value as boolean
        break
      case 'SINGLE_CHOICE':
      case 'MULTI_CHOICE':
        base.selectedOptionIds = value as string[]
        break
    }
    result.push(base)
  }
  return result
}

/** Returns a map questionId -> error message for unanswered required questions. */
export function validateAnswers(
  questions: Question[],
  answers: FormAnswers,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const q of questions) {
    if (q.required && isEmpty(answers[q.id])) {
      errors[q.id] = 'Pflichtfeld'
    }
  }
  return errors
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `form-logic` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/form-logic.ts src/lib/__tests__/form-logic.test.ts
git commit -m "feat: form-logic pure functions (filter, build, validate)"
```

---

## Task 8: mock-store.ts (localStorage, TDD)

**Files:**
- Create: `src/lib/mock-store.ts`
- Test: `src/lib/__tests__/mock-store.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/mock-store.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveSubmission, countSubmissions, resetStore } from '@/lib/mock-store'

// Minimal localStorage polyfill for the node test environment.
beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
  })
  resetStore()
})

describe('mock-store submissions', () => {
  it('starts at zero submissions', () => {
    expect(countSubmissions('camp-1')).toBe(0)
  })

  it('counts saved submissions per campaign', () => {
    saveSubmission('camp-1', { departmentId: 'd1', answers: [] })
    saveSubmission('camp-1', { departmentId: 'd2', answers: [] })
    saveSubmission('camp-2', { departmentId: 'd1', answers: [] })
    expect(countSubmissions('camp-1')).toBe(2)
    expect(countSubmissions('camp-2')).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/mock-store'`.

- [ ] **Step 3: Implement `src/lib/mock-store.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — `mock-store` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mock-store.ts src/lib/__tests__/mock-store.test.ts
git commit -m "feat: mock-store localStorage submissions"
```

---

## Task 9: api.ts (mock layer, TDD on the form-loading logic)

**Files:**
- Create: `src/lib/api.ts`
- Test: `src/lib/__tests__/api.test.ts`

- [ ] **Step 1: Write the failing test for `buildPublicForm`**

The department-filtering composition is the risky pure part; the network/JSON-fetch wrappers are thin. Create `src/lib/__tests__/api.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/api'` (or `buildPublicForm` not exported).

- [ ] **Step 3: Implement `src/lib/api.ts`**

```ts
import { API_BASE_URL, COMPANY_ID, USE_MOCKS } from '@/lib/config'
import { filterQuestionsForDepartment } from '@/lib/form-logic'
import { countSubmissions, saveSubmission } from '@/lib/mock-store'
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
  constructor(public readonly error: ApiError) {
    super(error.message)
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
  if (USE_MOCKS) return loadMock<Survey[]>('surveys.json')
  return apiFetch(`/companies/${COMPANY_ID}/surveys`)
}

export async function getSurvey(id: string): Promise<SurveyWithQuestions> {
  if (USE_MOCKS) return loadMock<SurveyWithQuestions>('survey-detail.json')
  return apiFetch(`/companies/${COMPANY_ID}/surveys/${id}`)
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — `buildPublicForm` tests green (plus earlier suites still green).

- [ ] **Step 5: Verify type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.ts src/lib/__tests__/api.test.ts
git commit -m "feat: api mock layer with department-filtered public form"
```

---

## Task 10: FormRenderer component

**Files:**
- Create: `src/components/FormRenderer.tsx`

- [ ] **Step 1: Implement `src/components/FormRenderer.tsx`**

```tsx
import type { PublicForm, Question } from '@/lib/types'
import type { FormAnswers, FormAnswerValue } from '@/lib/form-logic'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface FormRendererProps {
  form: PublicForm
  answers: FormAnswers
  errors: Record<string, string>
  onDepartmentChange: (departmentId: string) => void
  onAnswerChange: (questionId: string, value: FormAnswerValue) => void
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question
  value: FormAnswerValue | undefined
  onChange: (value: FormAnswerValue) => void
}) {
  switch (question.type) {
    case 'RATING': {
      const min = question.minimumValue ?? 1
      const max = question.maximumValue ?? 5
      const scale = Array.from({ length: max - min + 1 }, (_, i) => min + i)
      return (
        <div className="flex gap-2">
          {scale.map((n) => (
            <Button
              key={n}
              type="button"
              variant={value === n ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      )
    }
    case 'TEXT':
      return (
        <Textarea
          maxLength={question.maximumLength ?? undefined}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'BOOLEAN':
      return (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={value === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(true)}
          >
            Ja
          </Button>
          <Button
            type="button"
            variant={value === false ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(false)}
          >
            Nein
          </Button>
        </div>
      )
    case 'SINGLE_CHOICE':
      return (
        <RadioGroup
          value={(value as string[])?.[0] ?? ''}
          onValueChange={(v) => onChange([v])}
        >
          {question.options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <RadioGroupItem value={opt.id} id={opt.id} />
              <Label htmlFor={opt.id}>{opt.label}</Label>
            </div>
          ))}
        </RadioGroup>
      )
    case 'MULTI_CHOICE': {
      const selected = (value as string[]) ?? []
      return (
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <Checkbox
                id={opt.id}
                checked={selected.includes(opt.id)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? [...selected, opt.id]
                      : selected.filter((id) => id !== opt.id),
                  )
                }
              />
              <Label htmlFor={opt.id}>{opt.label}</Label>
            </div>
          ))}
        </div>
      )
    }
  }
}

export function FormRenderer({
  form,
  answers,
  errors,
  onDepartmentChange,
  onAnswerChange,
}: FormRendererProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>
          Abteilung <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.selectedDepartmentId ?? ''}
          onValueChange={onDepartmentChange}
        >
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Abteilung auswählen" />
          </SelectTrigger>
          <SelectContent>
            {form.departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {form.selectedDepartmentId &&
        form.questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-2">
            <Label className={cn(errors[q.id] && 'text-destructive')}>
              {q.text}
              {q.required && <span className="text-destructive"> *</span>}
            </Label>
            {q.helpText && (
              <p className="text-sm text-muted-foreground">{q.helpText}</p>
            )}
            <QuestionField
              question={q}
              value={answers[q.id]}
              onChange={(v) => onAnswerChange(q.id, v)}
            />
            {errors[q.id] && (
              <p className="text-sm text-destructive">{errors[q.id]}</p>
            )}
          </div>
        ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors. (If `radio-group` or `checkbox` weren't generated in Task 3, re-run that shadcn add command.)

- [ ] **Step 3: Commit**

```bash
git add src/components/FormRenderer.tsx
git commit -m "feat: FormRenderer with department dropdown + 5 question types"
```

---

## Task 11: PublicFormPage

**Files:**
- Modify: `src/pages/PublicFormPage.tsx` (full rewrite)

- [ ] **Step 1: Rewrite `src/pages/PublicFormPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiException, getPublicForm, submitFeedback } from '@/lib/api'
import { buildAnswerRequests, validateAnswers } from '@/lib/form-logic'
import type { FormAnswers, FormAnswerValue } from '@/lib/form-logic'
import type { PublicForm } from '@/lib/types'
import { FormRenderer } from '@/components/FormRenderer'
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
          <p className="text-xs text-primary">
            🔒 Vollständig anonym — deine Antworten werden nur aggregiert ausgewertet.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
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
```

- [ ] **Step 2: Verify build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual end-to-end check**

Run `npm run dev`, open `http://localhost:5173/feedback/demo-token`. Expected: card with title, a required "Abteilung" dropdown, NO questions shown yet. Pick "Softwareentwicklung" → questions appear (incl. the dev-only "Entwicklungsprozesse" question). Pick "Vertrieb" → dev-only question disappears and previous answers are cleared. Try submitting without answering a required field → inline "Pflichtfeld" errors. Fill required fields → submit → "Danke!" screen. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PublicFormPage.tsx
git commit -m "feat: public feedback form page"
```

---

## Task 12: QuestionEditor + BuilderPage

**Files:**
- Create: `src/components/QuestionEditor.tsx`
- Modify: `src/pages/BuilderPage.tsx` (full rewrite)

- [ ] **Step 1: Create `src/components/QuestionEditor.tsx`**

```tsx
import type { Question, QuestionType } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'

const TYPE_LABELS: Record<QuestionType, string> = {
  RATING: 'Bewertung (1–5)',
  TEXT: 'Freitext',
  BOOLEAN: 'Ja / Nein',
  SINGLE_CHOICE: 'Einzelauswahl',
  MULTI_CHOICE: 'Mehrfachauswahl',
}

interface QuestionEditorProps {
  question: Question
  onChange: (next: Question) => void
  onDelete: () => void
}

export function QuestionEditor({ question, onChange, onDelete }: QuestionEditorProps) {
  const hasOptions =
    question.type === 'SINGLE_CHOICE' || question.type === 'MULTI_CHOICE'

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start gap-2">
        <Input
          value={question.text}
          placeholder="Fragetext"
          onChange={(e) => onChange({ ...question, text: e.target.value })}
        />
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Frage löschen">
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={question.type}
          onValueChange={(v) =>
            onChange({ ...question, type: v as QuestionType, options: [] })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={question.required}
            onCheckedChange={(c) => onChange({ ...question, required: c === true })}
          />
          Pflichtfrage
        </label>
      </div>

      {hasOptions && (
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Antwortoptionen</Label>
          {question.options.map((opt, i) => (
            <div key={opt.id} className="flex gap-2">
              <Input
                value={opt.label}
                onChange={(e) =>
                  onChange({
                    ...question,
                    options: question.options.map((o, j) =>
                      j === i ? { ...o, label: e.target.value } : o,
                    ),
                  })
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Option löschen"
                onClick={() =>
                  onChange({
                    ...question,
                    options: question.options.filter((_, j) => j !== i),
                  })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              onChange({
                ...question,
                options: [
                  ...question.options,
                  {
                    id: `opt-${question.id}-${question.options.length}`,
                    label: 'Neue Option',
                    value: `OPT_${question.options.length}`,
                    position: question.options.length + 1,
                  },
                ],
              })
            }
          >
            Option hinzufügen
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `src/pages/BuilderPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSurvey, publishAndGetLink } from '@/lib/api'
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
```

- [ ] **Step 3: Verify build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual check**

Run `npm run dev`, open `/surveys/26c98d0d-95f7-492b-a95d-a9bce4409f03`. Expected: left = editable questions with type dropdown + required checkbox + add/delete; right = live preview rendering those questions. Change a question's type to "Einzelauswahl" → option editor appears; preview updates. Click "Veröffentlichen und Link erhalten" → dialog with `/feedback/demo-token` link + working "Kopieren". Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/QuestionEditor.tsx src/pages/BuilderPage.tsx
git commit -m "feat: survey builder with question editor + publish link"
```

---

## Task 13: SurveysListPage

**Files:**
- Modify: `src/pages/SurveysListPage.tsx` (full rewrite)

- [ ] **Step 1: Rewrite `src/pages/SurveysListPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listSurveys } from '@/lib/api'
import type { Survey } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SurveysListPage() {
  const [surveys, setSurveys] = useState<Survey[] | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    listSurveys().then(setSurveys)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Umfragen</h1>
        <Button
          onClick={() => navigate('/surveys/26c98d0d-95f7-492b-a95d-a9bce4409f03')}
        >
          Umfrage erstellen
        </Button>
      </div>

      {!surveys ? (
        <p className="text-muted-foreground">Lädt …</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-base">{s.title}</CardTitle>
                <Badge variant={s.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                  {s.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/surveys/${s.id}`}>Bearbeiten</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/dashboard">Ergebnisse</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `npx tsc -b --noEmit && npm run build`, then `npm run dev` and open `/`. Expected: "Umfragen" heading, "Umfrage erstellen" button (navigates to builder), one survey card with "PUBLISHED" badge and Bearbeiten/Ergebnisse buttons. Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SurveysListPage.tsx
git commit -m "feat: surveys list page"
```

---

## Task 14: Chart components (KPIs, sentiment, categories, trend, heatmap)

**Files:**
- Create: `src/components/charts/KpiCards.tsx`
- Create: `src/components/charts/SentimentChart.tsx`
- Create: `src/components/charts/CategoryScoresChart.tsx`
- Create: `src/components/charts/SatisfactionTrendChart.tsx`
- Create: `src/components/charts/DepartmentHeatmap.tsx`

- [ ] **Step 1: Create `src/components/charts/KpiCards.tsx`**

```tsx
import type { Kpi } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatValue(kpi: Kpi): string {
  if (kpi.unit === 'PERCENT') return `${kpi.value}%`
  if (kpi.unit === 'OUT_OF_5') return `${kpi.value} / 5`
  return String(kpi.value)
}

export function KpiCards({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatValue(kpi)}</div>
            {kpi.change !== undefined && (
              <p
                className={
                  kpi.change < 0 ? 'text-sm text-destructive' : 'text-sm text-emerald-600'
                }
              >
                {kpi.change > 0 ? '+' : ''}
                {kpi.change} {kpi.changeLabel ?? ''}
              </p>
            )}
            {kpi.detail && (
              <p className="text-sm text-muted-foreground">{kpi.detail}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/charts/SentimentChart.tsx`**

```tsx
import { Pie, PieChart } from 'recharts'
import type { SentimentSlice } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const config = {
  POSITIVE: { label: 'Positiv', color: 'var(--chart-2)' },
  NEUTRAL: { label: 'Neutral', color: 'var(--chart-3)' },
  NEGATIVE: { label: 'Negativ', color: 'var(--chart-5)' },
} satisfies ChartConfig

export function SentimentChart({ data }: { data: SentimentSlice[] }) {
  const chartData = data.map((d) => ({
    sentiment: d.sentiment,
    count: d.count,
    fill: `var(--color-${d.sentiment})`,
  }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stimmungsverteilung</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-64">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="sentiment" />} />
            <Pie data={chartData} dataKey="count" nameKey="sentiment" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create `src/components/charts/CategoryScoresChart.tsx`**

```tsx
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { CategoryScore } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const config = {
  score: { label: 'Aktuell', color: 'var(--chart-1)' },
  previousScore: { label: 'Vorher', color: 'var(--chart-3)' },
} satisfies ChartConfig

export function CategoryScoresChart({
  data,
  title = 'Kategorie-Bewertungen',
}: {
  data: CategoryScore[]
  title?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="max-h-72 w-full">
          <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 16 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" domain={[0, 5]} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="score" fill="var(--color-score)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Create `src/components/charts/SatisfactionTrendChart.tsx`**

```tsx
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import type { TrendPoint } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const config = {
  score: { label: 'Zufriedenheit', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function SatisfactionTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zufriedenheitstrend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="max-h-72 w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => (v ?? '').slice(0, 3)}
            />
            <YAxis domain={[0, 5]} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="score" stroke="var(--color-score)" strokeWidth={2} dot />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Create `src/components/charts/DepartmentHeatmap.tsx`**

```tsx
import { Link } from 'react-router-dom'
import type { HeatmapRow } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const CATEGORIES = ['LEADERSHIP', 'WORKLOAD', 'COMMUNICATION', 'TEAMWORK'] as const
const LABELS: Record<string, string> = {
  LEADERSHIP: 'Führung',
  WORKLOAD: 'Belastung',
  COMMUNICATION: 'Kommunikation',
  TEAMWORK: 'Team',
}

function cellColor(score: number): string {
  if (score >= 4) return 'bg-emerald-500/20 text-emerald-700'
  if (score >= 3) return 'bg-amber-500/20 text-amber-700'
  return 'bg-red-500/20 text-red-700'
}

export function DepartmentHeatmap({ rows }: { rows: HeatmapRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Abteilungs-Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="p-2">Abteilung</th>
              {CATEGORIES.map((c) => (
                <th key={c} className="p-2">{LABELS[c]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.departmentId} className="border-t">
                <td className="p-2 font-medium">
                  {row.suppressed ? (
                    row.departmentName
                  ) : (
                    <Link
                      className="hover:underline"
                      to={`/dashboard/departments/${row.departmentId}`}
                    >
                      {row.departmentName}
                    </Link>
                  )}
                </td>
                {row.suppressed || !row.scores ? (
                  <td colSpan={CATEGORIES.length} className="p-2 text-muted-foreground">
                    Nicht genügend Daten
                  </td>
                ) : (
                  CATEGORIES.map((c) => (
                    <td key={c} className="p-2">
                      <span className={cn('rounded px-2 py-1', cellColor(row.scores![c] ?? 0))}>
                        {row.scores![c]?.toFixed(1) ?? '–'}
                      </span>
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 6: Verify build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: build succeeds. (If `chart` wasn't generated in Task 3, run `npx shadcn@latest add chart --yes`.)

- [ ] **Step 7: Commit**

```bash
git add src/components/charts
git commit -m "feat: dashboard chart components"
```

---

## Task 15: DashboardPage (overview)

**Files:**
- Modify: `src/pages/DashboardPage.tsx` (full rewrite)

- [ ] **Step 1: Rewrite `src/pages/DashboardPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { getDashboardOverview } from '@/lib/api'
import type { DashboardOverview } from '@/lib/types'
import { KpiCards } from '@/components/charts/KpiCards'
import { SentimentChart } from '@/components/charts/SentimentChart'
import { CategoryScoresChart } from '@/components/charts/CategoryScoresChart'
import { SatisfactionTrendChart } from '@/components/charts/SatisfactionTrendChart'
import { DepartmentHeatmap } from '@/components/charts/DepartmentHeatmap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null)

  useEffect(() => {
    getDashboardOverview().then(setData)
  }, [])

  if (!data) return <p className="text-muted-foreground">Lädt …</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{data.campaign.name}</h1>
        <p className="text-muted-foreground">
          {data.company.name} · {data.sampleSize} Antworten
        </p>
      </div>

      <KpiCards kpis={data.kpis} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SentimentChart data={data.sentimentDistribution} />
        <CategoryScoresChart data={data.categoryScores} />
      </div>

      <SatisfactionTrendChart data={data.satisfactionTrend} />
      <DepartmentHeatmap rows={data.departmentHeatmap} />

      <Card>
        <CardHeader>
          <CardTitle>KI-Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p>{data.aiSummary.summary}</p>
          <p className="text-xs text-muted-foreground">{data.aiSummary.disclaimer}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empfohlene Maßnahmen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.recommendedActions.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 border-b pb-3 last:border-0">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Badge variant={a.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                  {a.priority}
                </Badge>
                <Badge variant="outline">{a.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `npx tsc -b --noEmit && npm run build`, then `npm run dev` and open `/dashboard`. Expected: campaign header, KPI cards, sentiment pie + category bars, trend line, heatmap (Personal row shows "Nicht genügend Daten"), KI summary, recommended actions. Department names in the heatmap are links. Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat: dashboard overview page"
```

---

## Task 16: DepartmentPage (drilldown)

**Files:**
- Modify: `src/pages/DepartmentPage.tsx` (full rewrite)

- [ ] **Step 1: Rewrite `src/pages/DepartmentPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getDepartmentDashboard } from '@/lib/api'
import type { DepartmentDashboard } from '@/lib/types'
import { CategoryScoresChart } from '@/components/charts/CategoryScoresChart'
import { SatisfactionTrendChart } from '@/components/charts/SatisfactionTrendChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function DepartmentPage() {
  const { id = '' } = useParams()
  const [data, setData] = useState<DepartmentDashboard | null>(null)

  useEffect(() => {
    getDepartmentDashboard(id).then(setData)
  }, [id])

  if (!data) return <p className="text-muted-foreground">Lädt …</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{data.department.name}</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard">Zurück</Link>
        </Button>
      </div>

      {!data.visible ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nicht genügend Daten für eine anonyme Darstellung
            {data.sampleSize ? ` (${data.sampleSize} von ${data.minimumGroupSize}).` : '.'}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-3">
            <Badge variant="secondary">
              Zufriedenheit {data.overallSatisfaction} / 5
            </Badge>
            <Badge variant="outline">
              Firmenschnitt {data.companyAverage} / 5
            </Badge>
          </div>
          {data.categoryScores && (
            <CategoryScoresChart
              data={data.categoryScores}
              title="Kategorien (Abteilung vs. Firma)"
            />
          )}
          {data.trend && <SatisfactionTrendChart data={data.trend} />}
          {data.topTopics && (
            <Card>
              <CardHeader>
                <CardTitle>Top-Themen</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {data.topTopics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span>{t.label}</span>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{t.mentions}×</Badge>
                      <Badge variant={t.sentiment === 'NEGATIVE' ? 'destructive' : 'outline'}>
                        {t.sentiment}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `npx tsc -b --noEmit && npm run build`, then `npm run dev`. From `/dashboard`, click "Softwareentwicklung" in the heatmap → drilldown shows satisfaction vs company badges, category chart, trend, top topics. (The mock always returns the Softwareentwicklung drilldown; that's expected in mock mode.) Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/DepartmentPage.tsx
git commit -m "feat: department drilldown page"
```

---

## Task 17: Full end-to-end verification + final commit

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all suites (`form-logic`, `mock-store`, `api`) PASS.

- [ ] **Step 2: Type-check + production build**

Run: `npx tsc -b --noEmit && npm run build`
Expected: no type errors, build succeeds.

- [ ] **Step 3: Manual end-to-end run**

Run `npm run dev` and walk the full demo flow:
1. `/` → "Umfrage erstellen" → builder.
2. In builder: add a question, change a type, "Veröffentlichen und Link erhalten" → copy link.
3. Open the link (`/feedback/demo-token`) → pick department → answer required questions → submit → "Danke!".
4. `/dashboard` → KPIs, charts, heatmap, AI summary, actions all render.
5. Click a department → drilldown renders.

Expected: every step works without console errors. Stop the dev server.

- [ ] **Step 4: Final commit (if any uncommitted tweaks)**

```bash
git add -A
git commit -m "chore: anonytix frontend MVP end-to-end verified" || echo "nothing to commit"
```

---

## Notes for the implementer

- **`import type`** is mandatory for type-only imports (`verbatimModuleSyntax: true`); mixing value and type imports without it fails the build.
- **shadcn component names**: the exact files generated in Task 3 are `button card input textarea label select checkbox radio-group dialog badge separator sonner chart`. If any import path under `@/components/ui/*` is missing, re-run `npx shadcn@latest add <name> --yes`.
- **Mock mode** is controlled by `USE_MOCKS` in `src/lib/config.ts`. To switch to the real backend later, set it to `false` — no component changes needed. Remember the backend must first implement the deviations in spec §2 (single general link, `?departmentId=` form loading, `departments[]`/`selectedDepartmentId` in the form response, `departmentId` in the submission).
- **Privacy guard**: no screen ever renders raw free-text answers or individual submissions; only aggregates from the dashboard mocks. Do not add moderation endpoints.
- **Question CRUD in mock mode**: the builder edits questions in local React state and only calls `publishAndGetLink`. The contract's granular endpoints (`addQuestion`/`updateQuestion`/`deleteQuestion`/`reorderQuestions`, spec §5) are intentionally deferred — add them as `api.ts` functions when wiring the real backend, where each edit must persist via `PATCH/POST/DELETE/PUT`. For the MVP demo, local state is sufficient.
