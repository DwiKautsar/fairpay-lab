import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, RotateCcw, ShieldCheck } from 'lucide-react';
import type {
  CandidateOfferResult,
  LinearityResult,
  SimulationResult,
  TabId,
} from '../../types/fairpay';
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
import { FormulaInfoButton } from '../FormulaInfoButton';
import { RevealUp, TypingHeading } from '../MotionPrimitives';

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
  onNavigateTab?: (tab: TabId) => void;
}

const SCENARIO_PRESETS = [
  { label: 'Konservatif', subsidy: 6, loyalty: 4 },
  { label: 'Seimbang', subsidy: 12, loyalty: 8 },
  { label: 'Progresif', subsidy: 20, loyalty: 12 },
];

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
  onNavigateTab,
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
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <RevealUp y={10} delay={0.02}>
            <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
              UJI 03 · LABORATORIUM KEBIJAKAN
            </div>
          </RevealUp>
          <TypingHeading
            text="Uji kebijakan sebelum diterapkan."
            speedMs={38}
            delayMs={160}
            className="mt-2 text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] leading-[1.16] text-[#0B1221] [text-wrap:balance]"
          />
          <RevealUp y={10} delay={0.1}>
            <p className="mt-2 text-[14.5px] text-[#64748B] leading-relaxed">
              Geser parameter untuk melihat dampak penyesuaian terhadap keadilan gaji secara langsung.
            </p>
          </RevealUp>
        </div>

        <RevealUp y={10} delay={0.12} className="self-start md:self-end shrink-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E6F8F1] px-3.5 py-2 text-[12.5px] font-semibold text-[#059669] whitespace-nowrap">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Data asli tetap aman</span>
          </div>
        </RevealUp>
      </div>

      {/* Main 2-Column Simulator Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.45fr] items-stretch">
        {/* Left: Parameter Simulasi */}
        <RevealUp delay={0.08} className="flex flex-col">
          <section className="fairpay-card-subtle flex flex-1 flex-col justify-between rounded-2xl bg-[#F8F9FC] p-6 sm:p-7">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
                  PARAMETER SIMULASI
                </div>
                <h2 className="mt-1.5 flex items-center gap-2 text-[20px] font-bold tracking-tight text-[#0F172A]">
                  <span>Rancang skenario</span>
                  <FormulaInfoButton formulaId="policySimulation" />
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

            {/* Quick Scenario Presets */}
            <div className="mt-5">
              <div className="text-[11.5px] font-medium text-[#64748B] mb-2">
                Preset cepat skenario
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SCENARIO_PRESETS.map((preset) => {
                  const isActive = subsidyPct === preset.subsidy && loyaltyPct === preset.loyalty;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        onChangeSubsidy(preset.subsidy);
                        onChangeLoyalty(preset.loyalty);
                      }}
                      className={`rounded-xl border px-2.5 py-2 text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] ${
                        isActive
                          ? 'border-[#1562FF] bg-[#EEF4FF] text-[#0C2B7E] shadow-2xs'
                          : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#CBD5E1] hover:text-[#0F172A]'
                      }`}
                    >
                      <div className="text-[12px] font-semibold leading-tight">{preset.label}</div>
                      <div className="mt-0.5 font-mono text-[10.5px] text-[#64748B] tabular-nums">
                        {preset.subsidy}% · {preset.loyalty}%
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders */}
            <div className="mt-6 space-y-6">
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
        </RevealUp>

        {/* Right: Hasil Langsung (Before vs After) */}
        <RevealUp delay={0.14} className="flex flex-col">
          <section className="fairpay-card flex flex-1 flex-col justify-between rounded-2xl border border-[#EEF1F7] bg-white p-5 sm:p-7 shadow-[0_2px_20px_rgba(15,23,42,0.035)]">
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
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-[#1562FF] uppercase shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1562FF]" aria-hidden="true" />
                LIVE
              </span>
            </div>

            {/* Comparison Table */}
            <div className="mt-6">
              <div className="grid grid-cols-[minmax(0,1fr)_68px_76px] sm:grid-cols-[minmax(0,1fr)_96px_104px] items-center gap-2 sm:gap-3 pb-3 border-b border-[#EEF1F7] font-mono text-[10.5px] sm:text-[11px] font-medium tracking-wider text-[#94A3B8] uppercase">
                <span>Metrik</span>
                <span className="text-right whitespace-nowrap">SEBELUM</span>
                <span className="text-right whitespace-nowrap">SESUDAH</span>
              </div>

              <div className="divide-y divide-[#F1F4F9]">
                {/* Row 1: Normalitas */}
                <div className="grid grid-cols-[minmax(0,1fr)_68px_76px] sm:grid-cols-[minmax(0,1fr)_96px_104px] items-start gap-2 sm:gap-3 py-4">
                  <div className="min-w-0">
                    <div className="flex min-h-[24px] items-center gap-1.5 text-[13.5px] sm:text-[14.5px] font-bold text-[#0F172A] leading-snug">
                      <span className="truncate">Normalitas</span>
                      <FormulaInfoButton formulaId="shapiroWilk" />
                    </div>
                    <div className="mt-0.5 text-[11.5px] sm:text-[12px] text-[#94A3B8] leading-snug">
                      Shapiro-Wilk · p-value
                    </div>
                  </div>
                  <div className="flex min-h-[24px] items-center justify-end font-mono text-[12.5px] sm:text-[14px] text-[#94A3B8] line-through tabular-nums whitespace-nowrap">
                    {formatPValueCompact(simulation.before.shapiroP)}
                  </div>
                  <div className="text-right">
                    <div
                      className={`flex min-h-[24px] items-center justify-end font-mono text-[13.5px] sm:text-[15.5px] font-semibold tabular-nums whitespace-nowrap ${
                        simulation.normalityPassed ? 'text-[#059669]' : 'text-[#B45309]'
                      }`}
                    >
                      {simulation.after.shapiroP < 0.001
                        ? '<0.001'
                        : formatPValueFull(simulation.after.shapiroP, false)}
                    </div>
                    <div
                      className={`mt-0.5 text-[11.5px] sm:text-[12px] font-semibold leading-snug ${
                        simulation.normalityPassed ? 'text-[#059669]' : 'text-[#B45309]'
                      }`}
                    >
                      {simulation.normalityPassed ? 'Lolos' : 'Belum'}
                    </div>
                  </div>
                </div>

                {/* Row 2: Homogenitas */}
                <div className="grid grid-cols-[minmax(0,1fr)_68px_76px] sm:grid-cols-[minmax(0,1fr)_96px_104px] items-start gap-2 sm:gap-3 py-4">
                  <div className="min-w-0">
                    <div className="flex min-h-[24px] items-center gap-1.5 text-[13.5px] sm:text-[14.5px] font-bold text-[#0F172A] leading-snug">
                      <span className="truncate">Homogenitas</span>
                      <FormulaInfoButton formulaId="leveneTest" />
                    </div>
                    <div className="mt-0.5 text-[11.5px] sm:text-[12px] text-[#94A3B8] leading-snug">
                      Levene · p-value
                    </div>
                  </div>
                  <div className="flex min-h-[24px] items-center justify-end font-mono text-[12.5px] sm:text-[14px] text-[#94A3B8] line-through tabular-nums whitespace-nowrap">
                    {formatPValueCompact(simulation.before.leveneP)}
                  </div>
                  <div className="text-right">
                    <div
                      className={`flex min-h-[24px] items-center justify-end font-mono text-[13.5px] sm:text-[15.5px] font-semibold tabular-nums whitespace-nowrap ${
                        simulation.homogeneityPassed ? 'text-[#059669]' : 'text-[#B45309]'
                      }`}
                    >
                      {simulation.after.leveneP < 0.001
                        ? '<0.001'
                        : formatPValueFull(simulation.after.leveneP, false)}
                    </div>
                    <div
                      className={`mt-0.5 text-[11.5px] sm:text-[12px] font-semibold leading-snug ${
                        simulation.homogeneityPassed ? 'text-[#059669]' : 'text-[#B45309]'
                      }`}
                    >
                      {simulation.homogeneityPassed ? 'Lolos' : 'Belum'}
                    </div>
                  </div>
                </div>

                {/* Row 3: Kesenjangan gaji */}
                <div className="grid grid-cols-[minmax(0,1fr)_68px_76px] sm:grid-cols-[minmax(0,1fr)_96px_104px] items-start gap-2 sm:gap-3 py-4">
                  <div className="min-w-0">
                    <div className="flex min-h-[24px] items-center gap-1.5 text-[13.5px] sm:text-[14.5px] font-bold text-[#0F172A] leading-snug">
                      <span className="truncate">Kesenjangan gaji</span>
                      <FormulaInfoButton formulaId="groupGapPct" />
                    </div>
                    <div className="mt-0.5 text-[11.5px] sm:text-[12px] text-[#94A3B8] leading-snug">
                      Selisih median kelompok
                    </div>
                  </div>
                  <div className="flex min-h-[24px] items-center justify-end font-mono text-[12.5px] sm:text-[14px] text-[#94A3B8] line-through tabular-nums whitespace-nowrap">
                    {formatPercentComma(simulation.before.gapPct, 1)}
                  </div>
                  <div className="text-right">
                    <div
                      className={`flex min-h-[24px] items-center justify-end font-mono text-[13.5px] sm:text-[15.5px] font-semibold tabular-nums whitespace-nowrap ${
                        simulation.gapPassed ? 'text-[#059669]' : 'text-[#B45309]'
                      }`}
                    >
                      {formatPercentComma(simulation.after.gapPct, 1)}
                    </div>
                    <div
                      className={`mt-0.5 text-[11.5px] sm:text-[12px] font-semibold leading-snug ${
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

          {/* Bottom Dynamic Callout */}
          <div
            className={`mt-5 flex items-start gap-2.5 rounded-xl px-4 py-3.5 text-[13px] leading-relaxed ${
              isBothPassed && simulation.gapPassed
                ? 'bg-[#E6F8F1] text-[#065F46]'
                : 'bg-[#EEF4FF] text-[#334155]'
            }`}
          >
            <Check
              className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${
                isBothPassed && simulation.gapPassed ? 'text-[#059669]' : 'text-[#1562FF]'
              }`}
              strokeWidth={2.4}
            />
            <p>
              <strong
                className={`font-bold ${
                  isBothPassed && simulation.gapPassed ? 'text-[#047857]' : 'text-[#1562FF]'
                }`}
              >
                {isBothPassed && simulation.gapPassed
                  ? 'Seluruh ambang keadilan statistik terpenuhi.'
                  : isBothPassed
                    ? 'Asumsi normalitas dan homogenitas terpenuhi.'
                    : subsidyPct === 0 && loyaltyPct === 0
                      ? 'Belum ada intervensi aktif.'
                      : 'Skenario bergerak mendekati ambang adil.'}
              </strong>{' '}
              {isBothPassed && simulation.gapPassed
                ? 'Distribusi normal, varians homogen, dan kesenjangan median berada di bawah 5%.'
                : isBothPassed
                  ? 'Sesuaikan subsidi gaji bawah sedikit lagi agar kesenjangan median turun di bawah 5%.'
                  : subsidyPct === 0 && loyaltyPct === 0
                    ? 'Pilih preset atau geser slider di samping untuk melihat dampak kebijakan secara langsung.'
                    : 'Tingkatkan subsidi atau bonus loyalitas hingga kedua p-value melewati 0,05.'}
            </p>
          </div>
          </section>
        </RevealUp>
      </div>

      {/* Kalkulator Tawaran Card (PRD Section 4.5 Bagian C) */}
      <RevealUp delay={0.06} inView>
        <section className="fairpay-card-subtle rounded-2xl bg-[#F8F9FC] p-6 sm:p-7">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.9fr_1fr] xl:items-center">
          <div>
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
              KALKULATOR TAWARAN
            </div>
            <h2 className="mt-1.5 flex items-center gap-2 text-[20px] font-bold tracking-tight text-[#0F172A]">
              <span>Estimasi gaji karyawan baru</span>
              <FormulaInfoButton formulaId="offerCalculator" />
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

          <div className="border-t border-[#E6EAF2] pt-5 xl:border-t-0 xl:border-l xl:pl-7 xl:pt-0">
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
      </RevealUp>

      {/* Uji Linearitas Regresi Card (PRD Section 4.5 Bagian A: Scatterplot Linear vs Quadratic + Deviation Test) */}
      <RevealUp delay={0.08} inView>
        <section className="fairpay-card rounded-2xl border border-[#EEF1F7] bg-white p-6 sm:p-7 shadow-[0_2px_20px_rgba(15,23,42,0.035)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
              UJI LINEARITAS REGRESI
            </div>
            <h2 className="mt-1.5 flex items-center gap-2 text-[19px] sm:text-[21px] font-bold tracking-tight text-[#0F172A]">
              <span>Hubungan gaji vs {expHumanLabel} &amp; deteksi titik jenuh karir</span>
              <FormulaInfoButton formulaId="regressionLinearity" />
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

            {/* Quadratic Regression Curve (keep strokeDasharray intact via opacity fade) */}
            {quadPath && (
              <motion.path
                d={quadPath}
                fill="none"
                stroke="#7C3AED"
                strokeWidth="2.2"
                strokeDasharray="6 4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 'some' }}
                transition={{ duration: 0.65, delay: 0.3, ease: 'easeOut' }}
                className="pointer-events-none"
              />
            )}

            {/* Linear Regression Line */}
            {linearPath && (
              <motion.path
                d={linearPath}
                fill="none"
                stroke="#1562FF"
                strokeWidth="2.6"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.35 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, amount: 'some' }}
                transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none"
              />
            )}
          </svg>
        </div>
        </section>
      </RevealUp>

      {/* Guided Step Footer */}
      {onNavigateTab && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF1F6] pt-4">
          <button
            type="button"
            onClick={() => onNavigateTab('homogenitas')}
            className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium text-[#475569] hover:bg-[#F3F5F9] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Uji Homogenitas (Levene)</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('ringkasan')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#EEF4FF] px-4 py-2 text-[13px] font-semibold text-[#1562FF] hover:bg-[#E0ECFF] transition-colors cursor-pointer"
          >
            <span>Kembali ke Ringkasan Audit</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
