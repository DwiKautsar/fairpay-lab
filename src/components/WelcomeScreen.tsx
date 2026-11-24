import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';
import { AppFooter } from './AppFooter';

interface WelcomeScreenProps {
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

export function WelcomeScreen({ onEnterDashboard }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-screen flex-col bg-white text-[#0F172A]"
    >
      {/* Minimalist Top Bar */}
      <header className="w-full border-b border-[#EEF1F6] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-[1160px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 shrink-0">
            <BrandLogo variant="color" className="h-[28px] w-[36px] shrink-0" />
            <span className="font-display text-[19px] font-bold tracking-tight text-[#0B1221] whitespace-nowrap">
              FairPay
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[12.5px] text-[#64748B] whitespace-nowrap">
            <span>HR Equity Auditor</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11.5px] text-[#475569]">
              Probabilitas &amp; Statistika
            </span>
          </div>
        </div>
      </header>

      {/* Main Editorial Hero */}
      <main className="mx-auto flex w-full max-w-[1160px] flex-1 items-center px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-12">
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-[1.22fr_0.98fr] lg:gap-12 items-stretch">
          {/* Left Column: Crisp Editorial Proposition + Single Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-center"
          >
            <div className="text-[12.5px] font-semibold tracking-wide text-[#1562FF]">
              Audit Keadilan Kompensasi Berbasis Statistika
            </div>

            <h1 className="mt-4 font-display text-[34px] sm:text-[44px] lg:text-[48px] font-bold tracking-[-0.025em] leading-[1.12] text-[#0B1221] [text-wrap:balance]">
              Uji keadilan struktur gaji secara objektif, bukan asumsi.
            </h1>

            <p className="mt-5 max-w-[56ch] text-[15.5px] sm:text-[16px] leading-[1.7] text-[#475569]">
              <strong className="font-semibold text-[#0F172A]">FairPay</strong> adalah ruang kerja
              audit kompensasi yang menerjemahkan data penggajian menjadi diagnosis statistika
              formal. Unggah dataset organisasi Anda atau gunakan data publik bawaan untuk
              mengevaluasi normalitas, kesetaraan varians, serta dampak simulasi kebijakan secara
              real-time.
            </p>

            {/* Primary CTA */}
            <div className="mt-8 flex flex-col items-start gap-3">
              <button
                type="button"
                onClick={onEnterDashboard}
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#1562FF] px-7 py-3.5 text-[14.5px] font-semibold text-white shadow-[0_8px_24px_rgba(21,98,255,0.28)] transition-all duration-200 hover:bg-[#0E51DB] hover:shadow-[0_10px_28px_rgba(21,98,255,0.34)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1562FF] focus-visible:ring-offset-2 whitespace-nowrap cursor-pointer"
              >
                <span>Buka Dashboard Audit</span>
                <ArrowRight className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <p className="text-[12.5px] text-[#64748B]">
                Mendukung impor CSV/Excel, 2 dataset publik bawaan, dan ekspor laporan berdiagram.
              </p>
            </div>

            {/* Quiet Quantitative Context Strip */}
            <div className="mt-9 grid grid-cols-3 gap-4 border-t border-[#EEF1F6] pt-6 max-w-lg">
              <div>
                <div className="font-mono text-[20px] sm:text-[22px] font-bold text-[#0C2B7E] tabular-nums">
                  3 Uji
                </div>
                <div className="mt-0.5 text-[12px] text-[#64748B]">
                  Normalitas, Levene &amp; Regresi
                </div>
              </div>
              <div>
                <div className="font-mono text-[20px] sm:text-[22px] font-bold text-[#0C2B7E] tabular-nums">
                  α = 0,05
                </div>
                <div className="mt-0.5 text-[12px] text-[#64748B]">
                  Ambang signifikansi baku
                </div>
              </div>
              <div>
                <div className="font-mono text-[20px] sm:text-[22px] font-bold text-[#0C2B7E] tabular-nums">
                  100%
                </div>
                <div className="mt-0.5 text-[12px] text-[#64748B]">
                  Simulasi aman di memori
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Signature FairPay Navy Architectural Card */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.54, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Ringkasan kapabilitas FairPay"
            className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#0C2B7E] p-7 sm:p-8 text-white shadow-[0_14px_40px_rgba(12,43,126,0.18)]"
          >
            {/* Subtle Architectural Ring Motif */}
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
                {PILLARS.map((item) => (
                  <div key={item.index} className="flex items-start gap-4 py-4.5 first:pt-4.5 last:pb-1">
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
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/14 pt-4 text-[12px] text-[#B7CAF4]">
              <span>Transparansi rumus lengkap di setiap metrik</span>
              <span className="font-mono text-[11px] text-[#93C5FD]">Excel · CSV</span>
            </div>
          </motion.section>
        </div>
      </main>

      <AppFooter />
    </motion.div>
  );
}
