import { useState } from 'react';
import { Info } from 'lucide-react';
import type { NormalityResult } from '../../types/fairpay';
import { formatDecimalComma, formatIntegerId, formatPValueFull } from '../../lib/format';

interface NormalitasTabProps {
  normalityRaw: NormalityResult;
  normalityLog: NormalityResult;
  logTransform: boolean;
  onToggleLogTransform: () => void;
}

export function NormalitasTab({
  normalityRaw,
  normalityLog,
  logTransform,
  onToggleLogTransform,
}: NormalitasTabProps) {
  const active = logTransform ? normalityLog : normalityRaw;
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  const [hoveredQQ, setHoveredQQ] = useState<number | null>(null);

  // Histogram SVG geometry
  const histW = 540;
  const histH = 260;
  const histPad = { top: 18, right: 16, bottom: 34, left: 16 };
  const plotW = histW - histPad.left - histPad.right;
  const plotH = histH - histPad.top - histPad.bottom;

  const maxDensity = Math.max(
    1e-9,
    ...active.histogram.map((b) => Math.max(b.density, b.normalDensity))
  );

  const bins = active.histogram;
  const minX = bins[0]?.x0 ?? 0;
  const maxX = bins[bins.length - 1]?.x1 ?? 1;
  const xSpan = Math.max(1e-6, maxX - minX);

  // Smooth normal curve path (64 sample points across histogram x range)
  const curvePath = (() => {
    if (bins.length === 0 || active.stdDev <= 1e-9) return '';
    const steps = 64;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const xv = minX + (xSpan * i) / steps;
      const density =
        (1 / (active.stdDev * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * Math.pow((xv - active.mean) / active.stdDev, 2));
      const px = histPad.left + ((xv - minX) / xSpan) * plotW;
      const py = histPad.top + plotH - (density / (maxDensity * 1.12)) * plotH;
      pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return pts.join(' ');
  })();

  // Clean x-axis tick labels
  const histTicks = [0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
    const val = minX + xSpan * t;
    const label = logTransform
      ? val.toFixed(1)
      : idx === 4
        ? `${Math.round(val / 1000)}+`
        : `${Math.round(val / 1000)}`;
    return {
      x: histPad.left + t * plotW,
      label,
    };
  });

  // Q-Q Plot SVG geometry
  const qqW = 360;
  const qqH = 260;
  const qqPad = { top: 20, right: 20, bottom: 38, left: 42 };
  const qqPlotW = qqW - qqPad.left - qqPad.right;
  const qqPlotH = qqH - qqPad.top - qqPad.bottom;

  const qqXs = active.qqPoints.map((p) => p.theoretical);
  const qqYs = active.qqPoints.map((p) => p.observed);
  const qqMinX = Math.min(-2.2, ...qqXs) - 0.35;
  const qqMaxX = Math.max(2.2, ...qqXs) + 0.35;
  const qqMinY = Math.min(...qqYs, active.qqLine.intercept + active.qqLine.slope * qqMinX);
  const qqMaxY = Math.max(...qqYs, active.qqLine.intercept + active.qqLine.slope * qqMaxX);
  const qqSpanY = Math.max(1e-6, qqMaxY - qqMinY);

  const mapQQX = (v: number) => qqPad.left + ((v - qqMinX) / (qqMaxX - qqMinX)) * qqPlotW;
  const mapQQY = (v: number) =>
    qqPad.top + qqPlotH - ((v - qqMinY) / qqSpanY) * (qqPlotH - 12) - 6;

  const refStartX = qqMinX + 0.25;
  const refEndX = qqMaxX - 0.25;
  const refStartY = active.qqLine.intercept + active.qqLine.slope * refStartX;
  const refEndY = active.qqLine.intercept + active.qqLine.slope * refEndX;

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Header + Log Transform Toggle */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
            UJI 01 · SHAPIRO-WILK
          </div>
          <h1 className="mt-2 text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] leading-[1.16] text-[#0B1221] [text-wrap:balance]">
            Apakah sebaran gaji wajar?
          </h1>
          <p className="mt-2 text-[14.5px] text-[#64748B] leading-relaxed">
            Menguji apakah distribusi gaji mengikuti pola normal dan tidak didominasi nilai ekstrem.
          </p>
        </div>

        {/* Interactive Log Transformation Toggle Card */}
        <button
          type="button"
          role="switch"
          aria-checked={logTransform}
          onClick={onToggleLogTransform}
          className="inline-flex items-center gap-3.5 self-start sm:self-end rounded-2xl bg-[#F2F4F8] px-4 py-3 text-left transition-colors hover:bg-[#EAEFF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] shrink-0 cursor-pointer"
        >
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
              logTransform ? 'bg-[#1562FF]' : 'bg-[#CBD5E1]'
            }`}
          >
            <span
              className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                logTransform ? 'translate-x-5.5' : 'translate-x-1'
              }`}
            />
          </span>
          <div>
            <div className="text-[11px] font-medium text-[#64748B] leading-tight">
              Transformasi
            </div>
            <div className="mt-0.5 text-[13px] font-bold text-[#0F172A] leading-tight whitespace-nowrap">
              {logTransform ? 'Logaritma aktif' : 'Logaritma nonaktif'}
            </div>
          </div>
        </button>
      </div>

      {/* Stratified Sampling Notice if N > 5,000 (PRD Section 6.1) */}
      {active.wasSubsampled && (
        <div className="flex items-start gap-2.5 rounded-xl bg-[#EEF4FF] border border-[#D4E3FF] px-4 py-3 text-[13px] text-[#1E3A8A]">
          <Info className="h-4.5 w-4.5 shrink-0 mt-0.5 text-[#1562FF]" />
          <span>
            Dataset melebihi 5.000 baris. Uji Shapiro-Wilk otomatis menggunakan sampel acak
            terstratifikasi sebesar <strong>{formatIntegerId(active.sampleUsed)} baris</strong>{' '}
            sesuai batas akurasi scipy.stats.shapiro.
          </span>
        </div>
      )}

      {/* Main Stat + Verdict Card */}
      <section className="rounded-2xl bg-[#F8F9FC] overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-[190px_190px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-[#E6EAF2]">
          <div className="p-5 sm:p-6 border-r border-[#E6EAF2] lg:border-r-0">
            <div className="text-[12.5px] font-medium text-[#64748B]">Statistik W</div>
            <div className="mt-1.5 font-mono text-[28px] sm:text-[31px] font-semibold tracking-tight text-[#0F172A] tabular-nums">
              {formatDecimalComma(active.wStatistic, 3)}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="text-[12.5px] font-medium text-[#64748B]">p-value</div>
            <div className="mt-1.5 font-mono text-[28px] sm:text-[31px] font-semibold tracking-tight text-[#0F172A] tabular-nums">
              {formatPValueFull(active.pValue, true)}
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 flex flex-col sm:flex-row sm:items-center gap-3.5 p-5 sm:p-6">
            <span
              className={`inline-flex items-center gap-1.5 self-start sm:self-center rounded-full px-3 py-1.5 font-mono text-[11.5px] font-semibold whitespace-nowrap shrink-0 ${
                active.isNormal
                  ? 'bg-[#E6F8F1] text-[#059669]'
                  : 'bg-[#FDECEC] text-[#DC2626]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active.isNormal ? 'bg-[#059669]' : 'bg-[#DC2626]'
                }`}
                aria-hidden="true"
              />
              {active.isNormal ? 'Distribusi normal' : 'Distribusi tidak normal'}
            </span>
            <p className="text-[13.5px] text-[#475569] leading-relaxed">
              {active.isNormal
                ? logTransform
                  ? 'Setelah transformasi, data memenuhi asumsi normalitas (p ≥ 0,05).'
                  : 'p-value ≥ 0,05. Sebaran gaji mengikuti pola distribusi normal.'
                : 'p-value < 0,05. Ada bukti kuat distribusi gaji tidak normal.'}
            </p>
          </div>
        </div>
      </section>

      {/* Charts Grid: Histogram + Q-Q Plot */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Left: Histogram with Normal Bell Curve */}
        <section className="rounded-2xl border border-[#EEF1F7] bg-white p-6 shadow-[0_2px_20px_rgba(15,23,42,0.035)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
                HISTOGRAM
              </div>
              <h2 className="mt-1.5 text-[19px] font-bold tracking-tight text-[#0F172A]">
                Sebaran gaji tahunan
              </h2>
            </div>
            <div className="text-right font-mono text-[11.5px] text-[#94A3B8] whitespace-nowrap">
              {logTransform ? 'Skala ln(USD)' : 'USD · ribuan'}
            </div>
          </div>

          <div className="relative mt-6">
            {hoveredBin !== null && bins[hoveredBin] && (
              <div className="pointer-events-none absolute right-2 top-0 z-10 rounded-xl bg-[#0F172A] px-3 py-2 text-[11.5px] text-white shadow-lg font-mono tabular-nums">
                <div>
                  {logTransform
                    ? `${bins[hoveredBin].x0.toFixed(2)} – ${bins[hoveredBin].x1.toFixed(2)}`
                    : `$${Math.round(bins[hoveredBin].x0 / 1000)}k – $${Math.round(bins[hoveredBin].x1 / 1000)}k`}
                </div>
                <div className="text-[#93C5FD]">
                  {formatIntegerId(bins[hoveredBin].count)} karyawan
                </div>
              </div>
            )}

            <svg
              viewBox={`0 0 ${histW} ${histH}`}
              className="w-full h-auto overflow-visible"
              role="img"
              aria-label="Histogram sebaran gaji dengan kurva distribusi normal"
            >
              {/* Baseline */}
              <line
                x1={histPad.left}
                y1={histPad.top + plotH}
                x2={histPad.left + plotW}
                y2={histPad.top + plotH}
                stroke="#E2E8F0"
                strokeWidth="1"
              />

              {/* Bars */}
              {bins.map((bin, idx) => {
                const bw = plotW / bins.length;
                const gap = 3;
                const bh = Math.max(2, (bin.density / (maxDensity * 1.12)) * plotH);
                const x = histPad.left + idx * bw + gap / 2;
                const y = histPad.top + plotH - bh;
                const isHover = hoveredBin === idx;
                return (
                  <rect
                    key={idx}
                    x={x}
                    y={y}
                    width={Math.max(4, bw - gap)}
                    height={bh}
                    rx="2"
                    fill={isHover ? '#B8D1FF' : '#D9E6FF'}
                    className="transition-colors duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredBin(idx)}
                    onMouseLeave={() => setHoveredBin(null)}
                  />
                );
              })}

              {/* Smooth Normal Curve Overlay */}
              {curvePath && (
                <path
                  d={curvePath}
                  fill="none"
                  stroke="#1562FF"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none"
                />
              )}

              {/* X-Axis Labels */}
              {histTicks.map((t, idx) => (
                <text
                  key={idx}
                  x={t.x}
                  y={histH - 8}
                  textAnchor={idx === 0 ? 'start' : idx === histTicks.length - 1 ? 'end' : 'middle'}
                  className="fill-[#94A3B8] font-mono text-[11px]"
                >
                  {t.label}
                </text>
              ))}
            </svg>
          </div>
        </section>

        {/* Right: Q-Q Plot */}
        <section className="rounded-2xl border border-[#EEF1F7] bg-white p-6 shadow-[0_2px_20px_rgba(15,23,42,0.035)]">
          <div>
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
              Q-Q PLOT
            </div>
            <h2 className="mt-1.5 text-[19px] font-bold tracking-tight text-[#0F172A]">
              Observasi vs ekspektasi
            </h2>
          </div>

          <div className="relative mt-6">
            {hoveredQQ !== null && active.qqPoints[hoveredQQ] && (
              <div className="pointer-events-none absolute right-2 top-0 z-10 rounded-xl bg-[#0F172A] px-3 py-2 text-[11.5px] text-white shadow-lg font-mono tabular-nums">
                <div>Teoretis: z = {active.qqPoints[hoveredQQ].theoretical.toFixed(2)}</div>
                <div className="text-[#93C5FD]">
                  Observasi:{' '}
                  {logTransform
                    ? active.qqPoints[hoveredQQ].observed.toFixed(2)
                    : `$${(active.qqPoints[hoveredQQ].observed / 1000).toFixed(1)}k`}
                </div>
              </div>
            )}

            <svg
              viewBox={`0 0 ${qqW} ${qqH}`}
              className="w-full h-auto overflow-visible"
              role="img"
              aria-label="Grafik Q-Q Plot kuantil observasi terhadap kuantil teoretis normal"
            >
              {/* Y & X Axes */}
              <line
                x1={qqPad.left}
                y1={qqPad.top}
                x2={qqPad.left}
                y2={qqPad.top + qqPlotH}
                stroke="#CBD5E1"
                strokeWidth="1.1"
              />
              <line
                x1={qqPad.left}
                y1={qqPad.top + qqPlotH}
                x2={qqPad.left + qqPlotW}
                y2={qqPad.top + qqPlotH}
                stroke="#CBD5E1"
                strokeWidth="1.1"
              />

              {/* Diagonal Reference Line */}
              <line
                x1={mapQQX(refStartX)}
                y1={mapQQY(refStartY)}
                x2={mapQQX(refEndX)}
                y2={mapQQY(refEndY)}
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Quantile Points */}
              {active.qqPoints.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={mapQQX(pt.theoretical)}
                  cy={mapQQY(pt.observed)}
                  r={hoveredQQ === idx ? 5 : 3.4}
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredQQ(idx)}
                  onMouseLeave={() => setHoveredQQ(null)}
                />
              ))}

              {/* Axis Titles */}
              <text
                x={qqPad.left + qqPlotW / 2}
                y={qqH - 8}
                textAnchor="middle"
                className="fill-[#94A3B8] text-[11px]"
              >
                Kuantil teoretis
              </text>
              <text
                x={14}
                y={qqPad.top + qqPlotH / 2}
                textAnchor="middle"
                transform={`rotate(-90 14 ${qqPad.top + qqPlotH / 2})`}
                className="fill-[#94A3B8] text-[11px]"
              >
                Kuantil observasi
              </text>
            </svg>
          </div>
        </section>
      </div>
    </div>
  );
}
