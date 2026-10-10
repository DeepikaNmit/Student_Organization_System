import {
  Bell,
  CalendarDays,
  Building2,
  ClipboardCheck,
  HandHeart,
  HeartHandshake,
  LayoutDashboard,
  Megaphone,
  Landmark,
  ScrollText,
  Settings,
  Ticket,
  UserCircle,
  Users,
  BadgeCheck,
  ShieldCheck,
  ShoppingBag,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'
import type { User } from '../types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  soon?: boolean
}

export const STUBS: Record<string, string> = {
  '/clubs': 'Clubs',
  '/campaigns': 'Campaigns',
}

export function navFor(user: User): NavItem[] {
  const isAdmin = user.role === 'ADMIN'
  const caps = user.capabilities

  const items: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/events', label: 'Events', icon: CalendarDays },
    { to: '/events/tickets', label: 'My Tickets', icon: Ticket },
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ]

  if (isAdmin) {
    items.push(
      { to: '/admin/members', label: 'Members', icon: Users },
      { to: '/admin/account-approvals', label: 'Account Approvals', icon: ShieldCheck },
    )
  } else {
    items.push({ to: '/membership', label: user.role === 'MEMBER' ? 'My Membership' : 'Membership', icon: BadgeCheck })
  }

  // Merchandise — accessible to all roles
  items.push({ to: '/merchandise', label: 'Merchandise', icon: ShoppingBag })

  items.push(
    { to: '/clubs', label: 'Clubs', icon: Building2, soon: true },
    { to: '/campaigns', label: caps.includes('FUNDER') ? 'Campaigns (Funder)' : 'Campaigns', icon: HeartHandshake, soon: true },
  )
  if (isAdmin || caps.includes('VOLUNTEER') || user.role === 'NON_MEMBER') {
    items.push({ to: '/volunteering', label: 'Volunteering', icon: HandHeart })
  }
  if (isAdmin || caps.includes('TREASURER')) {
    items.push({ to: '/treasury', label: 'Treasury', icon: Landmark })
  }
  if (isAdmin) {
    items.push(
      { to: '/club-memory', label: 'ClubMemory', icon: BookOpen },
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/audit-log', label: 'Audit Log', icon: ScrollText },
    )
  }
  items.push({ to: '/profile', label: 'Profile', icon: UserCircle })
  return items
}
