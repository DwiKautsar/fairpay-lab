/**
 * Indonesian & financial number formatting helpers matching FairPay design mockups
 */

export function formatIntegerId(val: number): string {
  return Math.round(val).toLocaleString('id-ID');
}

export function formatDecimalComma(val: number, decimals = 3): string {
  return val.toFixed(decimals).replace('.', ',');
}

export function formatPValueCompact(p: number): string {
  if (p < 0.001) return '<0.001';
  if (p < 0.1) return p.toFixed(3).replace(/^0/, '');
  return p.toFixed(3);
}

export function formatPValueFull(p: number, useComma = true): string {
  if (p < 0.001) return useComma ? '< 0,001' : '< 0.001';
  const s = p.toFixed(3);
  return useComma ? s.replace('.', ',') : s;
}

export function formatSalaryK(val: number, decimals = 1): string {
  const k = val / 1000;
  if (k >= 1000) {
    const formatted = Math.round(k).toLocaleString('id-ID');
    return `$${formatted}k`;
  }
  return `$${k.toFixed(decimals)}k`;
}

export function formatSalaryKComma(val: number, decimals = 1): string {
  const k = val / 1000;
  return `$${k.toFixed(decimals).replace('.', ',')}k`;
}

export function formatSalaryKWhole(val: number): string {
  const k = Math.round(val / 1000);
  return `$${k}k`;
}

export function formatBudgetK(val: number): string {
  const k = Math.round(val / 1000);
  if (k >= 1000) {
    return `$${k.toLocaleString('id-ID')}k`;
  }
  return `$${k}k`;
}

export function formatPercentComma(val: number, decimals = 1): string {
  return `${val.toFixed(decimals).replace('.', ',')}%`;
}

export function formatPercentDot(val: number, decimals = 1): string {
  return `${val.toFixed(decimals)}%`;
}
