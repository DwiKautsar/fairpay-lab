import { ArrowRight, Database, FileSpreadsheet, Sparkles, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import type { DatasetKey, TabId } from '../types/fairpay';
import { downloadExcelTemplate } from '../lib/excel';
import { RevealUp, TypingHeading } from './MotionPrimitives';

interface EmptyStateViewProps {
  activeTab: TabId;
  onSelectDataset: (key: DatasetKey) => void;
  onOpenUpload: () => void;
  onDownloadTemplate?: () => void;
}

const TAB_CONTEXT: Record<TabId, { kicker: string; title: string; subtitle: string }> = {
  ringkasan: {
    kicker: 'RINGKASAN AUDIT',
    title: 'Belum ada dataset aktif.',
    subtitle:
      'Muat salah satu dataset riil bawaan atau unggah file CSV/Excel Anda untuk melihat potret struktur gaji dan diagnosis statistik.',
  },
  normalitas: {
    kicker: 'UJI 01 · SHAPIRO-WILK',
    title: 'Siap menguji normalitas sebaran gaji.',
    subtitle:
      'Pilih atau unggah dataset terlebih dahulu untuk menghitung statistik W, p-value, histogram kurva normal, dan Q-Q plot.',
  },
  homogenitas: {
    kicker: 'UJI 02 · LEVENE',
    title: 'Siap membandingkan varians antarkelompok.',
    subtitle:
      'Pilih atau unggah dataset terlebih dahulu untuk menjalankan Levene’s Test dan memvisualisasikan boxplot rentang upah.',
  },
  linearitas: {
    kicker: 'UJI 03 · LABORATORIUM KEBIJAKAN',
    title: 'Simulator kebijakan menunggu dataset.',
    subtitle:
      'Muat dataset terlebih dahulu untuk menjalankan simulasi subsidi gaji, bonus pengalaman, kalkulator tawaran, dan uji linearitas.',
  },
};

export function EmptyStateView({
  activeTab,
  onSelectDataset,
  onOpenUpload,
  onDownloadTemplate,
}: EmptyStateViewProps) {
  const ctx = TAB_CONTEXT[activeTab];

  return (
    <div className="space-y-7 sm:space-y-8 py-1 sm:py-3">
      {/* Contextual Hero Header */}
      <div className="max-w-2xl">
        <RevealUp delay={0.02} y={8}>
          <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
            {ctx.kicker}
          </div>
        </RevealUp>
        <TypingHeading
          key={ctx.title}
          text={ctx.title}
          speedMs={52}
          delayMs={180}
          className="mt-2 text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] leading-[1.16] text-[#0B1221] [text-wrap:balance]"
        />
        <RevealUp delay={0.12} y={10}>
          <p className="mt-2.5 text-[14.5px] text-[#64748B] leading-relaxed">{ctx.subtitle}</p>
        </RevealUp>
      </div>

      {/* Empty Canvas Card */}
      <RevealUp delay={0.14} y={18}>
        <section className="fairpay-card rounded-2xl border border-dashed border-[#CBD5E1] bg-white/75 backdrop-blur-xs p-6 sm:p-10 shadow-[0_2px_18px_rgba(12,43,126,0.03)]">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 360, damping: 22, delay: 0.2 }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#1562FF]"
            >
              <Database className="h-6 w-6" strokeWidth={1.8} />
            </motion.div>
            <h2 className="mt-4 text-[19px] sm:text-[21px] font-bold tracking-tight text-[#0F172A]">
              Mulai audit keadilan kompensasi
            </h2>
            <p className="mt-2 text-[13.5px] text-[#64748B] leading-relaxed">
              Unggah data penggajian perusahaan Anda dalam format{' '}
              <span className="font-mono text-[#334155]">.csv</span> atau{' '}
              <span className="font-mono text-[#334155]">.xlsx</span>, atau pilih dataset contoh di
              bawah untuk langsung mencoba seluruh fitur.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <motion.button
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                onClick={onOpenUpload}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1562FF] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_4px_14px_rgba(21,98,255,0.26)] transition-colors hover:bg-[#0E51DB] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] focus-visible:ring-offset-2"
              >
                <Upload className="h-4 w-4" />
                <span>Unggah CSV / Excel</span>
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  onDownloadTemplate ? onDownloadTemplate() : void downloadExcelTemplate()
                }
                className="inline-flex items-center gap-2 rounded-xl border border-[#D5DCE8] bg-white px-4 py-2.5 text-[13.5px] font-medium text-[#334155] transition-colors hover:bg-[#F3F5F9] hover:text-[#0F172A] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF]"
              >
                <FileSpreadsheet className="h-4 w-4 text-[#0F9D78]" />
                <span>Unduh Template Excel (9 Kolom)</span>
              </motion.button>
            </div>
          </div>
        </section>
      </RevealUp>

      {/* Instant Built-In Dataset Starters — High-Contrast FairPay Blue Dominance */}
      <section aria-label="Dataset riil bawaan">
        <RevealUp delay={0.2} y={12}>
          <div className="mb-3.5 flex items-center gap-2 font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#0C2B7E] uppercase">
            <Sparkles className="h-3.5 w-3.5 text-[#1562FF]" />
            <span>ATAU MULAI INSTAN DENGAN DATASET RIIL BAWAAN</span>
          </div>
        </RevealUp>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Card 1: Deep FairPay Navy -> Royal Blue */}
          <RevealUp delay={0.24} y={20} className="flex">
            <motion.button
              type="button"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              onClick={() => onSelectDataset('glassdoor')}
              className="group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-[#1E40AF]/40 bg-gradient-to-br from-[#0C2B7E] via-[#1139A3] to-[#155AE8] p-6 text-left text-white shadow-[0_12px_28px_rgba(12,43,126,0.2)] transition-shadow duration-200 hover:shadow-[0_20px_40px_rgba(21,98,255,0.3)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] focus-visible:ring-offset-2"
            >
              {/* Subtle decorative arc */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border-[18px] border-white/[0.08] transition-transform duration-300 group-hover:scale-110"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-12 right-8 h-28 w-28 rounded-full bg-[#60A5FA]/20 blur-2xl"
              />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[#BFDBFE] uppercase">
                    Kaggle Public Dataset
                  </span>
                  <span className="rounded-lg bg-white/14 px-2.5 py-0.5 font-mono text-[11px] font-medium text-white backdrop-blur-xs tabular-nums">
                    1.000 baris · 9 kolom
                  </span>
                </div>
                <h2 className="mt-3 text-[19px] font-bold tracking-tight text-white">
                  Glassdoor Gender Pay Gap
                </h2>
                <p className="mt-1.5 text-[13.5px] text-[#DBEAFE]/90 leading-relaxed">
                  Struktur gaji pokok 5 divisi dengan perbandingan gender, pendidikan, kinerja, dan
                  pengalaman kerja.
                </p>
              </div>

              <div className="relative z-10 mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2 text-[13px] font-bold text-[#0C2B7E] shadow-xs transition-all group-hover:bg-[#EFF6FF]">
                <span>Muat dataset ini</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.button>
          </RevealUp>

          {/* Card 2: Vibrant FairPay Electric Blue -> Cobalt */}
          <RevealUp delay={0.31} y={20} className="flex">
            <motion.button
              type="button"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              onClick={() => onSelectDataset('employee_salary')}
              className="group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-[#3B82F6]/45 bg-gradient-to-br from-[#1562FF] via-[#1351D8] to-[#0B3496] p-6 text-left text-white shadow-[0_12px_28px_rgba(21,98,255,0.22)] transition-shadow duration-200 hover:shadow-[0_20px_40px_rgba(21,98,255,0.34)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] focus-visible:ring-offset-2"
            >
              {/* Subtle decorative ring */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -bottom-12 h-40 w-40 rounded-full border-[18px] border-white/[0.09] transition-transform duration-300 group-hover:scale-110"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 left-1/2 h-28 w-28 rounded-full bg-[#93C5FD]/22 blur-2xl"
              />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[#DBEAFE] uppercase">
                    Kaggle Public Dataset
                  </span>
                  <span className="rounded-lg bg-white/16 px-2.5 py-0.5 font-mono text-[11px] font-medium text-white backdrop-blur-xs tabular-nums">
                    375 baris · 6 kolom
                  </span>
                </div>
                <h2 className="mt-3 text-[19px] font-bold tracking-tight text-white">
                  Employee Salary &amp; Experience
                </h2>
                <p className="mt-1.5 text-[13.5px] text-[#E0EDFF]/92 leading-relaxed">
                  Data gaji tahunan lintas tingkat pendidikan (Bachelor, Master, PhD) dan masa kerja
                  untuk uji linearitas.
                </p>
              </div>

              <div className="relative z-10 mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2 text-[13px] font-bold text-[#1562FF] shadow-xs transition-all group-hover:bg-[#EFF6FF]">
                <span>Muat dataset ini</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.button>
          </RevealUp>
        </div>
      </section>
    </div>
  );
}
