import { useMemo } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Renders publication-grade LaTeX mathematical formulas via KaTeX.
 * Strictly static developer-authored formulas only (trust: false).
 */
export function MathFormula({
  latex,
  displayMode = false,
  className = '',
}: MathFormulaProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: false,
        output: 'html',
      });
    } catch {
      return latex;
    }
  }, [latex, displayMode]);

  return (
    <span
      className={`${displayMode ? 'block fairpay-math-display' : 'inline-block fairpay-math-inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
