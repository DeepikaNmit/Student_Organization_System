import { Link, useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { STUBS } from '../lib/nav'
import { PageHeader } from '../components/ui'

export function ComingSoonPage() {
  const { pathname } = useLocation()
  const title = STUBS[pathname] ?? 'This module'
  return (
    <>
      <PageHeader title={title} demo={false} />
      <div className="card flex flex-col items-center gap-2 py-14 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-pinky text-navy">
          <Construction className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="text-xl font-bold text-navy">Coming soon</h2>
        <p className="max-w-sm text-sm text-navy/80">{title} is on the Clustro roadmap and will arrive in a later phase.</p>
      </div>
    </>
  )
}

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-navy">Page not found</h1>
        <p className="mt-2 text-navy/80">That page doesn't exist in Clustro.</p>
        <Link to="/dashboard" className="btn-primary mt-4">Back to dashboard</Link>
      </div>
    </div>
  )
}
