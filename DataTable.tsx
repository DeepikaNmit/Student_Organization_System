import type { ReactNode } from 'react'
import { EmptyState, ErrorState, Spinner } from './ui'

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[] | undefined
  rowKey: (row: T) => string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyTitle?: string
  emptyHint?: string
}

export function DataTable<T>({ columns, rows, rowKey, loading, error, onRetry, emptyTitle = 'Nothing here yet', emptyHint }: Props<T>) {
  if (loading) return <div className="card"><Spinner /></div>
  if (error) return <div className="card"><ErrorState message={error} onRetry={onRetry} /></div>
  if (!rows || rows.length === 0) return <div className="card"><EmptyState title={emptyTitle} hint={emptyHint} /></div>

  return (
    <div className="overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-navy text-white">
            <tr>
              {columns.map((c) => (
                <th key={c.header} scope="col" className={`px-4 py-3 font-semibold ${c.className ?? ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10">
            {rows.map((r) => (
              <tr key={rowKey(r)} className="align-top hover:bg-surface">
                {columns.map((c) => (
                  <td key={c.header} className={`px-4 py-3 text-navy ${c.className ?? ''}`}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
