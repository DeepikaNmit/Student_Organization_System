import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, CheckCircle2, Loader2, Lock, MapPin, Plus, Search, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createEvent, listEvents, listMyTickets, registerForEvent } from '../api/events'
import { eventSchema, type EventForm } from '../lib/schemas'
import { errMsg, formatDateTime, formatInr } from '../lib/format'
import type { ClubEvent, Ticket, User } from '../types'
import { Field } from '../components/Field'
import { FormModal, Modal } from '../components/FormModal'
import { TicketCard } from '../components/TicketCard'
import { Banner, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui'

const isMemberUser = (u: User) => u.role === 'MEMBER' || u.role === 'ADMIN'
const priceFor = (e: ClubEvent, u: User) => (isMemberUser(u) ? e.memberPriceInr : e.nonMemberPriceInr)

export function EventsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const eventsQ = useQuery({ queryKey: ['events'], queryFn: listEvents })
  const ticketsQ = useQuery({ queryKey: ['tickets'], queryFn: listMyTickets })
  const [search, setSearch] = useState('')
  const [registering, setRegistering] = useState<ClubEvent | null>(null)
  const [creating, setCreating] = useState(false)

  const ticketByEvent = useMemo(() => new Map((ticketsQ.data ?? []).map((t) => [t.eventId, t])), [ticketsQ.data])
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase()
    return (eventsQ.data ?? []).filter((e) => !s || e.title.toLowerCase().includes(s) || e.tag.toLowerCase().includes(s) || e.venue.toLowerCase().includes(s))
  }, [eventsQ.data, search])

  if (!user) return null
  const canCreate = user.role === 'ADMIN' || user.capabilities.includes('EVENT_ORGANIZER')

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Member and non-member prices are shown on every event. Your price is highlighted."
        actions={
          <>
            <Link to="/events/tickets" className="btn-secondary">My tickets</Link>
            {canCreate && (
              <button className="btn-primary" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden /> New event
              </button>
            )}
          </>
        }
      />
      <div className="relative mb-4 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-navy/60" aria-hidden />
        <input className="input pl-9" placeholder="Search events" aria-label="Search events" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {eventsQ.isLoading && <Spinner />}
      {eventsQ.isError && <div className="card"><ErrorState message={errMsg(eventsQ.error)} onRetry={() => eventsQ.refetch()} /></div>}
      {eventsQ.data && rows.length === 0 && <div className="card"><EmptyState title="No events found" hint="Try a different search, or check back soon." /></div>}
      {rows.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {rows.map((e) => (
            <EventCard key={e.id} event={e} user={user} ticket={ticketByEvent.get(e.id)} onRegister={() => setRegistering(e)} />
          ))}
        </div>
      )}

      {registering && (
        <RegisterModal
          event={registering}
          user={user}
          onClose={() => {
            setRegistering(null)
            qc.invalidateQueries()
          }}
        />
      )}
      {creating && <CreateEventModal onClose={() => setCreating(false)} onDone={() => qc.invalidateQueries()} />}
    </>
  )
}

function EventCard({ event: e, user, ticket, onRegister }: { event: ClubEvent; user: User; ticket?: Ticket; onRegister: () => void }) {
  const left = e.capacity - e.registered
  const soldOut = left <= 0
  const member = isMemberUser(user)
  const locked = e.memberOnly && !member
  const pct = Math.min(100, Math.round((e.registered / e.capacity) * 100))

  return (
    <article className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cyan-clustro px-2 py-0.5 text-xs font-semibold text-navy">{e.tag}</span>
        {e.memberOnly && (
          <span className="inline-flex items-center gap-1 rounded-full bg-pinky px-2 py-0.5 text-xs font-semibold text-navy">
            <Lock className="h-3 w-3" aria-hidden /> Members only
          </span>
        )}
        {soldOut && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-950">Sold out</span>}
      </div>
      <h2 className="break-words text-lg font-bold text-navy">{e.title}</h2>
      <p className="text-sm text-navy/90">{e.description}</p>
      <div className="space-y-1 text-sm text-navy">
        <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" aria-hidden /> {formatDateTime(e.startsAt)}</p>
        <p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" aria-hidden /> {e.venue}</p>
        <p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" aria-hidden /> {e.registered}/{e.capacity} registered{!soldOut && ` · ${left} left`}</p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-navy/10"
        role="progressbar"
        aria-label="Seats filled"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={`h-full ${soldOut ? 'bg-red-700' : 'bg-navy'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-center text-sm">
        <div className={`rounded-lg border px-2 py-1.5 ${member ? 'border-navy bg-cyan-clustro/30' : 'border-navy/20'}`}>
          <p className="text-xs font-semibold text-navy/80">Member{member && ' · you'}</p>
          <p className="font-bold text-navy">{formatInr(e.memberPriceInr)}</p>
        </div>
        <div className={`rounded-lg border px-2 py-1.5 ${!member ? 'border-navy bg-cyan-clustro/30' : 'border-navy/20'}`}>
          <p className="text-xs font-semibold text-navy/80">Non-member{!member && ' · you'}</p>
          <p className="font-bold text-navy">{e.memberOnly ? 'N/A' : formatInr(e.nonMemberPriceInr)}</p>
        </div>
      </div>
      <div className="mt-auto">
        {ticket ? (
          <Link to="/events/tickets" className="btn-secondary w-full"><CheckCircle2 className="h-4 w-4" aria-hidden /> Registered · view ticket</Link>
        ) : locked ? (
          <Link to="/membership" className="btn-secondary w-full"><Lock className="h-4 w-4" aria-hidden /> Become a member to join</Link>
        ) : (
          <button className="btn-primary w-full" disabled={soldOut} onClick={onRegister}>
            {soldOut ? 'Sold out' : `Register · ${formatInr(priceFor(e, user))}`}
          </button>
        )}
      </div>
    </article>
  )
}

function RegisterModal({ event: e, user, onClose }: { event: ClubEvent; user: User; onClose: () => void }) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const m = useMutation({ mutationFn: registerForEvent })
  const price = priceFor(e, user)

  const confirm = async () => {
    setError(null)
    try {
      setTicket(await m.mutateAsync(e.id))
    } catch (err) {
      setError(errMsg(err))
    }
  }

  return (
    <Modal title={ticket ? "You're registered" : `Register for ${e.title}`} onClose={onClose} wide={!!ticket}>
      {ticket ? (
        <div className="space-y-3">
          <TicketCard ticket={ticket} />
          <div className="flex justify-end"><button className="btn-primary" onClick={onClose}>Done</button></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-navy/20 p-3 text-sm text-navy">
            <p className="font-semibold">{e.title}</p>
            <p>{formatDateTime(e.startsAt)} · {e.venue}</p>
            <p className="mt-2 flex items-center justify-between">
              <span>Your price ({isMemberUser(user) ? 'member' : 'non-member'})</span>
              <span className="text-lg font-bold">{formatInr(price)}</span>
            </p>
          </div>
          {price > 0 && <Banner tone="warn">Demo mode — no real payment is taken.</Banner>}
          {error && <Banner tone="error">{error}</Banner>}
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={onClose} disabled={m.isPending}>Cancel</button>
            <button className="btn-primary" onClick={confirm} disabled={m.isPending}>
              {m.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {price > 0 ? `Pay ${formatInr(price)} (Demo) & register` : 'Confirm registration'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function CreateEventModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: '', description: '', startsAt: '', venue: '', capacity: 50, memberPriceInr: 0, nonMemberPriceInr: 0, memberOnly: false, tag: 'Talk' },
  })
  const m = useMutation({ mutationFn: createEvent })

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
    <FormModal title="New event" onClose={onClose} onSubmit={onSubmit} submitLabel="Create event" submitting={m.isPending} error={error} wide>
      <Field label="Title" htmlFor="title" error={errors.title?.message}>
        <input id="title" className="input" {...register('title')} />
      </Field>
      <Field label="Description" htmlFor="description" error={errors.description?.message}>
        <textarea id="description" rows={3} className="input" {...register('description')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date & time" htmlFor="startsAt" error={errors.startsAt?.message}>
          <input id="startsAt" type="datetime-local" className="input" {...register('startsAt')} />
        </Field>
        <Field label="Venue" htmlFor="venue" error={errors.venue?.message}>
          <input id="venue" className="input" {...register('venue')} />
        </Field>
        <Field label="Capacity" htmlFor="capacity" error={errors.capacity?.message}>
          <input id="capacity" type="number" min={1} className="input" {...register('capacity', { valueAsNumber: true })} />
        </Field>
        <Field label="Tag" htmlFor="tag" error={errors.tag?.message}>
          <input id="tag" className="input" {...register('tag')} />
        </Field>
        <Field label="Member price (₹)" htmlFor="memberPriceInr" error={errors.memberPriceInr?.message}>
          <input id="memberPriceInr" type="number" min={0} className="input" {...register('memberPriceInr', { valueAsNumber: true })} />
        </Field>
        <Field label="Non-member price (₹)" htmlFor="nonMemberPriceInr" error={errors.nonMemberPriceInr?.message}>
          <input id="nonMemberPriceInr" type="number" min={0} className="input" {...register('nonMemberPriceInr', { valueAsNumber: true })} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-navy">
        <input type="checkbox" className="h-4 w-4 accent-navy" {...register('memberOnly')} /> Members only
      </label>
    </FormModal>
  )
}

export function MyTicketsPage() {
  const q = useQuery({ queryKey: ['tickets'], queryFn: listMyTickets })
  return (
    <>
      <PageHeader title="My tickets" subtitle="Show the QR code at the door." />
      {q.isLoading && <Spinner />}
      {q.isError && <div className="card"><ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} /></div>}
      {q.data && q.data.length === 0 && (
        <div className="card">
          <EmptyState title="No tickets yet" hint="Register for an event and your ticket will appear here." action={<Link to="/events" className="btn-primary mt-2">Browse events</Link>} />
        </div>
      )}
      {q.data && q.data.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {q.data.map((t) => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}
    </>
  )
}
