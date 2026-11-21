import { useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Users,
  Wallet,
} from 'lucide-react';
import type { AnalysisBundle, TabId } from '../../types/fairpay';
import {
  formatDecimalComma,
  formatIntegerId,
  formatPercentComma,
  formatSalaryK,
  formatSalaryKWhole,
} from '../../lib/format';

interface RingkasanTabProps {
  analysis: AnalysisBundle;
  periodLabel: string;
  departmentLabel: string;
  groupLabel: string;
  onNavigateTab: (tab: TabId) => void;
  onOpenRawData: () => void;
}

export function RingkasanTab({
  analysis,
  periodLabel,
  departmentLabel,
  groupLabel,
  onNavigateTab,
  onOpenRawData,
}: RingkasanTabProps) {
  const { kpi, departments, normalityRaw, homogeneity, linearity } = analysis;
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

  // Axis ceiling rounded nicely to nearest $25k above highest department mean (min $100k)
  const highestDeptMean = Math.max(100000, ...departments.map((d) => d.meanSalary));
  const axisMax = Math.ceil(highestDeptMean / 25000) * 25000;
  const axisTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => axisMax * t);

  const isEquityWarning = !normalityRaw.isNormal || !homogeneity.isHomogeneous || kpi.groupGapPct >= 5;
  const meanAboveMedian = kpi.meanVsMedianPct >= 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Hero Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
            RINGKASAN AUDIT
          </div>
          <h1 className="mt-2 text-[28px] sm:text-[34px] font-bold tracking-[-0.018em] leading-[1.15] text-[#0B1221] [text-wrap:balance]">
            Potret kompensasi, tanpa bias.
          </h1>
          <p className="mt-2 text-[14.5px] text-[#64748B] leading-relaxed">
            Baca kondisi struktur gaji sebelum masuk ke pengujian statistik formal.
          </p>
        </div>

        <div className="border-t border-[#EAEEF5] pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 shrink-0">
          <div className="text-[12px] text-[#94A3B8]">Periode data</div>
          <div className="mt-1 text-[13.5px] font-semibold text-[#1E293B] whitespace-nowrap">
            {periodLabel}
          </div>
        </div>
      </div>

      {/* 4 KPI Strip */}
      <section
        aria-label="Indikator utama kompensasi"
        className="grid grid-cols-1 divide-y divide-[#EEF1F6] border-y border-[#F1F4F9] py-2 sm:grid-cols-2 sm:divide-y-0 sm:gap-y-5 lg:grid-cols-4 lg:divide-x lg:divide-[#EAEEF5] lg:border-y-0 lg:py-1"
      >
        {/* KPI 1 */}
        <div className="flex items-start gap-3.5 py-4 lg:py-2 lg:pr-6">
          <div className="mt-1 text-[#1562FF] shrink-0">
            <Users className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-[#64748B]">Total karyawan</div>
            <div className="mt-1 font-mono text-[24px] sm:text-[26px] font-bold tracking-tight text-[#0F172A] tabular-nums">
              {formatIntegerId(kpi.validRows)}
            </div>
            <div className="mt-0.5 text-[12px] text-[#94A3B8] tabular-nums">
              {kpi.droppedRows === 0
                ? '100% data valid'
                : `${kpi.validPercent.toFixed(1)}% valid (${kpi.droppedRows} kosong dihapus)`}
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="flex items-start gap-3.5 py-4 lg:py-2 lg:px-6">
          <div className="mt-1 text-[#1562FF] shrink-0">
            <Wallet className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-[#64748B]">Rata-rata gaji</div>
            <div className="mt-1 font-mono text-[24px] sm:text-[26px] font-bold tracking-tight text-[#0F172A] tabular-nums">
              {formatSalaryK(kpi.meanSalary, 1)}
            </div>
            <div className="mt-0.5 text-[12px] text-[#94A3B8] tabular-nums">
              {meanAboveMedian ? '↑' : '↓'} {formatPercentComma(Math.abs(kpi.meanVsMedianPct), 1)} dari median
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="flex items-start gap-3.5 py-4 lg:py-2 lg:px-6">
          <div className="mt-1 text-[#1562FF] shrink-0">
            <BarChart3 className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-[#64748B]">Median gaji</div>
            <div className="mt-1 font-mono text-[24px] sm:text-[26px] font-bold tracking-tight text-[#0F172A] tabular-nums">
              {formatSalaryK(kpi.medianSalary, 1)}
            </div>
            <div className="mt-0.5 text-[12px] text-[#94A3B8]">Posisi tengah data</div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="flex items-start gap-3.5 py-4 lg:py-2 lg:pl-6">
          <div className="mt-1 text-[#1562FF] shrink-0">
            <ArrowLeftRight className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-[#64748B]">Kesenjangan grup</div>
            <div className="mt-1 font-mono text-[24px] sm:text-[26px] font-bold tracking-tight text-[#0F172A] tabular-nums">
              {formatPercentComma(kpi.groupGapPct, 1)}
            </div>
            <div
              className={`mt-0.5 text-[12px] font-medium ${
                kpi.groupGapPct >= 5 ? 'text-[#C25E00]' : 'text-[#059669]'
              }`}
            >
              {kpi.groupGapPct >= 5 ? 'Perlu ditinjau' : 'Dalam batas wajar'}
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Bento Row: Department Bar Chart + Dark Navy Temuan Utama */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.68fr_1fr] items-stretch">
        {/* Left: Department Distribution Card */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#EEF1F7] bg-white p-6 sm:p-7 shadow-[0_2px_20px_rgba(15,23,42,0.035)]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
                  DISTRIBUSI
                </div>
                <h2 className="mt-1.5 text-[19px] sm:text-[21px] font-bold tracking-tight text-[#0F172A]">
                  Gaji rata-rata per {departmentLabel.toLowerCase() === 'dept' ? 'divisi' : departmentLabel}
                </h2>
              </div>
              <button
                type="button"
                onClick={onOpenRawData}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1562FF] hover:text-[#0E51DB] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:underline"
              >
                <span>Lihat data mentah</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="mt-7 space-y-4">
              {departments.length === 0 ? (
                <div className="rounded-xl bg-[#F8F9FC] p-8 text-center text-[13.5px] text-[#64748B]">
                  Tidak ada data valid pada filter saat ini.
                </div>
              ) : (
                departments.slice(0, 7).map((dept) => {
                  const pct = Math.max(14, Math.min(100, (dept.meanSalary / axisMax) * 100));
                  const isHovered = hoveredDept === dept.department;
                  return (
                    <div
                      key={dept.department}
                      onMouseEnter={() => setHoveredDept(dept.department)}
                      onMouseLeave={() => setHoveredDept(null)}
                      className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr_64px] items-center gap-3 sm:gap-4"
                    >
                      <div className="text-[13px] font-medium text-[#475569] leading-tight pr-1">
                        {dept.department}
                      </div>

                      <div className="relative flex items-center">
                        <div className="h-[26px] w-full rounded-[4px] bg-[#F8FAFC] overflow-hidden">
                          <div
                            className="flex h-full items-center justify-end rounded-[4px] px-2.5 transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: dept.color,
                              opacity: hoveredDept && !isHovered ? 0.72 : 1,
                            }}
                          >
                            <span className="font-mono text-[11.5px] font-semibold text-white tabular-nums whitespace-nowrap">
                              {formatSalaryKWhole(dept.meanSalary)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:block text-right font-mono text-[12px] text-[#94A3B8] tabular-nums whitespace-nowrap">
                        {formatIntegerId(dept.count)} org
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* X-Axis Ticks */}
          {departments.length > 0 && (
            <div className="mt-6 grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr_64px] gap-3 sm:gap-4">
              <div />
              <div className="flex items-center justify-between font-mono text-[11px] text-[#94A3B8] tabular-nums">
                {axisTicks.map((tick, idx) => (
                  <span key={idx}>{tick === 0 ? '$0' : formatSalaryKWhole(tick)}</span>
                ))}
              </div>
              <div className="hidden sm:block" />
            </div>
          )}
        </section>

        {/* Right: Dark Navy Temuan Utama Card */}
        <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#0C2B7E] p-6 sm:p-7 text-white shadow-[0_8px_28px_rgba(12,43,126,0.18)]">
          {/* Subtle decorative circular arc matching reference */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-14 h-48 w-48 rounded-full border-[26px] border-white/[0.08]"
          />

          <div className="relative z-10">
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] text-[#9EB7EC] uppercase">
              TEMUAN UTAMA
            </div>
            <h2 className="mt-2.5 text-[23px] sm:text-[25px] font-bold tracking-tight leading-[1.22] text-white [text-wrap:balance]">
              {isEquityWarning
                ? 'Struktur upah belum sepenuhnya setara.'
                : 'Struktur upah sudah relatif setara.'}
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[#C7D7F8]">
              {isEquityWarning
                ? 'Varians kelompok dan distribusi gaji menunjukkan sinyal yang perlu diuji lebih lanjut.'
                : 'Sebaran gaji dan konsistensi varians antar kelompok berada pada rentang yang sehat.'}
            </p>

            {/* Numbered Findings 01 & 02 */}
            <div className="mt-6 divide-y divide-white/15 border-t border-white/15">
              <div className="flex items-start gap-3.5 py-4">
                <span className="font-mono text-[12px] font-semibold text-[#89A5E3] mt-0.5">
                  01
                </span>
                <div>
                  <div className="text-[13.5px] font-bold text-white leading-snug">
                    {kpi.skewness > 0.2
                      ? 'Distribusi miring ke kanan'
                      : kpi.skewness < -0.2
                        ? 'Distribusi miring ke kiri'
                        : 'Distribusi relatif simetris'}
                  </div>
                  <p className="mt-1 text-[12.5px] text-[#B7CAF4] leading-relaxed">
                    {kpi.skewness > 0.2
                      ? 'Segelintir gaji tinggi menarik rata-rata naik di atas median.'
                      : 'Rata-rata dan median gaji berada pada jarak yang proporsional.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 py-4">
                <span className="font-mono text-[12px] font-semibold text-[#89A5E3] mt-0.5">
                  02
                </span>
                <div>
                  <div className="text-[13.5px] font-bold text-white leading-snug">
                    {homogeneity.isHomogeneous
                      ? 'Varians antarkelompok konsisten'
                      : 'Varians antarkelompok berbeda'}
                  </div>
                  <p className="mt-1 text-[12.5px] text-[#B7CAF4] leading-relaxed">
                    Rentang gaji {kpi.widerVarianceGroup.toLowerCase()} sebesar{' '}
                    {formatDecimalComma(kpi.varianceRatio, 1)}× lebih lebar
                    {groupLabel.toLowerCase() !== 'gender' ? ` (${groupLabel})` : ''}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('linearitas')}
            className="relative z-10 mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-[13.5px] font-bold text-[#0C2B7E] shadow-sm transition-all hover:bg-[#F1F5FF] active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>Buka simulator kebijakan</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </div>

      {/* Bottom Diagnosis Strip: Tiga Mesin Diagnosis */}
      <section
        aria-label="Status tiga mesin diagnosis statistik"
        className="rounded-2xl bg-[#F8F9FC] px-6 py-5 sm:px-7 sm:py-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="shrink-0 lg:pr-6">
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
              STATUS PENGUJIAN
            </div>
            <h2 className="mt-1 text-[18px] font-bold tracking-tight text-[#0F172A]">
              Tiga mesin diagnosis
            </h2>
          </div>

          <div className="grid flex-1 grid-cols-1 divide-y divide-[#E7EBF4] sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
            {/* Test 1: Shapiro-Wilk */}
            <button
              type="button"
              onClick={() => onNavigateTab('normalitas')}
              className="group flex flex-col items-start py-3.5 text-left transition-colors sm:px-5 sm:py-1 first:pt-0 sm:first:pl-5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] rounded-lg"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-[13.5px] font-bold text-[#0F172A] group-hover:text-[#1562FF] transition-colors">
                  Shapiro–Wilk
                </span>
                <span className="font-mono text-[11.5px] text-[#94A3B8] tabular-nums">
                  W {formatDecimalComma(normalityRaw.wStatistic, 3)}
                </span>
              </div>
              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${
                  normalityRaw.isNormal
                    ? 'bg-[#E6F8F1] text-[#059669]'
                    : 'bg-[#FDECEC] text-[#DC2626]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    normalityRaw.isNormal ? 'bg-[#059669]' : 'bg-[#DC2626]'
                  }`}
                  aria-hidden="true"
                />
                {normalityRaw.isNormal ? 'Normal' : 'Tidak normal'}
              </span>
            </button>

            {/* Test 2: Levene's Test */}
            <button
              type="button"
              onClick={() => onNavigateTab('homogenitas')}
              className="group flex flex-col items-start py-3.5 text-left transition-colors sm:px-5 sm:py-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] rounded-lg"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-[13.5px] font-bold text-[#0F172A] group-hover:text-[#1562FF] transition-colors">
                  Levene&apos;s Test
                </span>
                <span className="font-mono text-[11.5px] text-[#94A3B8] tabular-nums">
                  F {formatDecimalComma(homogeneity.fStatistic, 3)}
                </span>
              </div>
              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${
                  homogeneity.isHomogeneous
                    ? 'bg-[#E6F8F1] text-[#059669]'
                    : 'bg-[#FDECEC] text-[#DC2626]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    homogeneity.isHomogeneous ? 'bg-[#059669]' : 'bg-[#DC2626]'
                  }`}
                  aria-hidden="true"
                />
                {homogeneity.isHomogeneous ? 'Homogen' : 'Heterogen'}
              </span>
            </button>

            {/* Test 3: Uji Linearitas */}
            <button
              type="button"
              onClick={() => onNavigateTab('linearitas')}
              className="group flex flex-col items-start py-3.5 text-left transition-colors sm:px-5 sm:py-1 last:pb-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] rounded-lg"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-[13.5px] font-bold text-[#0F172A] group-hover:text-[#1562FF] transition-colors">
                  Uji Linearitas
                </span>
                <span className="font-mono text-[11.5px] text-[#94A3B8] tabular-nums">
                  R² {formatDecimalComma(linearity.rSquaredLinear, 3)}
                </span>
              </div>
              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${
                  linearity.isLinear
                    ? 'bg-[#E6F8F1] text-[#059669]'
                    : 'bg-[#FEF3C7] text-[#B45309]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    linearity.isLinear ? 'bg-[#059669]' : 'bg-[#B45309]'
                  }`}
                  aria-hidden="true"
                />
                {linearity.isLinear ? 'Cukup linear' : 'Terindikasi plateau'}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
