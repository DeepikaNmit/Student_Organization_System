import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listUsers, updateUserAccess } from '../api/members'
import { accessSchema, type AccessForm } from '../lib/schemas'
import { errMsg, formatDate } from '../lib/format'
import { ALL_CAPABILITIES, CAPABILITY_LABEL, ROLE_LABEL, type Role, type User } from '../types'
import { DataTable, type Column } from '../components/DataTable'
import { Field } from '../components/Field'
import { FormModal } from '../components/FormModal'
import { Banner, CapabilityChip, PageHeader, RoleBadge } from '../components/ui'

export function AdminMembersPage() {
  const q = useQuery({ queryKey: ['users'], queryFn: listUsers })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL')
  const [selected, setSelected] = useState<User | null>(null)

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase()
    return (q.data ?? []).filter(
      (u) => (roleFilter === 'ALL' || u.role === roleFilter) && (!s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)),
    )
  }, [q.data, search, roleFilter])

  const columns: Column<User>[] = [
    {
      header: 'Name',
      cell: (u) => (
        <div className="min-w-0">
          <p className="font-semibold">{u.name}</p>
          <p className="break-all text-xs text-navy/80">{u.email}</p>
        </div>
      ),
    },
    { header: 'Role', cell: (u) => <RoleBadge role={u.role} /> },
    {
      header: 'Capabilities',
      cell: (u) =>
        u.capabilities.length ? (
          <div className="flex flex-wrap gap-1">{u.capabilities.map((c) => <CapabilityChip key={c} cap={c} />)}</div>
        ) : (
          <span className="text-navy/60">—</span>
        ),
    },
    { header: 'Plan', cell: (u) => <span className="capitalize">{u.planId ?? '—'}</span> },
    { header: 'Joined', cell: (u) => formatDate(u.createdAt) },
    {
      header: '',
      cell: (u) => (
        <button className="btn-secondary px-3 py-1.5" onClick={() => setSelected(u)}>
          Manage
        </button>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Members" subtitle="Profiles, plans and access for everyone with a Clustro account." />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-navy/60" aria-hidden />
          <input className="input pl-9" placeholder="Search name or email" aria-label="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" aria-label="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'ALL' | Role)}>
          <option value="ALL">All roles</option>
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(u) => u.id}
        loading={q.isLoading}
        error={q.isError ? errMsg(q.error) : null}
        onRetry={() => q.refetch()}
        emptyTitle="No users match"
        emptyHint="Try a different search or role filter."
      />
      {selected && <ManageModal user={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function ManageModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { user: me } = useAuth()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const isSelf = me?.id === user.id
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccessForm>({ resolver: zodResolver(accessSchema), defaultValues: { role: user.role, capabilities: user.capabilities } })
  const m = useMutation({ mutationFn: (v: AccessForm) => updateUserAccess(user.id, v) })

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
    <FormModal title={user.name} onClose={onClose} onSubmit={onSubmit} submitLabel="Save access" submitting={m.isPending} error={error}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-surface p-3 text-sm text-navy">
        <dt className="font-semibold">Email</dt><dd className="break-all">{user.email}</dd>
        <dt className="font-semibold">Department</dt><dd>{user.department || '—'}</dd>
        <dt className="font-semibold">Phone</dt><dd>{user.phone || '—'}</dd>
        <dt className="font-semibold">Plan</dt><dd className="capitalize">{user.planId ?? '—'}</dd>
        <dt className="font-semibold">Joined</dt><dd>{formatDate(user.createdAt)}</dd>
        {user.bio && (<><dt className="font-semibold">Bio</dt><dd>{user.bio}</dd></>)}
      </dl>
      {isSelf && <Banner tone="warn">You can't change your own access.</Banner>}
      <Field label="Role" htmlFor="role" error={errors.role?.message}>
        <select id="role" className="input" disabled={isSelf} {...register('role')}>
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </Field>
      <fieldset disabled={isSelf}>
        <legend className="label">Capabilities</legend>
        <div className="grid grid-cols-2 gap-2">
          {ALL_CAPABILITIES.map((c) => (
            <label key={c} className="flex items-center gap-2 rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy">
              <input type="checkbox" value={c} className="h-4 w-4 accent-navy" {...register('capabilities')} />
              {CAPABILITY_LABEL[c]}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-navy/80">Funder is additive: it never makes someone a Member, and donations never activate membership.</p>
      </fieldset>
    </FormModal>
  )
}
