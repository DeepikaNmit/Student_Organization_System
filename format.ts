export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatInr = (n: number) => (n === 0 ? 'Free' : `₹${n.toLocaleString('en-IN')}`)

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.')
