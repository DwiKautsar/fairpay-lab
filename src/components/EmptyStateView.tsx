import { ArrowRight, Database, FileSpreadsheet, Upload } from 'lucide-react';
import type { DatasetKey, TabId } from '../types/fairpay';
import { downloadExcelTemplate } from '../lib/excel';

interface EmptyStateViewProps {
  activeTab: TabId;
  onSelectDataset: (key: DatasetKey) => void;
  onOpenUpload: () => void;
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
}: EmptyStateViewProps) {
  const ctx = TAB_CONTEXT[activeTab];

  return (
    <div className="space-y-8 py-2 sm:py-4">
      {/* Contextual Hero Header */}
      <div className="max-w-2xl">
        <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
          {ctx.kicker}
        </div>
        <h1 className="mt-2 text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] leading-[1.16] text-[#0B1221] [text-wrap:balance]">
          {ctx.title}
        </h1>
        <p className="mt-2.5 text-[14.5px] text-[#64748B] leading-relaxed">{ctx.subtitle}</p>
      </div>

      {/* Empty Canvas Card */}
      <section className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8F9FC] p-7 sm:p-10">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#1562FF]">
            <Database className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h2 className="mt-4 text-[19px] sm:text-[21px] font-bold tracking-tight text-[#0F172A]">
            Mulai audit keadilan kompensasi
          </h2>
          <p className="mt-2 text-[13.5px] text-[#64748B] leading-relaxed">
            Unggah data penggajian perusahaan Anda dalam format <span className="font-mono text-[#334155]">.csv</span> atau{' '}
            <span className="font-mono text-[#334155]">.xlsx</span>, atau pilih dataset contoh di bawah untuk langsung mencoba seluruh fitur.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1562FF] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_2px_10px_rgba(21,98,255,0.22)] transition-all hover:bg-[#0E51DB] active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] focus-visible:ring-offset-2"
            >
              <Upload className="h-4 w-4" />
              <span>Unggah CSV / Excel</span>
            </button>
            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D5DCE8] bg-white px-4 py-2.5 text-[13.5px] font-medium text-[#334155] transition-colors hover:bg-[#F3F5F9] hover:text-[#0F172A] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF]"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#0F9D78]" />
              <span>Unduh Template Excel</span>
            </button>
          </div>
        </div>
      </section>

      {/* Instant Built-In Dataset Starters (PRD Section 4.1) */}
      <section aria-label="Dataset riil bawaan">
        <div className="mb-3.5 font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#64748B] uppercase">
          ATAU GUNAKAN DATASET RIIL BAWAAN
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelectDataset('glassdoor')}
            className="group flex flex-col justify-between rounded-2xl border border-[#E7ECF4] bg-white p-5 text-left transition-all hover:border-[#1562FF]/50 hover:shadow-[0_4px_20px_rgba(21,98,255,0.08)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF]"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-medium text-[#1562FF]">
                  Kaggle Public Dataset
                </span>
                <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
                  1.000 baris · 9 kolom
                </span>
              </div>
              <h2 className="mt-2 text-[17px] font-bold text-[#0F172A] group-hover:text-[#1562FF] transition-colors">
                Glassdoor Gender Pay Gap
              </h2>
              <p className="mt-1.5 text-[13px] text-[#64748B] leading-relaxed">
                Struktur gaji pokok 5 divisi dengan perbandingan gender dan pengalaman kerja.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1562FF]">
              <span>Muat dataset ini</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectDataset('employee_salary')}
            className="group flex flex-col justify-between rounded-2xl border border-[#E7ECF4] bg-white p-5 text-left transition-all hover:border-[#1562FF]/50 hover:shadow-[0_4px_20px_rgba(21,98,255,0.08)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF]"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-medium text-[#1562FF]">
                  Kaggle Public Dataset
                </span>
                <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
                  375 baris · 6 kolom
                </span>
              </div>
              <h2 className="mt-2 text-[17px] font-bold text-[#0F172A] group-hover:text-[#1562FF] transition-colors">
                Employee Salary &amp; Experience
              </h2>
              <p className="mt-1.5 text-[13px] text-[#64748B] leading-relaxed">
                Data gaji tahunan lintas tingkat pendidikan (Bachelor, Master, PhD) dan masa kerja.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1562FF]">
              <span>Muat dataset ini</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
