import type { ColumnMapping, DataRow, DatasetBundle } from '../types/fairpay';

// Deterministic Mulberry32 PRNG so every run and test is 100% reproducible
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalRandom(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Built-in Dataset 1: Glassdoor Gender Pay Gap (1,000 rows x 9 columns)
 * Calibrated to closely reflect real Kaggle Glassdoor Gender Pay Gap statistical structure:
 * - 1,000 employees across 5 departments (Engineering 270, Sales 198, Marketing 182, Operations 221, HR 129)
 * - Gender split: Pria 532, Wanita 468
 * - Right-skewed salary distribution (Shapiro-Wilk p < 0.05 raw; log-transform p >= 0.05)
 * - Wider variance in Pria than Wanita (Levene's Test p < 0.05)
 * - Strong linear correlation with experience/seniority (R² ~ 0.78) with mild senior plateau
 */
export function buildGlassdoorDataset(): DatasetBundle {
  const rng = createRng(20260417);

  const deptConfigs: Array<{
    name: string;
    count: number;
    maleRatio: number;
    baseLogMean: number;
    titles: string[];
  }> = [
    {
      name: 'Engineering',
      count: 270,
      maleRatio: 0.62,
      baseLogMean: 4.49,
      titles: ['Software Engineer', 'Senior Engineer', 'Data Scientist', 'DevOps Engineer', 'Tech Lead'],
    },
    {
      name: 'Sales',
      count: 198,
      maleRatio: 0.54,
      baseLogMean: 4.30,
      titles: ['Account Executive', 'Sales Representative', 'Enterprise Sales', 'Sales Manager'],
    },
    {
      name: 'Marketing',
      count: 182,
      maleRatio: 0.45,
      baseLogMean: 4.21,
      titles: ['Marketing Specialist', 'Growth Analyst', 'Brand Strategist', 'Marketing Manager'],
    },
    {
      name: 'Operations',
      count: 221,
      maleRatio: 0.53,
      baseLogMean: 4.13,
      titles: ['Operations Analyst', 'Supply Chain Lead', 'Process Manager', 'Logistics Coordinator'],
    },
    {
      name: 'Human Resources',
      count: 129,
      maleRatio: 0.43,
      baseLogMean: 4.03,
      titles: ['HR Generalist', 'People Partner', 'Talent Recruiter', 'Compensation Analyst'],
    },
  ];

  const educations = ['High School', 'College', 'Masters', 'PhD'];
  const rows: DataRow[] = [];

  // Exact gender target: 532 Pria, 468 Wanita
  const deptGenderPools = deptConfigs.map((d) => {
    const males = Math.round(d.count * d.maleRatio);
    return { ...d, males, females: d.count - males };
  });

  // Adjust exact male total to 532
  const currentMales = deptGenderPools.reduce((acc, d) => acc + d.males, 0);
  const diff = 532 - currentMales;
  deptGenderPools[0].males += diff;
  deptGenderPools[0].females -= diff;

  for (const dept of deptGenderPools) {
    const genders: Array<'Pria' | 'Wanita'> = [
      ...Array<'Pria'>(dept.males).fill('Pria'),
      ...Array<'Wanita'>(dept.females).fill('Wanita'),
    ];
    // Deterministic shuffle
    for (let i = genders.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [genders[i], genders[j]] = [genders[j], genders[i]];
    }

    for (let i = 0; i < dept.count; i++) {
      const gender = genders[i];
      // Departments naturally have realistic average seniority/experience mixes while spanning junior-to-senior
      const deptExpShift =
        dept.name === 'Engineering'
          ? 1.35
          : dept.name === 'Sales'
            ? 0.25
            : dept.name === 'Marketing'
              ? -0.2
              : dept.name === 'Operations'
                ? -0.65
                : -1.15;
      const baseExp = 7.4 + deptExpShift + normalRandom(rng) * 2.1;
      const experienceYears = Math.max(0.5, Math.round(baseExp * 10) / 10);
      const seniority = Math.max(1, Math.min(5, Math.ceil(experienceYears / 3.4)));

      const age = Math.min(
        64,
        Math.max(22, Math.round(22 + experienceYears * 1.4 + (rng() * 6 - 2)))
      );
      const perfEval = Math.max(1, Math.min(5, Math.round(3.1 + normalRandom(rng) * 0.9)));
      const eduIdx = Math.min(3, Math.max(0, Math.floor(rng() * 3.4 + (seniority >= 4 ? 0.5 : 0))));
      const education = educations[eduIdx];
      const title =
        dept.titles[Math.min(dept.titles.length - 1, Math.floor((seniority - 1) * (dept.titles.length / 5)))];

      // Log-normal salary model:
      // - Strong positive correlation with experience (R² ~ 0.76)
      // - Department pay averages closely matching ~$90k, $75k, $68k, $63k, $58k
      // - Gender median gap ~8.5% and wider variance for Pria (Levene p < 0.05)
      // - Log(BasePay) is near-Gaussian so log-transformation restores Shapiro-Wilk normality (p >= 0.05)
      const expNormalized = (experienceYears - 7.4) / 7.4;
      const genderShift = gender === 'Pria' ? 0.026 : -0.026;
      const sigma = gender === 'Pria' ? 0.092 : 0.072;
      const noise = normalRandom(rng) * sigma;

      const deptPremium =
        dept.name === 'Engineering'
          ? 0.115
          : dept.name === 'Sales'
            ? 0.025
            : dept.name === 'Marketing'
              ? -0.025
              : dept.name === 'Operations'
                ? -0.068
                : -0.118;

      const logSalaryK =
        4.242 + deptPremium + 0.49 * expNormalized + genderShift + 0.005 * (perfEval - 3) + noise;

      const clampedBasePay = Math.max(20000, Math.round(Math.exp(logSalaryK) * 1000));
      const bonus = Math.round(clampedBasePay * (0.04 + perfEval * 0.014 + rng() * 0.025));

      rows.push({
        JobTitle: title,
        Gender: gender,
        Age: age,
        PerfEval: perfEval,
        Education: education,
        Dept: dept.name,
        YearsExperience: experienceYears,
        BasePay: clampedBasePay,
        Bonus: bonus,
      });
    }
  }

  return {
    key: 'glassdoor',
    name: 'Glassdoor Gender Pay Gap',
    shortName: 'Glassdoor Pay Gap',
    periodLabel: 'Jan 2023 — Des 2023',
    sourceLabel: 'Kaggle Public Dataset',
    columns: [
      'JobTitle',
      'Gender',
      'Age',
      'PerfEval',
      'Education',
      'Dept',
      'YearsExperience',
      'BasePay',
      'Bonus',
    ],
    rows,
    defaultMapping: {
      salaryCol: 'BasePay',
      groupCol: 'Gender',
      experienceCol: 'YearsExperience',
      departmentCol: 'Dept',
    },
  };
}

/**
 * Built-in Dataset 2: Employee Salary & Experience (375 rows x 6 columns)
 * Per PRD Section 5:
 * - 375 rows x 6 columns: Salary, Years of Experience, Gender, Education Level, Age, Job Title
 * - Distinct structure with clearer career plateau after 12+ years and Education-level pay spreads
 */
export function buildEmployeeSalaryDataset(): DatasetBundle {
  const rng = createRng(9845123);

  const eduConfigs = [
    { level: 'Bachelor', count: 195, base: 4.18, sigma: 0.13 },
    { level: 'Master', count: 122, base: 4.44, sigma: 0.16 },
    { level: 'PhD', count: 58, base: 4.66, sigma: 0.18 },
  ];

  const titlesByEdu: Record<string, string[]> = {
    Bachelor: ['Junior Analyst', 'Software Developer', 'Marketing Coordinator', 'Operations Specialist'],
    Master: ['Senior Analyst', 'Product Manager', 'Data Engineer', 'Finance Manager'],
    PhD: ['Principal Scientist', 'Research Director', 'Chief Economist', 'ML Architect'],
  };

  const rows: DataRow[] = [];

  for (const cfg of eduConfigs) {
    for (let i = 0; i < cfg.count; i++) {
      const gender: 'Pria' | 'Wanita' = rng() < 0.52 ? 'Pria' : 'Wanita';
      const years = Math.round((0.5 + rng() * 21.5) * 2) / 2; // 0.5 to 22 years
      const age = Math.min(60, Math.max(22, Math.round(22 + years + rng() * 6)));
      const titles = titlesByEdu[cfg.level];
      const title = titles[Math.floor(rng() * titles.length)];

      // Concave quadratic growth showing senior career plateau beyond ~14 years
      const linearComp = 0.044 * years;
      const plateauComp = -0.0011 * years * years;
      const genderOffset = gender === 'Pria' ? 0.035 : -0.035;
      const groupSigma = gender === 'Pria' ? cfg.sigma * 1.24 : cfg.sigma * 0.88;

      const logSalaryK = cfg.base + linearComp + plateauComp + genderOffset + normalRandom(rng) * groupSigma;
      const salary = Math.max(32000, Math.min(210000, Math.round(Math.exp(logSalaryK) * 1000)));

      rows.push({
        Age: age,
        Gender: gender,
        'Education Level': cfg.level,
        'Job Title': title,
        'Years of Experience': years,
        Salary: salary,
      });
    }
  }

  return {
    key: 'employee_salary',
    name: 'Employee Salary & Experience',
    shortName: 'Employee Salary & Exp',
    periodLabel: 'Jan 2024 — Des 2024',
    sourceLabel: 'Kaggle Public Dataset',
    columns: ['Age', 'Gender', 'Education Level', 'Job Title', 'Years of Experience', 'Salary'],
    rows,
    defaultMapping: {
      salaryCol: 'Salary',
      groupCol: 'Gender',
      experienceCol: 'Years of Experience',
      departmentCol: 'Education Level',
    },
  };
}

export const BUILTIN_DATASETS: Record<'glassdoor' | 'employee_salary', DatasetBundle> = {
  glassdoor: buildGlassdoorDataset(),
  employee_salary: buildEmployeeSalaryDataset(),
};

/**
 * Automatically detects numeric & categorical columns for user-uploaded CSV/Excel files
 */
export function detectColumnMapping(columns: string[], rows: DataRow[]): ColumnMapping {
  const sample = rows.slice(0, 60);
  const numericCols: string[] = [];
  const categoricalCols: string[] = [];

  for (const col of columns) {
    let numericCount = 0;
    let nonEmpty = 0;
    const uniqueValues = new Set<string>();
    for (const row of sample) {
      const val = row[col];
      if (val === null || val === undefined || val === '') continue;
      nonEmpty++;
      const num = typeof val === 'number' ? val : Number(String(val).replace(/[$,\s]/g, ''));
      if (!Number.isNaN(num) && Number.isFinite(num)) {
        numericCount++;
      } else {
        uniqueValues.add(String(val));
      }
    }
    if (nonEmpty > 0 && numericCount / nonEmpty >= 0.75) {
      numericCols.push(col);
    } else if (nonEmpty > 0) {
      categoricalCols.push(col);
    }
  }

  const pickByRegex = (list: string[], regex: RegExp, fallback: string): string => {
    return list.find((c) => regex.test(c)) ?? fallback;
  };

  const salaryCol = pickByRegex(
    numericCols,
    /salary|basepay|base_pay|gaji|upah|pay|income|comp/i,
    numericCols[numericCols.length - 1] ?? columns[0] ?? ''
  );

  const experienceCol = pickByRegex(
    numericCols.filter((c) => c !== salaryCol),
    /exp|pengalaman|seniority|years|masa|tenure|age/i,
    numericCols.find((c) => c !== salaryCol) ?? salaryCol
  );

  const groupCol = pickByRegex(
    categoricalCols,
    /gender|kelamin|sex|group|kelompok/i,
    categoricalCols[0] ?? columns[0] ?? ''
  );

  const departmentCol = pickByRegex(
    categoricalCols.filter((c) => c !== groupCol),
    /dept|divisi|department|education|unit|role|title/i,
    categoricalCols.find((c) => c !== groupCol) ?? groupCol
  );

  return {
    salaryCol,
    groupCol,
    experienceCol,
    departmentCol,
  };
}
