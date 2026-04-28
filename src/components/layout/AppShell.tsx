import { Suspense, useState, type CSSProperties, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { IconSettings } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { MobileNav } from '@/components/layout/MobileNav'
import { PageSkeleton } from '@/components/layout/PageSkeleton'
import { Sidebar } from '@/components/layout/Sidebar'

interface AppShellProps {
  children?: ReactNode
  hideHeader?: boolean
}

const PAGE_TITLES: Record<string, string> = {
  '/home': 'Home',
  '/compose': 'Compose',
  '/posts': 'Posts',
  '/insights': 'Insights',
  '/trends': 'Trends',
  '/circles': 'Circles',
  '/settings': 'Settings',
  '/settings/voice': 'Voice & writing',
}

function getPageTitle(pathname: string) {
  return PAGE_TITLES[pathname] || 'Content Copilot'
}

function initials(name: string | null | undefined) {
  return (name?.trim().charAt(0) || '?').toUpperCase()
}

export function AppShell({ children, hideHeader }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, avatarUrl } = useUserProfile()
  const shouldHideHeader = hideHeader ?? (location.pathname === '/home' || location.pathname === '/compose')
  const content = children ?? <Outlet />

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div
      className="flex min-h-screen bg-background"
      style={{ '--app-sidebar-width': sidebarCollapsed ? '4rem' : '14rem' } as CSSProperties}
    >
      <div className="hidden shrink-0 md:flex">
        <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={handleToggleCollapse} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {!shouldHideHeader && (
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-white px-4">
            <h1 className="font-heading text-base font-semibold text-foreground">{getPageTitle(location.pathname)}</h1>
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Your avatar" className="size-8 rounded-full border border-border" />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                  <span className="text-xs font-semibold text-muted-foreground">{initials(profile?.displayName)}</span>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} aria-label="Open settings">
                <IconSettings size={18} />
              </Button>
            </div>
          </header>
        )}

        <main className="flex-1 pb-16 md:pb-0">
          <Suspense fallback={<PageSkeleton />}>
            <div key={location.pathname} className="page-transition">
              {content}
            </div>
          </Suspense>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
