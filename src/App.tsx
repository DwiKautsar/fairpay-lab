import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
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
import {
  downloadExcelTemplate,
  exportAuditReportCsv,
  exportAuditReportXlsx,
} from './lib/excel';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SplashScreen } from './components/SplashScreen';
import { TabLoadingView } from './components/TabLoadingView';
import { EmptyStateView } from './components/EmptyStateView';
import { FilterModal } from './components/FilterModal';
import { RawDataModal } from './components/RawDataModal';
import { UploadModal } from './components/UploadModal';
import { RingkasanTab } from './components/tabs/RingkasanTab';
import { NormalitasTab } from './components/tabs/NormalitasTab';
import { HomogenitasTab } from './components/tabs/HomogenitasTab';
import { LinearitasSimulasiTab } from './components/tabs/LinearitasSimulasiTab';

const EMPTY_MAPPING: ColumnMapping = {
  salaryCol: '',
  groupCol: '',
  experienceCol: '',
  departmentCol: '',
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('ringkasan');
  const [isTabLoading, setIsTabLoading] = useState(false);
  const tabLoadingTimerRef = useRef<number | null>(null);
  // Start with no dataset selected so the initial screen shows a clean empty state
  const [datasetKey, setDatasetKey] = useState<DatasetKey>('none');
  const [customDataset, setCustomDataset] = useState<DatasetBundle | null>(null);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleSelectTab = useCallback(
    (nextTab: TabId) => {
      if (nextTab === activeTab) return;
      if (tabLoadingTimerRef.current !== null) {
        window.clearTimeout(tabLoadingTimerRef.current);
      }
      setActiveTab(nextTab);
      setIsTabLoading(true);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      tabLoadingTimerRef.current = window.setTimeout(() => {
        setIsTabLoading(false);
        tabLoadingTimerRef.current = null;
      }, 380);
    },
    [activeTab]
  );

  useEffect(() => {
    return () => {
      if (tabLoadingTimerRef.current !== null) {
        window.clearTimeout(tabLoadingTimerRef.current);
      }
    };
  }, []);

  const activeDataset: DatasetBundle | null = useMemo(() => {
    if (datasetKey === 'none') return null;
    if (datasetKey === 'custom' && customDataset) return customDataset;
    if (datasetKey === 'employee_salary') return BUILTIN_DATASETS.employee_salary;
    if (datasetKey === 'glassdoor') return BUILTIN_DATASETS.glassdoor;
    return null;
  }, [datasetKey, customDataset]);

  const [mapping, setMapping] = useState<ColumnMapping>(EMPTY_MAPPING);
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
  const [isExporting, setIsExporting] = useState(false);

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
    if (nextKey === 'none') {
      setMapping(EMPTY_MAPPING);
      setFilters({ departments: [], groups: [] });
      setLogTransform(false);
      setPythonVerifiedStats(null);
      return;
    }
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
    if (!activeDataset) return [];
    const set = new Set<string>();
    for (const row of activeDataset.rows) {
      const v = String(row[mapping.departmentCol] ?? '').trim();
      if (v) set.add(v);
    }
    return [...set].sort();
  }, [activeDataset, mapping.departmentCol]);

  const availableGroups = useMemo(() => {
    if (!activeDataset) return [];
    const set = new Set<string>();
    for (const row of activeDataset.rows) {
      const v = String(row[mapping.groupCol] ?? '').trim();
      if (v) set.add(v);
    }
    return [...set].sort();
  }, [activeDataset, mapping.groupCol]);

  // Cleaned records & instant analysis
  const cleaned = useMemo(() => {
    if (!activeDataset) return { records: [], totalFilteredRaw: 0, droppedRows: 0 };
    return extractCleanedRecords(activeDataset.rows, mapping, filters);
  }, [activeDataset, mapping, filters]);

  const localAnalysis = useMemo(() => {
    if (!activeDataset) return null;
    return runFullAnalysis(activeDataset.rows, mapping, filters);
  }, [activeDataset, mapping, filters]);

  // Call Python /api/analyze backend when dataset/mapping/filters change
  useEffect(() => {
    if (!activeDataset) {
      setPythonVerifiedStats(null);
      return;
    }
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
  }, [activeDataset, cleaned.records]);

  // Merge Python-verified test statistics into analysis bundle seamlessly
  const analysis = useMemo(() => {
    if (!localAnalysis) return null;
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
  const simulation = useMemo(() => {
    if (!activeDataset) return null;
    return runPolicySimulation(activeDataset.rows, mapping, filters, subsidyPct, loyaltyPct);
  }, [activeDataset, mapping, filters, subsidyPct, loyaltyPct]);

  // Candidate fair salary prediction
  const candidateOffer = useMemo(() => {
    if (!analysis) return null;
    return predictCandidateOffer(analysis.linearity, candidateYears);
  }, [analysis, candidateYears]);

  const activeFilterCount = filters.departments.length + filters.groups.length;

  const handleExportExcel = async () => {
    if (!activeDataset || !analysis || !simulation || !candidateOffer || isExporting) return;
    setIsExporting(true);
    try {
      await exportAuditReportXlsx({
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
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = () => {
    if (!activeDataset || !analysis || !simulation || !candidateOffer) return;
    exportAuditReportCsv({
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
      {/* Branded Entrance Splash Screen */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        activeDataset={activeDataset}
        customDataset={customDataset}
        onSelectDataset={handleSelectDataset}
        onOpenUpload={() => setUploadModalOpen(true)}
        validRowCount={analysis?.kpi.validRows ?? 0}
        columnCount={activeDataset?.columns.length ?? 0}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Right Main Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 w-full">
          <TopBar
            datasetName={activeDataset?.name ?? null}
            hasDataset={Boolean(activeDataset)}
            activeFilterCount={activeFilterCount}
            isExporting={isExporting}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onOpenFilter={() => setFilterModalOpen(true)}
            onExportExcel={() => void handleExportExcel()}
            onExportCsv={handleExportCsv}
            onDownloadTemplate={() => void downloadExcelTemplate()}
          />
          {isTabLoading && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[2.5px] overflow-hidden bg-[#E8F0FF]"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#0C2B7E] via-[#1562FF] to-[#60A5FA]"
              />
            </div>
          )}
        </div>

        <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-6 sm:px-6 sm:py-7 lg:px-10 lg:py-6">
          {isTabLoading ? (
            <TabLoadingView targetTab={activeTab} />
          ) : !activeDataset || !analysis || !simulation || !candidateOffer ? (
            <motion.div
              key={`empty-${activeTab}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <EmptyStateView
                activeTab={activeTab}
                onSelectDataset={handleSelectDataset}
                onOpenUpload={() => setUploadModalOpen(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'ringkasan' && (
                <RingkasanTab
                  analysis={analysis}
                  periodLabel={activeDataset.periodLabel}
                  departmentLabel={mapping.departmentCol}
                  groupLabel={mapping.groupCol}
                  onNavigateTab={handleSelectTab}
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
            </motion.div>
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      {activeDataset && (
        <>
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
        </>
      )}

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onDatasetLoaded={handleUploadedDataset}
      />
    </div>
  );
}
