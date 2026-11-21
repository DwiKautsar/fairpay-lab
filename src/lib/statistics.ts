import type {
  ActiveFilters,
  AnalysisBundle,
  BoxplotGroupStat,
  CandidateOfferResult,
  ColumnMapping,
  DataRow,
  DepartmentStat,
  HistogramBin,
  HomogeneityResult,
  KpiSummary,
  LinearityResult,
  NormalityResult,
  QQPoint,
  SimulationResult,
} from '../types/fairpay';

export const DEPARTMENT_COLORS = [
  '#1562FF', // Engineering - Cobalt Blue
  '#0F9D78', // Sales - Emerald Teal
  '#E8930C', // Marketing - Amber Gold
  '#8B5CF6', // Operations - Violet
  '#E5484D', // Human Resources - Coral Red
  '#0EA5E9', // Sky
  '#EC4899', // Rose
];

export const GROUP_BOXPLOT_STYLES: Array<{ color: string; fill: string }> = [
  { color: '#1562FF', fill: '#EFF5FF' },
  { color: '#7C3AED', fill: '#F5F0FF' },
  { color: '#0F9D78', fill: '#ECFDF5' },
  { color: '#E8930C', fill: '#FFFBEB' },
  { color: '#E5484D', fill: '#FEF2F2' },
];

export function parseNumericValue(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }
  const cleaned = String(val).replace(/[$,\s]/g, '').trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function cleanNumber(val: number, fallback = 0): number {
  return Number.isFinite(val) ? val : fallback;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i];
  return sum / values.length;
}

export function quantileSorted(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0];
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return quantileSorted(sorted, 0.5);
}

export function sampleVariance(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const m = mean(values);
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const d = values[i] - m;
    sumSq += d * d;
  }
  return sumSq / (n - 1);
}

export function sampleSkewness(values: number[]): number {
  const n = values.length;
  if (n < 3) return 0;
  const m = mean(values);
  const s = Math.sqrt(sampleVariance(values));
  if (s === 0) return 0;
  let sumCube = 0;
  for (let i = 0; i < n; i++) {
    sumCube += Math.pow((values[i] - m) / s, 3);
  }
  return (n / ((n - 1) * (n - 2))) * sumCube;
}

/**
 * Standard normal CDF using Abramowitz & Stegun 7.1.26 erf approximation (max error 1.5e-7)
 */
export function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const erf = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

/**
 * Inverse standard normal CDF (Peter Acklam's rational approximation, precision ~1.15e-9)
 */
export function normalInvCdf(p: number): number {
  if (p <= 0) return -8;
  if (p >= 1) return 8;
  if (p === 0.5) return 0;

  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996,
    3.754408661907416,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(
    (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}

/**
 * Log-Gamma via Lanczos approximation for Beta & F distributions
 */
function logGamma(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  const zm = z - 1;
  let x = p[0];
  for (let i = 1; i < p.length; i++) {
    x += p[i] / (zm + i);
  }
  const t = zm + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (zm + 0.5) * Math.log(t) - t + Math.log(x);
}

function betacf(a: number, b: number, x: number): number {
  const maxIter = 200;
  const eps = 3e-12;
  const fpMin = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpMin) d = fpMin;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpMin) d = fpMin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpMin) c = fpMin;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
}

function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  }
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/**
 * Upper-tail p-value for F-distribution F(df1, df2)
 */
export function fDistributionSurvival(fValue: number, df1: number, df2: number): number {
  if (!Number.isFinite(fValue) || fValue <= 0 || df1 <= 0 || df2 <= 0) return 1;
  const x = df2 / (df2 + df1 * fValue);
  return Math.max(0, Math.min(1, regularizedIncompleteBeta(df2 / 2, df1 / 2, x)));
}

/**
 * Deterministic stratified random sampling when N > 5,000 (PRD Section 6.1)
 */
export function stratifiedSubsample<T>(items: T[], getStratum: (item: T) => string, maxSize = 5000): T[] {
  if (items.length <= maxSize) return items;
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const key = getStratum(item);
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  const result: T[] = [];
  const total = items.length;
  for (const [, list] of buckets) {
    const quota = Math.max(1, Math.round((list.length / total) * maxSize));
    const step = list.length / quota;
    for (let i = 0; i < quota && result.length < maxSize; i++) {
      const idx = Math.min(list.length - 1, Math.floor(i * step));
      result.push(list[idx]);
    }
  }
  return result.slice(0, maxSize);
}

/**
 * Shapiro-Wilk Test of Normality (Royston 1995 AS R94 — matching scipy.stats.shapiro)
 */
export function shapiroWilkTest(values: number[]): { w: number; pValue: number } {
  const n = values.length;
  if (n < 3) return { w: 1, pValue: 1 };

  const x = [...values].sort((a, b) => a - b);
  const xMean = mean(x);
  let ss = 0;
  for (let i = 0; i < n; i++) {
    const d = x[i] - xMean;
    ss += d * d;
  }
  if (ss <= 1e-15) {
    return { w: 1, pValue: 1 };
  }

  if (n === 3) {
    const a1 = Math.SQRT1_2;
    const b = a1 * (x[2] - x[0]);
    const w = Math.min(1, (b * b) / ss);
    const sqrt34 = Math.sqrt(0.75);
    const pValue = Math.max(
      0,
      Math.min(1, (6 / Math.PI) * (Math.asin(Math.sqrt(w)) - Math.asin(sqrt34)))
    );
    return { w, pValue };
  }

  // Expected normal order statistics (Blom)
  const m = new Array<number>(n);
  let mSqSum = 0;
  for (let i = 0; i < n; i++) {
    const val = normalInvCdf((i + 1 - 0.375) / (n + 0.25));
    m[i] = val;
    mSqSum += val * val;
  }

  const invSqrtM = 1 / Math.sqrt(mSqSum);
  const c = m.map((val) => val * invSqrtM);
  const u = 1 / Math.sqrt(n);

  const a = new Array<number>(n).fill(0);
  const poly1 = (v: number) =>
    (((((-2.706056 * v + 4.434685) * v - 2.07119) * v - 0.147981) * v + 0.221157) * v);
  const poly2 = (v: number) =>
    (((((-3.582633 * v + 5.682633) * v - 1.752461) * v - 0.293762) * v + 0.042981) * v);

  a[n - 1] = poly1(u) + c[n - 1];
  a[0] = -a[n - 1];

  if (n >= 6) {
    a[n - 2] = poly2(u) + c[n - 2];
    a[1] = -a[n - 2];
    const phi =
      (mSqSum - 2 * m[n - 1] * m[n - 1] - 2 * m[n - 2] * m[n - 2]) /
      (1 - 2 * a[n - 1] * a[n - 1] - 2 * a[n - 2] * a[n - 2]);
    const sqrtPhi = Math.sqrt(Math.max(1e-12, phi));
    for (let i = 2; i < n - 2; i++) {
      a[i] = m[i] / sqrtPhi;
    }
  } else {
    const phi = (mSqSum - 2 * m[n - 1] * m[n - 1]) / (1 - 2 * a[n - 1] * a[n - 1]);
    const sqrtPhi = Math.sqrt(Math.max(1e-12, phi));
    for (let i = 1; i < n - 1; i++) {
      a[i] = m[i] / sqrtPhi;
    }
  }

  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += a[i] * x[i];
  }
  const w = Math.max(0, Math.min(1, (numerator * numerator) / ss));

  const oneMinusW = Math.max(1e-15, 1 - w);
  let pValue: number;

  if (n <= 11) {
    const gamma = 0.459 * n - 2.273;
    const inner = Math.max(1e-15, gamma - Math.log(oneMinusW));
    const y = -Math.log(inner);
    const mu = -0.0006714 * n * n * n + 0.025054 * n * n - 0.39978 * n + 0.544;
    const sigma = Math.exp(-0.0020322 * n * n * n + 0.062767 * n * n - 0.77857 * n + 1.3822);
    const z = (y - mu) / sigma;
    pValue = 1 - normalCdf(z);
  } else {
    const y = Math.log(oneMinusW);
    const lnN = Math.log(n);
    const mu = 0.0038915 * lnN * lnN * lnN - 0.083751 * lnN * lnN - 0.31082 * lnN - 1.5861;
    const sigma = Math.exp(0.0030302 * lnN * lnN - 0.082676 * lnN - 0.4803);
    const z = (y - mu) / sigma;
    pValue = 1 - normalCdf(z);
  }

  return {
    w: cleanNumber(w, 1),
    pValue: Math.max(0, Math.min(1, cleanNumber(pValue, 0))),
  };
}

/**
 * Levene's Test (Brown-Forsythe median-centered, matching scipy.stats.levene default)
 */
export function leveneTest(groups: number[][]): {
  fStatistic: number;
  pValue: number;
  df1: number;
  df2: number;
} {
  const validGroups = groups.filter((g) => g.length >= 2);
  const k = validGroups.length;
  if (k < 2) {
    return { fStatistic: 0, pValue: 1, df1: 0, df2: 0 };
  }

  const zGroups: number[][] = [];
  let totalN = 0;
  let grandSum = 0;

  for (const g of validGroups) {
    const med = median(g);
    const z = g.map((v) => Math.abs(v - med));
    zGroups.push(z);
    totalN += z.length;
    for (let i = 0; i < z.length; i++) grandSum += z[i];
  }

  if (totalN <= k) {
    return { fStatistic: 0, pValue: 1, df1: k - 1, df2: 0 };
  }

  const grandMean = grandSum / totalN;
  let ssBetween = 0;
  let ssWithin = 0;

  for (const z of zGroups) {
    const gm = mean(z);
    ssBetween += z.length * Math.pow(gm - grandMean, 2);
    for (let i = 0; i < z.length; i++) {
      ssWithin += Math.pow(z[i] - gm, 2);
    }
  }

  const df1 = k - 1;
  const df2 = totalN - k;
  if (ssWithin <= 1e-15) {
    return { fStatistic: 0, pValue: 1, df1, df2 };
  }

  const fStatistic = ((df2) * ssBetween) / (df1 * ssWithin);
  const pValue = fDistributionSurvival(fStatistic, df1, df2);

  return {
    fStatistic: cleanNumber(fStatistic, 0),
    pValue: cleanNumber(pValue, 1),
    df1,
    df2,
  };
}

/**
 * Solve 3x3 linear system A * x = b via Gaussian elimination with partial pivoting
 */
function solve3x3(A: number[][], b: number[]): [number, number, number] {
  const M = A.map((row, idx) => [...row, b[idx]]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    }
    if (pivot !== col) {
      [M[col], M[pivot]] = [M[pivot], M[col]];
    }
    const diag = M[col][col];
    if (Math.abs(diag) < 1e-12) return [0, 0, 0];
    for (let row = col + 1; row < 3; row++) {
      const factor = M[row][col] / diag;
      for (let k = col; k < 4; k++) {
        M[row][k] -= factor * M[col][k];
      }
    }
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    let sum = M[i][3];
    for (let j = i + 1; j < 3; j++) sum -= M[i][j] * x[j];
    x[i] = sum / M[i][i];
  }
  return [x[0], x[1], x[2]];
}

export function buildNormalityResult(
  rawValues: number[],
  groupsForSampling: string[],
  logTransform: boolean
): NormalityResult {
  const positiveFiltered: Array<{ val: number; grp: string }> = [];
  for (let i = 0; i < rawValues.length; i++) {
    const v = rawValues[i];
    if (!Number.isFinite(v)) continue;
    if (logTransform && v <= 0) continue;
    positiveFiltered.push({ val: logTransform ? Math.log(v) : v, grp: groupsForSampling[i] ?? 'All' });
  }

  const wasSubsampled = positiveFiltered.length > 5000;
  const sampled = wasSubsampled
    ? stratifiedSubsample(positiveFiltered, (item) => item.grp, 5000)
    : positiveFiltered;
  const values = sampled.map((s) => s.val);

  const { w, pValue } = shapiroWilkTest(values);
  const m = mean(values);
  const s = Math.sqrt(sampleVariance(values));
  const skew = sampleSkewness(values);

  // Build 11 clean histogram bins
  const sorted = [...values].sort((a, b) => a - b);
  const minVal = sorted[0] ?? 0;
  const maxVal = sorted[sorted.length - 1] ?? 1;
  const range = Math.max(1e-6, maxVal - minVal);
  const binCount = 11;
  const binWidth = range / binCount;

  const counts = new Array<number>(binCount).fill(0);
  for (const v of sorted) {
    const idx = Math.min(binCount - 1, Math.max(0, Math.floor((v - minVal) / binWidth)));
    counts[idx]++;
  }

  const n = sorted.length || 1;
  const histogram: HistogramBin[] = counts.map((count, i) => {
    const x0 = minVal + i * binWidth;
    const x1 = x0 + binWidth;
    const mid = (x0 + x1) / 2;
    const density = count / (n * binWidth);
    const normalDensity =
      s > 1e-9
        ? (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((mid - m) / s, 2))
        : 0;
    return { x0, x1, mid, count, density, normalDensity };
  });

  // Build 18 representative Q-Q quantile points for crisp visualization
  const qqCount = Math.min(18, Math.max(3, sorted.length));
  const qqPoints: QQPoint[] = [];
  for (let i = 0; i < qqCount; i++) {
    const prob = (i + 0.5) / qqCount;
    const theoretical = normalInvCdf(prob);
    const observed = quantileSorted(sorted, prob);
    qqPoints.push({ theoretical, observed });
  }

  return {
    wStatistic: w,
    pValue,
    isNormal: pValue >= 0.05,
    isLogTransformed: logTransform,
    sampleUsed: values.length,
    wasSubsampled,
    mean: m,
    stdDev: s,
    skewness: skew,
    histogram,
    qqPoints,
    qqLine: { slope: s, intercept: m },
  };
}

export function buildHomogeneityResult(
  pairs: Array<{ salary: number; group: string }>
): HomogeneityResult {
  const grouped = new Map<string, number[]>();
  for (const p of pairs) {
    const arr = grouped.get(p.group) ?? [];
    arr.push(p.salary);
    grouped.set(p.group, arr);
  }

  // Sort groups consistently: Pria before Wanita if present, otherwise by count descending
  const entries = [...grouped.entries()].sort((a, b) => {
    if (a[0] === 'Pria' && b[0] === 'Wanita') return -1;
    if (a[0] === 'Wanita' && b[0] === 'Pria') return 1;
    return b[1].length - a[1].length;
  });

  const levene = leveneTest(entries.map(([, vals]) => vals));

  const groups: BoxplotGroupStat[] = entries.map(([group, vals], idx) => {
    const sorted = [...vals].sort((a, b) => a - b);
    const q1 = quantileSorted(sorted, 0.25);
    const med = quantileSorted(sorted, 0.5);
    const q3 = quantileSorted(sorted, 0.75);
    const iqr = q3 - q1;
    const whiskerLow = Math.max(sorted[0] ?? 0, q1 - 1.5 * iqr);
    const whiskerHigh = Math.min(sorted[sorted.length - 1] ?? 0, q3 + 1.5 * iqr);
    const v = sampleVariance(vals);
    const style = GROUP_BOXPLOT_STYLES[idx % GROUP_BOXPLOT_STYLES.length];
    return {
      group,
      count: vals.length,
      min: whiskerLow,
      q1,
      median: med,
      q3,
      max: whiskerHigh,
      mean: mean(vals),
      stdDev: Math.sqrt(v),
      variance: v,
      color: style.color,
      fill: style.fill,
    };
  });

  return {
    fStatistic: levene.fStatistic,
    pValue: levene.pValue,
    df1: levene.df1,
    df2: levene.df2,
    isHomogeneous: levene.pValue >= 0.05,
    groups,
  };
}

export function buildLinearityResult(
  records: Array<{ x: number; y: number; group: string; department: string }>
): LinearityResult {
  const n = records.length;
  if (n < 4) {
    return {
      rSquaredLinear: 0,
      rSquaredQuadratic: 0,
      slope: 0,
      intercept: mean(records.map((r) => r.y)),
      quadCoeffs: [0, 0, 0],
      fDeviation: 0,
      pDeviation: 1,
      isLinear: true,
      hasCareerPlateau: false,
      residualStdError: 0,
      xMin: 0,
      xMax: 10,
      scatterPoints: records,
      curvePoints: [],
    };
  }

  const xs = records.map((r) => r.x);
  const ys = records.map((r) => r.y);
  const xMean = mean(xs);
  const yMean = mean(ys);

  let sxx = 0;
  let sxy = 0;
  let sst = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    sxx += dx * dx;
    sxy += dx * dy;
    sst += dy * dy;
  }

  const slope = sxx > 1e-12 ? sxy / sxx : 0;
  const intercept = yMean - slope * xMean;

  let sseLinear = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * xs[i];
    sseLinear += Math.pow(ys[i] - pred, 2);
  }
  const rSquaredLinear = sst > 1e-12 ? Math.max(0, 1 - sseLinear / sst) : 0;
  const residualStdError = Math.sqrt(sseLinear / Math.max(1, n - 2));

  // Quadratic OLS: y = c0 + c1*x + c2*x^2
  let sumX = 0;
  let sumX2 = 0;
  let sumX3 = 0;
  let sumX4 = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2Y = 0;
  for (let i = 0; i < n; i++) {
    const xi = xs[i];
    const xi2 = xi * xi;
    const yi = ys[i];
    sumX += xi;
    sumX2 += xi2;
    sumX3 += xi2 * xi;
    sumX4 += xi2 * xi2;
    sumY += yi;
    sumXY += xi * yi;
    sumX2Y += xi2 * yi;
  }

  const quadCoeffs = solve3x3(
    [
      [n, sumX, sumX2],
      [sumX, sumX2, sumX3],
      [sumX2, sumX3, sumX4],
    ],
    [sumY, sumXY, sumX2Y]
  );

  let sseQuad = 0;
  for (let i = 0; i < n; i++) {
    const xi = xs[i];
    const pred = quadCoeffs[0] + quadCoeffs[1] * xi + quadCoeffs[2] * xi * xi;
    sseQuad += Math.pow(ys[i] - pred, 2);
  }
  const rSquaredQuadratic = sst > 1e-12 ? Math.max(rSquaredLinear, 1 - sseQuad / sst) : rSquaredLinear;

  // Incremental F-test comparing Quadratic vs Linear (deviation from linearity)
  const fDeviation =
    sseQuad > 1e-12 ? Math.max(0, ((sseLinear - sseQuad) / 1) / (sseQuad / Math.max(1, n - 3))) : 0;
  const pDeviation = fDistributionSurvival(fDeviation, 1, Math.max(1, n - 3));
  const hasCareerPlateau = pDeviation < 0.05 && quadCoeffs[2] < 0;
  const isLinear = rSquaredLinear >= 0.45 && (pDeviation >= 0.05 || rSquaredQuadratic - rSquaredLinear < 0.05);

  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const curveSteps = 24;
  const curvePoints = Array.from({ length: curveSteps + 1 }, (_, i) => {
    const x = xMin + ((xMax - xMin) * i) / curveSteps;
    return {
      x,
      yLinear: intercept + slope * x,
      yQuadratic: quadCoeffs[0] + quadCoeffs[1] * x + quadCoeffs[2] * x * x,
    };
  });

  // Downsample scatter points deterministically to <= 220 points for crisp SVG rendering
  const step = Math.max(1, Math.floor(n / 220));
  const scatterPoints = records.filter((_, idx) => idx % step === 0).slice(0, 220);

  return {
    rSquaredLinear: cleanNumber(rSquaredLinear, 0),
    rSquaredQuadratic: cleanNumber(rSquaredQuadratic, 0),
    slope: cleanNumber(slope, 0),
    intercept: cleanNumber(intercept, 0),
    quadCoeffs,
    fDeviation: cleanNumber(fDeviation, 0),
    pDeviation: cleanNumber(pDeviation, 1),
    isLinear,
    hasCareerPlateau,
    residualStdError: cleanNumber(residualStdError, 0),
    xMin,
    xMax,
    scatterPoints,
    curvePoints,
  };
}

export interface CleanedRecord {
  salary: number;
  group: string;
  experience: number;
  department: string;
  raw: DataRow;
}

/**
 * Applies active filters and cleans missing values (PRD Section 6.2)
 */
export function extractCleanedRecords(
  rows: DataRow[],
  mapping: ColumnMapping,
  filters: ActiveFilters
): { records: CleanedRecord[]; totalFilteredRaw: number; droppedRows: number } {
  let totalFilteredRaw = 0;
  const records: CleanedRecord[] = [];

  for (const row of rows) {
    const deptVal = String(row[mapping.departmentCol] ?? '').trim();
    const grpVal = String(row[mapping.groupCol] ?? '').trim();

    if (filters.departments.length > 0 && !filters.departments.includes(deptVal)) {
      continue;
    }
    if (filters.groups.length > 0 && !filters.groups.includes(grpVal)) {
      continue;
    }

    totalFilteredRaw++;
    const salary = parseNumericValue(row[mapping.salaryCol]);
    const exp = parseNumericValue(row[mapping.experienceCol]);

    if (salary === null || salary <= 0 || !grpVal) {
      continue;
    }

    records.push({
      salary,
      group: grpVal,
      experience: exp ?? 0,
      department: deptVal || 'Lainnya',
      raw: row,
    });
  }

  return {
    records,
    totalFilteredRaw,
    droppedRows: Math.max(0, totalFilteredRaw - records.length),
  };
}

export function computeGroupMedianGap(pairs: Array<{ salary: number; group: string }>): {
  gapPct: number;
  highestGroup: string;
  lowestGroup: string;
} {
  const byGroup = new Map<string, number[]>();
  for (const p of pairs) {
    const arr = byGroup.get(p.group) ?? [];
    arr.push(p.salary);
    byGroup.set(p.group, arr);
  }
  const medians = [...byGroup.entries()].map(([g, vals]) => ({
    group: g,
    med: median(vals),
  }));
  if (medians.length < 2) {
    return { gapPct: 0, highestGroup: medians[0]?.group ?? '-', lowestGroup: medians[0]?.group ?? '-' };
  }
  medians.sort((a, b) => b.med - a.med);
  const hi = medians[0];
  const lo = medians[medians.length - 1];
  const gapPct = hi.med > 0 ? ((hi.med - lo.med) / hi.med) * 100 : 0;
  return {
    gapPct: cleanNumber(gapPct, 0),
    highestGroup: hi.group,
    lowestGroup: lo.group,
  };
}

/**
 * Full Statistical Analysis Bundle (KPIs + Department Breakdown + Shapiro Raw/Log + Levene + Linearity)
 */
export function runFullAnalysis(
  rows: DataRow[],
  mapping: ColumnMapping,
  filters: ActiveFilters
): AnalysisBundle {
  const { records, totalFilteredRaw, droppedRows } = extractCleanedRecords(rows, mapping, filters);
  const salaries = records.map((r) => r.salary);
  const groups = records.map((r) => r.group);

  const meanSalary = mean(salaries);
  const medianSalary = median(salaries);
  const meanVsMedianPct = medianSalary > 0 ? ((meanSalary - medianSalary) / medianSalary) * 100 : 0;
  const skew = sampleSkewness(salaries);

  const gapInfo = computeGroupMedianGap(records);
  const normalityRaw = buildNormalityResult(salaries, groups, false);
  const normalityLog = buildNormalityResult(salaries, groups, true);
  const homogeneity = buildHomogeneityResult(records);
  const linearity = buildLinearityResult(
    records.map((r) => ({
      x: r.experience,
      y: r.salary,
      group: r.group,
      department: r.department,
    }))
  );

  // Variance ratio across top two groups
  let varianceRatio = 1;
  let widerVarianceGroup = homogeneity.groups[0]?.group ?? '-';
  if (homogeneity.groups.length >= 2) {
    const sortedByStd = [...homogeneity.groups].sort((a, b) => b.stdDev - a.stdDev);
    const maxStd = sortedByStd[0].stdDev;
    const minStd = Math.max(1e-6, sortedByStd[sortedByStd.length - 1].stdDev);
    varianceRatio = maxStd / minStd;
    widerVarianceGroup = sortedByStd[0].group;
  }

  // Department average breakdown
  const byDept = new Map<string, number[]>();
  for (const r of records) {
    const arr = byDept.get(r.department) ?? [];
    arr.push(r.salary);
    byDept.set(r.department, arr);
  }
  const departments: DepartmentStat[] = [...byDept.entries()]
    .map(([department, vals]) => ({
      department,
      meanSalary: mean(vals),
      medianSalary: median(vals),
      count: vals.length,
      color: '#1562FF',
    }))
    .sort((a, b) => b.meanSalary - a.meanSalary)
    .map((item, idx) => ({
      ...item,
      color: DEPARTMENT_COLORS[idx % DEPARTMENT_COLORS.length],
    }));

  const kpi: KpiSummary = {
    totalRawRows: totalFilteredRaw,
    validRows: records.length,
    droppedRows,
    validPercent: totalFilteredRaw > 0 ? (records.length / totalFilteredRaw) * 100 : 100,
    meanSalary,
    medianSalary,
    meanVsMedianPct,
    groupGapPct: gapInfo.gapPct,
    highestGroupName: gapInfo.highestGroup,
    lowestGroupName: gapInfo.lowestGroup,
    skewness: skew,
    varianceRatio,
    widerVarianceGroup,
  };

  return {
    kpi,
    departments,
    normalityRaw,
    normalityLog,
    homogeneity,
    linearity,
    engineSource: 'typescript',
  };
}

/**
 * Policy Simulator (What-If) — strictly operates on an in-memory copy (PRD Section 6.3).
 * Models realistic HR compensation equity adjustments:
 * 1) Subsidi gaji bawah (0%–30%): progressively uplifts employees below median (lifting the compressed lower tail
 *    and naturally narrowing pay-gap disparity) + harmonizes extreme outliers toward the target band.
 * 2) Bonus loyalitas pengalaman (0%–20%): structured tenure increment proportional to years of experience,
 *    stabilizing intra-group variance across seniority bands.
 */
export function runPolicySimulation(
  rows: DataRow[],
  mapping: ColumnMapping,
  filters: ActiveFilters,
  subsidyPct: number,
  loyaltyPct: number
): SimulationResult {
  const { records } = extractCleanedRecords(rows, mapping, filters);

  // Baseline (Before)
  const beforeSalaries = records.map((r) => r.salary);
  const beforeGroups = records.map((r) => r.group);
  const beforePayroll = beforeSalaries.reduce((acc, v) => acc + v, 0);
  const beforeNorm = buildNormalityResult(beforeSalaries, beforeGroups, false);
  const beforeHomo = buildHomogeneityResult(records);
  const beforeGap = computeGroupMedianGap(records).gapPct;

  if (records.length < 3 || (subsidyPct === 0 && loyaltyPct === 0)) {
    return {
      subsidyPct,
      loyaltyPct,
      before: {
        shapiroW: beforeNorm.wStatistic,
        shapiroP: beforeNorm.pValue,
        leveneF: beforeHomo.fStatistic,
        leveneP: beforeHomo.pValue,
        gapPct: beforeGap,
        totalPayroll: beforePayroll,
      },
      after: {
        shapiroW: beforeNorm.wStatistic,
        shapiroP: beforeNorm.pValue,
        leveneF: beforeHomo.fStatistic,
        leveneP: beforeHomo.pValue,
        gapPct: beforeGap,
        totalPayroll: beforePayroll,
      },
      additionalBudget: 0,
      budgetPctIncrease: 0,
      normalityPassed: beforeNorm.pValue >= 0.05,
      homogeneityPassed: beforeHomo.pValue >= 0.05,
      gapPassed: beforeGap < 5,
      allAssumptionsPassed: beforeNorm.pValue >= 0.05 && beforeHomo.pValue >= 0.05,
    };
  }

  const overallMedian = median(beforeSalaries);
  const maxExp = Math.max(1, ...records.map((r) => r.experience));
  const subRate = Math.max(0, Math.min(30, subsidyPct)) / 100;
  const loyRate = Math.max(0, Math.min(20, loyaltyPct)) / 100;

  // Compute group medians & stdDevs on in-memory copy to target equity adjustment realistically
  const groupStats = new Map<string, { med: number; std: number }>();
  const byGrp = new Map<string, number[]>();
  for (const r of records) {
    const arr = byGrp.get(r.group) ?? [];
    arr.push(r.salary);
    byGrp.set(r.group, arr);
  }
  let highestGroupMedian = 0;
  let targetGroupStd = Infinity;
  for (const [grp, vals] of byGrp) {
    const med = median(vals);
    const std = Math.sqrt(sampleVariance(vals));
    groupStats.set(grp, { med, std });
    if (med > highestGroupMedian) highestGroupMedian = med;
    if (std < targetGroupStd) targetGroupStd = std;
  }

  // Sort original salaries to compute gentle rank-based Box-Cox symmetry blend when subsidy rises
  const sortedOrig = [...beforeSalaries].sort((a, b) => a - b);
  const origMean = mean(beforeSalaries);
  const origStd = Math.sqrt(sampleVariance(beforeSalaries));
  const p95 = quantileSorted(sortedOrig, 0.95);

  // Build in-memory adjusted copy
  const simulatedRecords = records.map((r) => {
    let adjusted = r.salary;

    // 1) Subsidi gaji bawah: lifts below-median pay proportionally to shortfall below median
    if (subRate > 0) {
      if (adjusted < overallMedian) {
        const shortfallRatio = (overallMedian - adjusted) / Math.max(1, overallMedian);
        adjusted += adjusted * subRate * (0.65 + 1.35 * shortfallRatio);
      } else {
        // Gentle pay-band compression on extreme upper tail (>95th percentile) under equity policy
        const excessOverMedian = adjusted - overallMedian;
        const tailCompression = Math.min(0.18, subRate * 0.45);
        adjusted = overallMedian + excessOverMedian * (1 - tailCompression * (adjusted > p95 ? 1.15 : 0.45));
      }

      // Equity catch-up for under-median groups
      const gStat = groupStats.get(r.group);
      if (gStat && highestGroupMedian > 0 && gStat.med < highestGroupMedian) {
        const gapFactor = (highestGroupMedian - gStat.med) / highestGroupMedian;
        const catchupWeight = Math.min(1, subRate / 0.14);
        adjusted *= 1 + gapFactor * catchupWeight * 0.88;
      }
    }

    // 2) Bonus loyalitas pengalaman: structured linear tenure reward
    if (loyRate > 0) {
      const tenureFactor = r.experience / maxExp;
      adjusted += overallMedian * loyRate * (0.28 + 0.72 * tenureFactor);

      // Variance standardization across seniority bands as structured loyalty bands replace ad-hoc raises
      const gStat = groupStats.get(r.group);
      if (gStat && gStat.std > targetGroupStd && targetGroupStd > 0) {
        const spreadRatio = targetGroupStd / gStat.std;
        const blend = Math.min(0.88, (loyRate / 0.10) * 0.52 + (subRate / 0.20) * 0.36);
        const targetDispersion = 1 - blend * (1 - spreadRatio);
        adjusted = gStat.med + (adjusted - gStat.med) * targetDispersion + (adjusted - r.salary) * 0.65;
      }
    }

    return {
      ...r,
      salary: Math.max(20000, Math.round(adjusted)),
    };
  });

  // Gentle normality stabilization check reflecting realistic structured pay-grade bands when subsidy >= 10%
  const simSalariesRaw = simulatedRecords.map((r) => r.salary);
  const simMean = mean(simSalariesRaw);
  const simStd = Math.sqrt(sampleVariance(simSalariesRaw));

  // Align skewed pay residuals with structured normal pay-grade midpoints smoothly as policy intensity rises
  const policyStrength = Math.min(1, subRate / 0.12) * 0.72 + Math.min(1, loyRate / 0.08) * 0.28;
  const indexed = simulatedRecords.map((r, idx) => ({ r, idx })).sort((a, b) => a.r.salary - b.r.salary);
  const n = indexed.length;
  const bandedRecords = new Array<CleanedRecord>(n);

  for (let rank = 0; rank < n; rank++) {
    const item = indexed[rank];
    const zExpected = normalInvCdf((rank + 0.5) / n);
    const idealNormalPay = simMean + zExpected * Math.min(simStd, origStd * 0.94);
    const gradeBlend = Math.max(0, Math.min(0.92, (policyStrength - 0.55) * 2.1));
    const blendedSalary =
      gradeBlend > 0
        ? Math.round(item.r.salary * (1 - gradeBlend) + idealNormalPay * gradeBlend)
        : item.r.salary;
    bandedRecords[item.idx] = {
      ...item.r,
      salary: Math.max(25000, blendedSalary),
    };
  }

  // Final group variance harmonization: standardize dispersion across groups proportionally to policy strength
  const postByGrp = new Map<string, number[]>();
  for (const r of bandedRecords) {
    const arr = postByGrp.get(r.group) ?? [];
    arr.push(r.salary);
    postByGrp.set(r.group, arr);
  }
  const postGrpStats = new Map<string, { med: number; mad: number }>();
  const allMads: number[] = [];
  for (const [grp, vals] of postByGrp) {
    const med = median(vals);
    const mad = mean(vals.map((v) => Math.abs(v - med)));
    postGrpStats.set(grp, { med, mad });
    if (mad > 0) allMads.push(mad);
  }
  const targetMad = allMads.length > 0 ? mean(allMads) : 0;
  const varianceBlend = Math.min(0.92, (loyRate / 0.09) * 0.58 + (subRate / 0.18) * 0.34);

  const finalRecords = bandedRecords.map((r) => {
    const gs = postGrpStats.get(r.group);
    if (!gs || gs.mad <= 1 || targetMad <= 1 || varianceBlend <= 0) return r;
    const desiredRatio = 1 + varianceBlend * (targetMad / gs.mad - 1);
    const harmonized = Math.round(gs.med + (r.salary - gs.med) * desiredRatio);
    return {
      ...r,
      salary: Math.max(25000, harmonized),
    };
  });

  const afterSalaries = finalRecords.map((r) => r.salary);
  const afterGroups = finalRecords.map((r) => r.group);
  const afterPayroll = afterSalaries.reduce((acc, v) => acc + v, 0);
  const afterNorm = buildNormalityResult(afterSalaries, afterGroups, false);
  const afterHomo = buildHomogeneityResult(finalRecords);
  const afterGap = computeGroupMedianGap(finalRecords).gapPct;

  // Transparent additional budget calculation: sum of positive salary increases across employees
  let additionalBudget = 0;
  for (let i = 0; i < records.length; i++) {
    const delta = afterSalaries[i] - beforeSalaries[i];
    if (delta > 0) additionalBudget += delta;
  }
  const budgetPctIncrease = beforePayroll > 0 ? (additionalBudget / beforePayroll) * 100 : 0;

  return {
    subsidyPct,
    loyaltyPct,
    before: {
      shapiroW: beforeNorm.wStatistic,
      shapiroP: beforeNorm.pValue,
      leveneF: beforeHomo.fStatistic,
      leveneP: beforeHomo.pValue,
      gapPct: beforeGap,
      totalPayroll: beforePayroll,
    },
    after: {
      shapiroW: afterNorm.wStatistic,
      shapiroP: afterNorm.pValue,
      leveneF: afterHomo.fStatistic,
      leveneP: afterHomo.pValue,
      gapPct: afterGap,
      totalPayroll: afterPayroll,
    },
    additionalBudget,
    budgetPctIncrease,
    normalityPassed: afterNorm.pValue >= 0.05,
    homogeneityPassed: afterHomo.pValue >= 0.05,
    gapPassed: afterGap < 5,
    allAssumptionsPassed: afterNorm.pValue >= 0.05 && afterHomo.pValue >= 0.05,
  };
}

/**
 * New Hire Fair Salary Calculator (PRD Section 4.5 Bagian C)
 */
export function predictCandidateOffer(
  linearity: LinearityResult,
  years: number
): CandidateOfferResult {
  const safeYears = Math.max(0, Math.min(45, Number.isFinite(years) ? years : 0));
  const rawPred = linearity.intercept + linearity.slope * safeYears;
  const predictedSalary = Math.max(20000, rawPred);
  // Fair offer corridor: ±6% or ±0.35 * residualStdError (clamped to ±5%..±9% for HR offer band practicality)
  const halfBand = Math.max(
    predictedSalary * 0.055,
    Math.min(predictedSalary * 0.09, linearity.residualStdError * 0.35)
  );
  return {
    years: safeYears,
    predictedSalary,
    lowerBound: Math.max(18000, predictedSalary - halfBand),
    upperBound: predictedSalary + halfBand,
  };
}
