import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getDashboard } from '../api/dashboard'
import { errMsg, formatDateTime } from '../lib/format'
import { Banner, EmptyState, ErrorState, PageHeader, Spinner, StatCard } from '../components/ui'

export function DashboardPage() {
  const { user } = useAuth()
  const q = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  if (!user) return null

  const subtitle =
    user.role === 'ADMIN'
      ? 'Overview of members, applications and events.'
      : user.role === 'MEMBER'
        ? 'Your membership and what is coming up.'
        : 'Explore Clustro, then apply for membership when you are ready.'

  return (
    <>
      <PageHeader title={`Hi, ${user.name.split(' ')[0]}`} subtitle={subtitle} />
      {q.isLoading && <Spinner />}
      {q.isError && <div className="card"><ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} /></div>}
      {q.data && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {q.data.stats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} />
            ))}
          </div>

          {user.role === 'NON_MEMBER' && <NonMemberCta status={q.data.myApplication?.status} note={q.data.myApplication?.reviewNote} />}

          {user.role === 'ADMIN' && (
            <div className="grid gap-5 xl:grid-cols-3">
              <section className="card xl:col-span-2">
                <h2 className="mb-3 font-bold text-navy">Registrations vs capacity</h2>
                {q.data.registrationsByEvent.length === 0 ? (
                  <EmptyState title="No upcoming events" />
                ) : (
                  <div className="h-64" role="img" aria-label="Bar chart of registrations versus capacity for upcoming events">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={q.data.registrationsByEvent} margin={{ left: -16, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#17254C22" />
                        <XAxis dataKey="name" tick={{ fill: '#17254C', fontSize: 11 }} interval={0} />
                        <YAxis tick={{ fill: '#17254C', fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="registered" name="Registered" fill="#17254C" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="capacity" name="Capacity" fill="#C8B6F4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
              <section className="card">
                <h2 className="font-bold text-navy">Needs your attention</h2>
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-sm text-navy font-semibold">Account Registrations</p>
                    <p className="text-sm text-navy/80">
                      {q.data.pendingAccountApprovals > 0
                        ? `${q.data.pendingAccountApprovals} account registration${q.data.pendingAccountApprovals > 1 ? 's' : ''} waiting for review.`
                        : 'No account registrations waiting for review.'}
                    </p>
                    <Link to="/admin/account-approvals" className="btn-primary mt-2">
                      Review accounts <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-navy">Upcoming events</h2>
                <Link to="/events" className="text-sm font-semibold underline">All events</Link>
              </div>
              {q.data.upcomingEvents.length === 0 ? (
                <EmptyState title="No upcoming events" />
              ) : (
                <ul className="divide-y divide-navy/10">
                  {q.data.upcomingEvents.map((e) => (
                    <li key={e.id} className="flex items-start gap-3 py-2.5">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-navy" aria-hidden />
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-navy">{e.title}</p>
                        <p className="text-xs text-navy/80">{formatDateTime(e.startsAt)} · {e.venue}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-navy">Latest announcements</h2>
                <Link to="/announcements" className="text-sm font-semibold underline">View all</Link>
              </div>
              {q.data.latestAnnouncements.length === 0 ? (
                <EmptyState title="No announcements yet" />
              ) : (
                <ul className="divide-y divide-navy/10">
                  {q.data.latestAnnouncements.map((a) => (
                    <li key={a.id} className="py-2.5">
                      <p className="break-words font-semibold text-navy">{a.title}</p>
                      <p className="line-clamp-2 text-sm text-navy/80">{a.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  )
}

function NonMemberCta({ status, note }: { status?: string; note?: string }) {
  return (
    <section className="card border-lav bg-lav/30">
      <h2 className="text-lg font-bold text-navy">Become a member</h2>
      {status === 'PENDING' ? (
        <div className="mt-2"><Banner tone="info">Your application is under review. You'll get a notification once an Admin decides.</Banner></div>
      ) : (
        <p className="mt-1 text-sm text-navy">
          Members get discounted event pricing and members-only events. Apply for free, or pick a paid plan for instant access.
        </p>
      )}
      {status === 'REJECTED' && <p className="mt-2 text-sm font-medium text-navy">Your last application was declined{note ? `: ${note}` : '.'} You can apply again.</p>}
      <Link to="/membership" className="btn-primary mt-3">
        View plans <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  )
}
