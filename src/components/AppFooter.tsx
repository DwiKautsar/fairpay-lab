import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert, GraduationCap, Users, X } from 'lucide-react';

const DEVELOPERS = [
  {
    name: 'Mohamad Firdiansyah',
    role: 'UI/UX Driven',
    nim: '2402041',
    badgeClass: 'border-[#CFE0FF] bg-[#EEF4FF] text-[#1562FF]',
    dotClass: 'bg-[#1562FF]',
  },
  {
    name: 'Ikbal Miftahudin',
    role: 'QA',
    nim: '2401426',
    badgeClass: 'border-[#C6F1E0] bg-[#ECFDF5] text-[#047857]',
    dotClass: 'bg-[#059669]',
  },
  {
    name: 'Dwi Rasyah Anandifa Kautsar',
    role: 'Product Manager',
    nim: '2401300',
    badgeClass: 'border-[#D7DAFF] bg-[#F1F2FF] text-[#3730A3]',
    dotClass: 'bg-[#4F46E5]',
  },
];

const LECTURER = {
  name: 'Muh. Asriadi AM, S.Pd., M.Pd.',
  course: 'Probabilitas dan Statistika',
};

export function AppFooter() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 12, width: 360 });

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined' || !triggerRef.current) return;
    const vw = window.innerWidth;
    const mobile = vw < 640;
    setIsMobile(mobile);
    if (mobile) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const cardW = Math.min(388, vw - 24);
    const idealLeft = rect.left + rect.width / 2 - cardW / 2;
    const clampedLeft = Math.max(12, Math.min(vw - cardW - 12, idealLeft));
    setCoords({
      top: rect.top - 12,
      left: clampedLeft,
      width: cardW,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onResizeOrScroll = () => updatePosition();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setPinned(false);
      }
    };
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
        setPinned(false);
      }
    };

    window.addEventListener('resize', onResizeOrScroll);
    window.addEventListener('scroll', onResizeOrScroll, true);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('resize', onResizeOrScroll);
      window.removeEventListener('scroll', onResizeOrScroll, true);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, updatePosition]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) return;
    clearCloseTimer();
    updatePosition();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (pinned) return;
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 150);
  };

  const handleClick = () => {
    clearCloseTimer();
    if (open && pinned) {
      setOpen(false);
      setPinned(false);
    } else {
      updatePosition();
      setOpen(true);
      setPinned(true);
    }
  };

  const overlayContent = (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
            INFORMASI TIM PENGEMBANG
          </div>
          <h3 className="mt-0.5 font-display text-[16px] font-bold tracking-tight text-[#0B1221]">
            Kelompok Gemini Stats 5A
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setPinned(false);
          }}
          aria-label="Tutup informasi pengembang"
          className="rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Developers List */}
      <div className="rounded-xl border border-[#E5ECF7] bg-[#F8FAFF] p-3.5">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-[#0C2B7E] uppercase">
          <Users className="h-3.5 w-3.5 text-[#1562FF]" />
          <span>Tim Pengembang</span>
        </div>
        <ul className="mt-2.5 divide-y divide-[#E6EDF8]">
          {DEVELOPERS.map((dev) => (
            <li
              key={dev.nim}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold text-[#0F172A] leading-snug">
                  {dev.name}
                </div>
                <span
                  className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold tracking-tight leading-none ${dev.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${dev.dotClass}`} aria-hidden="true" />
                  {dev.role}
                </span>
              </div>
              <span className="shrink-0 rounded-md bg-[#E8F0FF] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#1562FF] tabular-nums">
                {dev.nim}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Course Lecturer */}
      <div className="rounded-xl border border-[#DCE7FF] bg-[#0C2B7E] p-3.5 text-white">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-[#93C5FD] uppercase">
          <GraduationCap className="h-3.5 w-3.5 text-[#60A5FA]" />
          <span>Dosen Pengampu</span>
        </div>
        <div className="mt-1.5 text-[13.5px] font-bold text-white leading-snug">
          {LECTURER.name}
        </div>
        <div className="mt-0.5 text-[11.5px] text-[#BFDBFE]">
          Mata Kuliah {LECTURER.course}
        </div>
      </div>
    </div>
  );

  return (
    <footer className="mt-auto border-t border-[#E6EDF8]/75 bg-white/55 backdrop-blur-sm px-4 py-4 sm:px-6 lg:px-5 xl:px-7">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[12.5px] text-[#64748B] sm:justify-start">
          <span>&copy; 2026</span>
          <strong className="font-semibold text-[#0F172A]">Kelompok Gemini Stats 5A</strong>
          <span>&middot; FairPay HR Equity Auditor</span>
          <button
            ref={triggerRef}
            type="button"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label="Lihat nama pengembang dan dosen pengampu Kelompok Gemini Stats 5A"
            aria-expanded={open}
            title="Informasi Pengembang & Dosen Pengampu"
            className={`ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] ${
              open
                ? 'bg-[#1562FF] text-white'
                : 'bg-[#E8F0FF] text-[#1562FF] hover:bg-[#1562FF] hover:text-white'
            }`}
          >
            <CircleAlert className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="font-mono text-[11px] text-[#94A3B8]">
          Probabilitas &amp; Statistika
        </div>
      </div>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          isMobile ? (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Informasi Kelompok Gemini Stats 5A"
              className="fixed inset-0 z-[70] flex items-end justify-center bg-[#08153A]/45 p-3 backdrop-blur-[2px]"
              onClick={() => {
                setOpen(false);
                setPinned(false);
              }}
            >
              <div
                ref={popoverRef}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md max-h-[82vh] overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xl"
              >
                {overlayContent}
              </div>
            </div>
          ) : (
            <div
              ref={popoverRef}
              role="dialog"
              aria-label="Informasi Kelompok Gemini Stats 5A"
              onMouseEnter={clearCloseTimer}
              onMouseLeave={handleMouseLeave}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                width: coords.width,
                transform: 'translateY(-100%)',
              }}
              className="z-[70] rounded-2xl border border-[#DCE5F4] bg-white p-4 shadow-[0_18px_44px_rgba(12,43,126,0.18)]"
            >
              {overlayContent}
            </div>
          ),
          document.body
        )}
    </footer>
  );
}
