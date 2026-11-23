import type {
  DepartmentStat,
  HomogeneityResult,
  NormalityResult,
  SimulationResult,
} from '../types/fairpay';

function createHiDpiCanvas(width: number, height: number, scale = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  // Crisp white card background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  // Subtle card border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
  return { canvas, ctx };
}

function drawTitleHeader(
  ctx: CanvasRenderingContext2D,
  kicker: string,
  title: string,
  subtitle: string
) {
  ctx.fillStyle = '#1562FF';
  ctx.font = '700 10px "Plus Jakarta Sans", -apple-system, sans-serif';
  ctx.fillText(kicker.toUpperCase(), 24, 28);

  ctx.fillStyle = '#0B1221';
  ctx.font = '700 17px "Plus Jakarta Sans", -apple-system, sans-serif';
  ctx.fillText(title, 24, 50);

  ctx.fillStyle = '#64748B';
  ctx.font = '400 11.5px "Plus Jakarta Sans", -apple-system, sans-serif';
  ctx.fillText(subtitle, 24, 68);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Chart 1: Horizontal Bar Chart — Gaji Rata-Rata per Divisi
 */
export function renderDepartmentBarChartPng(departments: DepartmentStat[]): string | null {
  if (typeof document === 'undefined' || departments.length === 0) return null;
  const items = departments.slice(0, 7);
  const width = 680;
  const height = Math.max(290, 128 + items.length * 40);
  const setup = createHiDpiCanvas(width, height);
  if (!setup) return null;
  const { canvas, ctx } = setup;

  drawTitleHeader(
    ctx,
    'DISTRIBUSI KOMPENSASI',
    'Gaji Rata-Rata per Divisi',
    'Perbandingan rata-rata gaji tahunan (USD) dan jumlah karyawan aktif per unit'
  );

  const colors = ['#1562FF', '#0F9D78', '#E8920A', '#7C5DFA', '#E84545', '#0EA5E9', '#14B8A6'];
  const maxVal = Math.max(...items.map((d) => d.meanSalary), 10000);
  const axisMax = Math.ceil(maxVal / 25000) * 25000 || 100000;

  const labelX = 24;
  const barX = 165;
  const barMaxW = 410;
  const startY = 96;
  const rowStep = 40;
  const barH = 24;

  // Vertical gridlines
  for (let i = 0; i <= 4; i++) {
    const val = (axisMax / 4) * i;
    const gx = barX + (barMaxW * i) / 4;
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, startY - 6);
    ctx.lineTo(gx, startY + items.length * rowStep - 10);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 10.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`$${Math.round(val / 1000)}k`, gx, startY + items.length * rowStep + 8);
  }
  ctx.textAlign = 'left';

  items.forEach((d, idx) => {
    const y = startY + idx * rowStep;
    const w = Math.max(24, (d.meanSalary / axisMax) * barMaxW);

    // Dept name
    ctx.fillStyle = '#334155';
    ctx.font = '500 12px "Plus Jakarta Sans", -apple-system, sans-serif';
    const deptLabel = d.department.length > 18 ? `${d.department.slice(0, 17)}…` : d.department;
    ctx.fillText(deptLabel, labelX, y + 16);

    // Background track
    ctx.fillStyle = '#F8FAFC';
    roundRectPath(ctx, barX, y, barMaxW, barH, 6);
    ctx.fill();

    // Colored bar
    ctx.fillStyle = colors[idx % colors.length];
    roundRectPath(ctx, barX, y, w, barH, 6);
    ctx.fill();

    // Value label inside bar
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`$${Math.round(d.meanSalary / 1000)}k`, barX + w - 8, y + 16);

    // Headcount right label
    ctx.fillStyle = '#64748B';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${d.count} org`, barX + barMaxW + 14, y + 16);
  });

  return canvas.toDataURL('image/png');
}

/**
 * Chart 2: Histogram + Normal Curve — Uji Normalitas Shapiro-Wilk
 */
export function renderNormalityHistogramPng(
  normalityRaw: NormalityResult,
  normalityLog: NormalityResult
): string | null {
  if (typeof document === 'undefined' || normalityRaw.histogram.length === 0) return null;
  const width = 680;
  const height = 340;
  const setup = createHiDpiCanvas(width, height);
  if (!setup) return null;
  const { canvas, ctx } = setup;

  const pText = normalityRaw.pValue < 0.001 ? '< 0.001' : normalityRaw.pValue.toFixed(4);
  const pLogText = normalityLog.pValue < 0.001 ? '< 0.001' : normalityLog.pValue.toFixed(4);
  drawTitleHeader(
    ctx,
    'UJI 01 · SHAPIRO-WILK',
    'Sebaran Gaji Tahunan & Kurva Normal',
    `Data Asli: W = ${normalityRaw.wStatistic.toFixed(3)}, p = ${pText}  |  Transformasi Log: W = ${normalityLog.wStatistic.toFixed(3)}, p = ${pLogText}`
  );

  const bins = normalityRaw.histogram;
  const maxVal = Math.max(
    ...bins.map((b) => Math.max(b.density, b.normalDensity)),
    1e-9
  );
  const maxCount = Math.max(...bins.map((b) => b.count), 1);

  const chartL = 52;
  const chartR = width - 28;
  const chartT = 92;
  const chartB = height - 48;
  const chartW = chartR - chartL;
  const chartH = chartB - chartT;

  // Horizontal gridlines
  for (let i = 0; i <= 4; i++) {
    const gy = chartB - (chartH * i) / 4;
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartL, gy);
    ctx.lineTo(chartR, gy);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.round((maxCount * i) / 4)), chartL - 8, gy + 3);
  }
  ctx.textAlign = 'left';

  const gap = 4;
  const barW = (chartW - gap * (bins.length - 1)) / bins.length;

  // Histogram bars
  bins.forEach((b, idx) => {
    const bx = chartL + idx * (barW + gap);
    const bh = (b.density / maxVal) * chartH;
    const by = chartB - bh;

    ctx.fillStyle = '#CFE0FF';
    roundRectPath(ctx, bx, by, barW, Math.max(2, bh), 4);
    ctx.fill();

    // X-axis tick every 2-3 bins
    if (idx === 0 || idx === bins.length - 1 || idx % 3 === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`$${Math.round(b.mid / 1000)}k`, bx + barW / 2, chartB + 18);
    }
  });
  ctx.textAlign = 'left';

  // Normal bell curve overlay
  ctx.strokeStyle = '#1562FF';
  ctx.lineWidth = 2.75;
  ctx.beginPath();
  bins.forEach((b, idx) => {
    const cx = chartL + idx * (barW + gap) + barW / 2;
    const cy = chartB - (b.normalDensity / maxVal) * chartH;
    if (idx === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.stroke();

  // Legend
  ctx.fillStyle = '#CFE0FF';
  ctx.fillRect(chartR - 220, 74, 12, 8);
  ctx.fillStyle = '#475569';
  ctx.font = '500 10.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Frekuensi aktual', chartR - 202, 82);

  ctx.strokeStyle = '#1562FF';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(chartR - 102, 78);
  ctx.lineTo(chartR - 86, 78);
  ctx.stroke();
  ctx.fillText('Kurva normal', chartR - 80, 82);

  return canvas.toDataURL('image/png');
}

/**
 * Chart 3: Group Boxplot — Uji Homogenitas Levene
 */
export function renderGroupBoxplotChartPng(
  homogeneity: HomogeneityResult,
  groupColumnLabel: string
): string | null {
  if (typeof document === 'undefined' || homogeneity.groups.length === 0) return null;
  const groups = homogeneity.groups.slice(0, 6);
  const width = 680;
  const height = 340;
  const setup = createHiDpiCanvas(width, height);
  if (!setup) return null;
  const { canvas, ctx } = setup;

  const pText = homogeneity.pValue < 0.001 ? '< 0.001' : homogeneity.pValue.toFixed(4);
  drawTitleHeader(
    ctx,
    'UJI 02 · LEVENE TEST',
    `Rentang Gaji Berdasarkan ${groupColumnLabel}`,
    `F(${homogeneity.df1},${homogeneity.df2}) = ${homogeneity.fStatistic.toFixed(3)}, p = ${pText}  —  ${homogeneity.isHomogeneous ? 'Varians Homogen' : 'Varians Heterogen'}`
  );

  const minRaw = Math.min(...groups.map((g) => g.min));
  const maxRaw = Math.max(...groups.map((g) => g.max));
  const yMin = Math.max(0, Math.floor(minRaw / 20000) * 20000);
  const yMax = Math.ceil(maxRaw / 20000) * 20000 || 120000;
  const ySpan = Math.max(yMax - yMin, 10000);

  const chartL = 66;
  const chartR = width - 32;
  const chartT = 92;
  const chartB = height - 56;
  const chartH = chartB - chartT;
  const mapY = (val: number) => chartB - ((val - yMin) / ySpan) * chartH;

  // Horizontal gridlines
  for (let i = 0; i <= 4; i++) {
    const v = yMin + (ySpan * i) / 4;
    const gy = mapY(v);
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartL, gy);
    ctx.lineTo(chartR, gy);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`$${Math.round(v / 1000)}k`, chartL - 10, gy + 3);
  }

  const palette = ['#1562FF', '#7C3AED', '#0F9D78', '#E8920A', '#E84545', '#0EA5E9'];
  const slotW = (chartR - chartL) / groups.length;
  const boxW = Math.min(54, slotW * 0.42);

  groups.forEach((g, idx) => {
    const cx = chartL + slotW * idx + slotW / 2;
    const color = palette[idx % palette.length];
    const yMinPx = mapY(g.min);
    const yQ1Px = mapY(g.q1);
    const yMedPx = mapY(g.median);
    const yQ3Px = mapY(g.q3);
    const yMaxPx = mapY(g.max);

    // Whisker stem
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, yMaxPx);
    ctx.lineTo(cx, yMinPx);
    ctx.stroke();

    // Whisker caps
    ctx.beginPath();
    ctx.moveTo(cx - boxW * 0.35, yMaxPx);
    ctx.lineTo(cx + boxW * 0.35, yMaxPx);
    ctx.moveTo(cx - boxW * 0.35, yMinPx);
    ctx.lineTo(cx + boxW * 0.35, yMinPx);
    ctx.stroke();

    // IQR Box
    ctx.fillStyle = `${color}1A`;
    ctx.fillRect(cx - boxW / 2, yQ3Px, boxW, Math.max(4, yQ1Px - yQ3Px));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - boxW / 2, yQ3Px, boxW, Math.max(4, yQ1Px - yQ3Px));

    // Median thick line
    ctx.beginPath();
    ctx.moveTo(cx - boxW / 2, yMedPx);
    ctx.lineTo(cx + boxW / 2, yMedPx);
    ctx.lineWidth = 3;
    ctx.stroke();

    // Group label & median caption
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.group, cx, chartB + 20);

    ctx.fillStyle = '#64748B';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillText(`n=${g.count} · med $${(g.median / 1000).toFixed(1)}k`, cx, chartB + 36);
  });
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}

/**
 * Chart 4: Policy Simulation Before vs After Comparison
 */
export function renderSimulationComparisonPng(simulation: SimulationResult): string | null {
  if (typeof document === 'undefined') return null;
  const width = 680;
  const height = 320;
  const setup = createHiDpiCanvas(width, height);
  if (!setup) return null;
  const { canvas, ctx } = setup;

  drawTitleHeader(
    ctx,
    'UJI 03 · LABORATORIUM KEBIJAKAN',
    'Simulasi Kebijakan: Sebelum vs Sesudah',
    `Subsidi Bawah +${simulation.subsidyPct}%  |  Bonus Pengalaman +${simulation.loyaltyPct}%  |  Estimasi +$${Math.round(simulation.additionalBudget / 1000)}k/tahun`
  );

  // Two side-by-side panels: Left = p-value tests (Shapiro & Levene), Right = Pay Gap %
  const drawPanel = (
    x: number,
    y: number,
    w: number,
    h: number,
    heading: string,
    items: Array<{ label: string; before: number; after: number; suffix?: string }>,
    maxVal: number,
    threshold?: number
  ) => {
    ctx.fillStyle = '#F8FAFC';
    roundRectPath(ctx, x, y, w, h, 10);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(heading, x + 14, y + 22);

    const plotL = x + 36;
    const plotR = x + w - 16;
    const plotT = y + 38;
    const plotB = y + h - 34;
    const plotH = plotB - plotT;

    // Optional threshold line (e.g. p = 0.05)
    if (threshold !== undefined) {
      const ty = plotB - (Math.min(threshold, maxVal) / maxVal) * plotH;
      ctx.save();
      ctx.strokeStyle = '#0F9D78';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(plotL, ty);
      ctx.lineTo(plotR, ty);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#0F9D78';
      ctx.font = '600 9.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Ambang ${threshold}`, plotR, ty - 4);
      ctx.textAlign = 'left';
    }

    const groupW = (plotR - plotL) / items.length;
    const barW = Math.min(34, groupW * 0.28);

    items.forEach((it, idx) => {
      const cx = plotL + groupW * idx + groupW / 2;
      const bH = Math.max(4, (Math.min(it.before, maxVal) / maxVal) * plotH);
      const aH = Math.max(4, (Math.min(it.after, maxVal) / maxVal) * plotH);

      // Before bar (slate)
      ctx.fillStyle = '#94A3B8';
      roundRectPath(ctx, cx - barW - 4, plotB - bH, barW, bH, 4);
      ctx.fill();

      // After bar (FairPay blue)
      ctx.fillStyle = '#1562FF';
      roundRectPath(ctx, cx + 4, plotB - aH, barW, aH, 4);
      ctx.fill();

      // Value labels
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748B';
      const fmt = (v: number) => (it.suffix ? `${v.toFixed(1)}${it.suffix}` : v.toFixed(3));
      ctx.fillText(fmt(it.before), cx - barW / 2 - 4, plotB - bH - 5);
      ctx.fillStyle = '#0C2B7E';
      ctx.fillText(fmt(it.after), cx + barW / 2 + 4, plotB - aH - 5);

      // X label
      ctx.fillStyle = '#334155';
      ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(it.label, cx, plotB + 18);
    });
    ctx.textAlign = 'left';
  };

  const maxP = Math.max(
    0.15,
    simulation.before.shapiroP,
    simulation.after.shapiroP,
    simulation.before.leveneP,
    simulation.after.leveneP
  ) * 1.15;

  drawPanel(
    24,
    92,
    380,
    196,
    'Uji Asumsi Statistik (p-value, target ≥ 0.05)',
    [
      { label: 'Shapiro-Wilk', before: simulation.before.shapiroP, after: simulation.after.shapiroP },
      { label: 'Levene Test', before: simulation.before.leveneP, after: simulation.after.leveneP },
    ],
    maxP,
    0.05
  );

  const maxGap = Math.max(12, simulation.before.gapPct, simulation.after.gapPct) * 1.2;
  drawPanel(
    420,
    92,
    236,
    196,
    'Kesenjangan Median (target ≤ 5%)',
    [{ label: 'Pay Gap (%)', before: simulation.before.gapPct, after: simulation.after.gapPct, suffix: '%' }],
    maxGap,
    5
  );

  // Legend at bottom
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(24, 298, 12, 8);
  ctx.fillStyle = '#475569';
  ctx.font = '500 10.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Sebelum simulasi', 42, 306);

  ctx.fillStyle = '#1562FF';
  ctx.fillRect(156, 298, 12, 8);
  ctx.fillText('Sesudah simulasi', 174, 306);

  return canvas.toDataURL('image/png');
}
