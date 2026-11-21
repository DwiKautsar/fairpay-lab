import { Download, Filter, Menu } from 'lucide-react';

interface TopBarProps {
  datasetName: string | null;
  hasDataset: boolean;
  activeFilterCount: number;
  onOpenMobileMenu: () => void;
  onOpenFilter: () => void;
  onExportReport: () => void;
}

export function TopBar({
  datasetName,
  hasDataset,
  activeFilterCount,
  onOpenMobileMenu,
  onOpenFilter,
  onExportReport,
}: TopBarProps) {
  return (
    <header className="flex h-[68px] w-full items-center justify-between gap-4 border-b border-[#EEF0F5] bg-white/95 px-4 backdrop-blur-md shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-6 lg:px-10">
      {/* Left: Mobile Hamburger + Desktop Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Buka menu navigasi"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#111827] hover:bg-[#F3F5F9] transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF]"
        >
          <Menu className="h-5 w-5" />
        </button>

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

      {/* Right: Filter & Primary Export CTA */}
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

        <button
          type="button"
          disabled={!hasDataset}
          onClick={onExportReport}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1562FF] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_2px_10px_rgba(21,98,255,0.22)] transition-all hover:bg-[#0E51DB] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] focus-visible:ring-offset-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:bg-[#1562FF]"
        >
          <Download className="h-4 w-4" />
          <span>Ekspor laporan</span>
        </button>
      </div>
    </header>
  );
}
