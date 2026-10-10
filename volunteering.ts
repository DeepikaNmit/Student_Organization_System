import { nowIso, read, uid, wait, write } from '../mocks/store'
import { requireAdmin, requireUser } from './auth'
import { pushNotification } from '../mocks/notify'
import { ApiError } from './http'
import { appendAuditLog } from './auditLog'

export type VolunteerTaskStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'

export interface VolunteerTask {
  id: string
  title: string
  description: string
  eventId?: string
  assignedTo: string | null
  assignedToName: string | null
  status: VolunteerTaskStatus
  deadline: string
  hoursLogged: number
  expenseInr: number
  reimbursed: boolean
  createdAt: string
}

export interface VolunteerApplication {
  id: string
  userId: string
  userName: string
  message: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}

const TASKS_KEY = 'volunteer_tasks'
const APPS_KEY = 'volunteer_apps'
const day = 86400000

const seedTasks = (): VolunteerTask[] => [
  { id: 'vt1', title: 'Hack Night — Registration Desk', description: 'Check-in attendees, hand out badges and welcome kits.', assignedTo: 'u_member', assignedToName: 'Rohan Mehta', status: 'ASSIGNED', deadline: new Date(Date.now() + 6 * day).toISOString(), hoursLogged: 0, expenseInr: 0, reimbursed: false, createdAt: new Date(Date.now() - 5 * day).toISOString() },
  { id: 'vt2', title: 'Tech Talk — AV Setup', description: 'Set up projector, mic and speakers in Seminar Hall 2.', assignedTo: null, assignedToName: null, status: 'OPEN', deadline: new Date(Date.now() + 3 * day).toISOString(), hoursLogged: 0, expenseInr: 0, reimbursed: false, createdAt: new Date(Date.now() - 3 * day).toISOString() },
  { id: 'vt3', title: 'Annual Mixer — Decorations', description: 'Purchase and put up decorations in Central Courtyard.', assignedTo: null, assignedToName: null, status: 'OPEN', deadline: new Date(Date.now() + 18 * day).toISOString(), hoursLogged: 0, expenseInr: 500, reimbursed: false, createdAt: new Date(Date.now() - 2 * day).toISOString() },
]

const seedApps = (): VolunteerApplication[] => [
  { id: 'va1', userId: 'u_dev', userName: 'Dev Patel', message: 'I\'d love to help out at events!', status: 'PENDING', createdAt: new Date(Date.now() - 1 * day).toISOString() },
]

const loadTasks = () => read<VolunteerTask[]>(TASKS_KEY, seedTasks)
const saveTasks = (t: VolunteerTask[]) => write(TASKS_KEY, t)
const loadApps = () => read<VolunteerApplication[]>(APPS_KEY, seedApps)
const saveApps = (a: VolunteerApplication[]) => write(APPS_KEY, a)

// ---------- Applications ----------
export async function applyToVolunteer(message: string): Promise<VolunteerApplication> {
  await wait()
  const u = requireUser()
  const apps = loadApps()
  if (apps.some((a) => a.userId === u.id && a.status === 'PENDING')) {
    throw new ApiError('You already have a pending volunteer application.', 409)
  }
  const app: VolunteerApplication = { id: uid('va'), userId: u.id, userName: u.name, message, status: 'PENDING', createdAt: nowIso() }
  apps.unshift(app)
  saveApps(apps)
  appendAuditLog('ADMIN', `Volunteer application from ${u.name}`)
  return app
}

export async function listApplications(): Promise<VolunteerApplication[]> {
  await wait()
  requireAdmin()
  return loadApps()
}

export async function reviewApplication(appId: string, decision: 'ACCEPTED' | 'REJECTED'): Promise<VolunteerApplication> {
  await wait()
  requireAdmin()
  const apps = loadApps()
  const a = apps.find((x) => x.id === appId)
  if (!a) throw new ApiError('Application not found.', 404)
  a.status = decision
  saveApps(apps)
  pushNotification(a.userId, 'Volunteer application ' + decision.toLowerCase(), decision === 'ACCEPTED' ? 'Welcome aboard! Check the volunteering page for tasks.' : 'Your volunteer application was not accepted at this time.')
  return a
}

// ---------- Tasks ----------
export async function listTasks(): Promise<VolunteerTask[]> {
  await wait()
  return loadTasks()
}

export async function createTask(input: Omit<VolunteerTask, 'id' | 'createdAt' | 'hoursLogged' | 'reimbursed' | 'status'> & { status?: VolunteerTaskStatus }): Promise<VolunteerTask> {
  await wait()
  requireAdmin()
  const t: VolunteerTask = { ...input, id: uid('vt'), status: input.status ?? 'OPEN', hoursLogged: 0, reimbursed: false, createdAt: nowIso() }
  const all = loadTasks()
  all.unshift(t)
  saveTasks(all)
  appendAuditLog('ADMIN', `Created volunteer task "${t.title}"`)
  return t
}

export async function assignTask(taskId: string, userId: string, userName: string): Promise<VolunteerTask> {
  await wait()
  requireAdmin()
  const tasks = loadTasks()
  const t = tasks.find((x) => x.id === taskId)
  if (!t) throw new ApiError('Task not found.', 404)
  t.assignedTo = userId
  t.assignedToName = userName
  t.status = 'ASSIGNED'
  saveTasks(tasks)
  pushNotification(userId, 'Task assigned', `You've been assigned: ${t.title}`)
  return t
}

export async function updateTaskStatus(taskId: string, status: VolunteerTaskStatus, hoursLogged?: number): Promise<VolunteerTask> {
  await wait()
  const u = requireUser()
  const tasks = loadTasks()
  const t = tasks.find((x) => x.id === taskId)
  if (!t) throw new ApiError('Task not found.', 404)
  if (u.role !== 'ADMIN' && t.assignedTo !== u.id) throw new ApiError('Only the assigned volunteer or an admin can update this task.', 403)
  t.status = status
  if (hoursLogged !== undefined) t.hoursLogged = hoursLogged
  saveTasks(tasks)
  appendAuditLog('ADMIN', `Task "${t.title}" → ${status}`)
  return t
}

export async function reimburseTask(taskId: string): Promise<VolunteerTask> {
  await wait()
  requireAdmin()
  const tasks = loadTasks()
  const t = tasks.find((x) => x.id === taskId)
  if (!t) throw new ApiError('Task not found.', 404)
  if (t.expenseInr <= 0) throw new ApiError('No expense to reimburse.', 400)
  if (t.reimbursed) throw new ApiError('Already reimbursed.', 400)
  t.reimbursed = true
  saveTasks(tasks)
  if (t.assignedTo) pushNotification(t.assignedTo, 'Expense reimbursed', `₹${t.expenseInr} reimbursed for "${t.title}".`)
  appendAuditLog('FINANCIAL', `Reimbursed ₹${t.expenseInr} for task "${t.title}"`)
  return t
}
