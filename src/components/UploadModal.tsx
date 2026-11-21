import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';
import type { DatasetBundle } from '../types/fairpay';
import { downloadExcelTemplate, parseUploadedSpreadsheet } from '../lib/excel';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onDatasetLoaded: (dataset: DatasetBundle) => void;
}

export function UploadModal({ open, onClose, onDatasetLoaded }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const processFile = async (file: File) => {
    setError(null);
    const validExt = /\.(csv|xlsx|xls)$/i.test(file.name);
    if (!validExt) {
      setError('Format tidak didukung. Harap unggah file .csv, .xlsx, atau .xls.');
      return;
    }

    setLoading(true);
    try {
      const parsed = await parseUploadedSpreadsheet(file);
      onDatasetLoaded(parsed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membaca file dataset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div
        className="fixed inset-0 bg-[#0B1736]/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-[#E7EBF3]">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EFF2F7]">
          <div>
            <div className="font-mono text-[10.5px] font-semibold tracking-[0.1em] text-[#1562FF] uppercase">
              UNGGAH DATASET MANDIRI
            </div>
            <h2 id="upload-modal-title" className="text-[18px] font-bold text-[#0F172A] mt-0.5">
              Impor CSV atau Excel (.xlsx)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog unggah"
            className="rounded-lg p-2 text-[#64748B] hover:bg-[#F3F5F9] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void processFile(file);
          }}
          className={`mt-5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-colors ${
            dragging
              ? 'border-[#1562FF] bg-[#EEF4FF]'
              : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#94A3B8]'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E0ECFF] text-[#1562FF] mb-3">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-[14px] font-semibold text-[#0F172A]">
            {loading ? 'Memproses dataset...' : 'Tarik & lepas file CSV/Excel di sini'}
          </p>
          <p className="mt-1 text-[12.5px] text-[#64748B]">
            Baris bernilai kosong (NaN/Null) akan dibersihkan otomatis sebelum pengujian.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void processFile(file);
            }}
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-xl bg-[#1562FF] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0E51DB] transition-colors cursor-pointer disabled:opacity-60"
          >
            Pilih File dari Komputer
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3.5 text-[12.5px] text-[#B91C1C]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Template download helper (PRD Section 4.1) */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F8F9FC] border border-[#EAEEF5] p-3.5">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-5 w-5 text-[#0F9D78] shrink-0" />
            <div>
              <div className="text-[13px] font-semibold text-[#0F172A]">
                Butuh format kolom standar?
              </div>
              <div className="text-[11.5px] text-[#64748B]">
                Unduh template Excel siap isi untuk uji coba mandiri.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadExcelTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5DCE8] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#1E293B] hover:bg-[#F3F5F9] transition-colors whitespace-nowrap cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[#1562FF]" />
            <span>Unduh Template Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
