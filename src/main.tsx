import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App.tsx'
import SurveysListPage from '@/pages/SurveysListPage.tsx'
import BuilderPage from '@/pages/BuilderPage.tsx'
import PublicFormPage from '@/pages/PublicFormPage.tsx'
import DashboardPage from '@/pages/DashboardPage.tsx'
import DepartmentPage from '@/pages/DepartmentPage.tsx'
import AiOverviewPage from '@/pages/AiOverviewPage.tsx'

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <SurveysListPage /> },
      { path: '/surveys/:id', element: <BuilderPage /> },
      { path: '/feedback/:token', element: <PublicFormPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/dashboard/departments/:id', element: <DepartmentPage /> },
      { path: '/ai-overview', element: <AiOverviewPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
)
