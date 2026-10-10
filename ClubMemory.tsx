import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listHistory, listTemplates, listLeaders, listReports } from '../api/clubMemory'
import { errMsg, formatDate } from '../lib/format'
import { Banner, Spinner, EmptyState } from '../components/ui'

export function ClubMemoryPage() {
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'TEMPLATES' | 'LEADERS' | 'REPORTS'>('HISTORY')

  const historyQ = useQuery({ queryKey: ['clubHistory'], queryFn: listHistory })
  const templatesQ = useQuery({ queryKey: ['clubTemplates'], queryFn: listTemplates })
  const leadersQ = useQuery({ queryKey: ['clubLeaders'], queryFn: listLeaders })
  const reportsQ = useQuery({ queryKey: ['clubReports'], queryFn: listReports })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">ClubMemory</h1>
          <p className="mt-1 text-sm text-navy/70">Preserve institutional knowledge.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={`px-4 py-2 text-sm font-semibold rounded-lg ${activeTab === 'HISTORY' ? 'bg-navy text-white' : 'bg-navy-50 text-navy hover:bg-navy-100'}`} onClick={() => setActiveTab('HISTORY')}>History</button>
          <button className={`px-4 py-2 text-sm font-semibold rounded-lg ${activeTab === 'TEMPLATES' ? 'bg-navy text-white' : 'bg-navy-50 text-navy hover:bg-navy-100'}`} onClick={() => setActiveTab('TEMPLATES')}>Templates</button>
          <button className={`px-4 py-2 text-sm font-semibold rounded-lg ${activeTab === 'LEADERS' ? 'bg-navy text-white' : 'bg-navy-50 text-navy hover:bg-navy-100'}`} onClick={() => setActiveTab('LEADERS')}>Leaders</button>
          <button className={`px-4 py-2 text-sm font-semibold rounded-lg ${activeTab === 'REPORTS' ? 'bg-navy text-white' : 'bg-navy-50 text-navy hover:bg-navy-100'}`} onClick={() => setActiveTab('REPORTS')}>Reports</button>
        </div>
      </div>

      {activeTab === 'HISTORY' && (
        <div>
          {historyQ.isLoading && <Spinner />}
          {historyQ.isError && <Banner tone="error">{errMsg(historyQ.error)}</Banner>}
          {historyQ.data?.length === 0 && <EmptyState title="No history" hint="No historical events." />}
          <div className="space-y-4 max-w-3xl">
            {historyQ.data?.map(h => (
              <div key={h.id} className="card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-navy text-lg">{h.title}</h3>
                  <span className="text-xs px-2 py-1 bg-navy-50 rounded text-navy font-semibold">{h.semester}</span>
                </div>
                <p className="text-sm text-navy/70 mb-4">{formatDate(h.date)} • {h.venue} • {h.attendees} attendees</p>
                <div className="text-sm text-navy">
                  <p className="font-semibold mt-2">Highlights</p>
                  <p className="text-navy/80">{h.highlights}</p>
                  <p className="font-semibold mt-2">Lessons Learned</p>
                  <p className="text-navy/80">{h.lessonsLearned}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'TEMPLATES' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {templatesQ.isLoading && <Spinner />}
          {templatesQ.isError && <Banner tone="error">{errMsg(templatesQ.error)}</Banner>}
          {templatesQ.data?.map(t => (
            <div key={t.id} className="card p-4">
              <h3 className="font-bold text-navy text-lg mb-2">{t.name}</h3>
              <p className="text-sm text-navy/80 mb-4">{t.description}</p>
              <h4 className="text-xs font-semibold text-navy uppercase tracking-wider mb-2">Checklist</h4>
              <ul className="text-sm text-navy/70 space-y-1">
                {t.checklist.map((item, idx) => <li key={idx}>• {item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'LEADERS' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leadersQ.isLoading && <Spinner />}
          {leadersQ.isError && <Banner tone="error">{errMsg(leadersQ.error)}</Banner>}
          {leadersQ.data?.map(l => (
            <div key={l.id} className="card p-4">
              <h3 className="font-bold text-navy text-lg">{l.name}</h3>
              <p className="text-sm text-cyan-clustro font-semibold mb-2">{l.role}</p>
              <p className="text-xs text-navy/70 mb-4">{l.semester}</p>
              <h4 className="text-xs font-semibold text-navy uppercase tracking-wider mb-2">Handover Notes</h4>
              <p className="text-sm text-navy/80 italic">"{l.handoverNotes}"</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'REPORTS' && (
        <div className="space-y-4 max-w-3xl">
          {reportsQ.isLoading && <Spinner />}
          {reportsQ.isError && <Banner tone="error">{errMsg(reportsQ.error)}</Banner>}
          {reportsQ.data?.map(r => (
            <div key={r.id} className="card p-4">
              <h3 className="font-bold text-navy text-lg mb-2">{r.semester} Report</h3>
              <p className="text-sm text-navy/80 mb-4">{r.summary}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-navy/60 font-semibold uppercase">Events</p>
                  <p className="text-lg font-bold text-navy">{r.eventsHeld}</p>
                </div>
                <div>
                  <p className="text-xs text-navy/60 font-semibold uppercase">Members</p>
                  <p className="text-lg font-bold text-navy">+{r.membersGained}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600/80 font-semibold uppercase">Income</p>
                  <p className="text-lg font-bold text-emerald-700">₹{r.totalIncomeInr}</p>
                </div>
                <div>
                  <p className="text-xs text-red-600/80 font-semibold uppercase">Expense</p>
                  <p className="text-lg font-bold text-red-700">₹{r.totalExpenseInr}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
