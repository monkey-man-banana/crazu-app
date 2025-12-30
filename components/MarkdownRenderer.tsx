import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '', inline = false }) => {
  if (!content) return null;

  // Preprocess content to ensure robustness
  
  // 1. Convert specific delimiters to standard $ $ or $$ $$
  let processedContent = content
    .replace(/\\\[(.*?)\\\]/gs, '$$$1$$') // Replace \[ ... \] with $$ ... $$
    .replace(/\\\((.*?)\\\)/gs, '$$$1$$'); // Replace \( ... \) with $ ... $

  // 2. Fix quadruple backslashes sometimes returned by JSON APIs
  processedContent = processedContent.replace(/\\\\\\\\/g, '\\\\');

  // 2b. AGGRESSIVE LATEX REPAIR (Fixing broken backslashes)
  // This fixes common issues where '\f' or '\v' are consumed during JSON parsing
  processedContent = processedContent
    .replace(/(\s|^)rac\{/g, '$1\\frac{')   // Fix 'rac{' -> '\frac{'
    .replace(/(\s|^)vec\{/g, '$1\\vec{')     // Fix 'vec{' -> '\vec{'
    .replace(/(\s|^)int(\s|_|\^)/g, '$1\\int$2') // Fix 'int ' -> '\int '
    .replace(/(\s|^)cdot(\s)/g, '$1\\cdot$2') // Fix 'cdot ' -> '\cdot '
    .replace(/(\s|^)times(\s)/g, '$1\\times$2') // Fix 'times ' -> '\times '
    .replace(/(\s|^)hat\{/g, '$1\\hat{');    // Fix 'hat{' -> '\hat{'

  // 3. Heuristic Math Detection
  // If we find common LaTeX commands that are NOT wrapped in $, we try to wrap them.
  // This is a "best effort" to fix "invisible" or "raw" math text.
  const segments = processedContent.split(/(\$[^$]+\$|\$\$[^$]+\$\$)/g);
  
  processedContent = segments.map(segment => {
      // If it's already a math block, leave it alone
      if (segment.startsWith('$')) return segment;
      
      // Heuristic: If segment contains specific math commands but no $, wrap it.
      // Commands: \frac, \sum, \int, \sqrt, \alpha ... \omega and common symbols
      const mathSignalRegex = /\\(frac|sum|int|sqrt|prod|alpha|beta|gamma|delta|Delta|theta|lambda|Lambda|mu|pi|sigma|Sigma|omega|Omega|phi|Phi|psi|Psi|rho|tau|zeta|eta|epsilon|infty|approx|neq|leq|geq|pm|cdot|times|partial|nabla)/i;
      
      if (mathSignalRegex.test(segment)) {
          // Check if it's just a clean formula or mixed text. 
          // If mixed text, wrapping the whole thing might break text.
          // But for this app, usually short segments in Flashcards/Quiz are pure math.
          // We'll wrap if it looks mostly like math or is short.
          if (segment.length < 100 || !segment.includes(' ')) {
             // It's likely a standalone formula
             return `$ ${segment} $`;
          }
      }
      return segment;
  }).join('');

  // Default color classes only if not overridden or if we want standard behavior
  // We use text-inherit so it picks up parent color (vital for selected quiz options)
  const defaultColors = "text-black dark:text-white";
  
  const Wrapper = inline ? 'span' : 'div';

  return (
    <Wrapper className={`markdown-math prose dark:prose-invert max-w-none ${defaultColors} ${className} ${inline ? 'inline-block' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Override paragraph to handle inline mode better and enforce color
          p: inline 
            ? ({ children }) => <span className="inline text-inherit">{children}</span> 
            : ({ children }) => <p className="mb-4 leading-relaxed text-inherit">{children}</p>,
          
          a: ({ node, ...props }) => <a {...props} className="text-brand-yellow hover:underline" target="_blank" rel="noopener noreferrer" />,
          
          // Ensure lists are styled and colored
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-inherit">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-inherit">{children}</ol>,
          li: ({ children }) => <li className="pl-1 text-inherit">{children}</li>,

          // Headings with explicit colors
          h1: ({ children }) => <h1 className="text-3xl font-bold mb-6 mt-8 uppercase text-inherit">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-bold mb-4 mt-8 border-b-2 border-brand-yellow pb-2 inline-block pr-8 text-inherit">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xl font-bold mb-3 mt-6 text-brand-yellow">{children}</h3>,
          strong: ({ children }) => <strong className="font-bold text-brand-yellow">{children}</strong>,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </Wrapper>
  );
};

export default MarkdownRenderer;