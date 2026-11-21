import { useState } from 'react';
import { Check, RotateCcw, ShieldCheck } from 'lucide-react';
import type { CandidateOfferResult, LinearityResult, SimulationResult } from '../../types/fairpay';
import {
  formatBudgetK,
  formatDecimalComma,
  formatPercentComma,
  formatPercentDot,
  formatPValueCompact,
  formatPValueFull,
  formatSalaryK,
  formatSalaryKWhole,
} from '../../lib/format';

interface LinearitasSimulasiTabProps {
  subsidyPct: number;
  loyaltyPct: number;
  onChangeSubsidy: (v: number) => void;
  onChangeLoyalty: (v: number) => void;
  onResetSimulation: () => void;
  simulation: SimulationResult;
  linearity: LinearityResult;
  candidateYears: number;
  onChangeCandidateYears: (v: number) => void;
  candidateOffer: CandidateOfferResult;
  experienceLabel: string;
}

export function LinearitasSimulasiTab({
  subsidyPct,
  loyaltyPct,
  onChangeSubsidy,
  onChangeLoyalty,
  onResetSimulation,
  simulation,
  linearity,
  candidateYears,
  onChangeCandidateYears,
  candidateOffer,
  experienceLabel,
}: LinearitasSimulasiTabProps) {
  const [hoveredPt, setHoveredPt] = useState<number | null>(null);

  const subProgress = (subsidyPct / 30) * 100;
  const loyProgress = (loyaltyPct / 20) * 100;

  // Scatterplot + Linear vs Quadratic Regression SVG geometry (PRD 4.5 Bagian A)
  const scW = 760;
  const scH = 270;
  const scPad = { top: 18, right: 24, bottom: 40, left: 60 };
  const scPlotW = scW - scPad.left - scPad.right;
  const scPlotH = scH - scPad.top - scPad.bottom;

  const allYs = [
    ...linearity.scatterPoints.map((p) => p.y),
    ...linearity.curvePoints.flatMap((c) => [c.yLinear, c.yQuadratic]),
  ];
  const yMin = Math.max(0, Math.floor((Math.min(...allYs, 30000) / 20000)) * 20000);
  const yMax = Math.max(yMin + 40000, Math.ceil((Math.max(...allYs, 120000) / 20000)) * 20000);
  const xMin = Math.max(0, Math.floor(linearity.xMin));
  const xMax = Math.max(xMin + 1, Math.ceil(linearity.xMax));

  const mapScX = (x: number) => scPad.left + ((x - xMin) / (xMax - xMin)) * scPlotW;
  const mapScY = (y: number) => scPad.top + scPlotH - ((y - yMin) / (yMax - yMin)) * scPlotH;

  const linearPath = linearity.curvePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapScX(p.x).toFixed(1)} ${mapScY(p.yLinear).toFixed(1)}`)
    .join(' ');
  const quadPath = linearity.curvePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapScX(p.x).toFixed(1)} ${mapScY(p.yQuadratic).toFixed(1)}`)
    .join(' ');

  const scYTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + (yMax - yMin) * t);
  const scXTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(xMin + (xMax - xMin) * t));

  const isBothPassed = simulation.normalityPassed && simulation.homogeneityPassed;
  const expHumanLabel = /yearsexperience|years of experience|experience/i.test(experienceLabel)
    ? 'masa kerja'
    : /seniority/i.test(experienceLabel)
      ? 'tingkat senioritas'
      : experienceLabel;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
            UJI 03 · LABORATORIUM KEBIJAKAN
          </div>
          <h1 className="mt-2 text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] leading-[1.16] text-[#0B1221] [text-wrap:balance]">
            Uji kebijakan sebelum diterapkan.
          </h1>
          <p className="mt-2 text-[14.5px] text-[#64748B] leading-relaxed">
            Geser parameter untuk melihat dampak penyesuaian terhadap keadilan gaji secara langsung.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start sm:self-end rounded-full bg-[#E6F8F1] px-3.5 py-2 text-[12.5px] font-semibold text-[#059669] whitespace-nowrap shrink-0">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Data asli tetap aman</span>
        </div>
      </div>

      {/* Main 2-Column Simulator Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.45fr] items-stretch">
        {/* Left: Parameter Simulasi */}
        <section className="flex flex-col justify-between rounded-2xl bg-[#F8F9FC] p-6 sm:p-7">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
                  PARAMETER SIMULASI
                </div>
                <h2 className="mt-1.5 text-[20px] font-bold tracking-tight text-[#0F172A]">
                  Rancang skenario
                </h2>
              </div>
              {(subsidyPct > 0 || loyaltyPct > 0) && (
                <button
                  type="button"
                  onClick={onResetSimulation}
                  aria-label="Reset parameter simulasi"
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#64748B] hover:bg-white hover:text-[#0F172A] transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Sliders */}
            <div className="mt-7 space-y-7">
              {/* Slider 1: Subsidi gaji bawah */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <label
                    htmlFor="slider-subsidy"
                    className="text-[14px] font-semibold text-[#0F172A]"
                  >
                    Subsidi gaji bawah
                  </label>
                  <span className="font-mono text-[16px] font-semibold text-[#1562FF] tabular-nums">
                    {subsidyPct}%
                  </span>
                </div>
                <input
                  id="slider-subsidy"
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={subsidyPct}
                  onChange={(e) => onChangeSubsidy(Number(e.target.value))}
                  aria-valuetext={`${subsidyPct} persen`}
                  className="fairpay-slider"
                  style={{
                    background: `linear-gradient(to right, #1562FF 0%, #1562FF ${subProgress}%, #D5DCE8 ${subProgress}%, #D5DCE8 100%)`,
                  }}
                />
                <p className="mt-2.5 text-[12.5px] text-[#94A3B8]">
                  Menaikkan gaji karyawan di bawah median.
                </p>
              </div>

              {/* Slider 2: Bonus loyalitas pengalaman */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <label
                    htmlFor="slider-loyalty"
                    className="text-[14px] font-semibold text-[#0F172A]"
                  >
                    Bonus loyalitas pengalaman
                  </label>
                  <span className="font-mono text-[16px] font-semibold text-[#1562FF] tabular-nums">
                    {loyaltyPct}%
                  </span>
                </div>
                <input
                  id="slider-loyalty"
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={loyaltyPct}
                  onChange={(e) => onChangeLoyalty(Number(e.target.value))}
                  aria-valuetext={`${loyaltyPct} persen`}
                  className="fairpay-slider"
                  style={{
                    background: `linear-gradient(to right, #1562FF 0%, #1562FF ${loyProgress}%, #D5DCE8 ${loyProgress}%, #D5DCE8 100%)`,
                  }}
                />
                <p className="mt-2.5 text-[12.5px] text-[#94A3B8]">
                  Tambahan bertahap berdasarkan masa kerja.
                </p>
              </div>
            </div>
          </div>

          {/* Budget Impact Readout */}
          <div className="mt-8 border-t border-[#E6EAF2] pt-5">
            <div className="text-[12.5px] font-medium text-[#64748B]">
              Estimasi tambahan anggaran
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-[28px] sm:text-[30px] font-bold tracking-tight text-[#0F172A] tabular-nums">
                {formatBudgetK(simulation.additionalBudget)}
              </span>
              <span className="text-[13px] text-[#64748B]">/tahun</span>
            </div>
            <div className="mt-1 text-[12.5px] font-medium text-[#C25E00] tabular-nums">
              +{formatPercentDot(simulation.budgetPctIncrease, 1)} dari payroll saat ini
            </div>
          </div>
        </section>

        {/* Right: Hasil Langsung (Before vs After) */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#EEF1F7] bg-white p-6 sm:p-7 shadow-[0_2px_20px_rgba(15,23,42,0.035)]">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
                  HASIL LANGSUNG
                </div>
                <h2 className="mt-1.5 text-[20px] font-bold tracking-tight text-[#0F172A]">
                  Sebelum vs sesudah
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-[#1562FF] uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1562FF]" aria-hidden="true" />
                LIVE
              </span>
            </div>

            {/* Comparison Table */}
            <div className="mt-6">
              <div className="grid grid-cols-[1fr_76px_84px] sm:grid-cols-[1fr_92px_96px] items-center pb-3 border-b border-[#EEF1F7] font-mono text-[11px] font-medium tracking-wider text-[#94A3B8] uppercase">
                <span />
                <span className="text-right">SEBELUM</span>
                <span className="text-right">SESUDAH</span>
              </div>

              <div className="divide-y divide-[#F1F4F9]">
                {/* Row 1: Normalitas */}
                <div className="grid grid-cols-[1fr_76px_84px] sm:grid-cols-[1fr_92px_96px] items-center py-4 gap-2">
                  <div>
                    <div className="text-[14.5px] font-bold text-[#0F172A]">Normalitas</div>
                    <div className="text-[12px] text-[#94A3B8]">Shapiro-Wilk · p-value</div>
                  </div>
                  <div className="text-right font-mono text-[14.5px] text-[#94A3B8] line-through tabular-nums">
                    {formatPValueCompact(simulation.before.shapiroP)}
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-mono text-[16px] font-semibold tabular-nums ${
                        simulation.normalityPassed ? 'text-[#059669]' : 'text-[#B45309]'
                      }`}
                    >
                      {formatPValueFull(simulation.after.shapiroP, false)}
                    </div>
                    <div
                      className={`text-[12px] font-semibold ${
                        simulation.normalityPassed ? 'text-[#059669]' : 'text-[#B45309]'
                      }`}
                    >
                      {simulation.normalityPassed ? 'Lolos' : 'Belum'}
                    </div>
                  </div>
                </div>

                {/* Row 2: Homogenitas */}
                <div className="grid grid-cols-[1fr_76px_84px] sm:grid-cols-[1fr_92px_96px] items-center py-4 gap-2">
                  <div>
                    <div className="text-[14.5px] font-bold text-[#0F172A]">Homogenitas</div>
                    <div className="text-[12px] text-[#94A3B8]">Levene · p-value</div>
                  </div>
                  <div className="text-right font-mono text-[14.5px] text-[#94A3B8] line-through tabular-nums">
                    {formatPValueCompact(simulation.before.leveneP)}
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-mono text-[16px] font-semibold tabular-nums ${
                        simulation.homogeneityPassed ? 'text-[#059669]' : 'text-[#B45309]'
                      }`}
                    >
                      {formatPValueFull(simulation.after.leveneP, false)}
                    </div>
                    <div
                      className={`text-[12px] font-semibold ${
                        simulation.homogeneityPassed ? 'text-[#059669]' : 'text-[#B45309]'
                      }`}
                    >
                      {simulation.homogeneityPassed ? 'Lolos' : 'Belum'}
                    </div>
                  </div>
                </div>

                {/* Row 3: Kesenjangan gaji */}
                <div className="grid grid-cols-[1fr_76px_84px] sm:grid-cols-[1fr_92px_96px] items-center py-4 gap-2">
                  <div>
                    <div className="text-[14.5px] font-bold text-[#0F172A]">Kesenjangan gaji</div>
                    <div className="text-[12px] text-[#94A3B8]">Selisih median kelompok</div>
                  </div>
                  <div className="text-right font-mono text-[14.5px] text-[#94A3B8] line-through tabular-nums">
                    {formatPercentComma(simulation.before.gapPct, 1)}
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-mono text-[16px] font-semibold tabular-nums ${
                        simulation.gapPassed ? 'text-[#059669]' : 'text-[#B45309]'
                      }`}
                    >
                      {formatPercentDot(simulation.after.gapPct, 1)}
                    </div>
                    <div
                      className={`text-[12px] font-semibold ${
                        simulation.gapPassed ? 'text-[#059669]' : 'text-[#B45309]'
                      }`}
                    >
                      {simulation.gapPassed ? 'Lolos' : 'Belum'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Callout matching both screenshots */}
          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#EEF4FF] px-4 py-3.5 text-[13px] leading-relaxed text-[#334155]">
            <Check className="h-4.5 w-4.5 shrink-0 text-[#1562FF] mt-0.5" strokeWidth={2.4} />
            <p>
              <strong className="font-bold text-[#1562FF]">
                {isBothPassed
                  ? 'Skenario makin mendekati ambang adil.'
                  : 'Skenario makin mendekati ambang adil.'}
              </strong>{' '}
              {isBothPassed
                ? 'Kedua asumsi statistik kini terpenuhi.'
                : 'Tingkatkan parameter hingga kedua p-value melewati 0,05.'}
            </p>
          </div>
        </section>
      </div>

      {/* Kalkulator Tawaran Card (PRD Section 4.5 Bagian C) */}
      <section className="rounded-2xl bg-[#F8F9FC] p-6 sm:p-7">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_0.9fr_1fr] lg:items-center">
          <div>
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
              KALKULATOR TAWARAN
            </div>
            <h2 className="mt-1.5 text-[20px] font-bold tracking-tight text-[#0F172A]">
              Estimasi gaji karyawan baru
            </h2>
            <p className="mt-1.5 text-[13.5px] text-[#64748B] leading-relaxed">
              Prediksi berbasis garis regresi agar tawaran baru tidak merusak struktur keadilan.
            </p>
          </div>

          <div>
            <label
              htmlFor="candidate-years-input"
              className="block text-[12.5px] font-medium text-[#64748B] mb-2"
            >
              Masa kerja kandidat
            </label>
            <div className="flex items-center justify-between rounded-xl bg-[#EEF1F6] px-4 py-3 focus-within:ring-2 focus-within:ring-[#1562FF]">
              <input
                id="candidate-years-input"
                type="number"
                min={0}
                max={40}
                step={0.5}
                value={candidateYears}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onChangeCandidateYears(Number.isNaN(v) ? 0 : Math.max(0, Math.min(40, v)));
                }}
                className="w-full bg-transparent font-mono text-[16px] font-semibold text-[#0F172A] focus:outline-none tabular-nums"
              />
              <span className="ml-2 text-[13px] font-medium text-[#64748B] shrink-0">tahun</span>
            </div>
          </div>

          <div className="border-t border-[#E6EAF2] pt-5 lg:border-t-0 lg:border-l lg:pl-7 lg:pt-0">
            <div className="text-[12.5px] font-medium text-[#64748B]">Rentang tawaran wajar</div>
            <div className="mt-1.5 font-mono text-[20px] sm:text-[22px] font-bold tracking-tight text-[#0C2B7E] tabular-nums whitespace-nowrap">
              {formatSalaryK(candidateOffer.lowerBound, 1)} &ndash;{' '}
              {formatSalaryK(candidateOffer.upperBound, 1)}
            </div>
            <div className="mt-1 text-[12.5px] text-[#94A3B8] tabular-nums">
              Prediksi tengah {formatSalaryK(candidateOffer.predictedSalary, 1)}
            </div>
          </div>
        </div>
      </section>

      {/* Uji Linearitas Regresi Card (PRD Section 4.5 Bagian A: Scatterplot Linear vs Quadratic + Deviation Test) */}
      <section className="rounded-2xl border border-[#EEF1F7] bg-white p-6 sm:p-7 shadow-[0_2px_20px_rgba(15,23,42,0.035)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
              UJI LINEARITAS REGRESI
            </div>
            <h2 className="mt-1.5 text-[19px] sm:text-[21px] font-bold tracking-tight text-[#0F172A]">
              Hubungan gaji vs {expHumanLabel} &amp; deteksi titik jenuh karir
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[12px] font-medium text-[#475569]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-[#1562FF]" aria-hidden="true" />
              Regresi Linear
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 border-t-2 border-dashed border-[#7C3AED]"
                aria-hidden="true"
              />
              Kurva Kuadratik
            </span>
          </div>
        </div>

        {/* Mini Metrics Row */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl bg-[#F8F9FC] p-4">
          <div>
            <div className="text-[11.5px] text-[#64748B]">R² Linear</div>
            <div className="mt-0.5 font-mono text-[18px] font-bold text-[#0F172A] tabular-nums">
              {formatDecimalComma(linearity.rSquaredLinear, 3)}
            </div>
          </div>
          <div>
            <div className="text-[11.5px] text-[#64748B]">R² Kuadratik</div>
            <div className="mt-0.5 font-mono text-[18px] font-bold text-[#0F172A] tabular-nums">
              {formatDecimalComma(linearity.rSquaredQuadratic, 3)}
            </div>
          </div>
          <div>
            <div className="text-[11.5px] text-[#64748B]">F-Deviasi Linearitas</div>
            <div className="mt-0.5 font-mono text-[18px] font-bold text-[#0F172A] tabular-nums">
              {formatDecimalComma(linearity.fDeviation, 3)}
            </div>
          </div>
          <div>
            <div className="text-[11.5px] text-[#64748B]">Status Kelurusan</div>
            <div className="mt-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                  linearity.hasCareerPlateau
                    ? 'bg-[#FEF3C7] text-[#B45309]'
                    : 'bg-[#E6F8F1] text-[#059669]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    linearity.hasCareerPlateau ? 'bg-[#B45309]' : 'bg-[#059669]'
                  }`}
                  aria-hidden="true"
                />
                {linearity.hasCareerPlateau ? 'Career plateau' : 'Cukup linear'}
              </span>
            </div>
          </div>
        </div>

        {/* Scatterplot SVG */}
        <div className="relative mt-5">
          {hoveredPt !== null && linearity.scatterPoints[hoveredPt] && (
            <div className="pointer-events-none absolute right-2 top-0 z-10 rounded-xl bg-[#0F172A] px-3 py-2 text-[11.5px] text-white shadow-lg font-mono tabular-nums">
              <div>
                Pengalaman: {linearity.scatterPoints[hoveredPt].x.toFixed(1)} thn
              </div>
              <div className="text-[#93C5FD]">
                Gaji: {formatSalaryK(linearity.scatterPoints[hoveredPt].y, 1)}
              </div>
              <div className="text-[#CBD5E1] font-sans text-[11px]">
                {linearity.scatterPoints[hoveredPt].group} ·{' '}
                {linearity.scatterPoints[hoveredPt].department}
              </div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${scW} ${scH}`}
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label="Scatterplot hubungan gaji dan pengalaman dengan garis regresi linear dan kuadratik"
          >
            {/* Horizontal gridlines */}
            {scYTicks.map((tick, idx) => {
              const y = mapScY(tick);
              return (
                <g key={idx}>
                  <line
                    x1={scPad.left}
                    y1={y}
                    x2={scW - scPad.right}
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                  <text
                    x={scPad.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-[#94A3B8] font-mono text-[11px]"
                  >
                    {formatSalaryKWhole(tick)}
                  </text>
                </g>
              );
            })}

            {/* X-axis ticks */}
            {scXTicks.map((tick, idx) => {
              const x = mapScX(tick);
              return (
                <text
                  key={idx}
                  x={x}
                  y={scH - 12}
                  textAnchor="middle"
                  className="fill-[#94A3B8] font-mono text-[11px]"
                >
                  {tick} thn
                </text>
              );
            })}

            {/* Scatter Dots */}
            {linearity.scatterPoints.map((pt, idx) => (
              <circle
                key={idx}
                cx={mapScX(pt.x)}
                cy={mapScY(pt.y)}
                r={hoveredPt === idx ? 5 : 3}
                fill={pt.group === 'Wanita' ? '#8B5CF6' : '#3B82F6'}
                fillOpacity={hoveredPt === idx ? 0.95 : 0.45}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredPt(idx)}
                onMouseLeave={() => setHoveredPt(null)}
              />
            ))}

            {/* Quadratic Regression Curve */}
            {quadPath && (
              <path
                d={quadPath}
                fill="none"
                stroke="#7C3AED"
                strokeWidth="2.2"
                strokeDasharray="6 4"
                className="pointer-events-none"
              />
            )}

            {/* Linear Regression Line */}
            {linearPath && (
              <path
                d={linearPath}
                fill="none"
                stroke="#1562FF"
                strokeWidth="2.6"
                strokeLinecap="round"
                className="pointer-events-none"
              />
            )}
          </svg>
        </div>
      </section>
    </div>
  );
}
