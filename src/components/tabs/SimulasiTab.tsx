import { ArrowLeft, ArrowRight, Check, RotateCcw, ShieldCheck } from 'lucide-react';
import type { CandidateOfferResult, SimulationResult, TabId } from '../../types/fairpay';
import {
  formatBudgetK,
  formatPercentComma,
  formatPercentDot,
  formatPValueCompact,
  formatPValueFull,
  formatSalaryK,
} from '../../lib/format';
import { FormulaInfoButton } from '../FormulaInfoButton';
import { RevealUp, TypingHeading } from '../MotionPrimitives';

interface SimulasiTabProps {
  subsidyPct: number;
  loyaltyPct: number;
  onChangeSubsidy: (v: number) => void;
  onChangeLoyalty: (v: number) => void;
  onResetSimulation: () => void;
  simulation: SimulationResult;
  candidateYears: number;
  onChangeCandidateYears: (v: number) => void;
  candidateOffer: CandidateOfferResult;
  onNavigateTab?: (tab: TabId) => void;
}

const SCENARIO_PRESETS = [
  { label: 'Konservatif', subsidy: 6, loyalty: 4 },
  { label: 'Seimbang', subsidy: 12, loyalty: 8 },
  { label: 'Progresif', subsidy: 20, loyalty: 12 },
];

export function SimulasiTab({
  subsidyPct,
  loyaltyPct,
  onChangeSubsidy,
  onChangeLoyalty,
  onResetSimulation,
  simulation,
  candidateYears,
  onChangeCandidateYears,
  candidateOffer,
  onNavigateTab,
}: SimulasiTabProps) {
  const subProgress = (subsidyPct / 30) * 100;
  const loyProgress = (loyaltyPct / 20) * 100;
  const isBothPassed = simulation.normalityPassed && simulation.homogeneityPassed;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <RevealUp y={10} delay={0.02}>
            <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
              LABORATORIUM KEBIJAKAN · SIMULASI WHAT-IF
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
              Geser parameter subsidi dan bonus untuk melihat dampak penyesuaian terhadap keadilan
              gaji serta estimasi tawaran kandidat baru secara langsung.
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

      {/* Kalkulator Tawaran Card */}
      <RevealUp delay={0.08} inView>
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

      {/* Guided Step Footer */}
      {onNavigateTab && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF1F6] pt-4">
          <button
            type="button"
            onClick={() => onNavigateTab('linearitas')}
            className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium text-[#475569] hover:bg-[#F3F5F9] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Uji Linearitas (Regresi)</span>
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
