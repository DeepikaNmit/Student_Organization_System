import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { listApplications, reviewApplication } from '../api/members'
import { reviewSchema, type ReviewForm } from '../lib/schemas'
import { errMsg, formatDate } from '../lib/format'
import type { ApplicationStatus, MembershipApplication } from '../types'
import { DataTable, type Column } from '../components/DataTable'
import { Field } from '../components/Field'
import { FormModal } from '../components/FormModal'
import { PageHeader } from '../components/ui'

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  PENDING: 'bg-lav text-navy',
  APPROVED: 'bg-emerald-100 text-emerald-950',
  REJECTED: 'bg-red-100 text-red-950',
}

export function AdminApplicationsPage() {
  const q = useQuery({ queryKey: ['applications'], queryFn: listApplications })
  const [filter, setFilter] = useState<'ALL' | ApplicationStatus>('PENDING')
  const [selected, setSelected] = useState<MembershipApplication | null>(null)
  const rows = (q.data ?? []).filter((a) => filter === 'ALL' || a.status === filter)

  const columns: Column<MembershipApplication>[] = [
    {
      header: 'Applicant',
      cell: (a) => (
        <div className="min-w-0">
          <p className="font-semibold">{a.userName}</p>
          <p className="break-all text-xs text-navy/80">{a.userEmail}</p>
        </div>
      ),
    },
    { header: 'Plan', cell: (a) => <span className="capitalize">{a.planId}</span> },
    { header: 'Reason', className: 'max-w-xs', cell: (a) => <p className="line-clamp-2 break-words">{a.reason}</p> },
    { header: 'Submitted', cell: (a) => formatDate(a.createdAt) },
    {
      header: 'Status',
      cell: (a) => <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[a.status]}`}>{a.status[0] + a.status.slice(1).toLowerCase()}</span>,
    },
    {
      header: '',
      cell: (a) =>
        a.status === 'PENDING' ? (
          <button className="btn-primary px-3 py-1.5" onClick={() => setSelected(a)}>Review</button>
        ) : (
          <button className="btn-secondary px-3 py-1.5" onClick={() => setSelected(a)}>View</button>
        ),
    },
  ]

  return (
    <>
      <PageHeader title="Applications" subtitle="Review membership applications. Approving upgrades the applicant's existing account." />
      <div className="mb-4">
        <select className="input w-auto" aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value as 'ALL' | ApplicationStatus)}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ALL">All</option>
        </select>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(a) => a.id}
        loading={q.isLoading}
        error={q.isError ? errMsg(q.error) : null}
        onRetry={() => q.refetch()}
        emptyTitle="No applications here"
        emptyHint="New membership applications will show up in this list."
      />
      {selected && <ReviewModal app={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function ReviewModal({ app, onClose }: { app: MembershipApplication; onClose: () => void }) {
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const readOnly = app.status !== 'PENDING'
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewForm>({ resolver: zodResolver(reviewSchema), defaultValues: { decision: 'APPROVED', note: '' } })
  const m = useMutation({ mutationFn: (v: ReviewForm) => reviewApplication(app.id, v) })

  const onSubmit = handleSubmit(async (v) => {
    setError(null)
    try {
      await m.mutateAsync(v)
      await qc.invalidateQueries()
      onClose()
    } catch (e) {
      setError(errMsg(e))
    }
  })

  return (
    <FormModal title={`${app.userName}'s application`} onClose={onClose} onSubmit={onSubmit} submitLabel="Submit decision" submitting={m.isPending} error={error}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-surface p-3 text-sm text-navy">
        <dt className="font-semibold">Email</dt><dd className="break-all">{app.userEmail}</dd>
        <dt className="font-semibold">Plan</dt><dd className="capitalize">{app.planId}</dd>
        <dt className="font-semibold">Submitted</dt><dd>{formatDate(app.createdAt)}</dd>
        <dt className="font-semibold">Reason</dt><dd className="break-words">{app.reason}</dd>
        {readOnly && (<><dt className="font-semibold">Decision</dt><dd>{app.status.toLowerCase()}{app.reviewNote ? ` — ${app.reviewNote}` : ''}</dd></>)}
      </dl>
      {!readOnly && (
        <>
          <fieldset>
            <legend className="label">Decision</legend>
            <div className="flex gap-2">
              {(['APPROVED', 'REJECTED'] as const).map((d) => (
                <label key={d} className="flex flex-1 items-center gap-2 rounded-lg border border-navy/30 px-3 py-2 text-sm font-semibold text-navy">
                  <input type="radio" value={d} className="h-4 w-4 accent-navy" {...register('decision')} />
                  {d === 'APPROVED' ? 'Approve' : 'Reject'}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Note to applicant" htmlFor="note" error={errors.note?.message} hint="Required when rejecting.">
            <textarea id="note" rows={3} className="input" {...register('note')} />
          </Field>
        </>
      )}
    </FormModal>
  )
}
