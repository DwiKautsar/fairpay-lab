import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import type { LinearityResult, TabId } from '../../types/fairpay';
import {
  formatDecimalComma,
  formatPValueFull,
  formatSalaryK,
  formatSalaryKWhole,
} from '../../lib/format';
import { FormulaInfoButton } from '../FormulaInfoButton';
import { RevealUp, TypingHeading } from '../MotionPrimitives';

interface LinearitasTabProps {
  linearity: LinearityResult;
  experienceLabel: string;
  onNavigateTab?: (tab: TabId) => void;
}

export function LinearitasTab({
  linearity,
  experienceLabel,
  onNavigateTab,
}: LinearitasTabProps) {
  const [hoveredPt, setHoveredPt] = useState<number | null>(null);

  // Scatterplot + Linear vs Quadratic Regression SVG geometry
  const scW = 760;
  const scH = 290;
  const scPad = { top: 18, right: 24, bottom: 42, left: 62 };
  const scPlotW = scW - scPad.left - scPad.right;
  const scPlotH = scH - scPad.top - scPad.bottom;

  const allYs = [
    ...linearity.scatterPoints.map((p) => p.y),
    ...linearity.curvePoints.flatMap((c) => [c.yLinear, c.yQuadratic]),
  ];
  const yMin = Math.max(0, Math.floor(Math.min(...allYs, 30000) / 20000) * 20000);
  const yMax = Math.max(yMin + 40000, Math.ceil(Math.max(...allYs, 120000) / 20000) * 20000);
  const xMin = Math.max(0, Math.floor(linearity.xMin));
  const xMax = Math.max(xMin + 1, Math.ceil(linearity.xMax));

  const mapScX = (x: number) => scPad.left + ((x - xMin) / (xMax - xMin)) * scPlotW;
  const mapScY = (y: number) => scPad.top + scPlotH - ((y - yMin) / (yMax - yMin)) * scPlotH;

  const linearPath = linearity.curvePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapScX(p.x).toFixed(1)} ${mapScY(p.yLinear).toFixed(1)}`)
    .join(' ');
  const quadPath = linearity.curvePoints
    .map(
      (p, i) => `${i === 0 ? 'M' : 'L'} ${mapScX(p.x).toFixed(1)} ${mapScY(p.yQuadratic).toFixed(1)}`
    )
    .join(' ');

  const scYTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + (yMax - yMin) * t);
  const scXTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(xMin + (xMax - xMin) * t));

  const expHumanLabel = /yearsexperience|years of experience|experience/i.test(experienceLabel)
    ? 'masa kerja'
    : /seniority/i.test(experienceLabel)
      ? 'tingkat senioritas'
      : experienceLabel;

  const r2Delta = Math.max(0, linearity.rSquaredQuadratic - linearity.rSquaredLinear);
  const slopeSign = linearity.slope >= 0 ? '+' : '−';

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="max-w-2xl">
        <RevealUp y={10} delay={0.02}>
          <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
            UJI 03 · LINEARITAS REGRESI
          </div>
        </RevealUp>
        <TypingHeading
          text="Apakah kenaikan gaji sebanding dengan pengalaman?"
          speedMs={36}
          delayMs={160}
          className="mt-2 text-[25px] sm:text-[31px] font-bold tracking-[-0.02em] leading-[1.16] text-[#0B1221] [text-wrap:balance]"
        />
        <RevealUp y={10} delay={0.1}>
          <p className="mt-2 text-[14.5px] text-[#64748B] leading-relaxed">
            Bandingkan kecocokan regresi linear dan kuadratik terhadap {expHumanLabel} untuk
            mendeteksi perlambatan atau titik jenuh karir (career plateau).
          </p>
        </RevealUp>
      </div>

      {/* Stat + Verdict Summary Card (aligned with Normalitas & Homogenitas visual grammar) */}
      <RevealUp delay={0.08}>
        <section className="fairpay-card-subtle rounded-2xl bg-[#F8F9FC] overflow-hidden">
          <div className="grid grid-cols-2 xl:grid-cols-[170px_170px_170px_1fr] divide-y xl:divide-y-0 xl:divide-x divide-[#E6EAF2]">
            <div className="p-5 sm:p-6 border-r border-[#E6EAF2] xl:border-r-0">
              <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#64748B]">
                <span>R² Linear</span>
                <FormulaInfoButton formulaId="regressionLinearity" />
              </div>
              <div className="mt-1.5 font-mono text-[26px] sm:text-[30px] font-semibold tracking-tight text-[#0F172A] tabular-nums">
                {formatDecimalComma(linearity.rSquaredLinear, 3)}
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#94A3B8] tabular-nums">
                Kuadratik {formatDecimalComma(linearity.rSquaredQuadratic, 3)}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="text-[12.5px] font-medium text-[#64748B]">F-Deviasi</div>
              <div className="mt-1.5 font-mono text-[26px] sm:text-[30px] font-semibold tracking-tight text-[#0F172A] tabular-nums">
                {formatDecimalComma(linearity.fDeviation, 3)}
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#94A3B8] tabular-nums">
                ΔR² +{formatDecimalComma(r2Delta, 3)}
              </div>
            </div>

            <div className="p-5 sm:p-6 border-r border-[#E6EAF2] xl:border-r-0">
              <div className="text-[12.5px] font-medium text-[#64748B]">p-value deviasi</div>
              <div className="mt-1.5 font-mono text-[26px] sm:text-[30px] font-semibold tracking-tight text-[#0F172A] tabular-nums">
                {formatPValueFull(linearity.pDeviation, true)}
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#94A3B8]">Ambang α = 0,05</div>
            </div>

            <div className="col-span-2 xl:col-span-1 flex flex-col sm:flex-row sm:items-center gap-3.5 p-5 sm:p-6">
              <span
                className={`inline-flex items-center gap-1.5 self-start sm:self-center rounded-full px-3 py-1.5 font-mono text-[11.5px] font-semibold whitespace-nowrap shrink-0 ${
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
              <p className="text-[13.5px] text-[#475569] leading-relaxed">
                {linearity.hasCareerPlateau
                  ? 'Kurva kuadratik signifikan lebih cocok (p < 0,05). Kenaikan gaji cenderung melandai di masa kerja tinggi.'
                  : 'Hubungan gaji dan pengalaman mengikuti pola linear yang konsisten tanpa indikasi jenuh karir yang tajam.'}
              </p>
            </div>
          </div>
        </section>
      </RevealUp>

      {/* Main Scatterplot + Regression Model Card */}
      <RevealUp delay={0.14}>
        <section className="fairpay-card rounded-2xl border border-[#EEF1F7] bg-white p-6 sm:p-7 shadow-[0_2px_20px_rgba(15,23,42,0.035)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
                DIAGRAM PENCAR &amp; MODEL REGRESI
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

          {/* Regression Model Parameter Strip */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl bg-[#F8F9FC] p-4">
            <div>
              <div className="text-[11.5px] text-[#64748B]">Persamaan Regresi Linear</div>
              <div className="mt-1 font-mono text-[14px] sm:text-[15px] font-semibold text-[#0F172A] tabular-nums">
                ŷ = {formatSalaryK(linearity.intercept, 1)} {slopeSign}{' '}
                {formatSalaryK(Math.abs(linearity.slope), 1)}·X
              </div>
            </div>
            <div>
              <div className="text-[11.5px] text-[#64748B]">Estimasi kenaikan / tahun</div>
              <div className="mt-1 font-mono text-[15px] sm:text-[16px] font-bold text-[#1562FF] tabular-nums">
                {linearity.slope >= 0 ? '+' : '−'}
                {formatSalaryK(Math.abs(linearity.slope), 1)}{' '}
                <span className="font-sans text-[12px] font-normal text-[#64748B]">/ tahun</span>
              </div>
            </div>
            <div>
              <div className="text-[11.5px] text-[#64748B]">Residual Std. Error (SEE)</div>
              <div className="mt-1 font-mono text-[15px] sm:text-[16px] font-semibold text-[#0F172A] tabular-nums">
                ±{formatSalaryK(linearity.residualStdError, 1)}
              </div>
            </div>
          </div>

          {/* Scatterplot SVG */}
          <div className="relative mt-6">
            {hoveredPt !== null && linearity.scatterPoints[hoveredPt] && (
              <div className="pointer-events-none absolute right-2 top-0 z-10 rounded-xl bg-[#0F172A] px-3 py-2 text-[11.5px] text-white shadow-lg font-mono tabular-nums">
                <div>Pengalaman: {linearity.scatterPoints[hoveredPt].x.toFixed(1)} thn</div>
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
                <motion.path
                  d={quadPath}
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
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
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-none"
                />
              )}
            </svg>
          </div>
        </section>
      </RevealUp>

      {/* Method Note */}
      <RevealUp delay={0.2} y={12}>
        <div className="flex items-start gap-2.5 text-[13px] text-[#64748B]">
          <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-[#1562FF] mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-[#0F172A]">Catatan metode</strong> Uji F-Deviasi
            membandingkan pengurangan galat antara model regresi kuadratik (polinomial derajat 2)
            dan regresi linear untuk mendeteksi titik jenuh kompensasi secara objektif.
          </p>
        </div>
      </RevealUp>

      {/* Guided Audit Flow Footer */}
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
            onClick={() => onNavigateTab('simulasi')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#EEF4FF] px-4 py-2 text-[13px] font-semibold text-[#1562FF] hover:bg-[#E0ECFF] transition-colors cursor-pointer"
          >
            <span>Lanjut: Simulasi Kebijakan</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
