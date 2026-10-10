import { useEffect, type FormEventHandler, type ReactNode } from 'react'
import { Loader2, X } from 'lucide-react'
import { Banner } from './ui'

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/60 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-5 py-4">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-navy hover:bg-navy-50" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

interface FormModalProps {
  title: string
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  submitLabel: string
  submitting?: boolean
  error?: string | null
  children: ReactNode
  wide?: boolean
}

export function FormModal({ title, onClose, onSubmit, submitLabel, submitting, error, children, wide }: FormModalProps) {
  return (
    <Modal title={title} onClose={onClose} wide={wide}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {children}
        {error && <Banner tone="error">{error}</Banner>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}
