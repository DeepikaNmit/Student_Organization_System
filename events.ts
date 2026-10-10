import { nowIso, read, uid, wait, write } from '../mocks/store'
import { seedEvents } from '../mocks/seed'
import { pushNotification } from '../mocks/notify'
import type { ClubEvent, Ticket } from '../types'
import { requireUser } from './auth'
import { ApiError } from './http'

const EVENTS_KEY = 'events'
const TICKETS_KEY = 'tickets'

export const loadEvents = () => read<ClubEvent[]>(EVENTS_KEY, seedEvents)
const loadTickets = () => read<Ticket[]>(TICKETS_KEY, () => [])

export async function listEvents(): Promise<ClubEvent[]> {
  await wait()
  requireUser()
  return loadEvents().sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

export interface CreateEventInput {
  title: string
  description: string
  startsAt: string
  venue: string
  capacity: number
  memberPriceInr: number
  nonMemberPriceInr: number
  memberOnly: boolean
  tag: string
}

export async function createEvent(input: CreateEventInput): Promise<ClubEvent> {
  await wait()
  const me = requireUser()
  if (me.role !== 'ADMIN' && !me.capabilities.includes('EVENT_ORGANIZER')) {
    throw new ApiError('Only Admins and Event Organizers can create events.', 403)
  }
  const ev: ClubEvent = {
    id: uid('e'),
    ...input,
    startsAt: new Date(input.startsAt).toISOString(),
    registered: 0,
    organizerName: me.name,
  }
  const all = loadEvents()
  all.push(ev)
  write(EVENTS_KEY, all)
  return ev
}

export async function registerForEvent(eventId: string): Promise<Ticket> {
  await wait(500)
  const me = requireUser()
  const events = loadEvents()
  const ev = events.find((e) => e.id === eventId)
  if (!ev) throw new ApiError('Event not found.', 404)
  const isMember = me.role === 'MEMBER' || me.role === 'ADMIN'
  if (ev.memberOnly && !isMember) throw new ApiError('This event is for members only.', 403)
  if (ev.registered >= ev.capacity) throw new ApiError('This event is sold out.', 409)
  const tickets = loadTickets()
  if (tickets.some((t) => t.eventId === ev.id && t.userId === me.id)) {
    throw new ApiError('You already have a ticket for this event.', 409)
  }
  const price = isMember ? ev.memberPriceInr : ev.nonMemberPriceInr
  const ticket: Ticket = {
    id: uid('t'),
    eventId: ev.id,
    eventTitle: ev.title,
    startsAt: ev.startsAt,
    venue: ev.venue,
    userId: me.id,
    holderName: me.name,
    priceInr: price,
    code: `CLU-${ev.id.replace('e_', '').toUpperCase().slice(0, 5)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt: nowIso(),
  }
  ev.registered += 1
  tickets.unshift(ticket)
  write(EVENTS_KEY, events)
  write(TICKETS_KEY, tickets)
  pushNotification(me.id, 'Ticket confirmed', `You're registered for ${ev.title}.`)
  return ticket
}

export async function listMyTickets(): Promise<Ticket[]> {
  await wait()
  const me = requireUser()
  return loadTickets()
    .filter((t) => t.userId === me.id)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}
