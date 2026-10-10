import { nowIso, read, uid, wait, write } from '../mocks/store'
import { requireAdmin } from './auth'
import { appendAuditLog } from './auditLog'

export interface HistoricalEvent {
  id: string
  title: string
  date: string
  venue: string
  attendees: number
  highlights: string
  lessonsLearned: string
  semester: string
}

export interface EventTemplate {
  id: string
  name: string
  description: string
  estimatedBudgetInr: number
  checklist: string[]
  createdAt: string
}

export interface LeadershipRecord {
  id: string
  name: string
  role: string
  semester: string
  handoverNotes: string
}

export interface SemesterReport {
  id: string
  semester: string
  summary: string
  eventsHeld: number
  membersGained: number
  totalIncomeInr: number
  totalExpenseInr: number
  createdAt: string
}

const HIST_KEY = 'clubmem_history'
const TMPL_KEY = 'clubmem_templates'
const LEAD_KEY = 'clubmem_leaders'
const RPT_KEY = 'clubmem_reports'
const day = 86400000

const seedHistory = (): HistoricalEvent[] => [
  { id: 'h1', title: 'Hack Night 2025', date: new Date(Date.now() - 365 * day).toISOString(), venue: 'Innovation Lab', attendees: 52, highlights: 'Record attendance. Three projects won startup funding.', lessonsLearned: 'Start registration 3 weeks earlier. Need more mentors for hardware track.', semester: 'Fall 2025' },
  { id: 'h2', title: 'Welcome Week Mixer', date: new Date(Date.now() - 200 * day).toISOString(), venue: 'Central Courtyard', attendees: 130, highlights: 'Great turnout from freshers. 20 new membership signups.', lessonsLearned: 'Food ran out early — order 30% more next time.', semester: 'Spring 2026' },
]

const seedTemplates = (): EventTemplate[] => [
  { id: 'tmpl1', name: 'Hackathon Template', description: '12-hour build sprint with mentors, prizes, and demo round.', estimatedBudgetInr: 15000, checklist: ['Book venue', 'Confirm mentors', 'Order catering', 'Set up registrations', 'Arrange prizes', 'AV setup'], createdAt: new Date(Date.now() - 100 * day).toISOString() },
  { id: 'tmpl2', name: 'Tech Talk Template', description: 'Informal short-talk series with Q&A.', estimatedBudgetInr: 2000, checklist: ['Confirm speakers', 'Book seminar hall', 'Create promotional poster', 'Set up live stream'], createdAt: new Date(Date.now() - 80 * day).toISOString() },
]

const seedLeaders = (): LeadershipRecord[] => [
  { id: 'l1', name: 'Vikram Desai', role: 'President', semester: 'Fall 2025', handoverNotes: 'Focus on cross-club collaborations. Treasury surplus can fund new equipment.' },
  { id: 'l2', name: 'Anita Rao', role: 'President', semester: 'Spring 2026', handoverNotes: 'Expanding to two new departments. Merchandise store launch planned.' },
]

const seedReports = (): SemesterReport[] => [
  { id: 'r1', semester: 'Fall 2025', summary: 'Strong semester with 3 major events and 15 new members.', eventsHeld: 3, membersGained: 15, totalIncomeInr: 18500, totalExpenseInr: 14200, createdAt: new Date(Date.now() - 180 * day).toISOString() },
]

const loadHistory = () => read<HistoricalEvent[]>(HIST_KEY, seedHistory)
const saveHistory = (h: HistoricalEvent[]) => write(HIST_KEY, h)
const loadTemplates = () => read<EventTemplate[]>(TMPL_KEY, seedTemplates)
const saveTemplates = (t: EventTemplate[]) => write(TMPL_KEY, t)
const loadLeaders = () => read<LeadershipRecord[]>(LEAD_KEY, seedLeaders)
const saveLeaders = (l: LeadershipRecord[]) => write(LEAD_KEY, l)
const loadReports = () => read<SemesterReport[]>(RPT_KEY, seedReports)
const saveReports = (r: SemesterReport[]) => write(RPT_KEY, r)

// ---------- Historical Events ----------
export async function listHistory(): Promise<HistoricalEvent[]> {
  await wait()
  requireAdmin()
  return loadHistory()
}

export async function addHistoricalEvent(input: Omit<HistoricalEvent, 'id'>): Promise<HistoricalEvent> {
  await wait()
  requireAdmin()
  const e: HistoricalEvent = { ...input, id: uid('h') }
  const all = loadHistory()
  all.unshift(e)
  saveHistory(all)
  appendAuditLog('ADMIN', `Added historical event "${e.title}"`)
  return e
}

// ---------- Templates ----------
export async function listTemplates(): Promise<EventTemplate[]> {
  await wait()
  requireAdmin()
  return loadTemplates()
}

export async function createTemplate(input: Omit<EventTemplate, 'id' | 'createdAt'>): Promise<EventTemplate> {
  await wait()
  requireAdmin()
  const t: EventTemplate = { ...input, id: uid('tmpl'), createdAt: nowIso() }
  const all = loadTemplates()
  all.unshift(t)
  saveTemplates(all)
  appendAuditLog('ADMIN', `Created event template "${t.name}"`)
  return t
}

// ---------- Leadership ----------
export async function listLeaders(): Promise<LeadershipRecord[]> {
  await wait()
  requireAdmin()
  return loadLeaders()
}

export async function addLeader(input: Omit<LeadershipRecord, 'id'>): Promise<LeadershipRecord> {
  await wait()
  requireAdmin()
  const l: LeadershipRecord = { ...input, id: uid('l') }
  const all = loadLeaders()
  all.unshift(l)
  saveLeaders(all)
  appendAuditLog('ADMIN', `Added leadership record: ${l.name} (${l.role})`)
  return l
}

// ---------- Semester Reports ----------
export async function listReports(): Promise<SemesterReport[]> {
  await wait()
  requireAdmin()
  return loadReports()
}

export async function createReport(input: Omit<SemesterReport, 'id' | 'createdAt'>): Promise<SemesterReport> {
  await wait()
  requireAdmin()
  const r: SemesterReport = { ...input, id: uid('r'), createdAt: nowIso() }
  const all = loadReports()
  all.unshift(r)
  saveReports(all)
  appendAuditLog('ADMIN', `Created semester report for ${r.semester}`)
  return r
}
