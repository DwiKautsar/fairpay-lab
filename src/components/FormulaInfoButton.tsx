import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert, X } from 'lucide-react';
import { FORMULAS, type FormulaId } from '../lib/formulas';
import { MathFormula } from './MathFormula';

interface FormulaInfoButtonProps {
  formulaId: FormulaId;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
  className?: string;
}

interface PopoverCoords {
  top: number;
  left: number;
  width: number;
  placement: 'top' | 'bottom';
}

export function FormulaInfoButton({
  formulaId,
  variant = 'light',
  size = 'sm',
  className = '',
}: FormulaInfoButtonProps) {
  const spec = FORMULAS[formulaId];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState<PopoverCoords>({
    top: 0,
    left: 0,
    width: 400,
    placement: 'bottom',
  });

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined' || !triggerRef.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 640;
    setIsMobile(mobile);
    if (mobile) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const cardW = Math.min(416, vw - 24);
    const estCardH = 310;
    const spaceBelow = vh - rect.bottom;
    const placement: 'top' | 'bottom' = spaceBelow < estCardH && rect.top > estCardH ? 'top' : 'bottom';

    const idealLeft = rect.left + rect.width / 2 - cardW / 2;
    const clampedLeft = Math.max(12, Math.min(vw - cardW - 12, idealLeft));
    const top = placement === 'bottom' ? rect.bottom + 10 : rect.top - 10;

    setCoords({ top, left: clampedLeft, width: cardW, placement });
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
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const btnSizeClass = size === 'md' ? 'h-6 w-6' : 'h-[22px] w-[22px]';
  const iconSizeClass = size === 'md' ? 'h-3.5 w-3.5' : 'h-[13.5px] w-[13.5px]';
  const colorClass =
    variant === 'dark'
      ? open
        ? 'bg-white text-[#0C2B7E]'
        : 'bg-white/15 text-[#BFDBFE] hover:bg-white hover:text-[#0C2B7E]'
      : open
        ? 'bg-[#1562FF] text-white'
        : 'bg-[#EEF4FF] text-[#1562FF] hover:bg-[#1562FF] hover:text-white';

  const cardBody = (
    <div className="space-y-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#1562FF] uppercase">
            {spec.category}
          </div>
          <h3 className="mt-0.5 font-display text-[15.5px] font-bold tracking-tight text-[#0B1221]">
            {spec.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
            setPinned(false);
          }}
          aria-label="Tutup panduan rumus"
          className="rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Publication-Grade KaTeX Equation Box */}
      <div className="rounded-xl border border-[#DCE7FF] bg-[#F5F9FF] px-4 py-3">
        <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#1562FF] uppercase mb-1.5">
          Rumus Matematis
        </div>
        <div className="overflow-x-auto py-0.5 text-center">
          <MathFormula latex={spec.formulaLatex} displayMode />
        </div>
      </div>

      {/* Variables Breakdown */}
      <div className="space-y-2">
        <div className="font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#64748B] uppercase">
          Keterangan Variabel
        </div>
        <ul className="space-y-1.5">
          {spec.variables.map((v, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-[12.5px] leading-snug text-[#334155]"
            >
              <span className="mt-0.5 inline-flex min-w-[44px] shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5">
                <MathFormula latex={v.symbolLatex} />
              </span>
              <span className="pt-0.5">{v.desc}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Decision Criteria */}
      <div className="rounded-xl border border-[#E7ECF4] bg-[#F8FAFC] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#475569]">
        <strong className="font-semibold text-[#0F172A]">Cara membaca: </strong>
        {spec.decisionRule}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={`Lihat rumus dan penjelasan ${spec.title}`}
        aria-expanded={open}
        title={`Rumus: ${spec.title}`}
        className={`inline-flex shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] ${btnSizeClass} ${colorClass} ${className}`}
      >
        <CircleAlert className={iconSizeClass} strokeWidth={2.2} />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          isMobile ? (
            /* Mobile Responsive Modal Sheet */
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Rumus ${spec.title}`}
              className="fixed inset-0 z-[70] flex items-end justify-center bg-[#08153A]/45 p-3 backdrop-blur-[2px]"
              onClick={() => {
                setOpen(false);
                setPinned(false);
              }}
            >
              <div
                ref={popoverRef}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md max-h-[84vh] overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xl"
              >
                {cardBody}
              </div>
            </div>
          ) : (
            /* Desktop Smart-Clamped Floating Popover */
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={`Rumus ${spec.title}`}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                width: coords.width,
                transform: coords.placement === 'top' ? 'translateY(-100%)' : 'none',
              }}
              className="z-[70] rounded-2xl border border-[#DCE5F4] bg-white p-5 shadow-[0_18px_44px_rgba(12,43,126,0.18)]"
            >
              {cardBody}
            </div>
          ),
          document.body
        )}
    </>
  );
}
