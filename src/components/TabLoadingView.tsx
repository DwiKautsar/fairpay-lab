import { motion } from 'motion/react';
import type { TabId } from '../types/fairpay';
import { BrandLogo } from './BrandLogo';

interface TabLoadingViewProps {
  targetTab: TabId;
}

const TAB_LOADING_LABELS: Record<TabId, { title: string; subtitle: string }> = {
  ringkasan: {
    title: 'Menyiapkan Ringkasan Audit',
    subtitle: 'Menyelaraskan metrik kompensasi dan distribusi gaji per divisi...',
  },
  normalitas: {
    title: 'Memuat Uji Normalitas',
    subtitle: 'Menyiapkan histogram sebaran, kurva normal, dan Q-Q plot Shapiro–Wilk...',
  },
  homogenitas: {
    title: 'Memuat Uji Homogenitas',
    subtitle: 'Menghitung perbandingan rentang upah dan varians antarkelompok...',
  },
  linearitas: {
    title: 'Memuat Uji Linearitas',
    subtitle: 'Menghitung regresi linear vs kuadratik, F-Deviasi, dan diagram pencar...',
  },
  simulasi: {
    title: 'Menyiapkan Laboratorium Simulasi',
    subtitle: 'Memuat parameter kebijakan what-if dan kalkulator tawaran kandidat...',
  },
};

export function TabLoadingView({ targetTab }: TabLoadingViewProps) {
  const copy = TAB_LOADING_LABELS[targetTab];

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="flex min-h-[460px] flex-col items-center justify-center py-12"
    >
      {/* Orbital brand spinner */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-[#E2E8F0]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#1562FF] border-r-[#0C2B7E]"
          style={{ animationDuration: '0.75s' }}
        />
        <BrandLogo variant="color" className="h-[22px] w-[28px]" />
      </div>

      <div className="mt-5 text-center">
        <div className="font-display text-[17px] font-bold tracking-tight text-[#0B1221]">
          {copy.title}
        </div>
        <p className="mt-1.5 text-[13.5px] text-[#64748B]">{copy.subtitle}</p>
      </div>

      {/* Subtle analytical skeleton preview below */}
      <div
        aria-hidden="true"
        className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <div className="h-20 animate-pulse rounded-2xl bg-[#F4F6FA]" />
        <div className="h-20 animate-pulse rounded-2xl bg-[#F4F6FA] [animation-delay:100ms]" />
        <div className="h-20 animate-pulse rounded-2xl bg-[#F4F6FA] [animation-delay:200ms]" />
      </div>
    </motion.div>
  );
}
