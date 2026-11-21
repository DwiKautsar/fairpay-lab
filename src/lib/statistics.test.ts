import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { BUILTIN_DATASETS } from './datasets';
import {
  extractCleanedRecords,
  leveneTest,
  predictCandidateOffer,
  runFullAnalysis,
  runPolicySimulation,
  shapiroWilkTest,
  stratifiedSubsample,
} from './statistics';

const EMPTY_FILTERS = { departments: [], groups: [] };

test('Glassdoor built-in dataset has 1,000 rows and expected statistical diagnosis', () => {
  const ds = BUILTIN_DATASETS.glassdoor;
  assert.equal(ds.rows.length, 1000);

  const analysis = runFullAnalysis(ds.rows, ds.defaultMapping, EMPTY_FILTERS);
  assert.equal(analysis.kpi.validRows, 1000);
  assert.equal(analysis.kpi.droppedRows, 0);

  // Mean should be around $70k–$76k and above median (right-skewed)
  assert.ok(analysis.kpi.meanSalary > 66000 && analysis.kpi.meanSalary < 80000);
  assert.ok(analysis.kpi.meanSalary > analysis.kpi.medianSalary);

  // Raw Shapiro-Wilk fails normality (p < 0.05) while Log-transform restores normality (p >= 0.05)
  assert.equal(analysis.normalityRaw.isNormal, false, `Expected raw p < 0.05, got ${analysis.normalityRaw.pValue}`);
  assert.equal(analysis.normalityLog.isNormal, true, `Expected log p >= 0.05, got ${analysis.normalityLog.pValue}`);

  // Raw Levene's Test detects heterogeneous gender variance (p < 0.05)
  assert.equal(
    analysis.homogeneity.isHomogeneous,
    false,
    `Expected Levene p < 0.05, got F=${analysis.homogeneity.fStatistic}, p=${analysis.homogeneity.pValue}`
  );

  // Linearity has clear positive slope and strong R^2
  assert.ok(analysis.linearity.slope > 0);
  assert.ok(analysis.linearity.rSquaredLinear > 0.35);
});

test('Employee Salary built-in dataset has 375 rows and runs full analysis cleanly', () => {
  const ds = BUILTIN_DATASETS.employee_salary;
  assert.equal(ds.rows.length, 375);
  const analysis = runFullAnalysis(ds.rows, ds.defaultMapping, EMPTY_FILTERS);
  assert.equal(analysis.kpi.validRows, 375);
  assert.equal(analysis.departments.length, 3);
  assert.ok(analysis.linearity.rSquaredQuadratic >= analysis.linearity.rSquaredLinear);
});

test('Policy simulator preserves original data immutably and transitions failing tests to passing', () => {
  const ds = BUILTIN_DATASETS.glassdoor;
  const origFirstSalary = ds.rows[0].BasePay;

  // Baseline (0%, 0%) matches raw failing state
  const baseSim = runPolicySimulation(ds.rows, ds.defaultMapping, EMPTY_FILTERS, 0, 0);
  assert.equal(baseSim.normalityPassed, false);
  assert.equal(baseSim.homogeneityPassed, false);
  assert.equal(baseSim.additionalBudget, 0);

  // Strong equity policy (20% subsidy, 9% loyalty) passes both statistical assumptions & narrows gap
  const strongSim = runPolicySimulation(ds.rows, ds.defaultMapping, EMPTY_FILTERS, 20, 9);
  assert.equal(strongSim.normalityPassed, true, `Expected simulated Shapiro p >= 0.05, got ${strongSim.after.shapiroP}`);
  assert.equal(strongSim.homogeneityPassed, true, `Expected simulated Levene p >= 0.05, got ${strongSim.after.leveneP}`);
  assert.ok(strongSim.after.gapPct < strongSim.before.gapPct, 'Expected group gap to decrease');
  assert.ok(strongSim.additionalBudget > 0);

  // Original data never mutated (PRD Section 6.3)
  assert.equal(ds.rows[0].BasePay, origFirstSalary);
});

test('Candidate offer calculator scales monotonically with experience years', () => {
  const ds = BUILTIN_DATASETS.glassdoor;
  const analysis = runFullAnalysis(ds.rows, ds.defaultMapping, EMPTY_FILTERS);
  const junior = predictCandidateOffer(analysis.linearity, 2);
  const mid = predictCandidateOffer(analysis.linearity, 5);
  const senior = predictCandidateOffer(analysis.linearity, 10);

  assert.ok(junior.lowerBound < junior.predictedSalary && junior.predictedSalary < junior.upperBound);
  assert.ok(junior.predictedSalary < mid.predictedSalary);
  assert.ok(mid.predictedSalary < senior.predictedSalary);
});

test('Missing value cleaner drops NaN/null rows and reports dropped count (PRD Section 6.2)', () => {
  const sample = [
    { BasePay: 50000, Gender: 'Pria', Dept: 'IT', YearsExperience: 2 },
    { BasePay: null, Gender: 'Wanita', Dept: 'IT', YearsExperience: 3 },
    { BasePay: 'invalid', Gender: 'Pria', Dept: 'HR', YearsExperience: 4 },
    { BasePay: 62000, Gender: '', Dept: 'HR', YearsExperience: 5 },
    { BasePay: 71000, Gender: 'Wanita', Dept: 'Sales', YearsExperience: 6 },
  ];
  const { records, totalFilteredRaw, droppedRows } = extractCleanedRecords(
    sample,
    { salaryCol: 'BasePay', groupCol: 'Gender', experienceCol: 'YearsExperience', departmentCol: 'Dept' },
    EMPTY_FILTERS
  );
  assert.equal(totalFilteredRaw, 5);
  assert.equal(records.length, 2);
  assert.equal(droppedRows, 3);
});

test('Stratified subsampling caps sample size at 5,000 rows (PRD Section 6.1)', () => {
  const items = Array.from({ length: 6500 }, (_, i) => ({
    val: i,
    grp: i % 2 === 0 ? 'Pria' : 'Wanita',
  }));
  const sampled = stratifiedSubsample(items, (x) => x.grp, 5000);
  assert.equal(sampled.length, 5000);
});

test('Python stats_engine.py CLI agrees with TypeScript Shapiro-Wilk and Levene tests', () => {
  const ds = BUILTIN_DATASETS.glassdoor;
  const salaries = ds.rows.map((r) => Number(r.BasePay));
  const groups = ds.rows.map((r) => String(r.Gender));

  const tsShapiro = shapiroWilkTest(salaries);
  const pria = ds.rows.filter((r) => r.Gender === 'Pria').map((r) => Number(r.BasePay));
  const wanita = ds.rows.filter((r) => r.Gender === 'Wanita').map((r) => Number(r.BasePay));
  const tsLevene = leveneTest([pria, wanita]);

  const pyOut = execFileSync('python3', ['api/stats_engine.py'], {
    input: JSON.stringify({ action: 'analyze', salaries, groups }),
    encoding: 'utf-8',
  });
  const py = JSON.parse(pyOut);

  assert.ok(Math.abs(py.shapiroRaw.wStatistic - tsShapiro.w) < 1e-4);
  assert.ok(Math.abs(py.shapiroRaw.pValue - tsShapiro.pValue) < 1e-4);
  assert.ok(Math.abs(py.levene.fStatistic - tsLevene.fStatistic) < 1e-4);
  assert.ok(Math.abs(py.levene.pValue - tsLevene.pValue) < 1e-4);
});
