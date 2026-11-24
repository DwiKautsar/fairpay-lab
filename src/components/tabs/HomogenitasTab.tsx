import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { HomogeneityResult } from '../../types/fairpay';
import {
  formatDecimalComma,
  formatIntegerId,
  formatPValueFull,
  formatSalaryKComma,
  formatSalaryKWhole,
} from '../../lib/format';
import { FormulaInfoButton } from '../FormulaInfoButton';

interface HomogenitasTabProps {
  homogeneity: HomogeneityResult;
  groupColumnLabel: string;
}

export function HomogenitasTab({ homogeneity, groupColumnLabel }: HomogenitasTabProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const groups = homogeneity.groups.slice(0, 6);
  const allVals = groups.flatMap((g) => [g.min, g.max]);
  const rawMin = allVals.length ? Math.min(...allVals) : 20000;
  const rawMax = allVals.length ? Math.max(...allVals) : 120000;

  const yMin = Math.max(0, Math.floor(rawMin / 20000) * 20000);
  const yMax = Math.max(yMin + 40000, Math.ceil(rawMax / 20000) * 20000);
  const tickCount = 6;
  const yTicks = Array.from({ length: tickCount }, (_, i) => yMin + ((yMax - yMin) * i) / (tickCount - 1));

  // SVG Boxplot Geometry (proportioned so full chart + Catatan metode fit within 900px desktop fold)
  const svgW = 860;
  const svgH = 290;
  const pad = { top: 14, right: 28, bottom: 58, left: 66 };
  const plotW = svgW - pad.left - pad.right;
  const plotH = svgH - pad.top - pad.bottom;

  const mapY = (val: number) =>
    pad.top + plotH - ((val - yMin) / Math.max(1, yMax - yMin)) * plotH;

  const groupNameClean = groupColumnLabel.toLowerCase() === 'gender' ? 'gender' : groupColumnLabel;
  const activeHoverStat = groups.find((g) => g.group === hoveredGroup) ?? null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="max-w-2xl">
        <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
          UJI 02 · LEVENE
        </div>
        <h1 className="mt-2 text-[25px] sm:text-[31px] font-bold tracking-[-0.02em] leading-[1.16] text-[#0B1221] [text-wrap:balance]">
          Apakah rentang upah antarkelompok setara?
        </h1>
        <p className="mt-2 text-[14.5px] text-[#64748B] leading-relaxed">
          Bandingkan konsistensi variasi gaji berdasarkan {groupNameClean} untuk menemukan standar
          pengupahan yang timpang.
        </p>
      </div>

      {/* Stat + Verdict Card */}
      <section className="rounded-2xl bg-[#F8F9FC] overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-[190px_190px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-[#E6EAF2]">
          <div className="p-5 sm:p-6 border-r border-[#E6EAF2] lg:border-r-0">
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#64748B]">
              <span>Statistik F</span>
              <FormulaInfoButton formulaId="leveneTest" />
            </div>
            <div className="mt-1.5 font-mono text-[28px] sm:text-[31px] font-semibold tracking-tight text-[#0F172A] tabular-nums">
              {formatDecimalComma(homogeneity.fStatistic, 3)}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="text-[12.5px] font-medium text-[#64748B]">p-value</div>
            <div className="mt-1.5 font-mono text-[28px] sm:text-[31px] font-semibold tracking-tight text-[#0F172A] tabular-nums">
              {formatPValueFull(homogeneity.pValue, true)}
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 flex flex-col sm:flex-row sm:items-center gap-3.5 p-5 sm:p-6">
            <span
              className={`inline-flex items-center gap-1.5 self-start sm:self-center rounded-full px-3 py-1.5 font-mono text-[11.5px] font-semibold whitespace-nowrap shrink-0 ${
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
              {homogeneity.isHomogeneous ? 'Varians homogen' : 'Varians heterogen'}
            </span>
            <p className="text-[13.5px] text-[#475569] leading-relaxed">
              {homogeneity.isHomogeneous
                ? 'p-value ≥ 0,05. Rentang variasi gaji antarkelompok setara dan konsisten.'
                : 'p-value < 0,05. Rentang gaji antarkelompok berbeda secara signifikan.'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Boxplot Comparison Card */}
      <section className="rounded-2xl border border-[#EEF1F7] bg-white p-6 sm:p-7 shadow-[0_2px_20px_rgba(15,23,42,0.035)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
              PERBANDINGAN KELOMPOK
            </div>
            <h2 className="mt-1.5 flex items-center gap-2 text-[19px] sm:text-[21px] font-bold tracking-tight text-[#0F172A]">
              <span>Rentang gaji berdasarkan {groupNameClean}</span>
              <FormulaInfoButton formulaId="boxplotIqr" />
            </h2>
          </div>

          {/* Group Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[12.5px] font-medium text-[#475569]">
            {groups.map((g) => (
              <div key={g.group} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: g.color }}
                  aria-hidden="true"
                />
                <span>{g.group}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Boxplot SVG Container */}
        <div className="relative mt-6">
          {activeHoverStat && (
            <div className="pointer-events-none absolute right-2 top-0 z-10 rounded-xl bg-[#0F172A] px-3.5 py-2.5 text-[11.5px] text-white shadow-lg font-mono tabular-nums space-y-0.5">
              <div className="font-sans font-bold text-[12.5px] text-white mb-1">
                {activeHoverStat.group} (n = {formatIntegerId(activeHoverStat.count)})
              </div>
              <div>Max: {formatSalaryKComma(activeHoverStat.max, 1)}</div>
              <div>Q3: {formatSalaryKComma(activeHoverStat.q3, 1)}</div>
              <div className="text-[#93C5FD]">
                Median: {formatSalaryKComma(activeHoverStat.median, 1)}
              </div>
              <div>Q1: {formatSalaryKComma(activeHoverStat.q1, 1)}</div>
              <div>Min: {formatSalaryKComma(activeHoverStat.min, 1)}</div>
              <div className="pt-0.5 border-t border-white/15 text-[#CBD5E1]">
                SD: {formatSalaryKComma(activeHoverStat.stdDev, 1)}
              </div>
            </div>
          )}

          {groups.length < 2 ? (
            <div className="rounded-xl bg-[#F8F9FC] p-10 text-center text-[13.5px] text-[#64748B]">
              Minimal dibutuhkan 2 kelompok untuk menghitung Uji Homogenitas Levene.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full min-w-[320px] max-h-[320px] h-auto"
                role="img"
                aria-label={`Boxplot perbandingan rentang gaji berdasarkan ${groupNameClean}`}
              >
                {/* Horizontal Gridlines & Y Labels */}
                {yTicks.map((tick, idx) => {
                  const y = mapY(tick);
                  return (
                    <g key={idx}>
                      <line
                        x1={pad.left}
                        y1={y}
                        x2={svgW - pad.right}
                        y2={y}
                        stroke="#F1F5F9"
                        strokeWidth="1.2"
                      />
                      <text
                        x={pad.left - 14}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-[#94A3B8] font-mono text-[11.5px]"
                      >
                        {formatSalaryKWhole(tick)}
                      </text>
                    </g>
                  );
                })}

                {/* Boxplots */}
                {groups.map((g, idx) => {
                  const slotW = plotW / groups.length;
                  const cx = pad.left + slotW * (idx + 0.5);
                  const boxW = Math.min(62, Math.max(36, slotW * 0.22));
                  const capW = boxW * 0.42;

                  const yMinPos = mapY(g.min);
                  const yQ1Pos = mapY(g.q1);
                  const yMedPos = mapY(g.median);
                  const yQ3Pos = mapY(g.q3);
                  const yMaxPos = mapY(g.max);
                  const isHovered = hoveredGroup === g.group;

                  return (
                    <g
                      key={g.group}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredGroup(g.group)}
                      onMouseLeave={() => setHoveredGroup(null)}
                    >
                      {/* Invisible hit target */}
                      <rect
                        x={cx - boxW}
                        y={pad.top}
                        width={boxW * 2}
                        height={plotH}
                        fill="transparent"
                      />

                      {/* Whisker Vertical Lines */}
                      <line
                        x1={cx}
                        y1={yMaxPos}
                        x2={cx}
                        y2={yQ3Pos}
                        stroke={g.color}
                        strokeWidth={isHovered ? 2.4 : 1.9}
                      />
                      <line
                        x1={cx}
                        y1={yQ1Pos}
                        x2={cx}
                        y2={yMinPos}
                        stroke={g.color}
                        strokeWidth={isHovered ? 2.4 : 1.9}
                      />

                      {/* Whisker Caps */}
                      <line
                        x1={cx - capW / 2}
                        y1={yMaxPos}
                        x2={cx + capW / 2}
                        y2={yMaxPos}
                        stroke={g.color}
                        strokeWidth={isHovered ? 2.4 : 1.9}
                        strokeLinecap="round"
                      />
                      <line
                        x1={cx - capW / 2}
                        y1={yMinPos}
                        x2={cx + capW / 2}
                        y2={yMinPos}
                        stroke={g.color}
                        strokeWidth={isHovered ? 2.4 : 1.9}
                        strokeLinecap="round"
                      />

                      {/* IQR Box */}
                      <rect
                        x={cx - boxW / 2}
                        y={yQ3Pos}
                        width={boxW}
                        height={Math.max(4, yQ1Pos - yQ3Pos)}
                        rx="2"
                        fill={g.fill}
                        stroke={g.color}
                        strokeWidth={isHovered ? 2.4 : 1.9}
                      />

                      {/* Median Line */}
                      <line
                        x1={cx - boxW / 2}
                        y1={yMedPos}
                        x2={cx + boxW / 2}
                        y2={yMedPos}
                        stroke={g.color}
                        strokeWidth="2.6"
                      />

                      {/* Group Title & Subtitle */}
                      <text
                        x={cx}
                        y={pad.top + plotH + 26}
                        textAnchor="middle"
                        className="fill-[#0F172A] text-[13.5px] font-bold"
                      >
                        {g.group}
                      </text>
                      <text
                        x={cx}
                        y={pad.top + plotH + 45}
                        textAnchor="middle"
                        className="fill-[#94A3B8] font-mono text-[11px]"
                      >
                        n = {formatIntegerId(g.count)} · median {formatSalaryKComma(g.median, 1)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>
      </section>

      {/* Footer Method Note matching screenshot */}
      <div className="flex items-start gap-2.5 text-[13px] text-[#64748B]">
        <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-[#1562FF] mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-[#0F172A]">Catatan metode</strong> Levene&apos;s Test
          dipilih karena lebih robust terhadap data yang tidak normal dibanding Bartlett&apos;s Test.
        </p>
      </div>
    </div>
  );
}
