import { useQuery } from '@tanstack/react-query'
import { listTasks } from '../api/volunteering'
import { errMsg, formatDate } from '../lib/format'
import { Banner, Spinner, EmptyState } from '../components/ui'

export function VolunteeringPage() {
  const q = useQuery({ queryKey: ['volunteeringTasks'], queryFn: listTasks })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Volunteering</h1>
        <p className="mt-1 text-sm text-navy/70">Manage and view volunteer tasks.</p>
      </div>

      {q.isLoading && <Spinner />}
      {q.isError && <Banner tone="error">{errMsg(q.error)}</Banner>}
      {q.data?.length === 0 && <EmptyState title="No tasks" hint="There are currently no active volunteer tasks." />}

      {q.data && q.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map(t => (
            <div key={t.id} className="card p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-navy text-lg">{t.title}</h3>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${t.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-clustro text-navy'}`}>
                  {t.status}
                </span>
              </div>
              <p className="text-sm text-navy/80 mb-4">{t.description}</p>
              <div className="text-xs text-navy/60">
                <p>Assigned to: {t.assignedToName || 'Unassigned'}</p>
                <p>Deadline: {formatDate(t.deadline)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
