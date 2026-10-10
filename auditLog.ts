import { nowIso, read, uid, wait, write } from '../mocks/store'
import { requireAdmin, sessionUser } from './auth'

export type AuditCategory = 'ADMIN' | 'MEMBERSHIP' | 'FINANCIAL' | 'INVENTORY' | 'AUTH'

export interface AuditEntry {
  id: string
  category: AuditCategory
  action: string
  performedBy: string
  performedByName: string
  timestamp: string
}

const KEY = 'auditLog'

const seedAuditLog = (): AuditEntry[] => [
  {
    id: 'aud_seed1',
    category: 'ADMIN',
    action: 'System initialized with demo data.',
    performedBy: 'system',
    performedByName: 'System',
    timestamp: new Date(Date.now() - 120 * 86400000).toISOString(),
  },
]

const loadLog = () => read<AuditEntry[]>(KEY, seedAuditLog)
const saveLog = (log: AuditEntry[]) => write(KEY, log)

/** Append an audit entry. Can be called from any API module. */
export function appendAuditLog(category: AuditCategory, action: string) {
  const user = sessionUser()
  const entry: AuditEntry = {
    id: uid('aud'),
    category,
    action,
    performedBy: user?.id ?? 'system',
    performedByName: user?.name ?? 'System',
    timestamp: nowIso(),
  }
  const log = loadLog()
  log.unshift(entry)
  saveLog(log)
  return entry
}

export async function listAuditLog(opts?: {
  category?: AuditCategory | 'ALL'
  search?: string
  limit?: number
}): Promise<AuditEntry[]> {
  await wait()
  requireAdmin()
  let log = loadLog()
  if (opts?.category && opts.category !== 'ALL') {
    log = log.filter((e) => e.category === opts.category)
  }
  if (opts?.search) {
    const q = opts.search.toLowerCase()
    log = log.filter(
      (e) => e.action.toLowerCase().includes(q) || e.performedByName.toLowerCase().includes(q)
    )
  }
  if (opts?.limit) {
    log = log.slice(0, opts.limit)
  }
  return log
}
