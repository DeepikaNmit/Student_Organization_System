import { nowIso, wait } from '../mocks/store'
import { loadUsers, requireAdmin, saveUsers, toUser } from './auth'
import { pushNotification } from '../mocks/notify'
import { ApiError } from './http'
import type { User } from '../types'

export type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AccountApplication {
  id: string
  name: string
  email: string
  department: string
  accountStatus: AccountStatus
  createdAt: string
}

export async function listAccountApplications(filter: AccountStatus | 'ALL' = 'ALL'): Promise<AccountApplication[]> {
  await wait()
  requireAdmin()
  const users = loadUsers()
  return users
    .filter((u) => u.role !== 'ADMIN')
    .filter((u) => filter === 'ALL' || u.accountStatus === filter)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.department,
      accountStatus: u.accountStatus,
      createdAt: u.createdAt,
    }))
    .sort((a, b) => {
      // Pending first, then by date
      if (a.accountStatus === 'PENDING' && b.accountStatus !== 'PENDING') return -1
      if (b.accountStatus === 'PENDING' && a.accountStatus !== 'PENDING') return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

export async function pendingCount(): Promise<number> {
  await wait(80)
  requireAdmin()
  return loadUsers().filter((u) => u.accountStatus === 'PENDING').length
}

export async function approveAccount(userId: string): Promise<User> {
  await wait()
  requireAdmin()
  const users = loadUsers()
  const idx = users.findIndex((u) => u.id === userId)
  if (idx === -1) throw new ApiError('User not found.', 404)
  const user = users[idx]
  if (user.accountStatus !== 'PENDING') throw new ApiError('Account is not pending.', 400)
  user.accountStatus = 'APPROVED'
  saveUsers(users)
  pushNotification(userId, 'Account approved', 'Your Clustro account has been approved! You can now log in.')
  return toUser(user)
}

export async function rejectAccount(userId: string, reason: string): Promise<User> {
  await wait()
  requireAdmin()
  const users = loadUsers()
  const idx = users.findIndex((u) => u.id === userId)
  if (idx === -1) throw new ApiError('User not found.', 404)
  const user = users[idx]
  if (user.accountStatus !== 'PENDING') throw new ApiError('Account is not pending.', 400)
  if (!reason.trim()) throw new ApiError('Rejection reason is required.', 400)
  user.accountStatus = 'REJECTED'
  user.accountStatusReason = reason.trim()
  saveUsers(users)
  pushNotification(userId, 'Account registration rejected', reason)
  return toUser(user)
}
