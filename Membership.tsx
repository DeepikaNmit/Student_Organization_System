import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Check, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listPlans, myApplication, payAndUpgrade, submitApplication } from '../api/members'
import { applicationSchema, type ApplicationForm } from '../lib/schemas'
import { errMsg, formatDate, formatInr } from '../lib/format'
import type { PaymentReceipt, Plan } from '../types'
import { Field } from '../components/Field'
import { FormModal, Modal } from '../components/FormModal'
import { Banner, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui'

export function MembershipPage() {
  const { user, refresh } = useAuth()
  const qc = useQueryClient()
  const plansQ = useQuery({ queryKey: ['plans'], queryFn: listPlans })
  const appQ = useQuery({ queryKey: ['myApplication'], queryFn: myApplication })
  const [applyOpen, setApplyOpen] = useState(false)
  const [payPlan, setPayPlan] = useState<Plan | null>(null)

  if (!user) return null
  if (user.role === 'ADMIN') {
    return (
      <>
        <PageHeader title="Membership" demo={false} />
        <div className="card"><EmptyState title="Admins don't need a plan" hint="Manage members and applications from the Members and Applications pages." /></div>
      </>
    )
  }

  const app = appQ.data
  const isMember = user.role === 'MEMBER'

  return (
    <>
      <PageHeader
        title={isMember ? 'My membership' : 'Membership'}
        subtitle={isMember ? 'Your current plan and upgrade options.' : 'Apply for free, or pay for a plan to upgrade instantly. Either way, your account stays the same.'}
      />

      {!isMember && app?.status === 'PENDING' && (
        <div className="mb-4"><Banner tone="info">Your Associate application (sent {formatDate(app.createdAt)}) is waiting for Admin review.</Banner></div>
      )}
      {!isMember && app?.status === 'REJECTED' && (
        <div className="mb-4"><Banner tone="warn">Your last application was declined{app.reviewNote ? `: ${app.reviewNote}` : '.'} You can apply again or choose a paid plan.</Banner></div>
      )}
      {isMember && (
        <div className="card mb-5 border-cyan-clustro bg-cyan-clustro/20">
          <p className="text-sm font-semibold text-navy">Current plan</p>
          <p className="text-2xl font-bold capitalize text-navy">{user.planId ?? '—'}</p>
          {user.planRenewsAt && <p className="text-sm text-navy">Renews {formatDate(user.planRenewsAt)}</p>}
        </div>
      )}

      {plansQ.isLoading && <Spinner />}
      {plansQ.isError && <div className="card"><ErrorState message={errMsg(plansQ.error)} onRetry={() => plansQ.refetch()} /></div>}
      {plansQ.data && (
        <div className="grid gap-4 md:grid-cols-3">
          {plansQ.data.map((p) => {
            const current = isMember && user.planId === p.id
            return (
              <section key={p.id} className={`card flex flex-col ${p.highlight ? 'border-2 border-navy' : ''}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-navy">{p.name}</h2>
                  {p.highlight && <span className="rounded-full bg-lav px-2 py-0.5 text-xs font-bold text-navy">Popular</span>}
                </div>
                <p className="mt-2 text-3xl font-bold text-navy">{formatInr(p.priceInr)}</p>
                <p className="text-xs text-navy/70">{p.periodLabel}</p>
                <ul className="my-4 flex-1 space-y-1.5">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-navy">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {perk}
                    </li>
                  ))}
                </ul>
                {current ? (
                  <button className="btn-secondary" disabled>Current plan</button>
                ) : p.requiresApplication ? (
                  isMember ? (
                    <button className="btn-secondary" disabled>Not available</button>
                  ) : (
                    <button className="btn-secondary" disabled={app?.status === 'PENDING'} onClick={() => setApplyOpen(true)}>
                      {app?.status === 'PENDING' ? 'Application pending' : 'Apply for membership'}
                    </button>
                  )
                ) : (
                  <button className="btn-primary" onClick={() => setPayPlan(p)}>
                    {isMember ? 'Switch to this plan' : 'Choose plan'}
                  </button>
                )}
              </section>
            )
          })}
        </div>
      )}

      {applyOpen && <ApplyModal onClose={() => setApplyOpen(false)} onDone={() => qc.invalidateQueries()} />}
      {payPlan && (
        <PayModal
          plan={payPlan}
          onClose={() => {
            setPayPlan(null)
            refresh()
          }}
        />
      )}
    </>
  )
}

function ApplyModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationForm>({ resolver: zodResolver(applicationSchema), defaultValues: { reason: '' } })
  const m = useMutation({ mutationFn: submitApplication })

  const onSubmit = handleSubmit(async (v) => {
    setError(null)
    try {
      await m.mutateAsync(v)
      onDone()
      onClose()
    } catch (e) {
      setError(errMsg(e))
    }
  })

  return (
    <FormModal title="Apply for Associate membership" onClose={onClose} onSubmit={onSubmit} submitLabel="Submit application" submitting={m.isPending} error={error}>
      <p className="text-sm text-navy">An Admin will review your application. If approved, this same account becomes a Member account.</p>
      <Field label="Why would you like to join?" htmlFor="reason" error={errors.reason?.message}>
        <textarea id="reason" rows={5} className="input" {...register('reason')} />
      </Field>
    </FormModal>
  )
}

function PayModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const m = useMutation({ mutationFn: payAndUpgrade })

  const pay = async () => {
    setError(null)
    try {
      const r = await m.mutateAsync({ planId: plan.id })
      setReceipt(r.receipt)
    } catch (e) {
      setError(errMsg(e))
    }
  }

  return (
    <Modal title={receipt ? 'Payment confirmed' : `Upgrade to ${plan.name}`} onClose={onClose}>
      {receipt ? (
        <div className="space-y-3 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" aria-hidden />
          <p className="text-lg font-bold text-navy">You're now on the {plan.name} plan</p>
          <p className="text-sm text-navy">Your account has been upgraded to Member. Reference <span className="font-mono font-semibold">{receipt.reference}</span></p>
          <Banner tone="info">Demo mode — no real payment was taken.</Banner>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      ) : (
        <div className="space-y-4">
          <Banner tone="warn">Demo mode — no real payment is taken.</Banner>
          <div className="rounded-lg border border-navy/20 p-3">
            <div className="flex items-center justify-between text-sm text-navy">
              <span className="font-semibold">{plan.name} · {plan.periodLabel}</span>
              <span className="text-lg font-bold">{formatInr(plan.priceInr)}</span>
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-navy/80"><ShieldCheck className="h-4 w-4" aria-hidden /> Your existing account will be upgraded — no new account is created.</p>
          {error && <Banner tone="error">{error}</Banner>}
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={onClose} disabled={m.isPending}>Cancel</button>
            <button className="btn-primary" onClick={pay} disabled={m.isPending}>
              {m.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Pay {formatInr(plan.priceInr)} (Demo)
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
