import { useQuery } from '@tanstack/react-query'
import { getSummary, listTransactions } from '../api/treasury'
import { errMsg, formatInr, formatDate } from '../lib/format'
import { Banner, Spinner, EmptyState } from '../components/ui'

export function TreasuryPage() {
  const sumQ = useQuery({ queryKey: ['treasurySummary'], queryFn: getSummary })
  const txQ = useQuery({ queryKey: ['treasuryTx'], queryFn: () => listTransactions() })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Treasury</h1>
        <p className="mt-1 text-sm text-navy/70">Financial overview and transactions.</p>
      </div>

      {sumQ.isLoading && <Spinner />}
      {sumQ.isError && <Banner tone="error">{errMsg(sumQ.error)}</Banner>}

      {sumQ.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <div className="card bg-emerald-50 border-emerald-200">
            <h3 className="text-sm font-semibold text-emerald-800">Total Income</h3>
            <p className="text-2xl font-bold text-emerald-900 mt-2">{formatInr(sumQ.data.totalIncomeInr)}</p>
          </div>
          <div className="card bg-red-50 border-red-200">
            <h3 className="text-sm font-semibold text-red-800">Total Expenses</h3>
            <p className="text-2xl font-bold text-red-900 mt-2">{formatInr(sumQ.data.totalExpenseInr)}</p>
          </div>
          <div className="card bg-navy-50 border-navy-200">
            <h3 className="text-sm font-semibold text-navy">Balance</h3>
            <p className="text-2xl font-bold text-navy mt-2">{formatInr(sumQ.data.balanceInr)}</p>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold text-navy mb-4">Transactions</h2>
      {txQ.isLoading && <Spinner />}
      {txQ.data?.length === 0 && <EmptyState title="No transactions" hint="No transactions recorded yet." />}
      
      {txQ.data && txQ.data.length > 0 && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-navy-50 text-navy font-semibold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {txQ.data.map(t => (
                <tr key={t.id} className="hover:bg-navy-50/50">
                  <td className="px-4 py-3 text-navy/70">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-navy">{t.description}</td>
                  <td className="px-4 py-3 text-navy/80">{t.category}</td>
                  <td className={`px-4 py-3 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatInr(t.amountInr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
