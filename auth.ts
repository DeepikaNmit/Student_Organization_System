import { nowIso, read, removeKey, uid, wait, write } from '../mocks/store'
import { seedUsers, type StoredUser } from '../mocks/seed'
import { pushNotification } from '../mocks/notify'
import type { User } from '../types'
import { ApiError } from './http'

const USERS_KEY = 'users'
const SESSION_KEY = 'session'

export const loadUsers = () => read<StoredUser[]>(USERS_KEY, seedUsers)
export const saveUsers = (users: StoredUser[]) => write(USERS_KEY, users)
export const toUser = ({ password: _password, ...rest }: StoredUser): User => rest

export function sessionUser(): StoredUser | null {
  const id = read<string | null>(SESSION_KEY, () => null)
  if (!id) return null
  return loadUsers().find((u) => u.id === id) ?? null
}

export function requireUser(): StoredUser {
  const u = sessionUser()
  if (!u) throw new ApiError('Please sign in to continue.', 401)
  return u
}

export function requireAdmin(): StoredUser {
  const u = requireUser()
  if (u.role !== 'ADMIN') throw new ApiError('Admin access required.', 403)
  return u
}

export interface LoginInput {
  email: string
  password: string
}
export interface RegisterInput extends LoginInput {
  name: string
}

export async function me(): Promise<User | null> {
  await wait(120)
  const u = sessionUser()
  return u ? toUser(u) : null
}

export async function login(input: LoginInput): Promise<User> {
  await wait()
  const u = loadUsers().find((x) => x.email.toLowerCase() === input.email.trim().toLowerCase())
  if (!u || u.password !== input.password) throw new ApiError('Incorrect email or password.', 401)
  if (u.accountStatus === 'PENDING') throw new ApiError('Your account is pending admin approval. Please wait for an admin to review your registration.', 403)
  if (u.accountStatus === 'REJECTED') {
    throw new ApiError(`Your account registration was rejected. Reason: ${u.accountStatusReason || 'Contact an admin for details.'}`, 403)
  }
  write(SESSION_KEY, u.id)
  return toUser(u)
}

export async function register(input: RegisterInput): Promise<User> {
  await wait()
  const users = loadUsers()
  const email = input.email.trim().toLowerCase()
  if (users.some((x) => x.email.toLowerCase() === email)) {
    throw new ApiError('An account with this email already exists.', 409)
  }
  const user: StoredUser = {
    id: uid('u'),
    name: input.name.trim(),
    email,
    password: input.password,
    role: 'NON_MEMBER',
    accountStatus: 'PENDING',
    capabilities: [],
    planId: null,
    planRenewsAt: null,
    department: '',
    phone: '',
    bio: '',
    createdAt: nowIso(),
  }
  users.push(user)
  saveUsers(users)
  // Notify all admins
  const admins = users.filter((u) => u.role === 'ADMIN')
  admins.forEach((a) =>
    pushNotification(a.id, 'New account registration', `${user.name} (${user.email}) registered and is awaiting approval.`)
  )
  // Don't auto-login — return a marker user so the frontend can show "pending approval" message
  // We throw so the register page can show a success banner instead of navigating
  throw new ApiError('ACCOUNT_PENDING:Your account has been created and is pending admin approval. You will be notified once approved.', 202)
}

export async function logout(): Promise<void> {
  await wait(80)
  removeKey(SESSION_KEY)
}
