# Anonytix Frontend — Design (MVP für den Hackathon)

**Datum:** 2026-06-06
**Scope:** Frontend (React/Vite) für die anonyme Mitarbeiter-Feedback-Plattform.
Das Spring-Boot-Backend ist separat; sein API-Vertrag liegt in
`../../../anonytix-backend/frontend-mocks/`.

---

## 1. Ziel

Ein Frontend für zwei Nutzergruppen:

1. **HR-Abteilung** — erstellt eine Umfrage, bearbeitet Fragen, veröffentlicht sie
   und erhält einen Link zum Versenden; sieht die aggregierte KI-Auswertung im
   Dashboard.
2. **Mitarbeiter** — öffnet den anonymen Link, füllt das Formular aus und sendet ab.

End-to-End-Demo-Ablauf:
`Umfrage erstellen → Builder → Link → ausfüllen → absenden → Dashboard`.

Für das MVP wird das Backend zu Beginn nicht benötigt: Das Frontend läuft auf
**Mocks** (vorgefertigte JSON-Dateien aus `anonytix-backend/frontend-mocks/`) und
wird später durch Austausch eines einzigen Moduls `lib/api.ts` auf die echte API
umgestellt.

---

## 2. API-Vertrag (Source of Truth)

Der vollständige Vertrag liegt in `anonytix-backend/frontend-mocks/` (`API.md`,
`openapi.yaml`, `api-endpoints.json` + JSON-Beispiele). Kurzfassung:

```
Base URL: http://localhost:8080/api/v1   (env: VITE_API_BASE_URL)
Auth:     für das MVP keine; companyId im Pfad.
```

| Methode  | Endpunkt                                                                  | Zweck                                  |
| -------- | ------------------------------------------------------------------------- | -------------------------------------- |
| GET      | `/public/invitations/{token}/form`                                        | öffentliches Formular laden (ohne Abteilung) |
| GET      | `/public/invitations/{token}/form?departmentId={departmentId}`            | Formular inkl. abteilungsspezifischer Fragen |
| POST     | `/public/invitations/{token}/submissions`                                 | Antworten absenden (201)               |
| GET      | `/companies/{companyId}/departments`                                      | Abteilungen auflisten (Dropdown)       |
| GET      | `/companies/{companyId}/surveys`                                          | Umfragen auflisten                     |
| POST     | `/companies/{companyId}/surveys`                                          | Umfrage aus Vorlage erstellen          |
| GET      | `/companies/{companyId}/surveys/{surveyId}`                               | Umfrage inkl. Fragen laden             |
| PATCH    | `/companies/{companyId}/surveys/{surveyId}`                               | DRAFT bearbeiten                       |
| POST     | `/companies/{companyId}/surveys/{surveyId}/questions`                     | Frage hinzufügen                       |
| PATCH    | `.../questions/{questionId}`                                              | Frage bearbeiten                       |
| DELETE   | `.../questions/{questionId}`                                              | Frage deaktivieren                     |
| PUT      | `.../questions/order`                                                     | Reihenfolge ändern                     |
| POST     | `/companies/{companyId}/surveys/{surveyId}/publish`                       | veröffentlichen                        |
| GET/POST | `/companies/{companyId}/campaigns`                                        | Kampagnen                              |
| POST     | `.../campaigns/{campaignId}/activate`                                     | aktivieren                             |
| POST     | `.../campaigns/{campaignId}/invitations`                                  | EINEN allgemeinen Einladungslink erzeugen |
| GET      | `/companies/{companyId}/dashboard/overview?campaignId=`                   | Haupt-Dashboard                        |
| GET      | `/companies/{companyId}/dashboard/departments/{departmentId}?campaignId=` | Drilldown                              |

**Wichtig:** Pro Kampagne gibt es nur **EINEN** allgemeinen Einladungslink (nicht
einen pro Abteilung). Die Abteilung wählt der Mitarbeiter im Formular selbst aus.

### ⚠️ Abweichung vom aktuellen Backend-Contract (verbindlich für das Frontend)

Das Frontend-Modell weicht bewusst vom heutigen Stand der Backend-Mocks ab. Diese
Variante ist verbindlich; das Backend muss entsprechend angepasst werden:

| Thema | Aktueller Backend-Contract | Verbindliches Frontend-Modell |
|---|---|---|
| Einladungen | pro Abteilung mit `amount`; `InvitationBatchResponse` = Array von URLs | **EIN** allgemeiner Link pro Kampagne |
| `GET .../form` Response | ohne `departments` / `selectedDepartmentId` | enthält `departments[]` + `selectedDepartmentId` |
| `GET .../form` Query | kein `departmentId` | `?departmentId=` lädt allgemeine + abteilungsspezifische Fragen |
| Submission-Request | nur `answers` | `{ departmentId, answers }` |

Bis das Backend nachzieht, bilden die Mocks bereits das verbindliche
Frontend-Modell ab (nicht die Original-JSON aus `frontend-mocks/`, wo abweichend).

**Im Firmen-Frontend nicht umgesetzt:** `/platform/moderation/*` — das ist eine
interne Anonytix-Ansicht, kein Teil des HR-Dashboards.

### Fragetypen und Antwortfelder

| Fragetyp        | Feld in der Submission                                   |
| --------------- | -------------------------------------------------------- |
| `RATING`        | `numericValue` (zwischen `minimumValue`..`maximumValue`) |
| `TEXT`          | `textValue` (bis `maximumLength`)                        |
| `BOOLEAN`       | `booleanValue`                                           |
| `SINGLE_CHOICE` | genau eine ID in `selectedOptionIds`                     |
| `MULTI_CHOICE`  | mehrere IDs in `selectedOptionIds`                       |

### Fehlerformat

```json
{
  "timestamp": "...",
  "status": 400,
  "code": "VALIDATION_FAILED",
  "message": "...",
  "path": "...",
  "fieldErrors": [{ "field": "...", "message": "..." }]
}
```

Wichtige Codes: `VALIDATION_FAILED` (400), `RESOURCE_NOT_FOUND` (404),
`INVITATION_NOT_FOUND` (404), `INVITATION_ALREADY_USED` (409),
`SURVEY_ALREADY_PUBLISHED` (409), `INVITATION_EXPIRED` (410),
`MINIMUM_GROUP_SIZE_NOT_REACHED` (422), `INTERNAL_ERROR` (500).

---

## 3. Entscheidungen (im Brainstorming festgelegt)

- **Daten:** vollständige Mocks + localStorage; die API-Schicht ist hinter
  `lib/api.ts` gekapselt.
- **HR-Authentifizierung:** keine (offenes Dashboard für das MVP).
- **KI-Auswertung:** wird im Backend berechnet; das Frontend stellt nur die
  fertige Antwort dar (`dashboard-overview.json`).
- **Routing:** `react-router-dom` (echte URLs für den teilbaren Link nötig).
- **HR-Kette Survey→Campaign→Invitation:** hinter einem einzigen Button
  „Veröffentlichen und Link erhalten" verborgen (intern:
  publish→campaign→activate→invitations).
- **Dashboard:** vollständige Overview + Abteilungs-Drilldown.
- **Fragetypen im Builder:** alle 5 (`RATING`, `TEXT`, `BOOLEAN`,
  `SINGLE_CHOICE`, `MULTI_CHOICE`).

---

## 4. Architektur und Struktur

```
src/
  main.tsx                 # Router
  App.tsx                  # Layout (Header + <Outlet/>)
  lib/
    api.ts                 # ALLE Endpunkte des Vertrags; Mocks ↔ fetch über Flag
    types.ts               # Typen 1:1 zum JSON-Vertrag
    mock-store.ts          # localStorage: erstellte Surveys + Submissions
    utils.ts               # cn() für shadcn
  components/
    ui/                    # shadcn (button, card, input, select, checkbox,
                           #   textarea, radio-group, dialog, chart, ...)
    QuestionEditor.tsx     # Bearbeitung einer Frage (5 Typen)
    FormRenderer.tsx       # Pflicht-Abteilungs-Dropdown (shadcn Select) + Fragen → answers
    charts/
      KpiCard.tsx
      SentimentChart.tsx
      CategoryScoresChart.tsx
      SatisfactionTrendChart.tsx
      DepartmentHeatmap.tsx
  pages/
    SurveysListPage.tsx    # /                          Liste der HR-Umfragen
    BuilderPage.tsx        # /surveys/:id               Builder + Vorschau + Veröffentlichen
    PublicFormPage.tsx     # /feedback/:token           Mitarbeiter-Formular + „Danke"
    DashboardPage.tsx      # /dashboard                 Overview
    DepartmentPage.tsx     # /dashboard/departments/:id Drilldown
public/
  mocks/                   # JSON, kopiert aus anonytix-backend/frontend-mocks/
```

### Routen

| Pfad                         | Seite           | Nutzer      |
| ---------------------------- | --------------- | ----------- |
| `/`                          | SurveysListPage | HR          |
| `/surveys/:id`               | BuilderPage     | HR          |
| `/dashboard`                 | DashboardPage   | HR          |
| `/dashboard/departments/:id` | DepartmentPage  | HR          |
| `/feedback/:token`           | PublicFormPage  | Mitarbeiter |

---

## 5. Datenschicht (`lib/api.ts`)

Jede Funktion entspricht einem Endpunkt des Vertrags. Intern ein Modus-Schalter:
im Mock-Modus liest sie `public/mocks/*.json` + `localStorage`; im Live-Modus
`fetch(${VITE_API_BASE_URL}...)`. Signaturen und Rückgabetypen sind in beiden Modi
identisch, daher betrifft die Umstellung die Komponenten nicht.

```ts
listSurveys(): Promise<Survey[]>
createSurvey(req): Promise<Survey>                // aus Vorlage EMPLOYEE_SATISFACTION/EXIT_INTERVIEW
getSurvey(id): Promise<SurveyWithQuestions>
addQuestion(id, q) / updateQuestion(id, qid, q) / deleteQuestion(id, qid)
reorderQuestions(id, questionIds[])
listDepartments(): Promise<Department[]>         // für Abteilungs-Dropdown im Frageneditor

// publish → create campaign → activate → generate ONE invitation → allgemeiner Link
publishAndGetLink(surveyId): Promise<{
  campaignId: string
  url: string
  token: string
  expiresAt: string
}>

getPublicForm(token, departmentId?): Promise<PublicForm>   // ?departmentId= optional
submitFeedback(token, req: SubmitFeedbackRequest): Promise<SubmissionResponse>

getDashboardOverview(campaignId): Promise<DashboardOverview>
getDepartmentDashboard(departmentId, campaignId): Promise<DepartmentDashboard>
```

### Zentrale Typen (öffentliches Formular)

```ts
type PublicForm = {
  campaignId: string
  surveyId: string
  title: string
  description: string | null
  surveyType: "PULSE" | "EXIT"
  expiresAt: string
  departments: Department[]
  selectedDepartmentId: string | null   // null beim ersten Laden
  questions: Question[]                  // ohne departmentId → allgemeine Frage
}

type SubmitFeedbackRequest = {
  departmentId: string
  answers: AnswerRequest[]
}
```

Leere `departmentIds` bei einer Frage bedeuten: Frage gilt für **alle** Abteilungen.
Das Backend prüft die übermittelte `departmentId` — das Frontend darf sich **nicht**
darauf verlassen, dass jede gesendete ID akzeptiert wird (mögliche
`VALIDATION_FAILED`-Antwort behandeln).

`mock-store.ts` speichert die von HR erstellten Umfragen und eingegangene
Submissions in `localStorage`, damit der Demo-Ablauf „lebendig" ist (ein
erstelltes Formular ist tatsächlich über den Link erreichbar und Antworten
beeinflussen Zähler, wo sinnvoll). Die aggregierte KI-Auswertung kommt aus der
statischen `dashboard-overview.json` (sie wird vom Backend berechnet).

---

## 6. Datenfluss (End-to-End)

```
HR: /surveys/:id (DRAFT) — fügt Fragen hinzu/bearbeitet/sortiert (Live-Vorschau)
      ↓ „Veröffentlichen und Link erhalten"
    publishAndGetLink() → Dialog mit Link /feedback/:token (Button „Kopieren")
Mitarbeiter: öffnet /feedback/:token
      ↓ getPublicForm(token) → nur allgemeine Fragen + Abteilungsliste
      ↓ wählt Abteilung im Pflicht-Dropdown
      ↓ getPublicForm(token, departmentId) → allgemeine + abteilungsspezifische Fragen
      ↓ ausfüllen, submitFeedback(token, { departmentId, answers })
    Bildschirm „Danke — anonym übermittelt"
HR: /dashboard
      ↓ getDashboardOverview() → KPIs + Charts + KI-Zusammenfassung + Empfehlungen
      ↓ Klick auf eine Abteilung → /dashboard/departments/:id
    getDepartmentDashboard() → Drilldown (Kategorien vs. Firmendurchschnitt, Trend, Top-Themen)
```

`FormRenderer` ist eine reine Komponente: erhält `PublicForm`, gibt die
gesammelten `answers` über `onSubmit` zurück. Wird sowohl im öffentlichen Formular
als auch für die Live-Vorschau im Builder verwendet.

### Abteilungs-Auswahl im Mitarbeiterformular

- Vor den Fragen wird ein **verpflichtendes Abteilungs-Dropdown** angezeigt
  (Quelle: `PublicForm.departments`).
- Bei Auswahl/Wechsel der Abteilung wird das Formular über
  `getPublicForm(token, departmentId)` **neu geladen** (allgemeine +
  abteilungsspezifische Fragen).
- Beim Wechsel der Abteilung müssen **nicht mehr sichtbare Antworten** aus dem
  Formularzustand **entfernt** werden (keine Antworten zu nicht mehr angezeigten
  Fragen mitsenden).
- Ohne ausgewählte Abteilung ist „Absenden" deaktiviert.

### Mapping der Fragetypen im `FormRenderer`

- `RATING` → Button-Reihe `minimumValue..maximumValue` → `numericValue`.
- `TEXT` → `textarea` mit `maximumLength` → `textValue`.
- `BOOLEAN` → Ja/Nein-Schalter → `booleanValue`.
- `SINGLE_CHOICE` → Radio oder Select → eine ID in `selectedOptionIds`.
- `MULTI_CHOICE` → mehrere Checkboxen → mehrere IDs in `selectedOptionIds`.

Pro Antwort wird **nur** das zum Typ passende Feld gesetzt, die übrigen bleiben
`null`/`[]` (wie in `requests/submit-feedback.json`). Der Request enthält zusätzlich
die ausgewählte `departmentId` (`SubmitFeedbackRequest`).

---

## 7. Dashboard (gemäß `dashboard-overview.json`)

**Overview (`/dashboard`):**

- KPI-Karten (8): Wert, Einheit (`OUT_OF_5`/`PERCENT`/`COUNT`), Delta `change` +
  `changeLabel`, opt. `detail`.
- Sentiment-Verteilung (POSITIVE/NEUTRAL/NEGATIVE) — Pie/Bar.
- Kategorie-Scores (`score` vs. `previousScore`) — Bar-Chart (shadcn).
- Zufriedenheitstrend über Monate — Line-Chart.
- Abteilungs-Heatmap (mit Unterdrückung `suppressed`).
- Top-Themen (`label`, `mentions`, `sentiment`, `priority`, `trendPercentage`).
- **KI-Zusammenfassung** (`aiSummary.summary` + `disclaimer`) und **empfohlene
  Maßnahmen** (`recommendedActions`: title/priority/status).

**Drilldown (`/dashboard/departments/:id`):**

- Zufriedenheit der Abteilung vs. Firmendurchschnitt.
- Kategorien der Abteilung vs. Firma (`companyScore`).
- Trend der Abteilung, Top-Themen der Abteilung.
- Bei `visible:false`/`MINIMUM_GROUP_SIZE_NOT_REACHED` → Hinweis „Nicht genügend
  Daten für eine anonyme Darstellung".

---

## 8. Zustände und Fehler

- Alle Seiten halten `loading / error / data`.
- Einheitliches Parsen der Vertragsfehler (`code`, `message`, `fieldErrors`).
- Formular-Token: `INVITATION_NOT_FOUND` / `INVITATION_EXPIRED` /
  `INVITATION_ALREADY_USED` → eigene, verständliche Bildschirme.
- Veröffentlichte Umfrage (`SURVEY_ALREADY_PUBLISHED`) → Builder schreibgeschützt.
- Statistik-Unterdrückung (`sampleSize < minimumGroupSize`) → Hinweis statt Charts.
- Validierung von `required` vor dem Absenden, Inline-Fehler je Feld.

### Datenschutz (harte Anforderung)

Das Firmen-Frontend zeigt **niemals** rohen Freitext oder einzelne
Mitarbeiterantworten — nur Aggregate aus dem Backend. Moderations-Endpunkte werden
nicht aufgerufen und es werden keine Bildschirme dafür gebaut.

---

## 9. Testing (Hackathon-tauglich)

- Hauptfokus: manueller End-to-End-Durchlauf des Demo-Ablaufs.
- Optional Vitest für reine Funktionen: Mapping der `answers` je Typ, Validierung
  von `required`, Parsen des Fehlerformats.
- Kein schweres Test-Harness/E2E-Framework.

---

## 10. Setup-Schritte (erste Implementierungsphase)

1. shadcn initialisieren (`components.json`, Alias `@/*` in `tsconfig` und
   `vite.config.ts`), `lib/utils.ts` anlegen.
2. Vite-Starter-Template entfernen (`App.tsx`/`App.css`), Theme nach Tailwind 4
   übertragen.
3. `react-router-dom`, `lucide-react`, `recharts` (über shadcn `chart`) hinzufügen.
4. JSON aus `anonytix-backend/frontend-mocks/` nach `public/mocks/` kopieren.
5. `VITE_API_BASE_URL` in `.env` anlegen.

---

## 11. Außerhalb des MVP-Scopes

- Echte Authentifizierung/Mandantenfähigkeit.
- Anonytix-Moderationsansicht (`/platform/moderation/*`).
- Abteilungsverwaltung (Erstellen/Bearbeiten/Deaktivieren von Abteilungen) —
  Abteilungen werden nur via `listDepartments()` gelesen (für die Dropdowns).
- Consulting/Freelancer-Integration, Monetarisierung, Voice-Feedback.
