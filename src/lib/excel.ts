import * as XLSX from 'xlsx';
import type {
  AnalysisBundle,
  ColumnMapping,
  DataRow,
  DatasetBundle,
  SimulationResult,
} from '../types/fairpay';
import { detectColumnMapping } from './datasets';

/**
 * Parse user-uploaded CSV or Excel (.xlsx / .xls) file into a DatasetBundle
 */
export async function parseUploadedSpreadsheet(file: File): Promise<DatasetBundle> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File tidak memiliki sheet yang dapat dibaca.');
  }
  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<DataRow>(sheet, { defval: null });
  if (rawRows.length < 3) {
    throw new Error('Dataset minimal harus memiliki 3 baris data untuk pengujian statistik.');
  }

  const columns = Object.keys(rawRows[0] ?? {});
  if (columns.length < 2) {
    throw new Error('Dataset minimal harus memiliki kolom gaji dan kolom kelompok.');
  }

  const defaultMapping = detectColumnMapping(columns, rawRows);
  const cleanName = file.name.replace(/\.(csv|xlsx|xls)$/i, '');

  return {
    key: 'custom',
    name: cleanName,
    shortName: cleanName.length > 22 ? `${cleanName.slice(0, 20)}…` : cleanName,
    periodLabel: 'Dataset Unggahan',
    sourceLabel: file.name,
    columns,
    rows: rawRows,
    defaultMapping,
  };
}

/**
 * Download starter Excel template (PRD Section 4.1)
 */
export function downloadExcelTemplate(): void {
  const sampleRows = [
    { JobTitle: 'Software Engineer', Gender: 'Pria', Dept: 'Engineering', YearsExperience: 4, BasePay: 86000 },
    { JobTitle: 'Software Engineer', Gender: 'Wanita', Dept: 'Engineering', YearsExperience: 4, BasePay: 83000 },
    { JobTitle: 'Account Executive', Gender: 'Pria', Dept: 'Sales', YearsExperience: 6, BasePay: 78000 },
    { JobTitle: 'Marketing Analyst', Gender: 'Wanita', Dept: 'Marketing', YearsExperience: 3, BasePay: 64000 },
    { JobTitle: 'Operations Lead', Gender: 'Pria', Dept: 'Operations', YearsExperience: 8, BasePay: 74000 },
    { JobTitle: 'HR Generalist', Gender: 'Wanita', Dept: 'Human Resources', YearsExperience: 5, BasePay: 61000 },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Template_FairPay');
  XLSX.writeFile(wb, 'Template_FairPay_HR_Audit.xlsx');
}

/**
 * Export full Audit & Policy Simulation Report to multi-sheet .xlsx (PRD Section 4.5 Bagian D)
 */
export function exportAuditReportXlsx(params: {
  datasetName: string;
  mapping: ColumnMapping;
  analysis: AnalysisBundle;
  simulation: SimulationResult;
  candidateYears: number;
  offerLower: number;
  offerMid: number;
  offerUpper: number;
  rows: DataRow[];
}): void {
  const {
    datasetName,
    mapping,
    analysis,
    simulation,
    candidateYears,
    offerLower,
    offerMid,
    offerUpper,
    rows,
  } = params;

  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan KPI
  const kpiSheet = XLSX.utils.json_to_sheet([
    { Metrik: 'Dataset', Nilai: datasetName },
    { Metrik: 'Kolom Gaji (Y)', Nilai: mapping.salaryCol },
    { Metrik: 'Kolom Kelompok', Nilai: mapping.groupCol },
    { Metrik: 'Kolom Pengalaman (X)', Nilai: mapping.experienceCol },
    { Metrik: 'Total Baris Valid', Nilai: analysis.kpi.validRows },
    { Metrik: 'Baris Kosong Dikeluarkan', Nilai: analysis.kpi.droppedRows },
    { Metrik: 'Rata-rata Gaji (USD)', Nilai: Math.round(analysis.kpi.meanSalary) },
    { Metrik: 'Median Gaji (USD)', Nilai: Math.round(analysis.kpi.medianSalary) },
    { Metrik: 'Kesenjangan Median Kelompok (%)', Nilai: Number(analysis.kpi.groupGapPct.toFixed(2)) },
    { Metrik: 'Skewness Distribusi', Nilai: Number(analysis.kpi.skewness.toFixed(4)) },
    { Metrik: 'Rasio Sebaran Varians', Nilai: Number(analysis.kpi.varianceRatio.toFixed(3)) },
  ]);
  XLSX.utils.book_append_sheet(wb, kpiSheet, 'Ringkasan_KPI');

  // Sheet 2: Hasil Uji Statistik Formal
  const testsSheet = XLSX.utils.json_to_sheet([
    {
      Pengujian: 'Uji Normalitas Shapiro-Wilk (Data Asli)',
      Statistik: `W = ${analysis.normalityRaw.wStatistic.toFixed(4)}`,
      P_Value: Number(analysis.normalityRaw.pValue.toFixed(5)),
      Status: analysis.normalityRaw.isNormal ? 'Normal (p >= 0.05)' : 'Tidak Normal (p < 0.05)',
      Sampel: analysis.normalityRaw.sampleUsed,
    },
    {
      Pengujian: 'Uji Normalitas Shapiro-Wilk (Transformasi Log)',
      Statistik: `W = ${analysis.normalityLog.wStatistic.toFixed(4)}`,
      P_Value: Number(analysis.normalityLog.pValue.toFixed(5)),
      Status: analysis.normalityLog.isNormal ? 'Normal (p >= 0.05)' : 'Tidak Normal (p < 0.05)',
      Sampel: analysis.normalityLog.sampleUsed,
    },
    {
      Pengujian: `Uji Homogenitas Levene (${mapping.groupCol})`,
      Statistik: `F(${analysis.homogeneity.df1},${analysis.homogeneity.df2}) = ${analysis.homogeneity.fStatistic.toFixed(4)}`,
      P_Value: Number(analysis.homogeneity.pValue.toFixed(5)),
      Status: analysis.homogeneity.isHomogeneous ? 'Homogen (p >= 0.05)' : 'Heterogen (p < 0.05)',
      Sampel: analysis.kpi.validRows,
    },
    {
      Pengujian: 'Uji Linearitas Regresi (Linear vs Kuadratik)',
      Statistik: `R² Lin = ${analysis.linearity.rSquaredLinear.toFixed(4)}, F-Dev = ${analysis.linearity.fDeviation.toFixed(4)}`,
      P_Value: Number(analysis.linearity.pDeviation.toFixed(5)),
      Status: analysis.linearity.isLinear ? 'Cukup Linear' : 'Terindikasi Non-Linear / Plateau',
      Sampel: analysis.kpi.validRows,
    },
  ]);
  XLSX.utils.book_append_sheet(wb, testsSheet, 'Uji_Statistik');

  // Sheet 3: Simulasi Kebijakan Before vs After
  const simSheet = XLSX.utils.json_to_sheet([
    { Parameter: 'Subsidi Gaji Bawah (%)', Sebelum: 0, Sesudah: simulation.subsidyPct },
    { Parameter: 'Bonus Loyalitas Pengalaman (%)', Sebelum: 0, Sesudah: simulation.loyaltyPct },
    {
      Parameter: 'Shapiro-Wilk p-value',
      Sebelum: Number(simulation.before.shapiroP.toFixed(4)),
      Sesudah: Number(simulation.after.shapiroP.toFixed(4)),
    },
    {
      Parameter: 'Levene Test p-value',
      Sebelum: Number(simulation.before.leveneP.toFixed(4)),
      Sesudah: Number(simulation.after.leveneP.toFixed(4)),
    },
    {
      Parameter: 'Kesenjangan Median Kelompok (%)',
      Sebelum: Number(simulation.before.gapPct.toFixed(2)),
      Sesudah: Number(simulation.after.gapPct.toFixed(2)),
    },
    {
      Parameter: 'Estimasi Tambahan Anggaran (USD/tahun)',
      Sebelum: 0,
      Sesudah: Math.round(simulation.additionalBudget),
    },
    {
      Parameter: `Kalkulator Tawaran (${candidateYears} tahun pengalaman)`,
      Sebelum: Math.round(offerLower),
      Sesudah: `${Math.round(offerLower)} - ${Math.round(offerUpper)} (Tengah: ${Math.round(offerMid)})`,
    },
  ]);
  XLSX.utils.book_append_sheet(wb, simSheet, 'Simulasi_Kebijakan');

  // Sheet 4: Distribusi per Divisi
  const deptSheet = XLSX.utils.json_to_sheet(
    analysis.departments.map((d) => ({
      Divisi: d.department,
      Jumlah_Karyawan: d.count,
      Rata_Rata_Gaji_USD: Math.round(d.meanSalary),
      Median_Gaji_USD: Math.round(d.medianSalary),
    }))
  );
  XLSX.utils.book_append_sheet(wb, deptSheet, 'Per_Divisi');

  // Sheet 5: Data Mentah (capped at 5,000 rows for snappy download)
  const rawSheet = XLSX.utils.json_to_sheet(rows.slice(0, 5000));
  XLSX.utils.book_append_sheet(wb, rawSheet, 'Data_Analisis');

  const safeSlug = datasetName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  XLSX.writeFile(wb, `Laporan_Audit_FairPay_${safeSlug}.xlsx`);
}
