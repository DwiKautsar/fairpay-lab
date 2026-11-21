import { useEffect, useMemo, useState } from 'react';
import type {
  ActiveFilters,
  ColumnMapping,
  DatasetBundle,
  DatasetKey,
  TabId,
} from './types/fairpay';
import { BUILTIN_DATASETS } from './lib/datasets';
import {
  extractCleanedRecords,
  predictCandidateOffer,
  runFullAnalysis,
  runPolicySimulation,
} from './lib/statistics';
import { exportAuditReportXlsx } from './lib/excel';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { FilterModal } from './components/FilterModal';
import { RawDataModal } from './components/RawDataModal';
import { UploadModal } from './components/UploadModal';
import { RingkasanTab } from './components/tabs/RingkasanTab';
import { NormalitasTab } from './components/tabs/NormalitasTab';
import { HomogenitasTab } from './components/tabs/HomogenitasTab';
import { LinearitasSimulasiTab } from './components/tabs/LinearitasSimulasiTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('ringkasan');
  const [datasetKey, setDatasetKey] = useState<DatasetKey>('glassdoor');
  const [customDataset, setCustomDataset] = useState<DatasetBundle | null>(null);

  const activeDataset: DatasetBundle = useMemo(() => {
    if (datasetKey === 'custom' && customDataset) return customDataset;
    if (datasetKey === 'employee_salary') return BUILTIN_DATASETS.employee_salary;
    return BUILTIN_DATASETS.glassdoor;
  }, [datasetKey, customDataset]);

  const [mapping, setMapping] = useState<ColumnMapping>(activeDataset.defaultMapping);
  const [filters, setFilters] = useState<ActiveFilters>({ departments: [], groups: [] });

  // Interactive test & simulation states
  const [logTransform, setLogTransform] = useState(false);
  const [subsidyPct, setSubsidyPct] = useState(12);
  const [loyaltyPct, setLoyaltyPct] = useState(8);
  const [candidateYears, setCandidateYears] = useState(5);

  // Modals & mobile drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [rawDataModalOpen, setRawDataModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Python API sync result (non-blocking verification against /api/analyze on Vercel / local Python)
  const [pythonVerifiedStats, setPythonVerifiedStats] = useState<{
    shapiroRaw?: { wStatistic: number; pValue: number; isNormal: boolean };
    shapiroLog?: { wStatistic: number; pValue: number; isNormal: boolean };
    levene?: { fStatistic: number; pValue: number; df1: number; df2: number; isHomogeneous: boolean };
    engineSource?: 'python-scipy' | 'python-stdlib' | 'typescript';
  } | null>(null);

  // Sync column mapping and reset filters whenever dataset switches
  const handleSelectDataset = (nextKey: DatasetKey) => {
    setDatasetKey(nextKey);
    const target =
      nextKey === 'custom' && customDataset
        ? customDataset
        : nextKey === 'employee_salary'
          ? BUILTIN_DATASETS.employee_salary
          : BUILTIN_DATASETS.glassdoor;
    setMapping(target.defaultMapping);
    setFilters({ departments: [], groups: [] });
    setLogTransform(false);
  };

  const handleUploadedDataset = (uploaded: DatasetBundle) => {
    setCustomDataset(uploaded);
    setDatasetKey('custom');
    setMapping(uploaded.defaultMapping);
    setFilters({ departments: [], groups: [] });
    setLogTransform(false);
  };

  // Unique values for Filter modal
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    for (const row of activeDataset.rows) {
      const v = String(row[mapping.departmentCol] ?? '').trim();
      if (v) set.add(v);
    }
    return [...set].sort();
  }, [activeDataset.rows, mapping.departmentCol]);

  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    for (const row of activeDataset.rows) {
      const v = String(row[mapping.groupCol] ?? '').trim();
      if (v) set.add(v);
    }
    return [...set].sort();
  }, [activeDataset.rows, mapping.groupCol]);

  // Cleaned records & instant analysis
  const cleaned = useMemo(
    () => extractCleanedRecords(activeDataset.rows, mapping, filters),
    [activeDataset.rows, mapping, filters]
  );

  const localAnalysis = useMemo(
    () => runFullAnalysis(activeDataset.rows, mapping, filters),
    [activeDataset.rows, mapping, filters]
  );

  // Call Python /api/analyze backend when dataset/mapping/filters change
  useEffect(() => {
    let cancelled = false;
    const salaries = cleaned.records.slice(0, 5000).map((r) => r.salary);
    const groups = cleaned.records.slice(0, 5000).map((r) => r.group);
    if (salaries.length < 3) {
      setPythonVerifiedStats(null);
      return;
    }

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salaries, groups }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && data.shapiroRaw && data.levene) {
          setPythonVerifiedStats(data);
        }
      })
      .catch(() => {
        // Fallback seamlessly to local pure-TypeScript statistical engine
      });

    return () => {
      cancelled = true;
    };
  }, [cleaned.records]);

  // Merge Python-verified test statistics into analysis bundle seamlessly
  const analysis = useMemo(() => {
    if (!pythonVerifiedStats) return localAnalysis;
    return {
      ...localAnalysis,
      engineSource: pythonVerifiedStats.engineSource ?? localAnalysis.engineSource,
      normalityRaw: pythonVerifiedStats.shapiroRaw
        ? {
            ...localAnalysis.normalityRaw,
            wStatistic: pythonVerifiedStats.shapiroRaw.wStatistic,
            pValue: pythonVerifiedStats.shapiroRaw.pValue,
            isNormal: pythonVerifiedStats.shapiroRaw.isNormal,
          }
        : localAnalysis.normalityRaw,
      normalityLog: pythonVerifiedStats.shapiroLog
        ? {
            ...localAnalysis.normalityLog,
            wStatistic: pythonVerifiedStats.shapiroLog.wStatistic,
            pValue: pythonVerifiedStats.shapiroLog.pValue,
            isNormal: pythonVerifiedStats.shapiroLog.isNormal,
          }
        : localAnalysis.normalityLog,
      homogeneity: pythonVerifiedStats.levene
        ? {
            ...localAnalysis.homogeneity,
            fStatistic: pythonVerifiedStats.levene.fStatistic,
            pValue: pythonVerifiedStats.levene.pValue,
            isHomogeneous: pythonVerifiedStats.levene.isHomogeneous,
          }
        : localAnalysis.homogeneity,
    };
  }, [localAnalysis, pythonVerifiedStats]);

  // Real-time policy simulation (in-memory copy)
  const simulation = useMemo(
    () => runPolicySimulation(activeDataset.rows, mapping, filters, subsidyPct, loyaltyPct),
    [activeDataset.rows, mapping, filters, subsidyPct, loyaltyPct]
  );

  // Candidate fair salary prediction
  const candidateOffer = useMemo(
    () => predictCandidateOffer(analysis.linearity, candidateYears),
    [analysis.linearity, candidateYears]
  );

  const activeFilterCount = filters.departments.length + filters.groups.length;

  const handleExportReport = () => {
    exportAuditReportXlsx({
      datasetName: activeDataset.name,
      mapping,
      analysis,
      simulation,
      candidateYears,
      offerLower: candidateOffer.lowerBound,
      offerMid: candidateOffer.predictedSalary,
      offerUpper: candidateOffer.upperBound,
      rows: cleaned.records.map((r) => r.raw),
    });
  };

  return (
    <div className="flex min-h-screen bg-white text-[#0F172A]">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeDataset={activeDataset}
        customDataset={customDataset}
        onSelectDataset={handleSelectDataset}
        onOpenUpload={() => setUploadModalOpen(true)}
        validRowCount={analysis.kpi.validRows}
        columnCount={activeDataset.columns.length}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Right Main Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          datasetName={activeDataset.name}
          activeFilterCount={activeFilterCount}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenFilter={() => setFilterModalOpen(true)}
          onExportReport={handleExportReport}
        />

        <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-10 lg:py-6">
          {activeTab === 'ringkasan' && (
            <RingkasanTab
              analysis={analysis}
              periodLabel={activeDataset.periodLabel}
              departmentLabel={mapping.departmentCol}
              groupLabel={mapping.groupCol}
              onNavigateTab={setActiveTab}
              onOpenRawData={() => setRawDataModalOpen(true)}
            />
          )}

          {activeTab === 'normalitas' && (
            <NormalitasTab
              normalityRaw={analysis.normalityRaw}
              normalityLog={analysis.normalityLog}
              logTransform={logTransform}
              onToggleLogTransform={() => setLogTransform((prev) => !prev)}
            />
          )}

          {activeTab === 'homogenitas' && (
            <HomogenitasTab
              homogeneity={analysis.homogeneity}
              groupColumnLabel={mapping.groupCol}
            />
          )}

          {activeTab === 'linearitas' && (
            <LinearitasSimulasiTab
              subsidyPct={subsidyPct}
              loyaltyPct={loyaltyPct}
              onChangeSubsidy={setSubsidyPct}
              onChangeLoyalty={setLoyaltyPct}
              onResetSimulation={() => {
                setSubsidyPct(0);
                setLoyaltyPct(0);
              }}
              simulation={simulation}
              linearity={analysis.linearity}
              candidateYears={candidateYears}
              onChangeCandidateYears={setCandidateYears}
              candidateOffer={candidateOffer}
              experienceLabel={mapping.experienceCol}
            />
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      <FilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        columns={activeDataset.columns}
        mapping={mapping}
        onChangeMapping={setMapping}
        availableDepartments={availableDepartments}
        availableGroups={availableGroups}
        filters={filters}
        onChangeFilters={setFilters}
        onResetAll={() => {
          setMapping(activeDataset.defaultMapping);
          setFilters({ departments: [], groups: [] });
        }}
      />

      <RawDataModal
        open={rawDataModalOpen}
        onClose={() => setRawDataModalOpen(false)}
        datasetName={activeDataset.name}
        columns={activeDataset.columns}
        rows={cleaned.records.map((r) => r.raw)}
      />

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onDatasetLoaded={handleUploadedDataset}
      />
    </div>
  );
}
