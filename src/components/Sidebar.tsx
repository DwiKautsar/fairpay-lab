import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  onBackToWelcome?: () => void;
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
  onBackToWelcome,
  validRowCount,
  columnCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const renderSidebarBody = (instance: 'desktop' | 'mobile') => (
    <div className="relative h-full w-full">
      {/* Subtle atmospheric FairPay Navy halo easing sidebar into workspace */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 -right-3 rounded-[22px] bg-gradient-to-r from-[#0C2B7E]/10 via-[#1562FF]/5 to-transparent blur-xl"
      />

      {/* Modern Architectural Floating Glass Sidebar (Authentic FairPay Navy #0C2B7E + #1562FF Mesh) */}
      <div className="fairpay-sidebar-mesh relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-white/[0.12] text-white backdrop-blur-xl shadow-[0_2px_4px_-1px_rgba(8,22,66,0.12),0_12px_26px_-8px_rgba(12,43,126,0.26),0_26px_48px_-16px_rgba(12,43,126,0.24),10px_14px_34px_-14px_rgba(21,98,255,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] select-none">
        {/* Ultra-fine top-edge specular hairline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/32 to-transparent"
        />

        <div className="relative z-10 flex h-full flex-col overflow-y-auto scrollbar-navy">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-5 pt-6 pb-6">
            <button
              type="button"
              onClick={onBackToWelcome}
              title="Kembali ke halaman pembuka FairPay"
              className="flex items-center gap-3 text-left rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer"
            >
              <BrandLogo className="w-[36px] h-[29px] text-white shrink-0" />
              <div className="min-w-0">
                <div className="font-display text-[18.5px] font-bold tracking-tight leading-tight text-white">
                  FairPay
                </div>
                <div className="font-mono text-[9.5px] font-medium tracking-[0.14em] text-[#95AFE4] uppercase mt-0.5">
                  HR EQUITY AUDITOR
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Tutup menu navigasi"
              className="lg:hidden rounded-xl p-2 text-white/75 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Analysis Navigation */}
          <div className="px-3.5">
            <div className="px-2.5 pb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-[#83A0DC] uppercase">
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
                    className={`group relative flex w-full items-center justify-between gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-[13.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer ${
                      isActive
                        ? 'font-semibold text-white'
                        : 'font-medium text-[#D6E2FA] hover:bg-white/[0.07] hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId={`sidebar-active-glass-${instance}`}
                        transition={{ type: 'spring', stiffness: 440, damping: 36 }}
                        className="pointer-events-none absolute inset-0 rounded-[12px] bg-gradient-to-r from-[#1562FF] via-[#1562FF] to-[#1E6CFF]/90 ring-1 ring-white/[0.14] shadow-[0_6px_16px_-4px_rgba(21,98,255,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute left-1 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-white/90"
                        />
                      </motion.span>
                    )}
                    <span className="relative z-10 flex items-center gap-3 min-w-0 pl-0.5">
                      <Icon
                        className={`h-[17px] w-[17px] shrink-0 transition-colors duration-150 ${
                          isActive
                            ? 'text-white'
                            : 'text-[#96B1E8] group-hover:text-white'
                        }`}
                        strokeWidth={isActive ? 2.1 : 1.85}
                      />
                      <span className="leading-snug">{item.label}</span>
                    </span>
                    {item.badge && (
                      <span
                        className={`relative z-10 shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[9.5px] font-semibold tracking-wider ${
                          isActive
                            ? 'bg-white/18 text-white'
                            : 'bg-white/[0.09] text-[#C7D8FC]'
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

          <div className="mx-5 my-6 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />

          {/* Data Source Controls */}
          <div className="px-4.5 space-y-3.5">
            <div className="font-mono text-[10px] font-medium tracking-[0.14em] text-[#83A0DC] uppercase">
              SUMBER DATA
            </div>

            <div>
              <label
                htmlFor={instance === 'desktop' ? 'dataset-selector' : 'dataset-selector-mobile'}
                className="block text-[12px] font-medium text-[#C5D6F8] mb-1.5"
              >
                Dataset aktif
              </label>
              <div className="relative">
                <select
                  id={instance === 'desktop' ? 'dataset-selector' : 'dataset-selector-mobile'}
                  value={activeDataset ? activeDataset.key : 'none'}
                  onChange={(e) => onSelectDataset(e.target.value as DatasetKey)}
                  className="w-full appearance-none rounded-xl border border-white/[0.12] bg-white/[0.07] px-3.5 py-2.5 pr-9 text-[13px] font-medium text-white backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:bg-white/[0.11] hover:border-white/22 focus:border-[#60A5FA] focus:outline-none cursor-pointer"
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
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AEBFEC]"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/22 bg-white/[0.03] px-3 py-2.5 text-[13px] font-medium text-[#DCE6FC] transition-all hover:border-white/42 hover:bg-white/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 cursor-pointer"
            >
              <Upload className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Unggah CSV / Excel</span>
            </button>

            {/* Dataset Status */}
            {activeDataset ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5">
                <ShieldCheck className="h-[16px] w-[16px] shrink-0 text-[#34D399] mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-[#34D399] leading-tight">
                    Data siap dianalisis
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#9FB6E6] tabular-nums">
                    {formatIntegerId(validRowCount)} baris · {columnCount} kolom
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5">
                <CircleDashed className="h-[16px] w-[16px] shrink-0 text-[#96B0E5] mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-[#D6E3FC] leading-tight">
                    Belum ada dataset
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#8FA8DE]">
                    Pilih atau unggah file data
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Academic Footer */}
          <div className="mt-auto px-5 pb-5 pt-6">
            <div className="mb-4 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
            <div className="text-[12.5px] font-bold text-white leading-tight">
              Kelompok Gemini Stats 5A
            </div>
            <div className="mt-0.5 text-[11px] text-[#91A9DE]">Probabilitas &amp; Statistika</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky 3D Floating Glass Sidebar */}
      <aside className="hidden lg:block lg:w-[258px] xl:w-[274px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:py-3.5 lg:pl-3.5 lg:pr-2.5 z-30">
        {renderSidebarBody('desktop')}
      </aside>

      {/* Mobile Floating 3D Glass Drawer Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 flex lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi FairPay"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#08153A]/45 backdrop-blur-[3px]"
              onClick={onCloseMobile}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%', opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0.6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex h-full w-[282px] max-w-[85vw] flex-col p-3"
            >
              {renderSidebarBody('mobile')}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
