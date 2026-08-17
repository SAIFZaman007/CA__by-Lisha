import { create } from 'zustand'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

/**
 * Minimal toast system. Confirmations after a save, and errors that would
 * otherwise vanish silently.
 */
const useToastStore = create((set) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, toast.duration ?? 4000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (message) => useToastStore.getState().push({ message, tone: 'success' }),
  error: (message) => useToastStore.getState().push({ message, tone: 'error', duration: 6000 }),
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      // Announced to screen readers without stealing focus.
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map(({ id, message, tone }) => {
          const Icon = tone === 'error' ? AlertCircle : CheckCircle2
          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 shadow-xl shadow-black/40"
            >
              <Icon
                className={`mt-0.5 size-5 shrink-0 ${
                  tone === 'error' ? 'text-brand-500' : 'text-signal-green'
                }`}
              />
              <p className="flex-1 text-sm text-chalk-50">{message}</p>
              <button
                type="button"
                onClick={() => dismiss(id)}
                aria-label="Dismiss"
                className="text-chalk-500 transition hover:text-chalk-50"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
