import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { Capability, Role } from '../types'
import { Spinner } from './ui'

export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const loc = useLocation()
  if (isLoading) return <div className="grid min-h-screen place-items-center"><Spinner label="Loading Clustro…" /></div>
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <Outlet />
}

export function GuestOnly() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="grid min-h-screen place-items-center"><Spinner label="Loading Clustro…" /></div>
  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/** Allows a user whose role is in `roles`, OR who holds any capability in `capabilities`. */
export function RequireRole({ roles, capabilities = [] }: { roles: Role[]; capabilities?: Capability[] }) {
  const { user } = useAuth()
  if (!user) return null
  const ok = roles.includes(user.role) || capabilities.some((c) => user.capabilities.includes(c))
  if (!ok) {
    return (
      <div className="card mx-auto mt-10 max-w-md text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-navy" aria-hidden />
        <h1 className="mt-2 text-xl font-bold text-navy">You don't have access to this page</h1>
        <p className="mt-1 text-sm text-navy/80">Your account's role doesn't include this area of Clustro.</p>
      </div>
    )
  }
  return <Outlet />
}
