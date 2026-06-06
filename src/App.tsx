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
