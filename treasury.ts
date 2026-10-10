import { nowIso, read, uid, wait, write } from '../mocks/store'
import { requireUser, sessionUser, loadUsers } from './auth'
import { ApiError } from './http'
import { appendAuditLog } from './auditLog'

// ---------- Types ----------
export type TransactionType = 'INCOME' | 'EXPENSE'
export type IncomeCategory = 'MEMBERSHIP_FEE' | 'EVENT_TICKET' | 'MERCHANDISE' | 'DONATION' | 'SPONSORSHIP' | 'OTHER_INCOME'
export type ExpenseCategory = 'EVENT_COST' | 'MERCHANDISE_COST' | 'VENUE' | 'MARKETING' | 'EQUIPMENT' | 'REIMBURSEMENT' | 'OTHER_EXPENSE'

export interface Transaction {
  id: string
  type: TransactionType
  category: IncomeCategory | ExpenseCategory
  description: string
  amountInr: number
  reference: string
  recordedBy: string
  recordedByName: string
  createdAt: string
}

export interface Budget {
  id: string
  name: string
  allocatedInr: number
  spentInr: number
  semester: string
}

export interface FundraiserContribution {
  id: string
  fundraiserId: string
  userId: string
  userName: string
  amountInr: number
  createdAt: string
}

export interface Fundraiser {
  id: string
  title: string
  goalInr: number
  raisedInr: number
  active: boolean
  createdAt: string
}

// ---------- Keys ----------
const TX_KEY = 'treasury_tx'
const BUDGET_KEY = 'treasury_budgets'
const FUND_KEY = 'treasury_fundraisers'
const CONTRIB_KEY = 'treasury_contributions'

// ---------- Seed ----------
const day = 86400000
const seedTx = (): Transaction[] => [
  { id: 'tx1', type: 'INCOME', category: 'MEMBERSHIP_FEE', description: 'Standard plan — Rohan Mehta', amountInr: 499, reference: 'MEM-001', recordedBy: 'u_admin', recordedByName: 'Anita Rao', createdAt: new Date(Date.now() - 60 * day).toISOString() },
  { id: 'tx2', type: 'INCOME', category: 'MEMBERSHIP_FEE', description: 'Premium plan — Samir Khan', amountInr: 1499, reference: 'MEM-002', recordedBy: 'u_admin', recordedByName: 'Anita Rao', createdAt: new Date(Date.now() - 55 * day).toISOString() },
  { id: 'tx3', type: 'INCOME', category: 'EVENT_TICKET', description: 'Hack Night 2026 ticket sales (41 tickets)', amountInr: 6350, reference: 'EVT-001', recordedBy: 'u_admin', recordedByName: 'Anita Rao', createdAt: new Date(Date.now() - 10 * day).toISOString() },
  { id: 'tx4', type: 'EXPENSE', category: 'VENUE', description: 'Innovation Lab booking for Hack Night', amountInr: 3000, reference: 'EXP-001', recordedBy: 'u_admin', recordedByName: 'Anita Rao', createdAt: new Date(Date.now() - 8 * day).toISOString() },
  { id: 'tx5', type: 'EXPENSE', category: 'EVENT_COST', description: 'Catering for Hack Night (snacks & drinks)', amountInr: 4500, reference: 'EXP-002', recordedBy: 'u_admin', recordedByName: 'Anita Rao', createdAt: new Date(Date.now() - 7 * day).toISOString() },
  { id: 'tx6', type: 'INCOME', category: 'DONATION', description: 'Alumni donation — Dr. Arvind', amountInr: 5000, reference: 'DON-001', recordedBy: 'u_admin', recordedByName: 'Anita Rao', createdAt: new Date(Date.now() - 30 * day).toISOString() },
  { id: 'tx7', type: 'INCOME', category: 'SPONSORSHIP', description: 'TechCorp sponsorship for Tech Talk series', amountInr: 10000, reference: 'SPO-001', recordedBy: 'u_admin', recordedByName: 'Anita Rao', createdAt: new Date(Date.now() - 25 * day).toISOString() },
  { id: 'tx8', type: 'EXPENSE', category: 'MARKETING', description: 'Banner printing for Annual Mixer', amountInr: 1200, reference: 'EXP-003', recordedBy: 'u_admin', recordedByName: 'Anita Rao', createdAt: new Date(Date.now() - 5 * day).toISOString() },
]

const seedBudgets = (): Budget[] => [
  { id: 'b1', name: 'Events', allocatedInr: 25000, spentInr: 8700, semester: 'Fall 2026' },
  { id: 'b2', name: 'Marketing', allocatedInr: 5000, spentInr: 1200, semester: 'Fall 2026' },
  { id: 'b3', name: 'Equipment', allocatedInr: 8000, spentInr: 0, semester: 'Fall 2026' },
  { id: 'b4', name: 'Merchandise', allocatedInr: 15000, spentInr: 0, semester: 'Fall 2026' },
]

const seedFundraisers = (): Fundraiser[] => [
  { id: 'fund1', title: 'Annual Hack Night Fund', goalInr: 20000, raisedInr: 12000, active: true, createdAt: new Date(Date.now() - 40 * day).toISOString() },
]

const seedContribs = (): FundraiserContribution[] => [
  { id: 'c1', fundraiserId: 'fund1', userId: 'u_sam', userName: 'Samir Khan', amountInr: 5000, createdAt: new Date(Date.now() - 35 * day).toISOString() },
  { id: 'c2', fundraiserId: 'fund1', userId: 'u_priya', userName: 'Priya Iyer', amountInr: 3000, createdAt: new Date(Date.now() - 30 * day).toISOString() },
  { id: 'c3', fundraiserId: 'fund1', userId: 'u_admin', userName: 'Anita Rao', amountInr: 4000, createdAt: new Date(Date.now() - 28 * day).toISOString() },
]

// ---------- Helpers ----------
const loadTx = () => read<Transaction[]>(TX_KEY, seedTx)
const saveTx = (t: Transaction[]) => write(TX_KEY, t)
const loadBudgets = () => read<Budget[]>(BUDGET_KEY, seedBudgets)
const saveBudgets = (b: Budget[]) => write(BUDGET_KEY, b)
const loadFundraisers = () => read<Fundraiser[]>(FUND_KEY, seedFundraisers)
const saveFundraisers = (f: Fundraiser[]) => write(FUND_KEY, f)
const loadContribs = () => read<FundraiserContribution[]>(CONTRIB_KEY, seedContribs)
const saveContribs = (c: FundraiserContribution[]) => write(CONTRIB_KEY, c)

function requireTreasurer() {
  const u = requireUser()
  if (u.role !== 'ADMIN' && !u.capabilities.includes('TREASURER')) {
    throw new ApiError('Treasury access requires Admin or Treasurer capability.', 403)
  }
  return u
}

// ---------- Transactions ----------
export async function listTransactions(filter?: { type?: TransactionType }): Promise<Transaction[]> {
  await wait()
  requireTreasurer()
  let tx = loadTx()
  if (filter?.type) tx = tx.filter((t) => t.type === filter.type)
  return tx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function addTransaction(input: Omit<Transaction, 'id' | 'recordedBy' | 'recordedByName' | 'createdAt'>): Promise<Transaction> {
  await wait()
  const u = requireTreasurer()
  if (input.amountInr <= 0) throw new ApiError('Amount must be positive.', 400)
  // Prevent duplicate reference
  const all = loadTx()
  if (input.reference && all.some((t) => t.reference === input.reference)) {
    throw new ApiError('A transaction with this reference already exists.', 409)
  }
  const tx: Transaction = {
    ...input,
    id: uid('tx'),
    recordedBy: u.id,
    recordedByName: u.name,
    createdAt: nowIso(),
  }
  all.unshift(tx)
  saveTx(all)
  appendAuditLog('FINANCIAL', `${tx.type} ₹${tx.amountInr}: ${tx.description}`)
  return tx
}

// ---------- Summary ----------
export interface TreasurySummary {
  totalIncomeInr: number
  totalExpenseInr: number
  balanceInr: number
  incomeByCategory: { category: string; amount: number }[]
  expenseByCategory: { category: string; amount: number }[]
  monthlyTrend: { month: string; income: number; expense: number }[]
}

export async function getSummary(): Promise<TreasurySummary> {
  await wait()
  requireTreasurer()
  const tx = loadTx()
  let totalIncome = 0, totalExpense = 0
  const incomeMap = new Map<string, number>()
  const expenseMap = new Map<string, number>()
  const monthMap = new Map<string, { income: number; expense: number }>()

  for (const t of tx) {
    const monthKey = t.createdAt.slice(0, 7) // YYYY-MM
    if (!monthMap.has(monthKey)) monthMap.set(monthKey, { income: 0, expense: 0 })
    const m = monthMap.get(monthKey)!
    if (t.type === 'INCOME') {
      totalIncome += t.amountInr
      incomeMap.set(t.category, (incomeMap.get(t.category) ?? 0) + t.amountInr)
      m.income += t.amountInr
    } else {
      totalExpense += t.amountInr
      expenseMap.set(t.category, (expenseMap.get(t.category) ?? 0) + t.amountInr)
      m.expense += t.amountInr
    }
  }

  return {
    totalIncomeInr: totalIncome,
    totalExpenseInr: totalExpense,
    balanceInr: totalIncome - totalExpense,
    incomeByCategory: [...incomeMap.entries()].map(([category, amount]) => ({ category, amount })),
    expenseByCategory: [...expenseMap.entries()].map(([category, amount]) => ({ category, amount })),
    monthlyTrend: [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data })),
  }
}

// ---------- Budgets ----------
export async function listBudgets(): Promise<Budget[]> {
  await wait()
  requireTreasurer()
  return loadBudgets()
}

export async function createBudget(input: Omit<Budget, 'id'>): Promise<Budget> {
  await wait()
  requireTreasurer()
  const budgets = loadBudgets()
  const b: Budget = { ...input, id: uid('bud') }
  budgets.push(b)
  saveBudgets(budgets)
  appendAuditLog('FINANCIAL', `Created budget "${b.name}" — ₹${b.allocatedInr}`)
  return b
}

export async function updateBudgetSpent(budgetId: string, addSpent: number): Promise<Budget> {
  await wait()
  requireTreasurer()
  const budgets = loadBudgets()
  const b = budgets.find((x) => x.id === budgetId)
  if (!b) throw new ApiError('Budget not found.', 404)
  b.spentInr += addSpent
  saveBudgets(budgets)
  return b
}

// ---------- Fundraisers ----------
export async function listFundraisers(): Promise<Fundraiser[]> {
  await wait()
  requireTreasurer()
  return loadFundraisers()
}

export async function createFundraiser(input: Omit<Fundraiser, 'id' | 'raisedInr' | 'createdAt'>): Promise<Fundraiser> {
  await wait()
  requireTreasurer()
  const f: Fundraiser = { ...input, id: uid('fund'), raisedInr: 0, createdAt: nowIso() }
  const all = loadFundraisers()
  all.push(f)
  saveFundraisers(all)
  appendAuditLog('FINANCIAL', `Created fundraiser "${f.title}" — goal ₹${f.goalInr}`)
  return f
}

export async function contribute(fundraiserId: string, amountInr: number): Promise<FundraiserContribution> {
  await wait()
  const u = requireUser()
  if (amountInr <= 0) throw new ApiError('Amount must be positive.', 400)
  const funds = loadFundraisers()
  const f = funds.find((x) => x.id === fundraiserId)
  if (!f || !f.active) throw new ApiError('Fundraiser not found or inactive.', 404)
  f.raisedInr += amountInr
  saveFundraisers(funds)
  const c: FundraiserContribution = {
    id: uid('c'),
    fundraiserId,
    userId: u.id,
    userName: u.name,
    amountInr,
    createdAt: nowIso(),
  }
  const contribs = loadContribs()
  contribs.unshift(c)
  saveContribs(contribs)
  appendAuditLog('FINANCIAL', `Contribution ₹${amountInr} to "${f.title}" by ${u.name}`)
  return c
}

export async function listContributions(fundraiserId?: string): Promise<FundraiserContribution[]> {
  await wait()
  requireTreasurer()
  const all = loadContribs()
  return fundraiserId ? all.filter((c) => c.fundraiserId === fundraiserId) : all
}

// ---------- CSV Export ----------
export async function exportTransactionsCsv(): Promise<string> {
  await wait(80)
  requireTreasurer()
  const tx = loadTx()
  const rows = ['Type,Category,Description,Amount (INR),Reference,Recorded By,Date']
  for (const t of tx) {
    rows.push(`${t.type},${t.category},"${t.description}",${t.amountInr},${t.reference},${t.recordedByName},${t.createdAt}`)
  }
  return rows.join('\n')
}
