import { nowIso, read, uid, wait, write } from '../mocks/store'
import { seedAnnouncements } from '../mocks/seed'
import { pushNotification } from '../mocks/notify'
import type { Announcement, AnnouncementAudience } from '../types'
import { loadUsers, requireAdmin, requireUser } from './auth'

const KEY = 'announcements'

export const loadAnnouncements = () => read<Announcement[]>(KEY, seedAnnouncements)

export async function listAnnouncements(): Promise<Announcement[]> {
  await wait()
  const me = requireUser()
  const canSeeMembers = me.role === 'MEMBER' || me.role === 'ADMIN'
  return loadAnnouncements()
    .filter((a) => a.audience === 'ALL' || canSeeMembers)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createAnnouncement(input: {
  title: string
  body: string
  audience: AnnouncementAudience
}): Promise<Announcement> {
  await wait()
  const admin = requireAdmin()
  const a: Announcement = {
    id: uid('a'),
    title: input.title.trim(),
    body: input.body.trim(),
    audience: input.audience,
    authorName: admin.name,
    createdAt: nowIso(),
  }
  const all = loadAnnouncements()
  all.unshift(a)
  write(KEY, all)
  loadUsers()
    .filter((u) => u.id !== admin.id && (input.audience === 'ALL' || u.role === 'MEMBER' || u.role === 'ADMIN'))
    .forEach((u) => pushNotification(u.id, 'New announcement', a.title))
  return a
}
