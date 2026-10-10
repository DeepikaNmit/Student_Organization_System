import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, CheckCheck, Megaphone, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createAnnouncement, listAnnouncements } from '../api/announcements'
import { listNotifications, markAllRead, markRead } from '../api/notifications'
import { announcementSchema, type AnnouncementForm } from '../lib/schemas'
import { errMsg, formatDateTime } from '../lib/format'
import { Field } from '../components/Field'
import { FormModal } from '../components/FormModal'
import { EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui'

export function AnnouncementsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['announcements'], queryFn: listAnnouncements })
  const [creating, setCreating] = useState(false)

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="News from your organization."
        actions={
          user?.role === 'ADMIN' && (
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden /> New announcement
            </button>
          )
        }
      />
      {q.isLoading && <Spinner />}
      {q.isError && <div className="card"><ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} /></div>}
      {q.data && q.data.length === 0 && <div className="card"><EmptyState title="No announcements yet" hint="Updates from your organization will appear here." /></div>}
      {q.data && q.data.length > 0 && (
        <ul className="space-y-3">
          {q.data.map((a) => (
            <li key={a.id} className="card">
              <div className="flex flex-wrap items-center gap-2">
                <Megaphone className="h-4 w-4 text-navy" aria-hidden />
                <h2 className="break-words font-bold text-navy">{a.title}</h2>
                {a.audience === 'MEMBERS' && <span className="rounded-full bg-pinky px-2 py-0.5 text-xs font-semibold text-navy">Members</span>}
              </div>
              <p className="mt-2 whitespace-pre-line break-words text-sm text-navy">{a.body}</p>
              <p className="mt-2 text-xs text-navy/70">{a.authorName} · {formatDateTime(a.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
      {creating && <CreateModal onClose={() => setCreating(false)} onDone={() => qc.invalidateQueries()} />}
    </>
  )
}

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnouncementForm>({ resolver: zodResolver(announcementSchema), defaultValues: { title: '', body: '', audience: 'ALL' } })
  const m = useMutation({ mutationFn: createAnnouncement })

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
    <FormModal title="New announcement" onClose={onClose} onSubmit={onSubmit} submitLabel="Publish" submitting={m.isPending} error={error}>
      <Field label="Title" htmlFor="title" error={errors.title?.message}>
        <input id="title" className="input" {...register('title')} />
      </Field>
      <Field label="Message" htmlFor="body" error={errors.body?.message}>
        <textarea id="body" rows={4} className="input" {...register('body')} />
      </Field>
      <Field label="Audience" htmlFor="audience" error={errors.audience?.message} hint="Everyone in the audience gets a notification.">
        <select id="audience" className="input" {...register('audience')}>
          <option value="ALL">Everyone</option>
          <option value="MEMBERS">Members only</option>
        </select>
      </Field>
    </FormModal>
  )
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['notifications'], queryFn: listNotifications })
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] })
    qc.invalidateQueries({ queryKey: ['unread'] })
  }
  const readM = useMutation({ mutationFn: ({ id, read }: { id: string; read: boolean }) => markRead(id, read), onSuccess: refresh })
  const allM = useMutation({ mutationFn: markAllRead, onSuccess: refresh })
  const unread = (q.data ?? []).filter((n) => !n.read).length

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : 'You are all caught up.'}
        actions={
          <button className="btn-secondary" disabled={unread === 0 || allM.isPending} onClick={() => allM.mutate()}>
            <CheckCheck className="h-4 w-4" aria-hidden /> Mark all read
          </button>
        }
      />
      {q.isLoading && <Spinner />}
      {q.isError && <div className="card"><ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} /></div>}
      {q.data && q.data.length === 0 && <div className="card"><EmptyState title="No notifications" hint="Updates about your applications, tickets and announcements show up here." /></div>}
      {q.data && q.data.length > 0 && (
        <ul className="space-y-2">
          {q.data.map((n) => (
            <li key={n.id} className={`card flex items-start gap-3 ${n.read ? '' : 'border-navy bg-cyan-clustro/20'}`}>
              <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${n.read ? 'bg-navy/10 text-navy' : 'bg-navy text-white'}`}>
                <Bell className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold text-navy">
                  {n.title} {!n.read && <span className="ml-1 rounded-full bg-navy px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">New</span>}
                </p>
                <p className="break-words text-sm text-navy">{n.body}</p>
                <p className="mt-1 text-xs text-navy/70">{formatDateTime(n.createdAt)}</p>
              </div>
              <button className="btn-secondary shrink-0 px-3 py-1.5" onClick={() => readM.mutate({ id: n.id, read: !n.read })}>
                {n.read ? 'Mark unread' : 'Mark read'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
