import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface TypingHeadingProps {
  text: string;
  className?: string;
  /** Milliseconds per character (clear, smooth typewriter cadence) */
  speedMs?: number;
  /** Optional start delay in ms */
  delayMs?: number;
  /** Gate animation start (e.g., wait until SplashScreen finishes) */
  start?: boolean;
}

/**
 * Accessible, zero-layout-shift typing animation for section H1 headings.
 * Pre-reserves exact final height via an invisible mirror so content below never jumps.
 */
export function TypingHeading({
  text,
  className = '',
  speedMs = 40,
  delayMs = 160,
  start = true,
}: TypingHeadingProps) {
  const prefersReduced = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(() => (prefersReduced ? text.length : 0));
  const [showCaret, setShowCaret] = useState(false);

  useEffect(() => {
    if (prefersReduced) {
      setVisibleCount(text.length);
      setShowCaret(false);
      return;
    }

    if (!start) {
      setVisibleCount(0);
      setShowCaret(false);
      return;
    }

    setVisibleCount(0);
    setShowCaret(true);

    let intervalId: number | null = null;
    let hideCaretTimer: number | null = null;

    const startTimer = window.setTimeout(() => {
      let current = 0;
      intervalId = window.setInterval(() => {
        current += 1;
        setVisibleCount(current);
        if (current >= text.length) {
          if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
          hideCaretTimer = window.setTimeout(() => {
            setShowCaret(false);
          }, 750);
        }
      }, speedMs);
    }, delayMs);

    return () => {
      window.clearTimeout(startTimer);
      if (intervalId !== null) window.clearInterval(intervalId);
      if (hideCaretTimer !== null) window.clearTimeout(hideCaretTimer);
    };
  }, [text, speedMs, delayMs, start, prefersReduced]);

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
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.72, repeat: Infinity, ease: 'easeInOut' }}
            className="ml-0.5 inline-block h-[0.86em] w-[2.5px] translate-y-[0.08em] rounded-full bg-[#1562FF]"
          />
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
 */
export function RevealUp({
  children,
  className = '',
  delay = 0,
  y = 18,
  inView = false,
}: RevealUpProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const transition = {
    type: 'spring' as const,
    stiffness: 320,
    damping: 26,
    mass: 0.85,
    delay,
  };

  if (inView) {
    return (
      <motion.div
        initial={{ opacity: 0, y, scale: 0.988 }}
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
      initial={{ opacity: 0, y, scale: 0.988 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
