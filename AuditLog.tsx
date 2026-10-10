import { useQuery } from '@tanstack/react-query'
import { listAuditLog } from '../api/auditLog'
import { errMsg, formatDateTime } from '../lib/format'
import { Banner, Spinner, EmptyState } from '../components/ui'

export function AuditLogPage() {
  const q = useQuery({ queryKey: ['auditLog'], queryFn: () => listAuditLog() })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Audit Log</h1>
        <p className="mt-1 text-sm text-navy/70">View all system actions.</p>
      </div>

      {q.isLoading && <Spinner />}
      {q.isError && <Banner tone="error">{errMsg(q.error)}</Banner>}
      {q.data?.length === 0 && <EmptyState title="No logs" hint="No actions recorded yet." />}

      {q.data && q.data.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-navy-50 text-navy font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {q.data.map(log => (
                <tr key={log.id} className="hover:bg-navy-50/50">
                  <td className="px-4 py-3 text-navy/70">{formatDateTime(log.timestamp)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-navy-50 text-navy rounded font-semibold">{log.category}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-navy">{log.action}</td>
                  <td className="px-4 py-3 text-navy/80">{log.performedByName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
