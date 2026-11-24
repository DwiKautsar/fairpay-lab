import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import type { DataRow } from '../types/fairpay';
import { formatIntegerId } from '../lib/format';

interface RawDataModalProps {
  open: boolean;
  onClose: () => void;
  datasetName: string;
  columns: string[];
  rows: DataRow[];
}

const PAGE_SIZE = 20;

export function RawDataModal({
  open,
  onClose,
  datasetName,
  columns,
  rows,
}: RawDataModalProps) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = q
      ? rows.filter((row) =>
          columns.some((col) => String(row[col] ?? '').toLowerCase().includes(q))
        )
      : rows;

    if (sortCol) {
      result = [...result].sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortAsc ? av - bv : bv - av;
        }
        return sortAsc
          ? String(av ?? '').localeCompare(String(bv ?? ''))
          : String(bv ?? '').localeCompare(String(av ?? ''));
      });
    }
    return result;
  }, [rows, columns, search, sortCol, sortAsc]);

  if (!open) return null;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (col: string) => {
    setPage(1);
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="raw-data-title"
    >
      <div
        className="fixed inset-0 bg-[#0B1736]/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-[86vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl border border-[#E7EBF3] overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFF2F7] px-6 py-4">
          <div>
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.1em] text-[#1562FF] uppercase">
              DATA MENTAH INTERAKTIF
            </div>
            <h2 id="raw-data-title" className="text-[18px] font-bold text-[#0F172A]">
              {datasetName}
            </h2>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2.5 sm:gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari posisi, divisi, gender..."
                aria-label="Cari data mentah"
                className="w-full sm:w-64 rounded-xl border border-[#DDE3EE] bg-[#F8FAFC] py-2 pl-9 pr-3 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1562FF] focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup tabel data mentah"
              className="shrink-0 rounded-lg p-2 text-[#64748B] hover:bg-[#F3F5F9] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] border-b border-[#E7EBF3]">
              <tr>
                <th className="px-4 py-3 font-mono text-[11px] font-semibold text-[#64748B] w-14">
                  #
                </th>
                {columns.map((col) => {
                  const isSorted = sortCol === col;
                  return (
                    <th key={col} className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleSort(col)}
                        className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                          isSorted ? 'text-[#1562FF]' : 'text-[#334155] hover:text-[#1562FF]'
                        }`}
                      >
                        <span>{col}</span>
                        {isSorted ? (
                          sortAsc ? (
                            <ArrowUp className="h-3.5 w-3.5 text-[#1562FF]" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-[#1562FF]" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-[#94A3B8]" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-[#64748B]">
                    Tidak ada baris yang cocok dengan pencarian &ldquo;{search}&rdquo;.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F8FAFF] transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[12px] text-[#94A3B8] tabular-nums">
                      {(safePage - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    {columns.map((col) => {
                      const val = row[col];
                      const isNumeric = typeof val === 'number';
                      const isPay = /pay|salary|bonus|gaji/i.test(col) && isNumeric;
                      return (
                        <td
                          key={col}
                          className={`px-4 py-2.5 whitespace-nowrap ${
                            isNumeric ? 'font-mono tabular-nums text-[#0F172A]' : 'text-[#334155]'
                          }`}
                        >
                          {isPay
                            ? `$${Math.round(val as number).toLocaleString('en-US')}`
                            : val === null || val === undefined || val === ''
                              ? '—'
                              : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-[#EFF2F7] bg-[#FAFBFE] px-6 py-3 text-[12.5px] text-[#64748B]">
          <div className="tabular-nums">
            Menampilkan <span className="font-semibold text-[#0F172A]">{visibleRows.length}</span> dari{' '}
            <span className="font-semibold text-[#0F172A]">{formatIntegerId(filteredRows.length)}</span> baris
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#334155] hover:bg-[#F3F5F9] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="font-mono text-[12px] tabular-nums text-[#334155]">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#334155] hover:bg-[#F3F5F9] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
