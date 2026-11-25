import type ExcelJS from 'exceljs';
import type {
  AnalysisBundle,
  ColumnMapping,
  DataRow,
  DatasetBundle,
  SimulationResult,
} from '../types/fairpay';
import { detectColumnMapping } from './datasets';

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function styleHeaderRow(row: ExcelJS.Row, fillHex = 'FF0C2B7E'): void {
  row.height = 26;
  row.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillHex } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0C2B7E' } },
      bottom: { style: 'medium', color: { argb: 'FF1562FF' } },
      left: { style: 'thin', color: { argb: 'FF1D44A8' } },
      right: { style: 'thin', color: { argb: 'FF1D44A8' } },
    };
  });
}

function styleDataRows(ws: ExcelJS.Worksheet, startRow: number, endRow: number): void {
  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    row.height = 21;
    const isAlt = (r - startRow) % 2 === 1;
    row.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10.5, color: { argb: 'FF0F172A' } };
      if (isAlt) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
      cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'right' : 'left' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  }
}

function addBannerTitle(
  ws: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  mergeCols: number
): void {
  ws.mergeCells(1, 1, 1, mergeCols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C2B7E' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 34;

  ws.mergeCells(2, 1, 2, mergeCols);
  const subCell = ws.getCell(2, 1);
  subCell.value = subtitle;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFDBEAFE' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1562FF' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 22;
}

/**
 * Parse user-uploaded CSV or Excel (.xlsx / .xls) file into a DatasetBundle
 */
export async function parseUploadedSpreadsheet(file: File): Promise<DatasetBundle> {
  const [buffer, XLSX] = await Promise.all([file.arrayBuffer(), import('xlsx')]);
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
 * Download complete 9-column starter Excel template matching Glassdoor HR Audit schema
 * (20 realistic sample rows across 5 divisions + Panduan Pengisian sheet)
 */
export async function downloadExcelTemplate(): Promise<void> {
  const sampleRows = [
    { JobTitle: 'Software Engineer', Gender: 'Pria', Age: 29, PerfEval: 4, Education: 'College', Dept: 'Engineering', YearsExperience: 4.5, BasePay: 88000, Bonus: 9200 },
    { JobTitle: 'Software Engineer', Gender: 'Wanita', Age: 28, PerfEval: 4, Education: 'College', Dept: 'Engineering', YearsExperience: 4.2, BasePay: 84500, Bonus: 8600 },
    { JobTitle: 'Senior Backend Engineer', Gender: 'Pria', Age: 36, PerfEval: 5, Education: 'Masters', Dept: 'Engineering', YearsExperience: 10.5, BasePay: 118000, Bonus: 14500 },
    { JobTitle: 'Data Scientist', Gender: 'Wanita', Age: 33, PerfEval: 5, Education: 'PhD', Dept: 'Engineering', YearsExperience: 7.5, BasePay: 106000, Bonus: 12100 },
    { JobTitle: 'DevOps Engineer', Gender: 'Pria', Age: 32, PerfEval: 3, Education: 'College', Dept: 'Engineering', YearsExperience: 6.0, BasePay: 94000, Bonus: 8400 },
    { JobTitle: 'Account Executive', Gender: 'Pria', Age: 34, PerfEval: 4, Education: 'College', Dept: 'Sales', YearsExperience: 6.5, BasePay: 79000, Bonus: 11500 },
    { JobTitle: 'Account Executive', Gender: 'Wanita', Age: 31, PerfEval: 4, Education: 'Masters', Dept: 'Sales', YearsExperience: 5.5, BasePay: 75500, Bonus: 10200 },
    { JobTitle: 'Sales Manager', Gender: 'Pria', Age: 42, PerfEval: 5, Education: 'Masters', Dept: 'Sales', YearsExperience: 13.0, BasePay: 98000, Bonus: 15200 },
    { JobTitle: 'Sales Representative', Gender: 'Wanita', Age: 25, PerfEval: 3, Education: 'High School', Dept: 'Sales', YearsExperience: 2.0, BasePay: 56000, Bonus: 5200 },
    { JobTitle: 'Marketing Analyst', Gender: 'Wanita', Age: 27, PerfEval: 4, Education: 'College', Dept: 'Marketing', YearsExperience: 3.2, BasePay: 65000, Bonus: 5400 },
    { JobTitle: 'Growth Marketer', Gender: 'Pria', Age: 30, PerfEval: 4, Education: 'Masters', Dept: 'Marketing', YearsExperience: 5.0, BasePay: 73500, Bonus: 6800 },
    { JobTitle: 'Brand Manager', Gender: 'Wanita', Age: 38, PerfEval: 5, Education: 'Masters', Dept: 'Marketing', YearsExperience: 11.2, BasePay: 89000, Bonus: 9600 },
    { JobTitle: 'Content Strategist', Gender: 'Pria', Age: 26, PerfEval: 3, Education: 'College', Dept: 'Marketing', YearsExperience: 2.5, BasePay: 59000, Bonus: 4100 },
    { JobTitle: 'Operations Lead', Gender: 'Pria', Age: 37, PerfEval: 4, Education: 'College', Dept: 'Operations', YearsExperience: 8.5, BasePay: 76000, Bonus: 6900 },
    { JobTitle: 'Operations Analyst', Gender: 'Wanita', Age: 29, PerfEval: 4, Education: 'College', Dept: 'Operations', YearsExperience: 4.0, BasePay: 62500, Bonus: 5000 },
    { JobTitle: 'Supply Chain Specialist', Gender: 'Pria', Age: 35, PerfEval: 3, Education: 'Masters', Dept: 'Operations', YearsExperience: 7.0, BasePay: 71000, Bonus: 5800 },
    { JobTitle: 'Logistics Coordinator', Gender: 'Wanita', Age: 24, PerfEval: 3, Education: 'High School', Dept: 'Operations', YearsExperience: 1.5, BasePay: 51500, Bonus: 3600 },
    { JobTitle: 'HR Generalist', Gender: 'Wanita', Age: 31, PerfEval: 4, Education: 'College', Dept: 'Human Resources', YearsExperience: 5.2, BasePay: 61000, Bonus: 4800 },
    { JobTitle: 'People Partner', Gender: 'Pria', Age: 35, PerfEval: 4, Education: 'Masters', Dept: 'Human Resources', YearsExperience: 8.0, BasePay: 69500, Bonus: 5900 },
    { JobTitle: 'HR Manager', Gender: 'Wanita', Age: 44, PerfEval: 5, Education: 'Masters', Dept: 'Human Resources', YearsExperience: 14.5, BasePay: 86000, Bonus: 8900 },
  ];

  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FairPay — HR Equity Auditor';
  wb.created = new Date();

  const ws = wb.addWorksheet('Template_FairPay', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { header: 'JobTitle', key: 'JobTitle', width: 24 },
    { header: 'Gender', key: 'Gender', width: 12 },
    { header: 'Age', key: 'Age', width: 10 },
    { header: 'PerfEval', key: 'PerfEval', width: 12 },
    { header: 'Education', key: 'Education', width: 15 },
    { header: 'Dept', key: 'Dept', width: 19 },
    { header: 'YearsExperience', key: 'YearsExperience', width: 17 },
    { header: 'BasePay', key: 'BasePay', width: 15 },
    { header: 'Bonus', key: 'Bonus', width: 14 },
  ];

  sampleRows.forEach((row) => ws.addRow(row));
  styleHeaderRow(ws.getRow(1));
  styleDataRows(ws, 2, sampleRows.length + 1);

  // Format currency & numeric columns
  ws.getColumn('BasePay').numFmt = '$#,##0';
  ws.getColumn('Bonus').numFmt = '$#,##0';
  ws.getColumn('YearsExperience').numFmt = '0.0';
  ws.autoFilter = { from: 'A1', to: 'I1' };

  // Sheet 2: Panduan Pengisian Kolom
  const guide = wb.addWorksheet('Panduan_Pengisian', {
    views: [{ state: 'frozen', ySplit: 3 }],
  });
  addBannerTitle(
    guide,
    'Panduan Struktur Template Audit Gaji — FairPay',
    'Struktur 9 kolom lengkap sesuai standar dataset HR Equity (kompatibel langsung dengan seluruh uji statistik FairPay)',
    5
  );
  guide.getRow(3).values = ['Nama Kolom', 'Status', 'Tipe Data', 'Contoh Nilai', 'Digunakan Pada Uji'];
  styleHeaderRow(guide.getRow(3), 'FF1562FF');
  guide.columns = [
    { width: 20 },
    { width: 14 },
    { width: 16 },
    { width: 32 },
    { width: 38 },
  ];

  const guideRows = [
    ['JobTitle', 'Opsional', 'Teks', 'Software Engineer, HR Manager', 'Eksplorasi Data Mentah & Pencarian'],
    ['Gender', 'Wajib (Kelompok)', 'Kategori', 'Pria, Wanita', 'Uji Homogenitas Levene & Kesenjangan Grup'],
    ['Age', 'Opsional', 'Angka Bulat', '24 – 60', 'Konteks Demografi Karyawan'],
    ['PerfEval', 'Opsional', 'Skala 1–5', '1, 2, 3, 4, 5', 'Evaluasi Kinerja & Filter Lanjutan'],
    ['Education', 'Opsional', 'Kategori', 'High School, College, Masters, PhD', 'Alternatif Kolom Kelompok (Homogenitas)'],
    ['Dept', 'Wajib (Divisi)', 'Kategori', 'Engineering, Sales, Marketing, Operations, HR', 'Distribusi Rata-rata per Divisi & Filter'],
    ['YearsExperience', 'Wajib (X)', 'Angka Desimal', '1.5, 4.0, 10.5', 'Uji Linearitas Regresi, Bonus Loyalitas & Kalkulator Tawaran'],
    ['BasePay', 'Wajib (Y)', 'Angka / Mata Uang', '56000, 88000, 118000', 'Uji Shapiro-Wilk, Levene, Regresi & Simulasi Kebijakan'],
    ['Bonus', 'Opsional', 'Angka / Mata Uang', '4800, 9200, 14500', 'Analisis Total Kompensasi & Data Mentah'],
  ];
  guideRows.forEach((r) => guide.addRow(r));
  styleDataRows(guide, 4, guideRows.length + 3);

  const buffer = await wb.xlsx.writeBuffer();
  triggerBlobDownload(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    'Template_FairPay_HR_Audit_9Kolom.xlsx'
  );
}

export interface ExportAuditReportParams {
  datasetName: string;
  mapping: ColumnMapping;
  analysis: AnalysisBundle;
  simulation: SimulationResult;
  candidateYears: number;
  offerLower: number;
  offerMid: number;
  offerUpper: number;
  rows: DataRow[];
}

function computeSimulatedRowMetrics(
  row: DataRow,
  mapping: ColumnMapping,
  medianSalary: number,
  subsidyPct: number,
  loyaltyPct: number
) {
  const rawSalary = Number(String(row[mapping.salaryCol] ?? '').replace(/[^0-9.-]/g, ''));
  const salary = Number.isFinite(rawSalary) ? rawSalary : 0;
  const rawExp = Number(String(row[mapping.experienceCol] ?? '').replace(/[^0-9.-]/g, ''));
  const exp = Number.isFinite(rawExp) ? Math.max(0, rawExp) : 0;

  const subsidyMultiplier = salary > 0 && salary < medianSalary ? 1 + subsidyPct / 100 : 1;
  const experienceFactor = Math.min(exp / 10, 1.5);
  const loyaltyAdd = salary * (loyaltyPct / 100) * (experienceFactor * 0.5);
  const simulatedSalary = Math.round(salary * subsidyMultiplier + loyaltyAdd);
  const delta = simulatedSalary - Math.round(salary);
  const pctIncrease = salary > 0 ? Number(((delta / salary) * 100).toFixed(2)) : 0;

  return {
    actualSalary: Math.round(salary),
    simulatedSalary,
    delta,
    pctIncrease,
    belowMedian: salary > 0 && salary < medianSalary ? 'Ya' : 'Tidak',
  };
}

/**
 * Export complete styled multi-sheet Excel (.xlsx) report WITH 4 embedded high-DPI visual diagrams
 * + full formatted tables + complete simulated employee dataset.
 */
export async function exportAuditReportXlsx(params: ExportAuditReportParams): Promise<void> {
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

  const [
    { default: ExcelJS },
    {
      renderDepartmentBarChartPng,
      renderGroupBoxplotChartPng,
      renderNormalityHistogramPng,
      renderSimulationComparisonPng,
    },
  ] = await Promise.all([import('exceljs'), import('./reportCharts')]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'FairPay — HR Equity Auditor';
  wb.created = new Date();
  const timestamp = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Render high-DPI PNG charts cleanly from live analysis data
  const deptChartPng = renderDepartmentBarChartPng(analysis.departments);
  const normChartPng = renderNormalityHistogramPng(analysis.normalityRaw, analysis.normalityLog);
  const boxChartPng = renderGroupBoxplotChartPng(analysis.homogeneity, mapping.groupCol);
  const simChartPng = renderSimulationComparisonPng(simulation);

  // =========================================================================
  // SHEET 1: Ringkasan_Eksekutif (KPI + Embedded Bar Chart per Divisi)
  // =========================================================================
  const wsSummary = wb.addWorksheet('Ringkasan_Eksekutif', {
    views: [{ state: 'frozen', ySplit: 3 }],
  });
  addBannerTitle(
    wsSummary,
    `Laporan Audit Keadilan Gaji — ${datasetName}`,
    `FairPay HR Equity Auditor · Dihasilkan pada ${timestamp} · Sampel valid: ${analysis.kpi.validRows.toLocaleString('id-ID')} karyawan`,
    11
  );

  wsSummary.getRow(4).values = ['Indikator Utama (KPI)', 'Nilai', 'Keterangan / Interpretasi'];
  styleHeaderRow(wsSummary.getRow(4));
  wsSummary.getColumn(1).width = 34;
  wsSummary.getColumn(2).width = 22;
  wsSummary.getColumn(3).width = 40;

  const summaryRows: Array<[string, string | number, string]> = [
    ['Nama Dataset', datasetName, 'Sumber data aktif saat ekspor'],
    ['Kolom Gaji (Y)', mapping.salaryCol, 'Variabel target utama'],
    ['Kolom Kelompok (Homogenitas)', mapping.groupCol, 'Kelompok perbandingan Levene’s Test'],
    ['Kolom Divisi', mapping.departmentCol, 'Pengelompokan rata-rata divisi'],
    ['Kolom Pengalaman (X)', mapping.experienceCol, 'Prediktor regresi linearitas'],
    ['Total Karyawan Valid', analysis.kpi.validRows, `${analysis.kpi.droppedRows} baris tidak valid dikeluarkan`],
    ['Rata-Rata Gaji (USD)', Math.round(analysis.kpi.meanSalary), `${analysis.kpi.meanVsMedianPct >= 0 ? '+' : ''}${analysis.kpi.meanVsMedianPct.toFixed(1)}% dibanding median`],
    ['Median Gaji (USD)', Math.round(analysis.kpi.medianSalary), 'Nilai tengah distribusi gaji'],
    ['Kesenjangan Median Kelompok (%)', Number(analysis.kpi.groupGapPct.toFixed(2)), analysis.kpi.groupGapPct <= 5 ? 'Dalam ambang wajar (≤ 5%)' : 'Perlu ditinjau (> 5%)'],
    ['Skewness Distribusi', Number(analysis.kpi.skewness.toFixed(4)), analysis.kpi.skewness > 0.25 ? 'Miring ke kanan (ekor gaji tinggi)' : 'Relatif simetris'],
    ['Rasio Sebaran Varians', Number(analysis.kpi.varianceRatio.toFixed(2)), `${analysis.kpi.widerVarianceGroup} lebih lebar ${analysis.kpi.varianceRatio.toFixed(1)}×`],
    ['Status Uji Normalitas (Asli)', analysis.normalityRaw.isNormal ? 'Normal' : 'Tidak Normal', `W = ${analysis.normalityRaw.wStatistic.toFixed(3)}, p = ${analysis.normalityRaw.pValue.toFixed(4)}`],
    ['Status Uji Homogenitas', analysis.homogeneity.isHomogeneous ? 'Homogen' : 'Heterogen', `F = ${analysis.homogeneity.fStatistic.toFixed(3)}, p = ${analysis.homogeneity.pValue.toFixed(4)}`],
    ['Status Uji Linearitas', analysis.linearity.isLinear ? 'Cukup Linear' : 'Non-Linear / Plateau', `R² = ${analysis.linearity.rSquaredLinear.toFixed(3)}, F-Dev = ${analysis.linearity.fDeviation.toFixed(3)}`],
  ];
  summaryRows.forEach((r) => wsSummary.addRow(r));
  styleDataRows(wsSummary, 5, 4 + summaryRows.length);
  wsSummary.getCell('B11').numFmt = '$#,##0';
  wsSummary.getCell('B12').numFmt = '$#,##0';
  wsSummary.getCell('B13').numFmt = '0.00"%"';

  if (deptChartPng) {
    const imgId = wb.addImage({ base64: deptChartPng, extension: 'png' });
    wsSummary.addImage(imgId, {
      tl: { col: 4, row: 3.5 },
      ext: { width: 560, height: 270 },
    });
  }

  // =========================================================================
  // SHEET 2: Uji_Statistik (Formal Tests + Histogram & Boxplot Diagrams)
  // =========================================================================
  const wsTests = wb.addWorksheet('Uji_Statistik', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });
  addBannerTitle(
    wsTests,
    'Hasil Pengujian Asumsi Statistik Formal',
    'Shapiro-Wilk Normality Test (Asli & Log), Levene’s Homogeneity Test, dan Regression Linearity Check',
    10
  );
  wsTests.getRow(4).values = [
    'Pengujian Statistik',
    'Statistik Uji',
    'p-value',
    'Status Keputusan (α = 0,05)',
    'Ukuran Sampel',
    'Catatan Interpretasi',
  ];
  styleHeaderRow(wsTests.getRow(4));
  wsTests.columns = [
    { width: 34 },
    { width: 26 },
    { width: 13 },
    { width: 26 },
    { width: 15 },
    { width: 42 },
  ];

  const testRows = [
    [
      'Uji Normalitas Shapiro-Wilk (Data Asli)',
      `W = ${analysis.normalityRaw.wStatistic.toFixed(4)}`,
      Number(analysis.normalityRaw.pValue.toFixed(5)),
      analysis.normalityRaw.isNormal ? 'Distribusi Normal' : 'Tidak Normal',
      analysis.normalityRaw.sampleUsed,
      analysis.normalityRaw.isNormal
        ? 'Sebaran gaji mengikuti pola distribusi normal.'
        : 'Distribusi miring; pertimbangkan transformasi logaritma.',
    ],
    [
      'Uji Normalitas Shapiro-Wilk (Transformasi Log)',
      `W = ${analysis.normalityLog.wStatistic.toFixed(4)}`,
      Number(analysis.normalityLog.pValue.toFixed(5)),
      analysis.normalityLog.isNormal ? 'Distribusi Normal' : 'Tidak Normal',
      analysis.normalityLog.sampleUsed,
      analysis.normalityLog.isNormal
        ? 'Setelah log-transform, asumsi normalitas terpenuhi.'
        : 'Masih terdapat penyimpangan setelah transformasi log.',
    ],
    [
      `Uji Homogenitas Levene (${mapping.groupCol})`,
      `F(${analysis.homogeneity.df1},${analysis.homogeneity.df2}) = ${analysis.homogeneity.fStatistic.toFixed(4)}`,
      Number(analysis.homogeneity.pValue.toFixed(5)),
      analysis.homogeneity.isHomogeneous ? 'Varians Homogen' : 'Varians Heterogen',
      analysis.kpi.validRows,
      analysis.homogeneity.isHomogeneous
        ? 'Variasi sebaran gaji antar kelompok setara.'
        : 'Rentang gaji antar kelompok berbeda signifikan.',
    ],
    [
      'Uji Linearitas Regresi (Linear vs Kuadratik)',
      `R² = ${analysis.linearity.rSquaredLinear.toFixed(4)} | F-Dev = ${analysis.linearity.fDeviation.toFixed(3)}`,
      Number(analysis.linearity.pDeviation.toFixed(5)),
      analysis.linearity.isLinear ? 'Cukup Linear' : 'Terindikasi Plateau / Non-Linear',
      analysis.kpi.validRows,
      `Kenaikan rata-rata ~$${Math.round(analysis.linearity.slope).toLocaleString('id-ID')}/tahun pengalaman.`,
    ],
  ];
  testRows.forEach((r) => wsTests.addRow(r));
  styleDataRows(wsTests, 5, 4 + testRows.length);

  // Status cell badge tinting
  [5, 6, 7, 8].forEach((rowIdx, idx) => {
    const pass =
      idx === 0
        ? analysis.normalityRaw.isNormal
        : idx === 1
          ? analysis.normalityLog.isNormal
          : idx === 2
            ? analysis.homogeneity.isHomogeneous
            : analysis.linearity.isLinear;
    const statusCell = wsTests.getCell(rowIdx, 4);
    statusCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: pass ? 'FFE6F8F1' : 'FFFEECEC' },
    };
    statusCell.font = {
      name: 'Calibri',
      size: 10.5,
      bold: true,
      color: { argb: pass ? 'FF059669' : 'FFDC2626' },
    };
  });

  if (normChartPng) {
    const imgId = wb.addImage({ base64: normChartPng, extension: 'png' });
    wsTests.addImage(imgId, {
      tl: { col: 0, row: 10 },
      ext: { width: 520, height: 260 },
    });
  }
  if (boxChartPng) {
    const imgId = wb.addImage({ base64: boxChartPng, extension: 'png' });
    wsTests.addImage(imgId, {
      tl: { col: 4, row: 10 },
      ext: { width: 520, height: 260 },
    });
  }

  // =========================================================================
  // SHEET 3: Simulasi_Kebijakan (Before vs After + Comparison Diagram)
  // =========================================================================
  const wsSim = wb.addWorksheet('Simulasi_Kebijakan', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });
  addBannerTitle(
    wsSim,
    'Laboratorium Simulasi Kebijakan & Kalkulator Tawaran',
    `Skenario: Subsidi Gaji Bawah +${simulation.subsidyPct}% & Bonus Loyalitas Pengalaman +${simulation.loyaltyPct}%`,
    9
  );
  wsSim.getRow(4).values = ['Parameter / Indikator', 'Sebelum Simulasi', 'Sesudah Simulasi', 'Status Target'];
  styleHeaderRow(wsSim.getRow(4));
  wsSim.columns = [
    { width: 36 },
    { width: 22 },
    { width: 24 },
    { width: 24 },
  ];

  const simRows: Array<[string, string | number, string | number, string]> = [
    ['Subsidi Gaji Bawah (%)', 0, simulation.subsidyPct, 'Parameter Input'],
    ['Bonus Loyalitas Pengalaman (%)', 0, simulation.loyaltyPct, 'Parameter Input'],
    [
      'Normalitas (Shapiro-Wilk p-value)',
      Number(simulation.before.shapiroP.toFixed(4)),
      Number(simulation.after.shapiroP.toFixed(4)),
      simulation.normalityPassed ? 'Lolos (p >= 0,05)' : 'Belum Lolos',
    ],
    [
      'Homogenitas (Levene p-value)',
      Number(simulation.before.leveneP.toFixed(4)),
      Number(simulation.after.leveneP.toFixed(4)),
      simulation.homogeneityPassed ? 'Lolos (p >= 0,05)' : 'Belum Lolos',
    ],
    [
      'Kesenjangan Median Kelompok (%)',
      Number(simulation.before.gapPct.toFixed(2)),
      Number(simulation.after.gapPct.toFixed(2)),
      simulation.gapPassed ? 'Lolos (<= 5%)' : 'Belum Lolos',
    ],
    [
      'Estimasi Tambahan Anggaran (USD/tahun)',
      0,
      Math.round(simulation.additionalBudget),
      `+${simulation.budgetPctIncrease.toFixed(1)}% dari payroll`,
    ],
    [
      `Kalkulator Tawaran (${candidateYears} thn pengalaman)`,
      Math.round(offerLower),
      `${Math.round(offerLower).toLocaleString('id-ID')} – ${Math.round(offerUpper).toLocaleString('id-ID')} (Tengah: $${Math.round(offerMid).toLocaleString('id-ID')})`,
      'Berbasis Garis Regresi',
    ],
  ];
  simRows.forEach((r) => wsSim.addRow(r));
  styleDataRows(wsSim, 5, 4 + simRows.length);
  wsSim.getCell('C10').numFmt = '$#,##0';

  if (simChartPng) {
    const imgId = wb.addImage({ base64: simChartPng, extension: 'png' });
    wsSim.addImage(imgId, {
      tl: { col: 0, row: 13 },
      ext: { width: 580, height: 274 },
    });
  }

  // =========================================================================
  // SHEET 4: Per_Divisi_Kelompok (Division Stats + Group Boxplot Quartiles)
  // =========================================================================
  const wsBreakdown = wb.addWorksheet('Per_Divisi_Kelompok', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });
  addBannerTitle(
    wsBreakdown,
    'Rincian Statistik per Divisi & per Kelompok',
    `Pemecahan rata-rata divisi (${mapping.departmentCol}) dan kuartil boxplot (${mapping.groupCol})`,
    9
  );
  wsBreakdown.getRow(4).values = [
    'Divisi',
    'Jumlah Karyawan',
    'Rata-Rata Gaji (USD)',
    'Median Gaji (USD)',
    '',
    `Kelompok (${mapping.groupCol})`,
    'Jumlah',
    'Min / Q1 / Median / Q3 / Max (USD)',
    'Std Dev (USD)',
  ];
  styleHeaderRow(wsBreakdown.getRow(4));
  wsBreakdown.columns = [
    { width: 22 },
    { width: 17 },
    { width: 20 },
    { width: 19 },
    { width: 4 },
    { width: 20 },
    { width: 11 },
    { width: 38 },
    { width: 16 },
  ];

  const maxBreakdownLen = Math.max(analysis.departments.length, analysis.homogeneity.groups.length);
  for (let i = 0; i < maxBreakdownLen; i++) {
    const d = analysis.departments[i];
    const g = analysis.homogeneity.groups[i];
    const row = wsBreakdown.addRow([
      d ? d.department : '',
      d ? d.count : '',
      d ? Math.round(d.meanSalary) : '',
      d ? Math.round(d.medianSalary) : '',
      '',
      g ? g.group : '',
      g ? g.count : '',
      g
        ? `$${Math.round(g.min).toLocaleString('id-ID')} / $${Math.round(g.q1).toLocaleString('id-ID')} / $${Math.round(g.median).toLocaleString('id-ID')} / $${Math.round(g.q3).toLocaleString('id-ID')} / $${Math.round(g.max).toLocaleString('id-ID')}`
        : '',
      g ? Math.round(g.stdDev) : '',
    ]);
    if (d) {
      row.getCell(3).numFmt = '$#,##0';
      row.getCell(4).numFmt = '$#,##0';
    }
    if (g) {
      row.getCell(9).numFmt = '$#,##0';
    }
  }
  styleDataRows(wsBreakdown, 5, 4 + maxBreakdownLen);

  // =========================================================================
  // SHEET 5: Data_Analisis_Lengkap (All Filtered Rows + Computed Simulation Columns)
  // =========================================================================
  const wsData = wb.addWorksheet('Data_Analisis_Lengkap', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  const cappedRows = rows.slice(0, 10000);
  const originalCols = Object.keys(cappedRows[0] ?? {});
  const extraCols = [
    'Gaji_Aktual_USD',
    'Gaji_Simulasi_USD',
    'Selisih_Simulasi_USD',
    'Kenaikan_Simulasi_Pct',
    'Di_Bawah_Median',
  ];
  const allCols = [...originalCols, ...extraCols];
  wsData.columns = allCols.map((col) => ({
    header: col,
    key: col,
    width: Math.min(26, Math.max(13, col.length + 4)),
  }));

  cappedRows.forEach((row) => {
    const sim = computeSimulatedRowMetrics(
      row,
      mapping,
      analysis.kpi.medianSalary,
      simulation.subsidyPct,
      simulation.loyaltyPct
    );
    wsData.addRow({
      ...row,
      Gaji_Aktual_USD: sim.actualSalary,
      Gaji_Simulasi_USD: sim.simulatedSalary,
      Selisih_Simulasi_USD: sim.delta,
      Kenaikan_Simulasi_Pct: sim.pctIncrease,
      Di_Bawah_Median: sim.belowMedian,
    });
  });

  styleHeaderRow(wsData.getRow(1));
  styleDataRows(wsData, 2, cappedRows.length + 1);
  wsData.getColumn('Gaji_Aktual_USD').numFmt = '$#,##0';
  wsData.getColumn('Gaji_Simulasi_USD').numFmt = '$#,##0';
  wsData.getColumn('Selisih_Simulasi_USD').numFmt = '+$#,##0;-$#,##0;$0';
  wsData.getColumn('Kenaikan_Simulasi_Pct').numFmt = '0.00"%"';
  wsData.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: allCols.length },
  };

  const safeSlug = datasetName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const buffer = await wb.xlsx.writeBuffer();
  triggerBlobDownload(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `Laporan_Audit_FairPay_${safeSlug}.xlsx`
  );
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export complete, Excel-compatible UTF-8 BOM CSV containing every filtered row
 * enriched with simulated policy salary, delta, and key audit benchmark columns.
 */
export function exportAuditReportCsv(params: ExportAuditReportParams): void {
  const { datasetName, mapping, analysis, simulation, rows } = params;
  const originalCols = Object.keys(rows[0] ?? {});
  const auditCols = [
    'Gaji_Aktual_USD',
    'Gaji_Simulasi_USD',
    'Selisih_Simulasi_USD',
    'Kenaikan_Simulasi_Pct',
    'Di_Bawah_Median',
    'Subsidi_Simulasi_Pct',
    'Bonus_Loyalitas_Pct',
    'Median_Dataset_USD',
    'Shapiro_W_Asli',
    'Shapiro_P_Asli',
    'Levene_F',
    'Levene_P',
    'Linearitas_R2',
  ];

  const headers = [...originalCols, ...auditCols];
  const lines: string[] = [headers.map(escapeCsvCell).join(',')];

  const medianRounded = Math.round(analysis.kpi.medianSalary);
  const shapiroW = analysis.normalityRaw.wStatistic.toFixed(4);
  const shapiroP = analysis.normalityRaw.pValue.toFixed(5);
  const leveneF = analysis.homogeneity.fStatistic.toFixed(4);
  const leveneP = analysis.homogeneity.pValue.toFixed(5);
  const linR2 = analysis.linearity.rSquaredLinear.toFixed(4);

  for (const row of rows) {
    const sim = computeSimulatedRowMetrics(
      row,
      mapping,
      analysis.kpi.medianSalary,
      simulation.subsidyPct,
      simulation.loyaltyPct
    );
    const values = [
      ...originalCols.map((col) => row[col]),
      sim.actualSalary,
      sim.simulatedSalary,
      sim.delta,
      sim.pctIncrease,
      sim.belowMedian,
      simulation.subsidyPct,
      simulation.loyaltyPct,
      medianRounded,
      shapiroW,
      shapiroP,
      leveneF,
      leveneP,
      linR2,
    ];
    lines.push(values.map(escapeCsvCell).join(','));
  }

  // UTF-8 BOM so Microsoft Excel opens Indonesian text & numeric columns cleanly
  const csvContent = `\uFEFF${lines.join('\r\n')}`;
  const safeSlug = datasetName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  triggerBlobDownload(
    new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }),
    `Data_Audit_FairPay_${safeSlug}.csv`
  );
}
