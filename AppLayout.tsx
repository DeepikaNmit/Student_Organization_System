import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { navFor } from '../lib/nav'
import { unreadCount } from '../api/notifications'
import { CapabilityChip, Logo, RoleBadge } from './ui'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const unread = useQuery({ queryKey: ['unread'], queryFn: unreadCount, enabled: !!user, refetchInterval: 15000 })

  if (!user) return null
  const items = navFor(user)

  const sidebar = (
    <nav className="flex h-full flex-col bg-navy text-white" aria-label="Main">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo light />
        <button className="rounded-md p-1 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.map(({ to, label, icon: Icon, soon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/events'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-cyan-clustro text-navy' : 'text-white hover:bg-white/10'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {soon && <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase">Soon</span>}
              {to === '/notifications' && (unread.data ?? 0) > 0 && (
                <span className="rounded-full bg-pinky px-1.5 py-0.5 text-[11px] font-bold text-navy">{unread.data}</span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-white/15 p-4 text-xs text-white/80">Clustro — Everything Your Organization Needs, Together</div>
    </nav>
  )

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-navy/10 bg-white px-4 py-3">
          <button className="rounded-md p-2 text-navy hover:bg-navy-50 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="relative rounded-md p-2 text-navy hover:bg-navy-50"
              aria-label={`Notifications${(unread.data ?? 0) > 0 ? `, ${unread.data} unread` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {(unread.data ?? 0) > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-navy px-1 text-[10px] font-bold text-white">
                  {unread.data}
                </span>
              )}
            </button>
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-semibold text-navy">{user.name}</p>
              <div className="flex flex-wrap items-center justify-end gap-1">
                <RoleBadge role={user.role} />
                {user.capabilities.map((c) => (
                  <CapabilityChip key={c} cap={c} />
                ))}
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={async () => {
                await logout()
                navigate('/login', { replace: true })
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
