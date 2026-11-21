export type TabId = 'ringkasan' | 'normalitas' | 'homogenitas' | 'linearitas';

export type DatasetKey = 'none' | 'glassdoor' | 'employee_salary' | 'custom';

export interface DataRow {
  [key: string]: string | number | null | undefined;
}

export interface ColumnMapping {
  salaryCol: string;
  groupCol: string;
  experienceCol: string;
  departmentCol: string;
}

export interface DatasetBundle {
  key: DatasetKey;
  name: string;
  shortName: string;
  periodLabel: string;
  sourceLabel: string;
  columns: string[];
  rows: DataRow[];
  defaultMapping: ColumnMapping;
}

export interface ActiveFilters {
  departments: string[]; // empty means all
  groups: string[]; // empty means all
}

export interface KpiSummary {
  totalRawRows: number;
  validRows: number;
  droppedRows: number;
  validPercent: number;
  meanSalary: number;
  medianSalary: number;
  meanVsMedianPct: number;
  groupGapPct: number;
  highestGroupName: string;
  lowestGroupName: string;
  skewness: number;
  varianceRatio: number;
  widerVarianceGroup: string;
}

export interface DepartmentStat {
  department: string;
  meanSalary: number;
  medianSalary: number;
  count: number;
  color: string;
}

export interface HistogramBin {
  x0: number;
  x1: number;
  mid: number;
  count: number;
  density: number;
  normalDensity: number;
}

export interface QQPoint {
  theoretical: number;
  observed: number;
}

export interface NormalityResult {
  wStatistic: number;
  pValue: number;
  isNormal: boolean;
  isLogTransformed: boolean;
  sampleUsed: number;
  wasSubsampled: boolean;
  mean: number;
  stdDev: number;
  skewness: number;
  histogram: HistogramBin[];
  qqPoints: QQPoint[];
  qqLine: { slope: number; intercept: number };
}

export interface BoxplotGroupStat {
  group: string;
  count: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  stdDev: number;
  variance: number;
  color: string;
  fill: string;
}

export interface HomogeneityResult {
  fStatistic: number;
  pValue: number;
  df1: number;
  df2: number;
  isHomogeneous: boolean;
  groups: BoxplotGroupStat[];
}

export interface ScatterPoint {
  x: number;
  y: number;
  group: string;
  department: string;
}

export interface CurvePoint {
  x: number;
  yLinear: number;
  yQuadratic: number;
}

export interface LinearityResult {
  rSquaredLinear: number;
  rSquaredQuadratic: number;
  slope: number;
  intercept: number;
  quadCoeffs: [number, number, number]; // c0, c1, c2
  fDeviation: number;
  pDeviation: number;
  isLinear: boolean;
  hasCareerPlateau: boolean;
  residualStdError: number;
  xMin: number;
  xMax: number;
  scatterPoints: ScatterPoint[];
  curvePoints: CurvePoint[];
}

export interface AnalysisBundle {
  kpi: KpiSummary;
  departments: DepartmentStat[];
  normalityRaw: NormalityResult;
  normalityLog: NormalityResult;
  homogeneity: HomogeneityResult;
  linearity: LinearityResult;
  engineSource: 'python-scipy' | 'python-stdlib' | 'typescript';
}

export interface SimulationResult {
  subsidyPct: number;
  loyaltyPct: number;
  before: {
    shapiroW: number;
    shapiroP: number;
    leveneF: number;
    leveneP: number;
    gapPct: number;
    totalPayroll: number;
  };
  after: {
    shapiroW: number;
    shapiroP: number;
    leveneF: number;
    leveneP: number;
    gapPct: number;
    totalPayroll: number;
  };
  additionalBudget: number;
  budgetPctIncrease: number;
  normalityPassed: boolean;
  homogeneityPassed: boolean;
  gapPassed: boolean;
  allAssumptionsPassed: boolean;
}

export interface CandidateOfferResult {
  years: number;
  predictedSalary: number;
  lowerBound: number;
  upperBound: number;
}
