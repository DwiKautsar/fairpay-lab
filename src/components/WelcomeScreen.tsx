import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';
import { AppFooter } from './AppFooter';
import { RevealUp, TypingHeading } from './MotionPrimitives';

interface WelcomeScreenProps {
  isReady?: boolean;
  onEnterDashboard: () => void;
}

const PILLARS = [
  {
    index: '01',
    title: 'Uji Normalitas (Shapiro–Wilk)',
    description:
      'Mendeteksi anomali outlier dan kemiringan distribusi gaji secara formal, lengkap dengan transformasi logaritma natural serta Q-Q Plot.',
  },
  {
    index: '02',
    title: 'Uji Homogenitas (Levene)',
    description:
      'Membandingkan konsistensi rentang varians pengupahan antarkelompok gender atau divisi untuk mengungkap ketimpangan struktural.',
  },
  {
    index: '03',
    title: 'Linearitas & Simulator Kebijakan',
    description:
      'Mendeteksi titik jenuh karir melalui regresi linear vs kuadratik, mensimulasikan subsidi gaji bawah, dan mengestimasi rentang tawaran kandidat baru.',
  },
];

export function WelcomeScreen({ isReady = true, onEnterDashboard }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="fairpay-welcome-bg relative flex min-h-screen flex-col overflow-x-clip text-[#0F172A]"
    >
      {/* FairPay Parametric Contour Brand Pattern (blended seamlessly with top-white to bottom-blue gradient) */}
      <img
        src="/assets/aistudio/fairpay_pattern_parametric_contour_c983d46f.svg"
        alt=""
        aria-hidden="true"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-[0.88] mix-blend-multiply select-none [mask-image:linear-gradient(180deg,rgba(0,0,0,0.5)_0%,black_26%,black_100%)]"
      />

      {/* Seamless Top Bar (Blends directly into top-white canvas with zero hard crop edge) */}
      <header className="relative z-10 w-full bg-transparent">
        <div className="mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 shrink-0">
            <BrandLogo variant="color" className="h-[29px] w-[37px] shrink-0" />
            <span className="font-display text-[19.5px] font-bold tracking-tight text-[#0B1221] whitespace-nowrap">
              FairPay
            </span>
          </div>
        </div>
      </header>

      {/* Main Editorial Hero */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-1 items-center px-5 pt-4 pb-12 sm:px-8 sm:pt-6 sm:pb-16 lg:px-10 lg:pt-4 lg:pb-14">
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-[1.22fr_0.98fr] lg:gap-12 items-stretch">
          {/* Left Column: Crisp Editorial Proposition + Single Primary CTA */}
          <div className="flex flex-col justify-center">
            <TypingHeading
              text="Uji keadilan struktur gaji secara objektif, bukan asumsi."
              highlightPhrase="secara objektif"
              highlightClassName="text-[#1562FF]"
              start={isReady}
              speedMs={38}
              delayMs={180}
              className="font-display text-[32px] sm:text-[42px] lg:text-[48px] font-bold tracking-[-0.025em] leading-[1.12] text-[#0B1221] [text-wrap:balance]"
            />

            <RevealUp delay={0.14} y={14}>
              <p className="mt-5 max-w-[56ch] text-[15.5px] sm:text-[16px] leading-[1.7] text-[#475569]">
                <strong className="font-semibold text-[#0F172A]">FairPay</strong> adalah ruang kerja
                audit kompensasi yang menerjemahkan data penggajian menjadi diagnosis statistika
                formal. Unggah dataset organisasi Anda atau gunakan data publik bawaan untuk
                mengevaluasi normalitas, kesetaraan varians, serta dampak simulasi kebijakan secara
                real-time.
              </p>
            </RevealUp>

            {/* Primary CTA */}
            <RevealUp delay={0.22} y={16} className="mt-8 flex flex-col items-start gap-3">
              <motion.button
                type="button"
                onClick={onEnterDashboard}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#1562FF] px-7 py-3.5 text-[14.5px] font-semibold text-white shadow-[0_12px_28px_rgba(21,98,255,0.28)] transition-colors duration-200 hover:bg-[#0E51DB] hover:shadow-[0_16px_34px_rgba(21,98,255,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] focus-visible:ring-offset-2 whitespace-nowrap cursor-pointer"
              >
                <span>Buka Dashboard Audit</span>
                <ArrowRight className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1" />
              </motion.button>

              <p className="text-[12.5px] text-[#5B6B84]">
                Mendukung impor CSV/Excel, 2 dataset publik bawaan, dan ekspor laporan berdiagram.
              </p>
            </RevealUp>

            {/* Quiet Quantitative Context Strip */}
            <RevealUp
              delay={0.3}
              y={16}
              className="mt-9 grid grid-cols-3 gap-4 border-t border-[#0C2B7E]/10 pt-6 max-w-lg"
            >
              <div>
                <div className="font-mono text-[20px] sm:text-[22px] font-bold text-[#0C2B7E] tabular-nums">
                  3 Uji
                </div>
                <div className="mt-0.5 text-[12px] text-[#5B6B84]">
                  Normalitas, Levene &amp; Regresi
                </div>
              </div>
              <div>
                <div className="font-mono text-[20px] sm:text-[22px] font-bold text-[#0C2B7E] tabular-nums">
                  α = 0,05
                </div>
                <div className="mt-0.5 text-[12px] text-[#5B6B84]">
                  Ambang signifikansi baku
                </div>
              </div>
              <div>
                <div className="font-mono text-[20px] sm:text-[22px] font-bold text-[#0C2B7E] tabular-nums">
                  100%
                </div>
                <div className="mt-0.5 text-[12px] text-[#5B6B84]">
                  Simulasi aman di memori
                </div>
              </div>
            </RevealUp>
          </div>

          {/* Right Column: Signature FairPay Navy Architectural Card */}
          <RevealUp delay={0.16} y={22} className="flex">
            <section
              aria-label="Ringkasan kapabilitas FairPay"
              className="fairpay-sidebar-mesh fairpay-card-navy relative flex w-full flex-col justify-between overflow-hidden rounded-[24px] border border-white/[0.14] p-7 sm:p-8 text-white shadow-[0_22px_52px_-14px_rgba(12,43,126,0.32),0_4px_12px_rgba(12,43,126,0.12),inset_0_1px_0_rgba(255,255,255,0.22)]"
            >
              {/* Single Clean Architectural Ring Motif */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full border-[28px] border-white/[0.07]"
              />

              <div className="relative z-10">
                <div className="text-[12px] font-medium tracking-wide text-[#9EB7EC]">
                  Alur Kerja Audit FairPay
                </div>
                <h2 className="mt-2 font-display text-[22px] sm:text-[24px] font-bold tracking-tight leading-[1.24] text-white [text-wrap:balance]">
                  Tiga pilar diagnosis dalam satu ruang kerja terpadu.
                </h2>

                <div className="mt-6 divide-y divide-white/14 border-t border-white/14">
                  {PILLARS.map((item, idx) => (
                    <motion.div
                      key={item.index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.24 + idx * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="flex items-start gap-4 rounded-xl px-2 -mx-2 py-4.5 first:pt-4.5 last:pb-1 transition-colors duration-200 hover:bg-white/[0.05]"
                    >
                      <span className="font-mono text-[12px] font-semibold text-[#93C5FD] mt-0.5 shrink-0 tabular-nums">
                        {item.index}
                      </span>
                      <div>
                        <h3 className="text-[14.5px] font-bold text-white leading-snug">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-[13px] leading-relaxed text-[#C7D7F8]">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/14 pt-4 text-[12px] text-[#B7CAF4]">
                <span>Transparansi rumus lengkap di setiap metrik</span>
                <span className="font-mono text-[11px] text-[#93C5FD]">Excel · CSV</span>
              </div>
            </section>
          </RevealUp>
        </div>
      </main>

      <AppFooter variant="welcome" />
    </motion.div>
  );
}
