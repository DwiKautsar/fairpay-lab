import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Filter, X } from 'lucide-react';
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
import { formatIntegerId } from './lib/format';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AppFooter } from './components/AppFooter';
import { BrandLogo } from './components/BrandLogo';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TabLoadingView } from './components/TabLoadingView';
import { EmptyStateView } from './components/EmptyStateView';
import { FilterModal } from './components/FilterModal';
import { RawDataModal } from './components/RawDataModal';
import { UploadModal } from './components/UploadModal';
import { ToastNotice, type ToastMessage } from './components/ToastNotice';
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
  const [appStage, setAppStage] = useState<'welcome' | 'entering' | 'dashboard'>('welcome');
  const enterTimerRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('ringkasan');
  const [isTabLoading, setIsTabLoading] = useState(false);
  const tabLoadingTimerRef = useRef<number | null>(null);
  // Start with no dataset selected so the initial screen shows a clean empty state
  const [datasetKey, setDatasetKey] = useState<DatasetKey>('none');
  const [customDataset, setCustomDataset] = useState<DatasetBundle | null>(null);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleEnterDashboard = useCallback(() => {
    if (enterTimerRef.current !== null) {
      window.clearTimeout(enterTimerRef.current);
    }
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setAppStage('entering');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
    enterTimerRef.current = window.setTimeout(
      () => {
        setAppStage('dashboard');
        enterTimerRef.current = null;
      },
      prefersReduced ? 320 : 1150
    );
  }, []);

  const handleBackToWelcome = useCallback(() => {
    setMobileMenuOpen(false);
    setAppStage('welcome');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      if (enterTimerRef.current !== null) {
        window.clearTimeout(enterTimerRef.current);
      }
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
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
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (title: string, description?: string, tone: 'success' | 'info' = 'success') => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({ id: Date.now(), title, description, tone });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, 3400);
    },
    []
  );

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
      showToast('Dataset dikosongkan', 'Pilih atau unggah file baru untuk memulai audit.', 'info');
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
    showToast(
      `Dataset ${target.shortName} dimuat`,
      `${formatIntegerId(target.rows.length)} baris siap dianalisis pada seluruh uji statistik.`
    );
  };

  const handleUploadedDataset = (uploaded: DatasetBundle) => {
    setCustomDataset(uploaded);
    setDatasetKey('custom');
    setMapping(uploaded.defaultMapping);
    setFilters({ departments: [], groups: [] });
    setLogTransform(false);
    showToast(
      'File berhasil diimpor',
      `${uploaded.name} (${formatIntegerId(uploaded.rows.length)} baris) siap diaudit.`
    );
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
      showToast(
        'Laporan Excel (.xlsx) diunduh',
        'Berisi 5 sheet lengkap beserta 4 diagram visual dan hasil simulasi.'
      );
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
    showToast(
      'Data lengkap (.csv) diunduh',
      'File UTF-8 BOM siap dibuka langsung di Microsoft Excel.'
    );
  };

  const handleDownloadTemplate = async () => {
    await downloadExcelTemplate();
    showToast(
      'Template Excel (9 Kolom) diunduh',
      'Lengkap dengan 20 contoh data terisi dan sheet panduan.'
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      {/* Branded Entrance Splash Screen */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <AnimatePresence mode="wait">
        {appStage === 'welcome' && (
          <WelcomeScreen key="welcome" onEnterDashboard={handleEnterDashboard} />
        )}

        {appStage === 'entering' && (
          <motion.div
            key="entering"
            role="status"
            aria-label="Membuka Dashboard Audit FairPay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.015 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-screen flex-col items-center justify-center bg-white px-6 select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center"
            >
              <BrandLogo variant="color" className="h-[56px] w-[70px]" />
              <div className="mt-4 font-display text-[20px] font-bold tracking-tight text-[#0B1221]">
                Menyiapkan ruang kerja audit
              </div>
              <div className="mt-1 text-[13px] text-[#64748B]">
                Memuat mesin uji normalitas, homogenitas &amp; simulator kebijakan...
              </div>
              <div className="mt-6 h-[3.5px] w-48 overflow-hidden rounded-full bg-[#E8F0FF]">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full rounded-full bg-gradient-to-r from-[#0C2B7E] via-[#1562FF] to-[#60A5FA]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {appStage === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-screen bg-white text-[#0F172A]"
          >
            {/* Left Navigation Sidebar */}
            <Sidebar
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              activeDataset={activeDataset}
              customDataset={customDataset}
              onSelectDataset={handleSelectDataset}
              onOpenUpload={() => setUploadModalOpen(true)}
              onBackToWelcome={handleBackToWelcome}
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
            onDownloadTemplate={() => void handleDownloadTemplate()}
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
                onDownloadTemplate={() => void handleDownloadTemplate()}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Active Filter Summary Strip for immediate transparency */}
              {activeFilterCount > 0 && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#DCE7FF] bg-[#F5F9FF] px-3.5 py-2.5 text-[12.5px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#0C2B7E]">
                      <Filter className="h-3.5 w-3.5 text-[#1562FF]" />
                      <span>Filter aktif:</span>
                    </span>
                    {filters.departments.map((dept) => (
                      <button
                        key={`dept-${dept}`}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            departments: prev.departments.filter((d) => d !== dept),
                          }))
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-[#BFDBFE] bg-white px-2 py-0.5 text-[12px] font-medium text-[#1E3A8A] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
                      >
                        <span>{dept}</span>
                        <X className="h-3 w-3 text-[#64748B]" />
                      </button>
                    ))}
                    {filters.groups.map((grp) => (
                      <button
                        key={`grp-${grp}`}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            groups: prev.groups.filter((g) => g !== grp),
                          }))
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-[#BFDBFE] bg-white px-2 py-0.5 text-[12px] font-medium text-[#1E3A8A] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
                      >
                        <span>{grp}</span>
                        <X className="h-3 w-3 text-[#64748B]" />
                      </button>
                    ))}
                    <span className="font-mono text-[11.5px] text-[#64748B] tabular-nums">
                      · {formatIntegerId(analysis.kpi.validRows)} baris cocok
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({ departments: [], groups: [] });
                      showToast('Filter direset', 'Seluruh data kembali ditampilkan.', 'info');
                    }}
                    className="text-[12px] font-semibold text-[#1562FF] hover:text-[#0C2B7E] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Reset filter
                  </button>
                </div>
              )}

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
                  onNavigateTab={handleSelectTab}
                />
              )}

              {activeTab === 'homogenitas' && (
                <HomogenitasTab
                  homogeneity={analysis.homogeneity}
                  groupColumnLabel={mapping.groupCol}
                  onNavigateTab={handleSelectTab}
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
                    showToast('Parameter simulasi direset', 'Subsidi dan bonus kembali ke 0%.', 'info');
                  }}
                  simulation={simulation}
                  linearity={analysis.linearity}
                  candidateYears={candidateYears}
                  onChangeCandidateYears={setCandidateYears}
                  candidateOffer={candidateOffer}
                  experienceLabel={mapping.experienceCol}
                  onNavigateTab={handleSelectTab}
                />
              )}
            </motion.div>
          )}
        </main>

              <AppFooter />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <ToastNotice toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
