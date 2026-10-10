import { read, wait, write } from '../mocks/store'
import { requireAdmin } from './auth'
import { appendAuditLog } from './auditLog'

export interface OrgSettings {
  orgName: string
  tagline: string
  contactEmail: string
  currentSemester: string
  membershipPlans: { id: string; name: string; priceInr: number; periodLabel: string; requiresApplication: boolean }[]
  preferences: {
    autoApproveAccounts: boolean
    requirePaymentForMembership: boolean
    enableMerchandise: boolean
    enableVolunteering: boolean
  }
}

const KEY = 'settings'

const seedSettings = (): OrgSettings => ({
  orgName: 'Clustro',
  tagline: 'Everything Your Organization Needs, Together.',
  contactEmail: 'admin@clustro.demo',
  currentSemester: 'Fall 2026',
  membershipPlans: [
    { id: 'associate', name: 'Associate', priceInr: 0, periodLabel: 'free · by application', requiresApplication: true },
    { id: 'standard', name: 'Standard', priceInr: 499, periodLabel: 'per year', requiresApplication: false },
    { id: 'premium', name: 'Premium', priceInr: 1499, periodLabel: 'per year', requiresApplication: false },
  ],
  preferences: {
    autoApproveAccounts: false,
    requirePaymentForMembership: true,
    enableMerchandise: true,
    enableVolunteering: true,
  },
})

export async function getSettings(): Promise<OrgSettings> {
  await wait()
  requireAdmin()
  return read<OrgSettings>(KEY, seedSettings)
}

export async function updateSettings(patch: Partial<OrgSettings>): Promise<OrgSettings> {
  await wait()
  requireAdmin()
  const current = read<OrgSettings>(KEY, seedSettings)
  const updated = { ...current, ...patch }
  if (patch.preferences) updated.preferences = { ...current.preferences, ...patch.preferences }
  write(KEY, updated)
  appendAuditLog('ADMIN', `Settings updated`)
  return updated
}
