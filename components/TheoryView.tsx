import React, { useState, useRef } from 'react';
import { FileText, Download, HelpCircle, Loader2, FileType, Plus, X, ImageIcon, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { TheoryQuestion } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface TheoryViewProps {
  questions: TheoryQuestion[];
  onGenerateMore: (count: number) => void;
  isLoadingMore: boolean;
  isPro?: boolean;
}

const TheoryView: React.FC<TheoryViewProps> = ({ questions, onGenerateMore, isLoadingMore, isPro = false }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAskingCount, setIsAskingCount] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  
  // We use this ref for the specific PDF content generation
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!isPro) {
        alert("Downloads are available for Pro users only.");
        return;
    }
    if (!printRef.current) return;
    setIsDownloading(true);

    try {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '800px'; 
        container.style.zIndex = '-1000'; // Hide behind app
        container.style.backgroundColor = '#ffffff';
        container.style.color = '#000000';
        
        // Clone the PRINT REF, which contains everything expanded
        const clone = printRef.current.cloneNode(true) as HTMLElement;
        clone.classList.remove('dark'); 
        clone.classList.remove('hidden'); // Make it visible in the temp container
        clone.style.display = 'block';
        clone.style.width = '100%';
        clone.style.padding = '40px';

        // Force styles for PDF readability
        const allElements = clone.querySelectorAll('*');
        allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
                 el.style.color = 'black';
                 el.style.borderColor = '#000000';
            }
        });

        // Ensure SVGs in the PDF container are visible
        const svgs = clone.querySelectorAll('svg');
        svgs.forEach(svg => {
            svg.style.display = 'block';
            svg.style.maxWidth = '100%';
            svg.style.height = 'auto';
        });

        container.appendChild(clone);
        document.body.appendChild(container);

        // Wait for Math/Fonts
        await new Promise(r => setTimeout(r, 800));

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#FFFFFF",
            windowWidth: 800
        });

        document.body.removeChild(container);

        // Use JPEG with 0.8 quality to drastically reduce file size
        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
        }

        pdf.save('crazu-theory-questions.pdf');

    } catch (error) {
        console.error("PDF generation failed:", error);
        alert("Failed to generate PDF. Please try again.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!isPro) {
        alert("Downloads are available for Pro users only.");
        return;
    }
    const content = questions.map((q, i) => {
        // Clean up LaTeX: Replace double backslashes with single backslashes for commands
        // This fixes cases where AI over-escapes, e.g. \\frac becoming \frac
        let cleanQ = q.question.replace(/\\\\([a-zA-Z])/g, '\\$1');
        let text = `Question ${i + 1}:\n${cleanQ}\n`;
        if (q.diagramSVG) {
            text += `[Note: This question contains a diagram. Please see PDF for visual]\n`;
        }
        if (q.answer) {
             text += `Answer: ${q.answer}\n`;
        }
        if (q.explanation) {
             text += `Explanation: ${q.explanation}\n`;
        }
        return text;
    }).join('\n-------------------\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crazu-theory-questions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmitCount = () => {
     onGenerateMore(questionCount);
     setIsAskingCount(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="border-2 border-black dark:border-white p-8 bg-brand-white dark:bg-black">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b-2 border-black dark:border-white/20 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-purple text-black">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-black dark:text-white uppercase">Theory Questions</h2>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
                onClick={handleDownloadTxt}
                className={`flex items-center gap-2 px-6 py-3 font-bold uppercase border-2 transition-colors ${!isPro ? 'opacity-50 cursor-not-allowed bg-zinc-200 text-zinc-500' : 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 border-transparent'}`}
                title={isPro ? "Download Text" : "Pro Only"}
            >
                {isPro ? <FileType className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                <span className="hidden sm:inline">Text</span>
            </button>
            <button
                onClick={handleDownloadPdf}
                disabled={isDownloading || !isPro}
                className={`flex items-center gap-2 px-6 py-3 font-bold uppercase border-2 transition-colors ${!isPro ? 'opacity-50 cursor-not-allowed bg-zinc-200 text-zinc-500' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 border-transparent'}`}
                title={isPro ? "Download PDF" : "Pro Only"}
            >
                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin"/> : (isPro ? <Download className="w-5 h-5" /> : <Lock className="w-5 h-5" />)}
                <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* UI View - Flat List */}
        <div className="bg-brand-white dark:bg-black text-black dark:text-white">
            <div className="space-y-8 p-4 border-2 border-transparent">
            {questions.map((q, idx) => (
                <QuestionItem key={idx} index={idx} question={q} />
            ))}
            </div>
        </div>

        {/* Hidden Print View - Flat List */}
        <div ref={printRef} className="hidden text-black bg-white">
             <div className="p-8">
                <h1 className="text-3xl font-bold mb-2 border-b-2 border-black pb-4 text-black uppercase">Theory Questions</h1>
                <p className="text-zinc-500 mb-8">Generated by Crazu</p>
                
                <div className="space-y-6">
                    {questions.map((q, idx) => (
                        <div key={idx} className="mb-6 break-inside-avoid">
                            <div className="flex gap-4">
                                <span className="font-bold text-lg">{idx + 1}.</span>
                                <div className="text-lg leading-relaxed w-full">
                                    <MarkdownRenderer content={q.question} />
                                    {q.diagramSVG && (
                                        <div 
                                            className="my-4 border border-black p-4 flex justify-center bg-zinc-50"
                                            dangerouslySetInnerHTML={{ __html: q.diagramSVG }} 
                                        />
                                    )}
                                    {q.answer && (
                                        <div className="mt-2 text-sm">
                                            <strong>Answer:</strong> <MarkdownRenderer content={q.answer} inline />
                                        </div>
                                    )}
                                    {q.explanation && (
                                        <div className="mt-2 text-sm italic">
                                            <strong>Explanation:</strong> <MarkdownRenderer content={q.explanation} inline />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-black dark:border-white/20 flex justify-center">
          {isAskingCount ? (
             <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 bg-zinc-100 dark:bg-zinc-900 p-2 border-2 border-black dark:border-white">
                 <span className="font-bold uppercase text-sm pl-2 text-black dark:text-white">Quantity:</span>
                 <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 p-2 font-bold text-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black text-black dark:text-white focus:border-brand-purple outline-none"
                 />
                 <button 
                    onClick={handleSubmitCount}
                    className="bg-brand-purple text-white font-bold uppercase px-4 py-2 hover:bg-zinc-800 transition-colors border-2 border-transparent"
                 >
                    GO
                 </button>
                 <button 
                    onClick={() => setIsAskingCount(false)}
                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-black dark:text-white"
                 >
                    <X className="w-5 h-5" />
                 </button>
             </div>
          ) : (
             <button
                onClick={() => setIsAskingCount(true)}
                disabled={isLoadingMore}
                className={`
                flex items-center gap-3 px-8 py-4 font-bold uppercase tracking-widest text-lg transition-all
                ${isLoadingMore
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-wait'
                    : 'bg-transparent text-black dark:text-white border-2 border-black dark:border-white hover:bg-brand-purple hover:border-brand-purple hover:text-white'
                }
                `}
            >
                {isLoadingMore ? (
                <>Generating...</>
                ) : (
                <>
                    <HelpCircle className="w-5 h-5" />
                    Generate More Questions
                </>
                )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface QuestionItemProps {
  index: number;
  question: TheoryQuestion;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ index, question }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Also clean for display
    const cleanQ = question.question.replace(/\\\\([a-zA-Z])/g, '\\$1');
    
    return (
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-l-4 border-brand-purple text-black dark:text-white text-left">
        <div className="flex gap-4">
          <span className="text-brand-purple font-mono text-xl font-bold pt-1">0{index + 1}.</span>
          <div className="flex-1 w-full">
             <div className="text-lg font-medium leading-relaxed w-full">
                <MarkdownRenderer content={cleanQ} />
             </div>
             
             {question.diagramSVG && (
                <div className="mt-4 p-4 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-none max-w-lg">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-zinc-500">
                        <ImageIcon className="w-4 h-4" /> Figure
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: question.diagramSVG }} className="w-full overflow-x-auto dark:invert-[.85]" />
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="mt-6 flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border-2 border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-white hover:bg-white dark:hover:bg-black transition-all"
            >
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {isOpen ? 'Hide Solution' : 'Reveal Solution'}
            </button>

            {isOpen && (
                <div className="mt-6 pt-6 border-t-2 border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
                    {question.answer && (
                        <div className="mb-6">
                             <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-brand-purple rounded-full" />
                                <span className="text-xs font-bold uppercase text-zinc-500">Answer</span>
                             </div>
                             <div className="text-lg font-bold">
                                 <MarkdownRenderer content={question.answer} inline />
                             </div>
                        </div>
                    )}
                    
                    {question.explanation && (
                        <div>
                             <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-black dark:bg-white rounded-full" />
                                <span className="text-xs font-bold uppercase text-zinc-500">Explanation</span>
                             </div>
                             <div className="bg-white dark:bg-black p-6 border-2 border-zinc-100 dark:border-zinc-800 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                                 <MarkdownRenderer content={question.explanation} />
                             </div>
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default TheoryView;