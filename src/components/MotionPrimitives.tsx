import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface TypingHeadingProps {
  text: string;
  className?: string;
  /** Milliseconds per character (clear, natural typewriter cadence) */
  speedMs?: number;
  /** Optional start delay in ms */
  delayMs?: number;
  /** Gate animation start (e.g., wait until SplashScreen finishes) */
  start?: boolean;
}

/**
 * Accessible, zero-layout-shift typing animation for section H1 headings.
 * Pre-reserves exact final height via an invisible mirror so content below never jumps.
 * Always runs the typing reveal (non-vestibular text reveal) even when OS reduced-motion is enabled.
 */
export function TypingHeading({
  text,
  className = '',
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

  return (
    <h1 className={`relative ${className}`} aria-label={text}>
      {/* Invisible full-text mirror reserves exact multi-line height with zero layout shift */}
      <span aria-hidden="true" className="invisible select-none block">
        {text}
      </span>

      {/* Live typed overlay */}
      <span aria-hidden="true" className="absolute inset-0 block">
        {text.slice(0, visibleCount)}
        {showCaret && (
          <span className="fairpay-typing-caret ml-0.5 inline-block h-[0.86em] w-[2.5px] translate-y-[0.08em] rounded-full bg-[#1562FF]" />
        )}
      </span>
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
