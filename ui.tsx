import type { ReactNode } from 'react'
import { AlertTriangle, FlaskConical, Inbox, Loader2 } from 'lucide-react'
import type { Capability, Role } from '../types'
import { CAPABILITY_LABEL, ROLE_LABEL } from '../types'

export function Logo({ light = false, size = 'md' }: { light?: boolean; size?: 'md' | 'lg' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`grid place-items-center rounded-lg font-bold ${size === 'lg' ? 'h-10 w-10 text-xl' : 'h-8 w-8 text-lg'} ${
          light ? 'bg-cyan-clustro text-navy' : 'bg-navy text-cyan-clustro'
        }`}
        aria-hidden
      >
        C
      </span>
      <span className={`font-bold tracking-tight ${size === 'lg' ? 'text-2xl' : 'text-xl'} ${light ? 'text-white' : 'text-navy'}`}>
        Clustro
      </span>
    </span>
  )
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm font-medium text-navy">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      {label}
    </div>
  )
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-lav/50 text-navy">
        <Inbox className="h-6 w-6" aria-hidden />
      </span>
      <p className="font-semibold text-navy">{title}</p>
      {hint && <p className="max-w-sm text-sm text-navy/80">{hint}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-800">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <p className="font-semibold text-navy">We couldn't load this</p>
      <p className="max-w-sm text-sm text-navy/80">{message}</p>
      {onRetry && (
        <button className="btn-secondary mt-1" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function Banner({ tone = 'info', children }: { tone?: 'info' | 'success' | 'error' | 'warn'; children: ReactNode }) {
  const tones = {
    info: 'bg-cyan-clustro/30 border-cyan-clustro text-navy',
    success: 'bg-emerald-100 border-emerald-600 text-emerald-950',
    error: 'bg-red-100 border-red-700 text-red-950',
    warn: 'bg-pinky/60 border-pinky text-navy',
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm font-medium ${tones[tone]}`}>
      {children}
    </div>
  )
}

export function DemoBadge({ text = 'Demo data' }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-navy/40 bg-lav/50 px-2 py-0.5 text-xs font-semibold text-navy">
      <FlaskConical className="h-3 w-3" aria-hidden />
      {text}
    </span>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  demo = true,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  demo?: boolean
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          {demo && <DemoBadge />}
        </div>
        {subtitle && <p className="mt-1 text-sm text-navy/80">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/70">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-navy/70">{hint}</p>}
    </div>
  )
}

export function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    ADMIN: 'bg-navy text-white',
    MEMBER: 'bg-cyan-clustro text-navy',
    NON_MEMBER: 'bg-white text-navy border border-navy/40',
  }
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${styles[role]}`}>{ROLE_LABEL[role]}</span>
}

export function CapabilityChip({ cap }: { cap: Capability }) {
  return <span className="inline-block rounded-full bg-pinky px-2 py-0.5 text-xs font-semibold text-navy">{CAPABILITY_LABEL[cap]}</span>
}
