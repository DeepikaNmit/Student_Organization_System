import type { Notification } from '../types'
import { nowIso, read, uid, write } from './store'
import { seedNotifications } from './seed'

export const NOTIFICATIONS_KEY = 'notifications'

export const loadNotifications = () => read<Notification[]>(NOTIFICATIONS_KEY, seedNotifications)

export function pushNotification(userId: string, title: string, body: string) {
  const all = loadNotifications()
  all.unshift({ id: uid('n'), userId, title, body, read: false, createdAt: nowIso() })
  write(NOTIFICATIONS_KEY, all)
}
