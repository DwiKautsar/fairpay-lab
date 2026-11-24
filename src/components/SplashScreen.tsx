import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

type SplashPhase = 'color' | 'invert' | 'exit';

/**
 * Fullscreen entrance splash screen:
 * Phase 1 (color): Original dual-tone FairPay SVG (#0b2f79 + #1055ed) enters on clean white.
 * Phase 2 (invert): Radial navy wave sweeps smoothly while SVG morphs into negative-invert white.
 * Phase 3 (exit): Smoothly lifts & fades out to reveal the FairPay workspace.
 */
export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<SplashPhase>('color');

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const invertDelay = prefersReduced ? 500 : 1350;
    const exitDelay = prefersReduced ? 1150 : 2750;
    const doneDelay = prefersReduced ? 1450 : 3300;

    const t1 = window.setTimeout(() => setPhase('invert'), invertDelay);
    const t2 = window.setTimeout(() => setPhase('exit'), exitDelay);
    const t3 = window.setTimeout(() => onComplete(), doneDelay);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onComplete();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onComplete]);

  const isInverted = phase === 'invert' || phase === 'exit';

  return (
    <motion.div
      role="status"
      aria-label="Memuat FairPay HR Equity Auditor"
      initial={{ opacity: 1 }}
      animate={{
        opacity: phase === 'exit' ? 0 : 1,
        scale: phase === 'exit' ? 1.03 : 1,
      }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-white select-none ${
        phase === 'exit' ? 'pointer-events-none' : ''
      }`}
    >
      {/* Smooth radial FairPay Navy reveal expanding from center behind the logo */}
      <motion.div
        aria-hidden="true"
        initial={{ scale: 0, opacity: 0.96 }}
        animate={{
          scale: isInverted ? 3.4 : 0,
          opacity: isInverted ? 1 : 0.96,
        }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute h-[85vmax] w-[85vmax] rounded-full bg-[#0C2B7E]"
      />

      {/* Subtle ambient glow ring */}
      <motion.div
        aria-hidden="true"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{
          scale: isInverted ? 1.25 : 1,
          opacity: isInverted ? 0.24 : 0.14,
        }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute h-64 w-64 rounded-full blur-3xl"
        style={{
          background: isInverted
            ? 'radial-gradient(circle, rgba(96,165,250,0.45) 0%, rgba(12,43,126,0) 70%)'
            : 'radial-gradient(circle, rgba(16,85,237,0.32) 0%, rgba(255,255,255,0) 70%)',
        }}
      />

      {/* Center Brand Lockup */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 14 }}
          animate={{
            opacity: 1,
            scale: isInverted ? 1.04 : 1,
            y: 0,
          }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-white"
        >
          <BrandLogo
            variant={isInverted ? 'invert' : 'color'}
            animateFill
            className="h-[74px] w-[94px] sm:h-[86px] sm:w-[108px]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 flex flex-col items-center text-center"
        >
          <div
            className={`font-display text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] leading-none transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isInverted ? 'text-white' : 'text-[#0B1221]'
            }`}
          >
            FairPay
          </div>
          <div
            className={`mt-2 font-mono text-[11px] font-medium tracking-[0.22em] uppercase transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isInverted ? 'text-[#95ACE0]' : 'text-[#64748B]'
            }`}
          >
            HR EQUITY AUDITOR
          </div>
        </motion.div>

        {/* Sleek minimal progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28, duration: 0.35 }}
          className={`mt-8 h-[3px] w-40 overflow-hidden rounded-full transition-colors duration-700 ${
            isInverted ? 'bg-white/20' : 'bg-[#E2E8F0]'
          }`}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full w-full rounded-full transition-colors duration-700 ${
              isInverted ? 'bg-white' : 'bg-[#1055ED]'
            }`}
          />
        </motion.div>
      </div>

      {/* Quiet quick-skip button for returning visitors */}
      <button
        type="button"
        onClick={onComplete}
        aria-label="Lewati animasi pembuka"
        className={`absolute bottom-6 right-6 z-20 rounded-lg px-3 py-1.5 font-mono text-[11px] font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${
          isInverted
            ? 'text-white/60 hover:bg-white/10 hover:text-white focus-visible:ring-white/60'
            : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:ring-[#1562FF]'
        }`}
      >
        Lewati
      </button>
    </motion.div>
  );
}
