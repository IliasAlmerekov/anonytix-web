# Anonytix — Web Frontend

Anonytix is an AI-powered platform for **anonymous employee feedback and exit analysis**. This repository contains the web frontend: an HR-facing survey builder and analytics dashboard, plus a public, fully anonymous feedback form for employees.

Honest feedback is rare because employees fear that answers can be traced back to them. Anonytix collects feedback anonymously, aggregates it, and surfaces AI-generated insights — so HR sees *what* is happening across teams without ever seeing *who* said it.

> **Status:** MVP. The app runs entirely on local mocks today and is structured to swap to the Spring Boot API by flipping a single flag (see [Mock mode](#mock-mode)).

---

## Features

- **Survey builder** — create and edit pulse/exit surveys with five question types (rating, free text, yes/no, single- and multi-choice) and a live preview.
- **One general invitation link** — publish a survey to get a single shareable link; employees pick their department in the form itself.
- **Anonymous public form** — a standalone, chrome-free page with required-field validation and department-aware questions; no PII is ever displayed.
- **Analytics dashboard** — KPIs, department participation breakdown, monthly feedback (positive/negative), a multi-year satisfaction trend, and a department heatmap with small-group suppression.
- **AI overview** — top-5 AI highlights on the dashboard linking to a dedicated AI analysis page (summary, detected topics, recommended actions).
- **Year filtering** — a dashboard-wide year selector re-scopes KPIs, participation, and feedback charts.

## Tech Stack

| Area | Choice |
|------|--------|
| Framework | React 19 + TypeScript (`verbatimModuleSyntax`) |
| Build tool | Vite |
| Routing | react-router-dom 7 |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (new-york) |
| Charts | Recharts (via the shadcn `chart` wrapper) |
| Icons | lucide-react, @tabler/icons-react |
| Tests | Vitest (pure-function units) |

## Requirements

- Node.js 20+ and npm

## Getting Started

```bash
npm install
npm run dev
```

The app starts on `http://localhost:5173`. No backend is required — it runs on mock data out of the box.

### Demo walkthrough

1. **Umfragen** (`/`) — click *Umfrage erstellen* to open the builder.
2. **Builder** (`/surveys/new`) — edit questions, then *Veröffentlichen und Link erhalten*. The published survey appears back on the Umfragen list, and you get a shareable link.
3. **Public form** (`/feedback/:token`) — pick a department, answer, and submit anonymously.
4. **Dashboard** (`/dashboard`) — KPIs, charts, heatmap, and the AI highlights card.
5. **AI-Overview** (`/ai-overview`) — the full AI analysis.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite |

## Project Structure

```
src/
  lib/
    api.ts          # all endpoint functions (mock ↔ fetch) — the single data boundary
    config.ts       # USE_MOCKS flag + API base URL
    types.ts        # contract types
    form-logic.ts   # pure: filter/build/validate form answers (unit-tested)
    mock-store.ts   # localStorage CRUD for surveys + submissions (unit-tested)
  components/
    ui/             # shadcn-generated primitives
    charts/         # dashboard chart components
    app-sidebar.tsx # navigation shell
  pages/            # one component per route
public/mocks/       # JSON fixtures served in mock mode
```

## Mock mode

All data flows through `src/lib/api.ts`. The `USE_MOCKS` flag in `src/lib/config.ts` controls the source:

- **`true` (default)** — reads `public/mocks/*.json` and persists builder surveys + submissions to `localStorage`.
- **`false`** — calls the live API at `VITE_API_BASE_URL` (defaults to `http://localhost:8080/api/v1`).

Switching to the live backend requires no component changes. The backend must first implement the frontend's model deviations: a single general invitation link, `?departmentId=` form loading, and `departmentId` on submissions (see the spec under `docs/superpowers/specs/`).

Configure the API base URL via `.env`:

```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## Privacy

No screen ever renders raw free-text answers or individual submissions — only aggregates. The department heatmap suppresses groups below the minimum size to prevent re-identification.

## Testing

Unit tests cover the pure, high-risk logic (answer building/validation, department filtering, mock persistence):

```bash
npm test
```
