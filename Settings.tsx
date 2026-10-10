import { useQuery } from '@tanstack/react-query'
import { getSettings } from '../api/settings'
import { errMsg } from '../lib/format'
import { Banner, Spinner } from '../components/ui'

export function SettingsPage() {
  const q = useQuery({ queryKey: ['settings'], queryFn: getSettings })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Settings</h1>
        <p className="mt-1 text-sm text-navy/70">Manage organization settings.</p>
      </div>

      {q.isLoading && <Spinner />}
      {q.isError && <Banner tone="error">{errMsg(q.error)}</Banner>}

      {q.data && (
        <div className="card space-y-6">
          <div>
            <h2 className="text-lg font-bold text-navy mb-4">Organization Profile</h2>
            <div className="space-y-4 text-sm text-navy">
              <div>
                <p className="font-semibold">Name</p>
                <p className="text-navy/80">{q.data.orgName}</p>
              </div>
              <div>
                <p className="font-semibold">Tagline</p>
                <p className="text-navy/80">{q.data.tagline}</p>
              </div>
              <div>
                <p className="font-semibold">Contact Email</p>
                <p className="text-navy/80">{q.data.contactEmail}</p>
              </div>
              <div>
                <p className="font-semibold">Current Semester</p>
                <p className="text-navy/80">{q.data.currentSemester}</p>
              </div>
            </div>
          </div>
          
          <hr className="border-navy/10" />

          <div>
            <h2 className="text-lg font-bold text-navy mb-4">Preferences</h2>
            <ul className="space-y-2 text-sm text-navy">
              <li className="flex justify-between items-center py-1">
                <span>Auto-Approve Accounts</span>
                <span className="font-semibold">{q.data.preferences.autoApproveAccounts ? 'Yes' : 'No'}</span>
              </li>
              <li className="flex justify-between items-center py-1">
                <span>Require Payment For Membership</span>
                <span className="font-semibold">{q.data.preferences.requirePaymentForMembership ? 'Yes' : 'No'}</span>
              </li>
              <li className="flex justify-between items-center py-1">
                <span>Enable Merchandise</span>
                <span className="font-semibold">{q.data.preferences.enableMerchandise ? 'Yes' : 'No'}</span>
              </li>
              <li className="flex justify-between items-center py-1">
                <span>Enable Volunteering</span>
                <span className="font-semibold">{q.data.preferences.enableVolunteering ? 'Yes' : 'No'}</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
