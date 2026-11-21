import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import type { ActiveFilters, ColumnMapping } from '../types/fairpay';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  columns: string[];
  mapping: ColumnMapping;
  onChangeMapping: (next: ColumnMapping) => void;
  availableDepartments: string[];
  availableGroups: string[];
  filters: ActiveFilters;
  onChangeFilters: (next: ActiveFilters) => void;
  onResetAll: () => void;
}

export function FilterModal({
  open,
  onClose,
  columns,
  mapping,
  onChangeMapping,
  availableDepartments,
  availableGroups,
  filters,
  onChangeFilters,
  onResetAll,
}: FilterModalProps) {
  if (!open) return null;

  const toggleDept = (dept: string) => {
    const exists = filters.departments.includes(dept);
    const next = exists
      ? filters.departments.filter((d) => d !== dept)
      : [...filters.departments, dept];
    onChangeFilters({ ...filters, departments: next });
  };

  const toggleGroup = (grp: string) => {
    const exists = filters.groups.includes(grp);
    const next = exists ? filters.groups.filter((g) => g !== grp) : [...filters.groups, grp];
    onChangeFilters({ ...filters, groups: next });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-modal-title"
    >
      <div
        className="fixed inset-0 bg-[#0B1736]/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-[#E7EBF3]">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EFF2F7]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#1562FF]">
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 id="filter-modal-title" className="text-[17px] font-bold text-[#0F172A]">
                Filter & Pemetaan Kolom
              </h2>
              <p className="text-[12.5px] text-[#64748B]">
                Atur variabel pengujian statistik dan cakupan divisi yang dianalisis.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel filter"
            className="rounded-lg p-2 text-[#64748B] hover:bg-[#F3F5F9] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Column Mapping Section (PRD 4.1) */}
          <section>
            <h3 className="font-mono text-[11px] font-semibold tracking-[0.1em] text-[#1562FF] uppercase mb-3">
              PEMETAAN VARIABEL (Y, X, KELOMPOK)
            </h3>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="map-salary"
                  className="block text-[12.5px] font-medium text-[#334155] mb-1.5"
                >
                  Kolom Gaji (Y · Numerik)
                </label>
                <select
                  id="map-salary"
                  value={mapping.salaryCol}
                  onChange={(e) => onChangeMapping({ ...mapping, salaryCol: e.target.value })}
                  className="w-full rounded-xl border border-[#DDE3EE] bg-[#F8FAFC] px-3 py-2 text-[13px] font-medium text-[#0F172A] focus:border-[#1562FF] focus:bg-white focus:outline-none"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="map-group"
                  className="block text-[12.5px] font-medium text-[#334155] mb-1.5"
                >
                  Kolom Kelompok (Uji Levene)
                </label>
                <select
                  id="map-group"
                  value={mapping.groupCol}
                  onChange={(e) => {
                    onChangeMapping({ ...mapping, groupCol: e.target.value });
                    onChangeFilters({ ...filters, groups: [] });
                  }}
                  className="w-full rounded-xl border border-[#DDE3EE] bg-[#F8FAFC] px-3 py-2 text-[13px] font-medium text-[#0F172A] focus:border-[#1562FF] focus:bg-white focus:outline-none"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="map-experience"
                  className="block text-[12.5px] font-medium text-[#334155] mb-1.5"
                >
                  Kolom Pengalaman (X · Numerik)
                </label>
                <select
                  id="map-experience"
                  value={mapping.experienceCol}
                  onChange={(e) => onChangeMapping({ ...mapping, experienceCol: e.target.value })}
                  className="w-full rounded-xl border border-[#DDE3EE] bg-[#F8FAFC] px-3 py-2 text-[13px] font-medium text-[#0F172A] focus:border-[#1562FF] focus:bg-white focus:outline-none"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="map-department"
                  className="block text-[12.5px] font-medium text-[#334155] mb-1.5"
                >
                  Kolom Divisi / Kategori
                </label>
                <select
                  id="map-department"
                  value={mapping.departmentCol}
                  onChange={(e) => {
                    onChangeMapping({ ...mapping, departmentCol: e.target.value });
                    onChangeFilters({ ...filters, departments: [] });
                  }}
                  className="w-full rounded-xl border border-[#DDE3EE] bg-[#F8FAFC] px-3 py-2 text-[13px] font-medium text-[#0F172A] focus:border-[#1562FF] focus:bg-white focus:outline-none"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Department Filter */}
          {availableDepartments.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-mono text-[11px] font-semibold tracking-[0.1em] text-[#1562FF] uppercase">
                  FILTER {mapping.departmentCol.toUpperCase()}
                </h3>
                <span className="text-[11.5px] text-[#64748B]">
                  {filters.departments.length === 0
                    ? 'Semua divisi aktif'
                    : `${filters.departments.length} dipilih`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableDepartments.map((dept) => {
                  const selected = filters.departments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDept(dept)}
                      aria-pressed={selected}
                      className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all border cursor-pointer ${
                        selected
                          ? 'border-[#1562FF] bg-[#EEF4FF] text-[#1562FF]'
                          : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Group Filter */}
          {availableGroups.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-mono text-[11px] font-semibold tracking-[0.1em] text-[#1562FF] uppercase">
                  FILTER {mapping.groupCol.toUpperCase()}
                </h3>
                <span className="text-[11.5px] text-[#64748B]">
                  {filters.groups.length === 0
                    ? 'Semua kelompok aktif'
                    : `${filters.groups.length} dipilih`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableGroups.map((grp) => {
                  const selected = filters.groups.includes(grp);
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => toggleGroup(grp)}
                      aria-pressed={selected}
                      className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all border cursor-pointer ${
                        selected
                          ? 'border-[#1562FF] bg-[#EEF4FF] text-[#1562FF]'
                          : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {grp}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#EFF2F7] pt-4">
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium text-[#64748B] hover:bg-[#F3F5F9] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset default</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#1562FF] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0E51DB] transition-colors cursor-pointer"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}
