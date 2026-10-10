import type { Announcement, ClubEvent, MembershipApplication, Notification, Plan } from '../types'

export interface StoredUser {
  id: string
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'MEMBER' | 'NON_MEMBER'
  accountStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  accountStatusReason?: string
  capabilities: ('FUNDER' | 'TREASURER' | 'EVENT_ORGANIZER' | 'VOLUNTEER')[]
  planId: string | null
  planRenewsAt: string | null
  department: string
  phone: string
  bio: string
  createdAt: string
}

const day = 86_400_000
const iso = (offsetDays: number, hour = 17) => {
  const d = new Date(Date.now() + offsetDays * day)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@clustro.demo', password: 'Admin@1234' },
  { label: 'Member (Event Organizer)', email: 'member@clustro.demo', password: 'Member@1234' },
  { label: 'Non-Member', email: 'guest@clustro.demo', password: 'Guest@1234' },
]

export const seedPlans = (): Plan[] => [
  {
    id: 'associate',
    name: 'Associate',
    priceInr: 0,
    periodLabel: 'free · by application',
    requiresApplication: true,
    perks: ['Member event pricing', 'Members-only announcements', 'Reviewed by an Admin'],
  },
  {
    id: 'standard',
    name: 'Standard',
    priceInr: 499,
    periodLabel: 'per year',
    requiresApplication: false,
    highlight: true,
    perks: ['Instant activation', 'Member event pricing', 'Members-only events', 'Priority ticket access'],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceInr: 1499,
    periodLabel: 'per year',
    requiresApplication: false,
    perks: ['Everything in Standard', 'Guest passes (2 per event)', 'Early access to workshops'],
  },
]

export const seedUsers = (): StoredUser[] => [
  {
    id: 'u_admin',
    name: 'Anita Rao',
    email: 'admin@clustro.demo',
    password: 'Admin@1234',
    role: 'ADMIN',
    accountStatus: 'APPROVED',
    capabilities: ['TREASURER'],
    planId: null,
    planRenewsAt: null,
    department: 'Student Affairs',
    phone: '+91 90000 00001',
    bio: 'Runs day-to-day operations for the organization.',
    createdAt: iso(-120),
  },
  {
    id: 'u_member',
    name: 'Rohan Mehta',
    email: 'member@clustro.demo',
    password: 'Member@1234',
    role: 'MEMBER',
    accountStatus: 'APPROVED',
    capabilities: ['EVENT_ORGANIZER', 'VOLUNTEER'],
    planId: 'standard',
    planRenewsAt: iso(210),
    department: 'Computer Science',
    phone: '+91 90000 00002',
    bio: 'Organizes the monthly tech talks.',
    createdAt: iso(-90),
  },
  {
    id: 'u_guest',
    name: 'Meera Nair',
    email: 'guest@clustro.demo',
    password: 'Guest@1234',
    role: 'NON_MEMBER',
    accountStatus: 'APPROVED',
    capabilities: [],
    planId: null,
    planRenewsAt: null,
    department: 'Electronics',
    phone: '',
    bio: '',
    createdAt: iso(-12),
  },
  {
    id: 'u_sam',
    name: 'Samir Khan',
    email: 'samir@clustro.demo',
    password: 'Samir@1234',
    role: 'MEMBER',
    accountStatus: 'APPROVED',
    capabilities: ['FUNDER'],
    planId: 'premium',
    planRenewsAt: iso(300),
    department: 'Mechanical',
    phone: '',
    bio: 'Sponsors the annual hack night.',
    createdAt: iso(-60),
  },
  {
    id: 'u_priya',
    name: 'Priya Iyer',
    email: 'priya@clustro.demo',
    password: 'Priya@1234',
    role: 'NON_MEMBER',
    accountStatus: 'APPROVED',
    capabilities: ['FUNDER'],
    planId: null,
    planRenewsAt: null,
    department: 'Design',
    phone: '',
    bio: 'Contributes to campaigns. Funder status does not make her a member.',
    createdAt: iso(-25),
  },
  {
    id: 'u_dev',
    name: 'Dev Patel',
    email: 'dev@clustro.demo',
    password: 'Devdev@1234',
    role: 'NON_MEMBER',
    accountStatus: 'APPROVED',
    capabilities: [],
    planId: null,
    planRenewsAt: null,
    department: 'Information Science',
    phone: '',
    bio: '',
    createdAt: iso(-5),
  },
]

export const seedEvents = (): ClubEvent[] => [
  {
    id: 'e_hack',
    title: 'Hack Night 2026',
    description: 'A 12-hour build sprint with mentors, snacks and a demo round at midnight.',
    startsAt: iso(6, 18),
    venue: 'Innovation Lab, Block C',
    capacity: 60,
    registered: 41,
    memberPriceInr: 100,
    nonMemberPriceInr: 250,
    memberOnly: false,
    organizerName: 'Rohan Mehta',
    tag: 'Hackathon',
  },
  {
    id: 'e_talk',
    title: 'Monthly Tech Talk: Shipping Side Projects',
    description: 'Three short talks from seniors on taking a side project from idea to launch.',
    startsAt: iso(3, 16),
    venue: 'Seminar Hall 2',
    capacity: 120,
    registered: 87,
    memberPriceInr: 0,
    nonMemberPriceInr: 0,
    memberOnly: false,
    organizerName: 'Rohan Mehta',
    tag: 'Talk',
  },
  {
    id: 'e_work',
    title: 'Members Workshop: Figma for Teams',
    description: 'Hands-on session on shared design systems. Bring a laptop.',
    startsAt: iso(11, 15),
    venue: 'Studio 4',
    capacity: 25,
    registered: 25,
    memberPriceInr: 150,
    nonMemberPriceInr: 150,
    memberOnly: true,
    organizerName: 'Anita Rao',
    tag: 'Workshop',
  },
  {
    id: 'e_mix',
    title: 'Annual Mixer & Open House',
    description: 'Meet the clubs, grab a bite and find out how to get involved this year.',
    startsAt: iso(18, 17),
    venue: 'Central Courtyard',
    capacity: 200,
    registered: 64,
    memberPriceInr: 0,
    nonMemberPriceInr: 99,
    memberOnly: false,
    organizerName: 'Anita Rao',
    tag: 'Social',
  },
]

export const seedAnnouncements = (): Announcement[] => [
  {
    id: 'a1',
    title: 'Welcome to Clustro',
    body: 'Everything your organization needs, together. Explore events, apply for membership and keep up with news right here.',
    audience: 'ALL',
    authorName: 'Anita Rao',
    createdAt: iso(-10, 10),
  },
  {
    id: 'a2',
    title: 'Hack Night registrations are open',
    body: 'Tickets for Hack Night 2026 are live. Members get discounted pricing, and seats are limited to 60.',
    audience: 'ALL',
    authorName: 'Rohan Mehta',
    createdAt: iso(-2, 12),
  },
  {
    id: 'a3',
    title: 'Members: workshop seats are full',
    body: 'The Figma workshop has reached capacity. A second session is being planned for next month.',
    audience: 'MEMBERS',
    authorName: 'Anita Rao',
    createdAt: iso(-1, 9),
  },
]

export const seedNotifications = (): Notification[] => [
  {
    id: 'n1',
    userId: 'u_member',
    title: 'Welcome back',
    body: 'Your Standard membership is active.',
    read: true,
    createdAt: iso(-8, 9),
  },
  {
    id: 'n2',
    userId: 'u_guest',
    title: 'Welcome to Clustro',
    body: 'Browse events or apply for membership to unlock member pricing.',
    read: false,
    createdAt: iso(-1, 9),
  },
  {
    id: 'n3',
    userId: 'u_admin',
    title: 'New membership application',
    body: 'Dev Patel applied for the Associate plan.',
    read: false,
    createdAt: iso(-1, 11),
  },
]

export const seedApplications = (): MembershipApplication[] => [
  {
    id: 'app1',
    userId: 'u_dev',
    userName: 'Dev Patel',
    userEmail: 'dev@clustro.demo',
    planId: 'associate',
    reason: 'I attended the last tech talk and would like to help organize events next term.',
    status: 'PENDING',
    createdAt: iso(-1, 10),
  },
]
