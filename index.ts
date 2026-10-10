export type Role = 'ADMIN' | 'MEMBER' | 'NON_MEMBER'
export type Capability = 'FUNDER' | 'TREASURER' | 'EVENT_ORGANIZER' | 'VOLUNTEER'

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
  NON_MEMBER: 'Non-Member',
}

export const CAPABILITY_LABEL: Record<Capability, string> = {
  FUNDER: 'Funder',
  TREASURER: 'Treasurer',
  EVENT_ORGANIZER: 'Event Organizer',
  VOLUNTEER: 'Volunteer',
}

export const ALL_CAPABILITIES: Capability[] = ['FUNDER', 'TREASURER', 'EVENT_ORGANIZER', 'VOLUNTEER']

export interface User {
  id: string
  name: string
  email: string
  role: Role
  accountStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  accountStatusReason?: string
  capabilities: Capability[]
  planId: string | null
  planRenewsAt: string | null
  department: string
  phone: string
  bio: string
  createdAt: string
}

export interface Plan {
  id: string
  name: string
  priceInr: number
  periodLabel: string
  perks: string[]
  highlight?: boolean
  requiresApplication: boolean
}

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface MembershipApplication {
  id: string
  userId: string
  userName: string
  userEmail: string
  planId: string
  reason: string
  status: ApplicationStatus
  createdAt: string
  reviewedAt?: string
  reviewNote?: string
}

export interface PaymentReceipt {
  id: string
  userId: string
  planId: string
  amountInr: number
  status: 'CONFIRMED'
  reference: string
  createdAt: string
}

export interface ClubEvent {
  id: string
  title: string
  description: string
  startsAt: string
  venue: string
  capacity: number
  registered: number
  memberPriceInr: number
  nonMemberPriceInr: number
  memberOnly: boolean
  organizerName: string
  tag: string
}

export interface Ticket {
  id: string
  eventId: string
  eventTitle: string
  startsAt: string
  venue: string
  userId: string
  holderName: string
  priceInr: number
  code: string
  createdAt: string
}

export type AnnouncementAudience = 'ALL' | 'MEMBERS'

export interface Announcement {
  id: string
  title: string
  body: string
  audience: AnnouncementAudience
  authorName: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface DashboardData {
  role: Role
  stats: { label: string; value: number | string; hint?: string }[]
  registrationsByEvent: { name: string; registered: number; capacity: number }[]
  upcomingEvents: ClubEvent[]
  latestAnnouncements: Announcement[]
  pendingApplications: number
  pendingAccountApprovals: number
  myApplication: MembershipApplication | null
}
