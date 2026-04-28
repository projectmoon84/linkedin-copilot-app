import { useLocation, useNavigate } from 'react-router-dom'
import {
  IconFiles,
  IconFlame,
  IconLayoutDashboard,
  IconPencil,
  IconSettings,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV_ITEMS = [
  { path: '/home', label: 'Home', icon: IconLayoutDashboard },
  { path: '/compose', label: 'Compose', icon: IconPencil },
  { path: '/posts', label: 'Posts', icon: IconFiles },
  { path: '/trends', label: 'Trends', icon: IconFlame },
  { path: '/settings', label: 'Settings', icon: IconSettings },
]

export function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white md:hidden">
      <div className="flex h-14 items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                'flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon size={20} />
              <span className="text-3xs font-semibold">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
