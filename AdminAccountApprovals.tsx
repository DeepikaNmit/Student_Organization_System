import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, X, Clock, UserCheck, UserX, Filter } from 'lucide-react'
import { listAccountApplications, approveAccount, rejectAccount, type AccountStatus } from '../api/accountApprovals'
import { errMsg } from '../lib/format'
import { Banner, Spinner, EmptyState } from '../components/ui'

type FilterOption = AccountStatus | 'ALL'

export function AdminAccountApprovalsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<FilterOption>('PENDING')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const query = useQuery({
    queryKey: ['accountApplications', filter],
    queryFn: () => listAccountApplications(filter),
  })

  const approveMut = useMutation({
    mutationFn: approveAccount,
    onSuccess: (_u) => {
      setFeedback({ type: 'success', msg: `Account approved.` })
      qc.invalidateQueries({ queryKey: ['accountApplications'] })
      qc.invalidateQueries({ queryKey: ['accountPendingCount'] })
    },
    onError: (e) => setFeedback({ type: 'error', msg: errMsg(e) }),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectAccount(id, reason),
    onSuccess: () => {
      setFeedback({ type: 'success', msg: `Account rejected.` })
      setRejectId(null)
      setRejectReason('')
      qc.invalidateQueries({ queryKey: ['accountApplications'] })
      qc.invalidateQueries({ queryKey: ['accountPendingCount'] })
    },
    onError: (e) => setFeedback({ type: 'error', msg: errMsg(e) }),
  })

  const statusColors: Record<AccountStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
  }
  const statusIcons: Record<AccountStatus, typeof Clock> = {
    PENDING: Clock,
    APPROVED: UserCheck,
    REJECTED: UserX,
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Account Approvals</h1>
          <p className="mt-1 text-sm text-navy/70">Review and approve or reject new account registrations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-navy/60" aria-hidden />
          <select
            className="input py-1.5 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All</option>
          </select>
        </div>
      </div>

      {feedback && (
        <div className="mb-4">
          <Banner tone={feedback.type}>
            {feedback.msg}
          </Banner>
        </div>
      )}

      {query.isLoading && <Spinner label="Loading registrations…" />}
      {query.isError && <Banner tone="error">{errMsg(query.error)}</Banner>}
      {query.data && query.data.length === 0 && (
        <EmptyState title="No registrations" hint={filter === 'PENDING' ? 'No pending account registrations.' : 'No registrations match this filter.'} />
      )}
      {query.data && query.data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-navy/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-navy">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Department</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Registered</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-navy">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {query.data.map((app) => {
                const StatusIcon = statusIcons[app.accountStatus]
                return (
                  <tr key={app.id} className="hover:bg-navy-50/50">
                    <td className="px-4 py-3 font-medium text-navy">{app.name}</td>
                    <td className="px-4 py-3 text-navy/80">{app.email}</td>
                    <td className="px-4 py-3 text-navy/80">{app.department || '—'}</td>
                    <td className="px-4 py-3 text-navy/70 text-xs">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[app.accountStatus]}`}>
                        <StatusIcon className="h-3 w-3" />
                        {app.accountStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {app.accountStatus === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn-primary py-1 px-3 text-xs"
                            disabled={approveMut.isPending}
                            onClick={() => approveMut.mutate(app.id)}
                          >
                            <Check className="h-3 w-3" aria-hidden /> Approve
                          </button>
                          <button
                            className="btn-secondary py-1 px-3 text-xs text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => setRejectId(app.id)}
                          >
                            <X className="h-3 w-3" aria-hidden /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject confirmation dialog */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="card w-full max-w-md">
            <h2 className="text-lg font-bold text-navy">Reject Account</h2>
            <p className="mt-1 text-sm text-navy/70">Provide a reason for rejection (required). The user will be notified.</p>
            <textarea
              className="input mt-3 min-h-[80px]"
              placeholder="Reason for rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => { setRejectId(null); setRejectReason('') }}>Cancel</button>
              <button
                className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
                disabled={rejectMut.isPending || !rejectReason.trim()}
                onClick={() => rejectMut.mutate({ id: rejectId, reason: rejectReason.trim() })}
              >
                Reject Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
