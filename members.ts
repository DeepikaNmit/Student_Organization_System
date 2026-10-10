import { nowIso, read, uid, wait, write } from '../mocks/store'
import { seedApplications, seedPlans } from '../mocks/seed'
import { pushNotification } from '../mocks/notify'
import type { Capability, MembershipApplication, PaymentReceipt, Plan, Role, User } from '../types'
import { loadUsers, requireAdmin, requireUser, saveUsers, toUser } from './auth'
import { ApiError } from './http'

const APPS_KEY = 'applications'
const RECEIPTS_KEY = 'receipts'

const loadApps = () => read<MembershipApplication[]>(APPS_KEY, seedApplications)
const loadReceipts = () => read<PaymentReceipt[]>(RECEIPTS_KEY, () => [])

export async function listPlans(): Promise<Plan[]> {
  await wait(100)
  return seedPlans()
}

export async function listUsers(): Promise<User[]> {
  await wait()
  requireAdmin()
  return loadUsers().map(toUser)
}

export interface ProfileInput {
  name: string
  department: string
  phone: string
  bio: string
}

export async function updateProfile(input: ProfileInput): Promise<User> {
  await wait()
  const me = requireUser()
  const users = loadUsers()
  const u = users.find((x) => x.id === me.id)!
  Object.assign(u, input)
  saveUsers(users)
  return toUser(u)
}

export async function updateUserAccess(
  userId: string,
  input: { role: Role; capabilities: Capability[] },
): Promise<User> {
  await wait()
  const admin = requireAdmin()
  if (admin.id === userId) throw new ApiError('You cannot change your own access.', 400)
  const users = loadUsers()
  const u = users.find((x) => x.id === userId)
  if (!u) throw new ApiError('User not found.', 404)
  u.role = input.role
  u.capabilities = input.capabilities
  if (u.role === 'NON_MEMBER') {
    u.planId = null
    u.planRenewsAt = null
  }
  saveUsers(users)
  pushNotification(u.id, 'Your access was updated', 'An Admin changed your role or capabilities.')
  return toUser(u)
}

export async function myApplication(): Promise<MembershipApplication | null> {
  await wait(100)
  const me = requireUser()
  const mine = loadApps()
    .filter((a) => a.userId === me.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return mine[0] ?? null
}

export async function submitApplication(input: { reason: string }): Promise<MembershipApplication> {
  await wait()
  const me = requireUser()
  if (me.role !== 'NON_MEMBER') throw new ApiError('You are already a member.', 400)
  const apps = loadApps()
  if (apps.some((a) => a.userId === me.id && a.status === 'PENDING')) {
    throw new ApiError('You already have an application under review.', 409)
  }
  const app: MembershipApplication = {
    id: uid('app'),
    userId: me.id,
    userName: me.name,
    userEmail: me.email,
    planId: 'associate',
    reason: input.reason.trim(),
    status: 'PENDING',
    createdAt: nowIso(),
  }
  apps.unshift(app)
  write(APPS_KEY, apps)
  loadUsers()
    .filter((u) => u.role === 'ADMIN')
    .forEach((a) => pushNotification(a.id, 'New membership application', `${me.name} applied for the Associate plan.`))
  return app
}

export async function listApplications(): Promise<MembershipApplication[]> {
  await wait()
  requireAdmin()
  return loadApps().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function reviewApplication(
  id: string,
  input: { decision: 'APPROVED' | 'REJECTED'; note: string },
): Promise<MembershipApplication> {
  await wait()
  requireAdmin()
  const apps = loadApps()
  const app = apps.find((a) => a.id === id)
  if (!app) throw new ApiError('Application not found.', 404)
  if (app.status !== 'PENDING') throw new ApiError('This application was already reviewed.', 409)
  app.status = input.decision
  app.reviewNote = input.note.trim()
  app.reviewedAt = nowIso()
  write(APPS_KEY, apps)

  if (input.decision === 'APPROVED') {
    // Approval upgrades the SAME account — no new user is created.
    const users = loadUsers()
    const u = users.find((x) => x.id === app.userId)
    if (u && u.role === 'NON_MEMBER') {
      u.role = 'MEMBER'
      u.planId = app.planId
      u.planRenewsAt = new Date(Date.now() + 365 * 86_400_000).toISOString()
      saveUsers(users)
    }
    pushNotification(app.userId, 'Membership approved', 'Welcome aboard! Your account is now a Member account.')
  } else {
    pushNotification(
      app.userId,
      'Membership application declined',
      input.note.trim() ? `Note from the reviewer: ${input.note.trim()}` : 'Your application was not approved this time.',
    )
  }
  return app
}

export async function payAndUpgrade(input: { planId: string }): Promise<{ user: User; receipt: PaymentReceipt }> {
  await wait(700) // simulated "Demo mode" payment processing
  const me = requireUser()
  if (me.role === 'ADMIN') throw new ApiError('Admins do not need a plan.', 400)
  const plan = seedPlans().find((p) => p.id === input.planId)
  if (!plan || plan.requiresApplication) throw new ApiError('This plan cannot be purchased directly.', 400)
  const users = loadUsers()
  const u = users.find((x) => x.id === me.id)!
  u.role = 'MEMBER'
  u.planId = plan.id
  u.planRenewsAt = new Date(Date.now() + 365 * 86_400_000).toISOString()
  saveUsers(users)
  const receipt: PaymentReceipt = {
    id: uid('pay'),
    userId: u.id,
    planId: plan.id,
    amountInr: plan.priceInr,
    status: 'CONFIRMED',
    reference: `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt: nowIso(),
  }
  const receipts = loadReceipts()
  receipts.unshift(receipt)
  write(RECEIPTS_KEY, receipts)
  pushNotification(u.id, 'Payment confirmed (Demo mode)', `You are now on the ${plan.name} plan. Reference ${receipt.reference}.`)
  return { user: toUser(u), receipt }
}
