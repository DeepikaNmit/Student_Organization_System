import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { GuestOnly, RequireAuth, RequireRole } from './components/Guards'
import { AppLayout } from './components/AppLayout'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { DashboardPage } from './pages/Dashboard'
import { EventsPage, MyTicketsPage } from './pages/Events'
import { AnnouncementsPage, NotificationsPage } from './pages/Announcements'
import { MembershipPage } from './pages/Membership'
import { AdminMembersPage } from './pages/AdminMembers'
import { AdminAccountApprovalsPage } from './pages/AdminAccountApprovals'
import { ProfilePage } from './pages/Profile'
import { ComingSoonPage, NotFoundPage } from './pages/Misc'
import { MerchandisePage } from './pages/Merchandise'
import { TreasuryPage } from './pages/Treasury'
import { VolunteeringPage } from './pages/Volunteering'
import { SettingsPage } from './pages/Settings'
import { AuditLogPage } from './pages/AuditLog'
import { ClubMemoryPage } from './pages/ClubMemory'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route element={<GuestOnly />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/tickets" element={<MyTicketsPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/membership" element={<MembershipPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/merchandise" element={<MerchandisePage />} />
                <Route path="/volunteering" element={<VolunteeringPage />} />

                <Route element={<RequireRole roles={['ADMIN']} />}>
                  <Route path="/admin/members" element={<AdminMembersPage />} />
                  <Route path="/admin/account-approvals" element={<AdminAccountApprovalsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/audit-log" element={<AuditLogPage />} />
                  <Route path="/club-memory" element={<ClubMemoryPage />} />
                </Route>
                <Route element={<RequireRole roles={['ADMIN']} capabilities={['TREASURER']} />}>
                  <Route path="/treasury" element={<TreasuryPage />} />
                </Route>
                <Route path="/clubs" element={<ComingSoonPage />} />
                <Route path="/campaigns" element={<ComingSoonPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
