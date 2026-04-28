import { useLocation, useNavigate } from 'react-router-dom'
import {
  IconChartBar,
  IconChevronLeft,
  IconChevronRight,
  IconFiles,
  IconFlame,
  IconLayoutDashboard,
  IconMicrophone,
  IconPencil,
  IconSettings,
  IconUsersGroup,
} from '@tabler/icons-react'
import type { Icon } from '@tabler/icons-react'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

interface NavItem {
  path: string
  label: string
  icon: Icon
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { path: '/home', label: 'Home', icon: IconLayoutDashboard },
  { path: '/compose', label: 'Compose', icon: IconPencil },
  { path: '/posts', label: 'Posts', icon: IconFiles },
  { path: '/insights', label: 'Insights', icon: IconChartBar },
  { path: '/trends', label: 'Trends', icon: IconFlame },
  { path: '/circles', label: 'Circles', icon: IconUsersGroup },
]

const SECONDARY_NAV_ITEMS: NavItem[] = [
  { path: '/settings/voice', label: 'Voice', icon: IconMicrophone },
  { path: '/settings', label: 'Settings', icon: IconSettings },
]

function initials(name: string | null | undefined) {
  return (name?.trim().charAt(0) || '?').toUpperCase()
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, avatarUrl } = useUserProfile()

  const isActive = (path: string) => {
    if (path === '/settings') return location.pathname === '/settings'
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const renderItem = (item: NavItem) => {
    const IconComponent = item.icon
    const active = isActive(item.path)

    return (
      <button
        key={item.path}
        type="button"
        onClick={() => navigate(item.path)}
        className={cn(
          'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
          active ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          isCollapsed && 'justify-center px-2',
        )}
      >
        {active && <span className="absolute left-0 h-5 w-1 rounded-r bg-primary" />}
        <IconComponent size={18} className="shrink-0" />
        {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}
      </button>
    )
  }

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r border-border bg-white transition-[width] duration-200',
        isCollapsed ? 'w-16' : 'w-56',
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <IconPencil size={17} />
        </div>
        {!isCollapsed && (
          <span className="truncate font-heading text-base font-semibold text-foreground">
            Content Copilot
          </span>
        )}
      </div>

      <div className={cn('shrink-0 border-b border-border px-3 py-3', isCollapsed && 'px-2')}>
        <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Your avatar"
              className="size-8 shrink-0 rounded-full border border-border"
            />
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <span className="text-xs font-semibold text-muted-foreground">{initials(profile?.displayName)}</span>
            </div>
          )}
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{profile?.displayName || 'Your profile'}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.jobTitle || 'Ready to write'}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {MAIN_NAV_ITEMS.map(renderItem)}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-border px-2 py-2">
        {SECONDARY_NAV_ITEMS.map(renderItem)}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            isCollapsed && 'justify-center px-2',
          )}
        >
          {isCollapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
          {!isCollapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
