import {
  ChevronDown,
  CircleDashed,
  LayoutGrid,
  Scale,
  ShieldCheck,
  TrendingUp,
  Upload,
  X,
  Activity,
} from 'lucide-react';
import type { DatasetBundle, DatasetKey, TabId } from '../types/fairpay';
import { formatIntegerId } from '../lib/format';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  activeDataset: DatasetBundle | null;
  customDataset: DatasetBundle | null;
  onSelectDataset: (key: DatasetKey) => void;
  onOpenUpload: () => void;
  validRowCount: number;
  columnCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: TabId;
  label: string;
  badge?: string;
  icon: typeof LayoutGrid;
}> = [
  { id: 'ringkasan', label: 'Ringkasan', icon: LayoutGrid },
  { id: 'normalitas', label: 'Normalitas', icon: Activity },
  { id: 'homogenitas', label: 'Homogenitas', icon: Scale },
  { id: 'linearitas', label: 'Linearitas & Simulasi', badge: 'LAB', icon: TrendingUp },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  activeDataset,
  customDataset,
  onSelectDataset,
  onOpenUpload,
  validRowCount,
  columnCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const sidebarBody = (
    <div className="flex h-full flex-col overflow-y-auto scrollbar-navy bg-[#0C2B7E] text-white select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-7">
        <div className="flex items-center gap-3">
          <BrandLogo className="w-[38px] h-[30px] text-white shrink-0" />
          <div className="min-w-0">
            <div className="font-display text-[19px] font-bold tracking-tight leading-tight text-white">
              FairPay
            </div>
            <div className="font-mono text-[9.5px] font-medium tracking-[0.14em] text-[#95ACE0] uppercase mt-0.5">
              HR EQUITY AUDITOR
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup menu navigasi"
          className="lg:hidden rounded-lg p-2 text-white/75 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Analysis Navigation */}
      <div className="px-4">
        <div className="px-2.5 pb-2.5 font-mono text-[10px] font-medium tracking-[0.14em] text-[#839CD6] uppercase">
          ANALISIS
        </div>
        <nav aria-label="Menu analisis utama" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  isActive
                    ? 'bg-[#1562FF] text-white shadow-[0_4px_14px_rgba(21,98,255,0.35)]'
                    : 'text-[#DCE5FA] hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-[17px] w-[17px] shrink-0 ${
                      isActive ? 'text-white' : 'text-[#9BB3E8] group-hover:text-white'
                    }`}
                    strokeWidth={1.9}
                  />
                  <span className="leading-snug">{item.label}</span>
                </span>
                {item.badge && (
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider ${
                      isActive
                        ? 'bg-[#292B95]/80 text-[#E0E7FF]'
                        : 'bg-[#2B267D]/85 text-[#C7D2FE]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mx-5 my-6 h-px bg-white/12" />

      {/* Data Source Controls */}
      <div className="px-5 space-y-3.5">
        <div className="font-mono text-[10px] font-medium tracking-[0.14em] text-[#839CD6] uppercase">
          SUMBER DATA
        </div>

        <div>
          <label
            htmlFor="dataset-selector"
            className="block text-[12px] font-medium text-[#C5D4F5] mb-1.5"
          >
            Dataset aktif
          </label>
          <div className="relative">
            <select
              id="dataset-selector"
              value={activeDataset ? activeDataset.key : 'none'}
              onChange={(e) => onSelectDataset(e.target.value as DatasetKey)}
              className="w-full appearance-none rounded-xl border border-white/15 bg-[#153996]/90 px-3.5 py-2.5 pr-9 text-[13px] font-medium text-white transition-colors hover:bg-[#1A42AA] focus:border-[#60A5FA] focus:outline-none cursor-pointer"
            >
              <option value="none" className="bg-[#0C2B7E] text-[#A7BCE8]">
                Pilih dataset...
              </option>
              <option value="glassdoor" className="bg-[#0C2B7E] text-white">
                Glassdoor Pay Gap
              </option>
              <option value="employee_salary" className="bg-[#0C2B7E] text-white">
                Employee Salary & Exp
              </option>
              {customDataset && (
                <option value="custom" className="bg-[#0C2B7E] text-white">
                  {customDataset.shortName}
                </option>
              )}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A7BCE8]"
              aria-hidden="true"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onOpenUpload();
            onCloseMobile();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/25 bg-white/[0.03] px-3 py-2.5 text-[13px] font-medium text-[#DCE5FA] transition-colors hover:border-white/45 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer"
        >
          <Upload className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Unggah CSV / Excel</span>
        </button>

        {/* Dataset Status */}
        {activeDataset ? (
          <div className="flex items-start gap-2.5 pt-1">
            <ShieldCheck className="h-[17px] w-[17px] shrink-0 text-[#34D399] mt-0.5" />
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-[#34D399] leading-tight">
                Data siap dianalisis
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#9BB0E0] tabular-nums">
                {formatIntegerId(validRowCount)} baris · {columnCount} kolom
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 pt-1">
            <CircleDashed className="h-[17px] w-[17px] shrink-0 text-[#9BB0E0] mt-0.5" />
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-[#CBD9F7] leading-tight">
                Belum ada dataset
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#8FA6DA]">
                Pilih atau unggah file data
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Academic Footer */}
      <div className="mt-auto px-5 pb-6 pt-6">
        <div className="mb-4 h-px bg-white/12" />
        <div className="text-[13px] font-bold text-white leading-tight">Tim Statistika</div>
        <div className="mt-0.5 text-[11.5px] text-[#8FA6DA]">Proyek akademik</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block lg:w-[238px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        {sidebarBody}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi FairPay"
        >
          <div
            className="fixed inset-0 bg-[#08153A]/55 backdrop-blur-[2px] transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-[264px] max-w-[82vw] flex-col shadow-2xl">
            {sidebarBody}
          </div>
        </div>
      )}
    </>
  );
}
