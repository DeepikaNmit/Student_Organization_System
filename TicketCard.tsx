import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, MapPin } from 'lucide-react'
import type { Ticket } from '../types'
import { formatDateTime, formatInr } from '../lib/format'
import { DemoBadge } from './ui'

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-navy/15 bg-white shadow-sm sm:flex-row">
      <div className="min-w-0 flex-1 space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-lav px-2 py-0.5 text-xs font-semibold text-navy">Ticket</span>
          <DemoBadge />
        </div>
        <h3 className="break-words text-lg font-bold text-navy">{ticket.eventTitle}</h3>
        <p className="flex items-center gap-2 text-sm text-navy">
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden /> {formatDateTime(ticket.startsAt)}
        </p>
        <p className="flex items-center gap-2 text-sm text-navy">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden /> {ticket.venue}
        </p>
        <p className="text-sm text-navy">
          Holder: <span className="font-semibold">{ticket.holderName}</span> · Paid: <span className="font-semibold">{formatInr(ticket.priceInr)}</span>
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 border-t border-dashed border-navy/30 bg-surface p-4 sm:w-48 sm:border-l sm:border-t-0">
        <div className="rounded-lg bg-white p-2">
          <QRCodeSVG value={`clustro:ticket:${ticket.code}`} size={112} fgColor="#17254C" bgColor="#FFFFFF" title={`QR code for ticket ${ticket.code}`} />
        </div>
        <p className="break-all text-center font-mono text-xs font-semibold text-navy">{ticket.code}</p>
      </div>
    </article>
  )
}
