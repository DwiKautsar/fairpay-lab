import { useEffect, useMemo, useState } from 'react';
import type katexType from 'katex';

let cachedKatex: typeof katexType | null = null;
let katexLoadPromise: Promise<typeof katexType> | null = null;

function loadKatex(): Promise<typeof katexType> {
  if (cachedKatex) return Promise.resolve(cachedKatex);
  if (!katexLoadPromise) {
    katexLoadPromise = Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css'),
    ]).then(([mod]) => {
      cachedKatex = mod.default;
      return mod.default;
    });
  }
  return katexLoadPromise;
}

interface MathFormulaProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Renders publication-grade LaTeX mathematical formulas via KaTeX.
 * Strictly static developer-authored formulas only (trust: false).
 * Loads KaTeX dynamically on first use to keep the initial bundle lightweight.
 */
export function MathFormula({
  latex,
  displayMode = false,
  className = '',
}: MathFormulaProps) {
  const [katexLib, setKatexLib] = useState<typeof katexType | null>(cachedKatex);

  useEffect(() => {
    if (katexLib) return;
    let active = true;
    void loadKatex().then((lib) => {
      if (active) setKatexLib(lib);
    });
    return () => {
      active = false;
    };
  }, [katexLib]);

  const html = useMemo(() => {
    if (!katexLib) return null;
    try {
      return katexLib.renderToString(latex, {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: false,
        output: 'html',
      });
    } catch {
      return latex;
    }
  }, [katexLib, latex, displayMode]);

  if (html === null) {
    return (
      <span
        className={`${displayMode ? 'block py-1 font-mono text-[13px] text-[#334155]' : 'inline-block font-mono text-[12px] text-[#334155]'} ${className}`}
      >
        {latex}
      </span>
    );
  }

  return (
    <span
      className={`${displayMode ? 'block fairpay-math-display' : 'inline-block fairpay-math-inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
