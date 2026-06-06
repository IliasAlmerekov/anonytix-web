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
