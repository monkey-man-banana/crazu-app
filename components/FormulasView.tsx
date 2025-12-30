import React from 'react';
import { Calculator, ArrowRight, Code, Plus } from 'lucide-react';
import { Formula } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface FormulasViewProps {
  formulas: Formula[];
  onGenerateMore: () => void;
  isLoadingMore: boolean;
}

const FormulasView: React.FC<FormulasViewProps> = ({ formulas, onGenerateMore, isLoadingMore }) => {
  // Group by section
  const grouped = formulas.reduce((acc, curr) => {
    const section = curr.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(curr);
    return acc;
  }, {} as Record<string, Formula[]>);

  const sections = Object.keys(grouped);
  const isSingleSection = sections.length === 1 && sections[0] === 'General';

  return (
    <div className="animate-in fade-in duration-500">
      <div className="border-2 border-black dark:border-white p-8 mb-8 bg-brand-white dark:bg-black">
        <div className="flex items-center gap-4 mb-8 border-b-2 border-black dark:border-white/20 pb-6">
           <div className="p-3 bg-brand-yellow text-black">
              <Code className="w-6 h-6" />
           </div>
           <h2 className="text-3xl font-bold text-black dark:text-white uppercase">Formulas & Methods</h2>
        </div>
        
        {formulas.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-48 text-zinc-500 dark:text-zinc-400 border-2 border-dashed border-black dark:border-white bg-transparent mb-8">
             <Calculator className="w-10 h-10 mb-4 opacity-50" />
             <p className="font-bold uppercase tracking-widest">No explicit formulas detected yet</p>
           </div>
        ) : (
          isSingleSection ? (
            <FormulaList items={grouped['General']} />
          ) : (
            <div className="space-y-8 mb-8">
              {sections.map(section => (
                <div key={section} className="border-2 border-black dark:border-white/20">
                  <div className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border-b-2 border-black dark:border-white/20">
                    <h3 className="font-bold text-lg text-black dark:text-white">{section}</h3>
                  </div>
                  <div className="p-6 bg-brand-white dark:bg-black">
                    <FormulaList items={grouped[section]} />
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        
        <div className="mt-8 pt-8 border-t-2 border-black dark:border-white/20 flex justify-center">
            <button
                onClick={onGenerateMore}
                disabled={isLoadingMore}
                className={`
                flex items-center gap-2 px-8 py-4 font-bold uppercase tracking-widest text-lg transition-all
                ${isLoadingMore
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-wait'
                    : 'bg-brand-yellow text-black hover:bg-black hover:text-white'
                }
                `}
            >
                {isLoadingMore ? 'Scanning...' : (
                    <>
                        <Plus className="w-5 h-5" />
                        Generate More Formulas
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

const FormulaList = ({ items }: { items: Formula[] }) => (
  <div className="grid grid-cols-1 gap-6">
    {items.map((formula, idx) => {
      let expression = formula.expression.trim();
      
      // Handle aggressive escaping from JSON response
      // Replace quadruple backslashes with double (literal backslash for LaTeX)
      expression = expression.replace(/\\\\\\\\/g, '\\\\');
      
      // If we see \\frac, it might mean the string literal has \\frac, which renders as \frac
      // We need to ensure we don't accidentally unescape it into a control character if that was the intent,
      // but usually we want LaTeX commands. 
      // Safe strategy: if it looks like latex, wrap it in $$.
      
      if (!expression.startsWith('$$') && !expression.startsWith('$')) {
        expression = `$$ ${expression} $$`;
      } else if (expression.startsWith('$') && !expression.startsWith('$$')) {
        expression = `$$ ${expression.slice(1, -1)} $$`;
      }

      return (
        <div 
          key={idx} 
          className="group relative bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent hover:border-brand-yellow transition-colors p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1 w-full">
              <h3 className="text-xl font-bold text-black dark:text-white mb-4 group-hover:underline decoration-brand-yellow decoration-4 underline-offset-4 transition-all">
                {formula.title}
              </h3>
              <div className="font-mono text-base bg-black text-white p-6 mb-4 block w-full overflow-x-auto border-l-4 border-brand-yellow shadow-inner">
                {/* 
                  Fix: Explicitly force white text. 
                  In light mode, MarkdownRenderer defaults to 'text-black'. 
                  Since parent is 'bg-black', we need '!text-white' to ensure visibility.
                */}
                <MarkdownRenderer content={expression} className="!text-white" />
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 mt-2 text-zinc-600 dark:text-zinc-300 text-sm font-medium">
            <ArrowRight className="w-5 h-5 mt-0.5 text-brand-yellow flex-shrink-0" />
            <div className="flex-1">
               <MarkdownRenderer content={formula.method} />
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default FormulasView;