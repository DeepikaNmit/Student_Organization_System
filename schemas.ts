import { z } from 'zod'

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})
export type LoginForm = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(80, 'Keep it under 80 characters'),
    email,
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' })
export type RegisterForm = z.infer<typeof registerSchema>

export const applicationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(20, 'Tell us a little more (at least 20 characters)')
    .max(500, 'Keep it under 500 characters'),
})
export type ApplicationForm = z.infer<typeof applicationSchema>

export const reviewSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    note: z.string().trim().max(300, 'Keep it under 300 characters'),
  })
  .refine((d) => d.decision === 'APPROVED' || d.note.length >= 5, {
    path: ['note'],
    message: 'Add a short note explaining the decision',
  })
export type ReviewForm = z.infer<typeof reviewSchema>

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  department: z.string().trim().max(60, 'Keep it under 60 characters'),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === '' || /^[+0-9][0-9 ()-]{6,}$/.test(v), 'Enter a valid phone number'),
  bio: z.string().trim().max(240, 'Keep it under 240 characters'),
})
export type ProfileForm = z.infer<typeof profileSchema>

export const accessSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'NON_MEMBER']),
  capabilities: z.array(z.enum(['FUNDER', 'TREASURER', 'EVENT_ORGANIZER', 'VOLUNTEER'])),
})
export type AccessForm = z.infer<typeof accessSchema>

const money = (label: string) =>
  z
    .number({ error: `Enter ${label}` })
    .int('Whole rupees only')
    .min(0, 'Cannot be negative')
    .max(100000, 'That looks too high')

export const eventSchema = z.object({
  title: z.string().trim().min(3, 'Add a title').max(100),
  description: z.string().trim().min(10, 'Add a short description').max(400),
  startsAt: z
    .string()
    .min(1, 'Pick a date and time')
    .refine((v) => new Date(v).getTime() > Date.now(), 'Choose a date in the future'),
  venue: z.string().trim().min(2, 'Add a venue').max(80),
  capacity: z
    .number({ error: 'Enter a capacity' })
    .int('Whole numbers only')
    .min(1, 'At least 1 seat')
    .max(5000, 'Max 5000 seats'),
  memberPriceInr: money('a member price'),
  nonMemberPriceInr: money('a non-member price'),
  memberOnly: z.boolean(),
  tag: z.string().trim().min(2, 'Add a tag').max(24),
})
export type EventForm = z.infer<typeof eventSchema>

export const announcementSchema = z.object({
  title: z.string().trim().min(3, 'Add a title').max(100),
  body: z.string().trim().min(10, 'Write at least 10 characters').max(600),
  audience: z.enum(['ALL', 'MEMBERS']),
})
export type AnnouncementForm = z.infer<typeof announcementSchema>
