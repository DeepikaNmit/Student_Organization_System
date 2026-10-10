import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api/members'
import { profileSchema, type ProfileForm } from '../lib/schemas'
import { errMsg, formatDate } from '../lib/format'
import { Field } from '../components/Field'
import { Banner, CapabilityChip, PageHeader, RoleBadge } from '../components/ui'

export function ProfilePage() {
  const { user, refresh } = useAuth()
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', department: user?.department ?? '', phone: user?.phone ?? '', bio: user?.bio ?? '' },
  })
  const m = useMutation({ mutationFn: updateProfile })
  if (!user) return null

  const onSubmit = handleSubmit(async (v) => {
    setMsg(null)
    try {
      await m.mutateAsync(v)
      await refresh()
      setMsg({ tone: 'success', text: 'Profile saved.' })
    } catch (e) {
      setMsg({ tone: 'error', text: errMsg(e) })
    }
  })

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details." demo={false} />
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card space-y-3 lg:col-span-1">
          <p className="break-all text-sm text-navy">{user.email}</p>
          <div className="flex flex-wrap gap-1.5">
            <RoleBadge role={user.role} />
            {user.capabilities.map((c) => <CapabilityChip key={c} cap={c} />)}
          </div>
          <dl className="space-y-1 text-sm text-navy">
            <div className="flex justify-between gap-2"><dt className="font-semibold">Plan</dt><dd className="capitalize">{user.planId ?? '—'}</dd></div>
            <div className="flex justify-between gap-2"><dt className="font-semibold">Joined</dt><dd>{formatDate(user.createdAt)}</dd></div>
          </dl>
        </section>
        <form onSubmit={onSubmit} noValidate className="card space-y-4 lg:col-span-2">
          <Field label="Full name" htmlFor="name" error={errors.name?.message}>
            <input id="name" className="input" {...register('name')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Department" htmlFor="department" error={errors.department?.message}>
              <input id="department" className="input" {...register('department')} />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <input id="phone" className="input" {...register('phone')} />
            </Field>
          </div>
          <Field label="Bio" htmlFor="bio" error={errors.bio?.message}>
            <textarea id="bio" rows={3} className="input" {...register('bio')} />
          </Field>
          {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
          <div className="flex justify-end">
            <button className="btn-primary" disabled={m.isPending || !isDirty}>
              {m.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
