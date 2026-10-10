import { wait } from '../mocks/store'
import type { DashboardData } from '../types'
import { loadUsers, requireUser } from './auth'
import { loadEvents } from './events'
import { listAnnouncements } from './announcements'
import { myApplication, listApplications } from './members'

export async function getDashboard(): Promise<DashboardData> {
  await wait()
  const me = requireUser()
  const now = new Date().toISOString()
  const events = loadEvents()
  const upcoming = events.filter((e) => e.startsAt >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const latestAnnouncements = (await listAnnouncements()).slice(0, 3)

  const base = {
    role: me.role,
    upcomingEvents: upcoming.slice(0, 3),
    latestAnnouncements,
    registrationsByEvent: [] as DashboardData['registrationsByEvent'],
    pendingApplications: 0,
    pendingAccountApprovals: 0,
    myApplication: null as DashboardData['myApplication'],
  }

  if (me.role === 'ADMIN') {
    const users = loadUsers()
    const apps = await listApplications()
    const pending = apps.filter((a) => a.status === 'PENDING').length
    const pendingAcc = users.filter((u) => u.accountStatus === 'PENDING').length
    return {
      ...base,
      pendingApplications: pending,
      pendingAccountApprovals: pendingAcc,
      registrationsByEvent: upcoming.map((e) => ({
        name: e.title.length > 18 ? e.title.slice(0, 17) + '…' : e.title,
        registered: e.registered,
        capacity: e.capacity,
      })),
      stats: [
        { label: 'Total users', value: users.length },
        { label: 'Members', value: users.filter((u) => u.role === 'MEMBER').length },
        { label: 'Pending accounts', value: pendingAcc, hint: 'Awaiting approval' },
        { label: 'Upcoming events', value: upcoming.length },
      ],
    }
  }

  const app = await myApplication()
  if (me.role === 'MEMBER') {
    return {
      ...base,
      myApplication: app,
      stats: [
        { label: 'Plan', value: me.planId ? me.planId[0].toUpperCase() + me.planId.slice(1) : '—' },
        {
          label: 'Renews',
          value: me.planRenewsAt ? new Date(me.planRenewsAt).toLocaleDateString() : '—',
        },
        { label: 'Upcoming events', value: upcoming.length },
      ],
    }
  }

  return {
    ...base,
    myApplication: app,
    stats: [
      { label: 'Account type', value: 'Non-Member' },
      {
        label: 'Application',
        value: app ? app.status[0] + app.status.slice(1).toLowerCase() : 'None yet',
      },
      { label: 'Upcoming events', value: upcoming.length },
    ],
  }
}
