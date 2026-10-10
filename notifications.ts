import { loadNotifications, NOTIFICATIONS_KEY } from '../mocks/notify'
import { wait, write } from '../mocks/store'
import type { Notification } from '../types'
import { requireUser } from './auth'

export async function listNotifications(): Promise<Notification[]> {
  await wait()
  const u = requireUser()
  return loadNotifications()
    .filter((n) => n.userId === u.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function unreadCount(): Promise<number> {
  const u = requireUser()
  return loadNotifications().filter((n) => n.userId === u.id && !n.read).length
}

export async function markRead(id: string, read = true): Promise<void> {
  await wait(80)
  const u = requireUser()
  const all = loadNotifications()
  const n = all.find((x) => x.id === id && x.userId === u.id)
  if (n) n.read = read
  write(NOTIFICATIONS_KEY, all)
}

export async function markAllRead(): Promise<void> {
  await wait(120)
  const u = requireUser()
  const all = loadNotifications()
  all.forEach((n) => {
    if (n.userId === u.id) n.read = true
  })
  write(NOTIFICATIONS_KEY, all)
}
