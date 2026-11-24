import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  tone?: 'success' | 'info';
}

interface ToastNoticeProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function ToastNotice({ toast, onDismiss }: ToastNoticeProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[80] flex justify-end"
    >
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-[#DCE5F4] bg-white px-4 py-3.5 shadow-[0_14px_38px_rgba(12,43,126,0.16)]"
          >
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                toast.tone === 'info'
                  ? 'bg-[#EEF4FF] text-[#1562FF]'
                  : 'bg-[#E6F8F1] text-[#059669]'
              }`}
            >
              {toast.tone === 'info' ? (
                <Info className="h-4 w-4" strokeWidth={2.2} />
              ) : (
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[#0F172A] leading-snug">
                {toast.title}
              </div>
              {toast.description && (
                <div className="mt-0.5 text-[12px] text-[#64748B] leading-snug">
                  {toast.description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Tutup notifikasi"
              className="rounded-lg p-1 text-[#94A3B8] hover:bg-[#F3F5F9] hover:text-[#0F172A] transition-colors cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
