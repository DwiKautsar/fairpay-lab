import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Menu,
} from 'lucide-react';

interface TopBarProps {
  datasetName: string | null;
  hasDataset: boolean;
  activeFilterCount: number;
  isExporting?: boolean;
  isTabLoading?: boolean;
  onOpenMobileMenu: () => void;
  onOpenFilter: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onDownloadTemplate: () => void;
}

export function TopBar({
  datasetName,
  hasDataset,
  activeFilterCount,
  isExporting = false,
  isTabLoading = false,
  onOpenMobileMenu,
  onOpenFilter,
  onExportExcel,
  onExportCsv,
  onDownloadTemplate,
}: TopBarProps) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exportMenuOpen]);

  return (
    <header className="relative flex h-[64px] lg:h-[66px] w-full items-center justify-between gap-2 sm:gap-4 border-b border-[#E7EDF8] bg-white/90 px-3.5 backdrop-blur-xl shadow-[0_2px_10px_rgba(12,43,126,0.04)] sm:px-6 lg:rounded-[18px] lg:border lg:border-white/90 lg:bg-white/82 lg:px-6 lg:shadow-[0_10px_28px_-10px_rgba(12,43,126,0.09),0_2px_6px_rgba(12,43,126,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] lg:ring-1 lg:ring-[#DCE6F7]/75">
      {/* Left: Mobile Hamburger + Compact Context / Desktop Breadcrumb */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Buka menu navigasi"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#111827] hover:bg-[#F3F5F9] transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF]"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col min-w-0 lg:hidden">
          <span className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#94A3B8] uppercase leading-none">
            FairPay
          </span>
          <span
            className={`mt-0.5 truncate text-[12.5px] leading-tight ${
              datasetName ? 'font-semibold text-[#0F172A]' : 'font-medium text-[#94A3B8]'
            }`}
          >
            {datasetName ?? 'Belum ada dataset'}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2.5 text-[13.5px] min-w-0">
          <span className="text-[#94A3B8] whitespace-nowrap">Audit aktif</span>
          <span className="text-[#CBD5E1]" aria-hidden="true">
            /
          </span>
          <span
            className={`truncate ${
              datasetName ? 'font-semibold text-[#1E293B]' : 'font-medium text-[#94A3B8]'
            }`}
          >
            {datasetName ?? 'Belum ada dataset'}
          </span>
        </div>
      </div>

      {/* Right: Filter & Export Dropdown Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <button
          type="button"
          disabled={!hasDataset}
          onClick={onOpenFilter}
          aria-label={`Filter dan pemetaan kolom${activeFilterCount > 0 ? ` (${activeFilterCount} aktif)` : ''}`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F3F5F9] px-3.5 py-2.5 text-[13px] font-medium text-[#334155] transition-colors hover:bg-[#E8ECF4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-[#F3F5F9]"
        >
          <Filter className="h-4 w-4 text-[#475569]" />
          <span className="hidden sm:inline">Filter</span>
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md bg-[#DBEAFE] px-1.5 font-mono text-[11px] font-semibold text-[#1D4ED8] tabular-nums">
            {activeFilterCount}
          </span>
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            disabled={!hasDataset || isExporting}
            onClick={() => setExportMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={exportMenuOpen}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#1562FF] px-3 sm:px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_2px_10px_rgba(21,98,255,0.22)] transition-all hover:bg-[#0E51DB] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] focus-visible:ring-offset-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:bg-[#1562FF]"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>
              {isExporting ? (
                'Menyiapkan...'
              ) : (
                <>
                  Ekspor<span className="hidden sm:inline"> laporan</span>
                </>
              )}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 opacity-85 transition-transform duration-150 ${
                exportMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {exportMenuOpen && hasDataset && (
            <div
              role="menu"
              aria-label="Pilihan format ekspor laporan"
              className="absolute right-0 mt-2 w-[310px] origin-top-right rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_14px_38px_rgba(12,43,126,0.16)] z-40"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportMenuOpen(false);
                  onExportExcel();
                }}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#EFF6FF] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF]"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E6F8F1] text-[#059669]">
                  <FileSpreadsheet className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F172A]">
                    <span>Laporan Excel Lengkap</span>
                    <span className="rounded bg-[#DBEAFE] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#1D4ED8]">
                      .XLSX
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-[#64748B] leading-snug">
                    5 sheet terformat + 4 diagram statistik &amp; data simulasi lengkap.
                  </p>
                </div>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportMenuOpen(false);
                  onExportCsv();
                }}
                className="mt-1 flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#EFF6FF] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF]"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FF] text-[#1562FF]">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0F172A]">
                    <span>Ekspor Data Lengkap</span>
                    <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#334155]">
                      .CSV
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-[#64748B] leading-snug">
                    CSV siap Excel (UTF-8 BOM) berisi seluruh kolom asli, gaji simulasi &amp; hasil uji.
                  </p>
                </div>
              </button>

              <div className="my-1.5 h-px bg-[#EEF2F7]" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportMenuOpen(false);
                  onDownloadTemplate();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC] hover:text-[#0C2B7E] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF]"
              >
                <span>Unduh Template Excel (9 Kolom)</span>
                <span className="font-mono text-[10px] text-[#94A3B8]">.xlsx</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isTabLoading && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 lg:inset-x-3 bottom-0 h-[2.5px] overflow-hidden rounded-full bg-[#E8F0FF]"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#0C2B7E] via-[#1562FF] to-[#60A5FA]"
          />
        </div>
      )}
    </header>
  );
}
