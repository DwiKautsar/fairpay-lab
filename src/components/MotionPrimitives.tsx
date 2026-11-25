import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface TypingHeadingProps {
  text: string;
  className?: string;
  /** Optional substring inside `text` to highlight in an accent color */
  highlightPhrase?: string;
  /** Accent class for the highlighted substring (default: FairPay cobalt blue) */
  highlightClassName?: string;
  /** Milliseconds per character (clear, natural typewriter cadence) */
  speedMs?: number;
  /** Optional start delay in ms */
  delayMs?: number;
  /** Gate animation start (e.g., wait until SplashScreen finishes) */
  start?: boolean;
}

/**
 * Accessible, zero-layout-shift typing animation for section H1 headings.
 * Uses a single inline text flow with invisible trailing remainder so lines never wrap or jump mid-typing.
 * Supports optional accent phrase highlighting without altering glyph metrics.
 */
export function TypingHeading({
  text,
  className = '',
  highlightPhrase,
  highlightClassName = 'text-[#1562FF]',
  speedMs = 48,
  delayMs = 160,
  start = true,
}: TypingHeadingProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showCaret, setShowCaret] = useState(false);

  useEffect(() => {
    if (!start) {
      setVisibleCount(0);
      setShowCaret(false);
      return;
    }

    setVisibleCount(0);
    setShowCaret(true);

    let cancelled = false;
    let stepTimer: number | null = null;
    let hideCaretTimer: number | null = null;

    let current = 0;

    const typeNext = () => {
      if (cancelled) return;
      current += 1;
      setVisibleCount(current);

      if (current >= text.length) {
        hideCaretTimer = window.setTimeout(() => {
          if (!cancelled) setShowCaret(false);
        }, 900);
        return;
      }

      const prevChar = text[current - 1];
      // Slight natural pause on punctuation so it feels genuinely typed
      const nextDelay =
        prevChar === ',' || prevChar === '.' || prevChar === '?'
          ? speedMs * 3.2
          : prevChar === ' '
            ? speedMs * 1.15
            : speedMs;

      stepTimer = window.setTimeout(typeNext, nextDelay);
    };

    stepTimer = window.setTimeout(typeNext, delayMs);

    return () => {
      cancelled = true;
      if (stepTimer !== null) window.clearTimeout(stepTimer);
      if (hideCaretTimer !== null) window.clearTimeout(hideCaretTimer);
    };
  }, [text, speedMs, delayMs, start]);

  const hlStart =
    highlightPhrase && highlightPhrase.length > 0 ? text.indexOf(highlightPhrase) : -1;
  const hlEnd = hlStart >= 0 && highlightPhrase ? hlStart + highlightPhrase.length : -1;

  const renderRange = (from: number, to: number) => {
    if (to <= from) return null;
    if (hlStart < 0 || to <= hlStart || from >= hlEnd) {
      return text.slice(from, to);
    }
    const seg1End = Math.min(to, hlStart);
    const seg2Start = Math.max(from, hlStart);
    const seg2End = Math.min(to, hlEnd);
    const seg3Start = Math.max(from, hlEnd);
    return (
      <>
        {seg1End > from && text.slice(from, seg1End)}
        {seg2End > seg2Start && (
          <span className={highlightClassName}>{text.slice(seg2Start, seg2End)}</span>
        )}
        {to > seg3Start && text.slice(seg3Start, to)}
      </>
    );
  };

  const isComplete = visibleCount >= text.length;
  const activeIdx = visibleCount - 1;
  const isActiveHighlighted = hlStart >= 0 && activeIdx >= hlStart && activeIdx < hlEnd;

  return (
    <h1 className={className} aria-label={text}>
      {isComplete && !showCaret ? (
        renderRange(0, text.length)
      ) : (
        <span aria-hidden="true">
          {visibleCount === 0 ? (
            <>
              <span className="relative">
                <span className="invisible select-none">{text.slice(0, 1)}</span>
                {showCaret && (
                  <span className="fairpay-typing-caret pointer-events-none absolute left-0 top-[0.1em] h-[0.86em] w-[2.5px] rounded-full bg-[#1562FF]" />
                )}
              </span>
              <span className="invisible select-none">{text.slice(1)}</span>
            </>
          ) : (
            <>
              {visibleCount > 1 && <span>{renderRange(0, visibleCount - 1)}</span>}
              <span className={`relative ${isActiveHighlighted ? highlightClassName : ''}`}>
                {text[activeIdx]}
                {showCaret && (
                  <span className="fairpay-typing-caret pointer-events-none absolute -right-[2px] top-[0.1em] h-[0.86em] w-[2.5px] rounded-full bg-[#1562FF]" />
                )}
              </span>
              {visibleCount < text.length && (
                <span className="invisible select-none">{text.slice(visibleCount)}</span>
              )}
            </>
          )}
        </span>
      )}
    </h1>
  );
}

interface RevealUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  /** Trigger when scrolled into view instead of immediately on mount */
  inView?: boolean;
}

/**
 * Smooth spring bounce-up reveal for cards, KPI strips, and chart sections.
 * Uses a gentler amplitude if OS prefers-reduced-motion is enabled instead of disabling entirely.
 */
export function RevealUp({
  children,
  className = '',
  delay = 0,
  y = 18,
  inView = false,
}: RevealUpProps) {
  const prefersReduced = useReducedMotion();
  const offsetY = prefersReduced ? Math.min(8, y) : y;

  const transition = prefersReduced
    ? {
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1] as const,
        delay: Math.min(delay, 0.12),
      }
    : {
        type: 'spring' as const,
        stiffness: 320,
        damping: 26,
        mass: 0.85,
        delay,
      };

  if (inView) {
    return (
      <motion.div
        initial={{ opacity: 0, y: offsetY, scale: prefersReduced ? 1 : 0.988 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 'some' }}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: offsetY, scale: prefersReduced ? 1 : 0.988 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
