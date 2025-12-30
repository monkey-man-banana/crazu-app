import React, { useRef, useState, useEffect } from 'react';
import { Download, FileText, Loader2, FileType, CheckCircle, HelpCircle, MessageSquare, Send, QrCode, Image as ImageIcon, Lock } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import { QuizQuestion, TheoryQuestion } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { generateDiagramForQuestion, askDocumentQuestion } from '../services/geminiService';
import Logo from './Logo';

interface PaperViewProps {
  title: string;
  quiz: QuizQuestion[];
  theory: TheoryQuestion[];
  isPro?: boolean;
}

// Simple Chat Component for specific question
const QuestionChat = ({ questionText }: { questionText: string }) => {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if(!query.trim()) return;
        setHistory(prev => [...prev, { role: 'user', text: query }]);
        setLoading(true);
        const currentQuery = query;
        setQuery('');

        try {
            // We use a mock context of the specific question
            const answer = await askDocumentQuestion(
                `Question Context: ${questionText}`, 
                'text/plain', 
                currentQuery
            );
            setHistory(prev => [...prev, { role: 'ai', text: answer }]);
        } catch(e) {
            setHistory(prev => [...prev, { role: 'ai', text: "Error getting answer." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 bg-zinc-100 dark:bg-zinc-800 p-4 border-l-4 border-black dark:border-white">
            <h4 className="text-xs font-bold uppercase text-zinc-500 mb-2 flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-black dark:text-white" /> Ask AI about this question
            </h4>
            <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
                {history.map((h, i) => (
                    <div key={i} className={`text-sm p-2 border ${h.role === 'user' ? 'bg-white dark:bg-black ml-4 border-zinc-200 dark:border-zinc-700' : 'bg-brand-yellow/10 border-brand-yellow/20 mr-4'}`}>
                        <MarkdownRenderer content={h.text} inline />
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input 
                    className="flex-1 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 p-2 text-sm outline-none focus:border-brand-yellow text-black dark:text-white"
                    placeholder="Type your doubt..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                    onClick={handleSend}
                    disabled={loading}
                    className="p-2 bg-black dark:bg-white text-white dark:text-black hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                </button>
            </div>
        </div>
    )
}

const PaperView: React.FC<PaperViewProps> = ({ title, quiz = [], theory = [], isPro = false }) => {
  const [activeTab, setActiveTab] = useState<'paper' | 'answers'>('paper');
  const [localQuiz, setLocalQuiz] = useState<QuizQuestion[]>(quiz);
  const [localTheory, setLocalTheory] = useState<TheoryQuestion[]>(theory);
  const [diagramsLoading, setDiagramsLoading] = useState(false);
  
  // PDF Download Modal State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [includeQr, setIncludeQr] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const paperId = useRef(Math.random().toString(36).substring(7)).current; // Stable ID for this session

  // Update local state when props change
  useEffect(() => {
    setLocalQuiz(quiz);
    setLocalTheory(theory);
  }, [quiz, theory]);

  const loadDiagrams = async () => {
    setDiagramsLoading(true);
    
    // Process Quiz
    const newQuiz = [...localQuiz];
    for (let i = 0; i < newQuiz.length; i++) {
        if (!newQuiz[i].diagramSVG) {
             // Check if question implies a diagram
             const text = newQuiz[i].question.toLowerCase();
             if (text.includes('diagram') || text.includes('graph') || text.includes('figure') || text.includes('circuit') || text.includes('triangle') || text.includes('geometry')) {
                 const svg = await generateDiagramForQuestion(newQuiz[i].question);
                 if (svg) newQuiz[i].diagramSVG = svg;
             }
        }
    }
    setLocalQuiz(newQuiz);

    // Process Theory
    const newTheory = [...localTheory];
    for (let i = 0; i < newTheory.length; i++) {
        if (!newTheory[i].diagramSVG) {
             const text = newTheory[i].question.toLowerCase();
             if (text.includes('diagram') || text.includes('graph') || text.includes('figure') || text.includes('circuit')) {
                 const svg = await generateDiagramForQuestion(newTheory[i].question);
                 if (svg) newTheory[i].diagramSVG = svg;
             }
        }
    }
    setLocalTheory(newTheory);
    setDiagramsLoading(false);
  };

  const handleDownloadClick = () => {
      if (!isPro) {
          alert("Downloading PDF is a Pro feature. Please upgrade to access.");
          return;
      }
      setShowPdfModal(true);
  }

  const generatePDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);

    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        let cursorY = margin;
        let pageNum = 1;

        // Helper: Add header/footer to current page
        const addHeaderFooter = () => {
            doc.setFontSize(8);
            doc.setTextColor(50); // Dark grey for header
            doc.text("Crazu - Intelligent Study Companion", margin, 10);
            doc.text(title.substring(0, 40) + (title.length > 40 ? "..." : ""), pageWidth - margin, 10, { align: "right" });
            
            doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: "center" });
            doc.setDrawColor(200);
            doc.line(margin, 12, pageWidth - margin, 12); // Top line
        };

        // Helper: Capture an HTML element and add to PDF
        const addElementToPdf = async (element: HTMLElement) => {
            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    // Do not aggressively force colors here inside html2canvas callback
                    // as we do it globally on the container before capture
                }
            });
            // Use JPEG with 0.8 quality to drastically reduce file size
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const imgHeight = (canvas.height * contentWidth) / canvas.width;

            // Check if we need a new page
            if (cursorY + imgHeight > pageHeight - margin) {
                doc.addPage();
                pageNum++;
                cursorY = margin + 5; // Reset cursor with some top padding
                addHeaderFooter();
            }

            doc.addImage(imgData, 'JPEG', margin, cursorY, contentWidth, imgHeight, undefined, 'FAST');
            cursorY += imgHeight + 2; // Add small gap between elements
        };

        // --- 1. Prepare DOM ---
        // We clone the printRef to a visible area to ensure html2canvas captures it correctly
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '0';
        container.style.width = '800px'; // Fixed width for consistent rendering
        container.style.backgroundColor = '#ffffff';
        container.classList.add('pdf-container');
        
        const clone = printRef.current.cloneNode(true) as HTMLElement;
        clone.classList.remove('hidden');
        clone.style.display = 'block';
        
        // Remove answers if Student Copy
        if (!includeAnswers) {
            const answers = clone.querySelector('.answer-section-print');
            if (answers) answers.remove();
        }

        // Add QR Code at the very end of the clone content if requested
        if (includeQr) {
             const qrUrl = `https://crazu.app/answers/${paperId}.pdf`;
             const qrDataUrl = await QRCode.toDataURL(qrUrl);
             const qrDiv = document.createElement('div');
             qrDiv.className = 'print-element mt-8 pt-8 border-t-2 border-black text-center p-8 bg-zinc-50';
             qrDiv.setAttribute('data-id', 'qr-code');
             qrDiv.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: black;">
                    <img src="${qrDataUrl}" style="width: 120px; height: 120px; margin-bottom: 10px;" />
                    <p style="font-size: 14px; font-weight: bold; text-transform: uppercase; color: black;">Scan to view Answer PDF</p>
                    <p style="font-size: 10px; color: #000; font-family: monospace;">ID: ${paperId}</p>
                </div>
             `;
             clone.appendChild(qrDiv);
        }

        container.appendChild(clone);
        document.body.appendChild(container);

        // --- 2. FORCE STYLES ON CLONE ---
        // Apply general black color
        container.style.color = '#000000';
        
        // Force black on all text-heavy elements, avoiding KaTeX internals
        const textElements = container.querySelectorAll('h1, h2, h3, h4, h5, p, span, li, div');
        textElements.forEach((el) => {
            if (el instanceof HTMLElement) {
                // Do not mess with elements inside KaTeX unless it's the root
                if (!el.closest('.katex')) {
                    el.style.color = '#000000';
                    el.style.borderColor = '#000000';
                }
            }
        });

        // Specifically target KaTeX roots to ensure math is black
        const katexRoots = container.querySelectorAll('.katex');
        katexRoots.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.style.color = '#000000';
            }
        });
        
        // Ensure SVGs take up width and have no max-width constraints
        const svgs = container.querySelectorAll('svg');
        svgs.forEach((svg) => {
             svg.style.maxWidth = 'none';
             svg.style.width = '100%';
             svg.style.height = 'auto';
        });

        // Wait for styles/fonts to settle
        await new Promise(r => setTimeout(r, 800));

        // --- 3. Process Elements ---
        // Initialize PDF
        addHeaderFooter();
        cursorY += 5; // Initial offset from header

        // We iterate over specific marked elements in the clone to break pages correctly
        // The structure inside printRef should use a common class for blocks we want to keep together
        const elements = Array.from(clone.querySelectorAll('.print-element'));
        
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el instanceof HTMLElement) {
                // Assign a unique data-id for html2canvas onclone selection (redundancy check)
                el.setAttribute('data-id', `print-el-${i}`);
                await addElementToPdf(el);
            }
        }

        // Cleanup
        document.body.removeChild(container);

        doc.save(`Crazu_${includeAnswers ? 'Teacher' : 'Student'}_${paperId}.pdf`);
        setShowPdfModal(false);

    } catch (e) {
        console.error(e);
        alert("PDF Generation failed");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-black dark:text-white uppercase mb-2">Generated Paper</h1>
           <p className="text-zinc-500 font-mono text-sm">{title}</p>
        </div>
        <div className="flex gap-3">
             <button
                onClick={loadDiagrams}
                disabled={diagramsLoading}
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-black text-black dark:text-white font-bold uppercase hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border-2 border-black dark:border-white"
             >
                {diagramsLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5" />}
                {diagramsLoading ? 'Loading Diagrams...' : 'Load Diagrams'}
             </button>
             <button
                onClick={handleDownloadClick}
                className={`flex items-center gap-2 px-6 py-3 font-bold uppercase border-2 transition-colors ${!isPro ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 border-transparent'}`}
                title={isPro ? "Download PDF" : "Pro Only"}
             >
                {isPro ? <Download className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                Download PDF
             </button>
        </div>
      </div>

      {/* Tabs - Now with full border */}
      <div className="flex border-2 border-black dark:border-white mb-0 bg-white dark:bg-black">
         <button 
            onClick={() => setActiveTab('paper')}
            className={`flex-1 px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors border-r-2 border-black dark:border-white ${activeTab === 'paper' ? 'bg-brand-yellow text-black' : 'text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
         >
            Question Paper
         </button>
         <button 
            onClick={() => setActiveTab('answers')}
            className={`flex-1 px-8 py-4 font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'answers' ? 'bg-brand-yellow text-black' : 'text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
         >
            Answer Key & Doubts
         </button>
      </div>

      {/* Content Area - Removed top border to merge with tabs */}
      <div className="bg-white dark:bg-black border-2 border-black dark:border-white border-t-0 p-8 md:p-12 shadow-2xl min-h-[600px]">
         
         {/* --- QUESTION PAPER TAB --- */}
         {activeTab === 'paper' && (
             <div className="animate-in fade-in slide-in-from-left-4">
                 <div className="text-center mb-12 border-b-4 border-black dark:border-white pb-8">
                    <h2 className="text-3xl font-bold uppercase mb-2 text-black dark:text-white">{title}</h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest">Exam Paper • ID: {paperId}</p>
                </div>

                {/* Section A */}
                {localQuiz.length > 0 && (
                    <div className="mb-12">
                        <div className="bg-brand-yellow inline-block px-4 py-2 font-bold text-black uppercase mb-6 border-2 border-black">
                            Section A: Multiple Choice
                        </div>
                        <div className="space-y-8">
                            {localQuiz.map((q, idx) => (
                                <div key={idx} className="break-inside-avoid">
                                    <div className="flex flex-col gap-2 mb-3">
                                        <div className="flex gap-3">
                                            <span className="font-bold text-lg text-black dark:text-white font-mono">Q{idx + 1}.</span>
                                            <div className="text-lg text-black dark:text-white"><MarkdownRenderer content={q.question} inline /></div>
                                        </div>
                                        {q.diagramSVG && (
                                            <div className="ml-10 my-2 max-w-lg border border-zinc-200 p-2">
                                                <div dangerouslySetInnerHTML={{ __html: q.diagramSVG }} className="w-full dark:invert-[.85]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="pl-8 grid grid-cols-1 gap-2">
                                        {q.options.map((opt, optIdx) => (
                                            <div key={optIdx} className="flex gap-2 items-start text-zinc-600 dark:text-zinc-400">
                                                <div className="font-bold">{String.fromCharCode(65 + optIdx)}.</div>
                                                <div><MarkdownRenderer content={opt} inline /></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section B */}
                {localTheory.length > 0 && (
                    <div>
                        <div className="bg-black dark:bg-white inline-block px-4 py-2 font-bold text-white dark:text-black uppercase mb-6 border-2 border-black dark:border-transparent">
                            Section B: Theory Questions
                        </div>
                        <div className="space-y-6">
                            {localTheory.map((q, idx) => (
                                <div key={idx} className="break-inside-avoid">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-3">
                                            <span className="font-bold text-lg text-black dark:text-white font-mono">Q{localQuiz.length + idx + 1}.</span>
                                            <div className="text-lg text-black dark:text-white leading-relaxed"><MarkdownRenderer content={q.question} /></div>
                                        </div>
                                        {q.diagramSVG && (
                                            <div className="ml-10 my-2 max-w-lg border border-zinc-200 p-2">
                                                <div dangerouslySetInnerHTML={{ __html: q.diagramSVG }} className="w-full dark:invert-[.85]" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
         )}

         {/* --- ANSWER KEY TAB --- */}
         {activeTab === 'answers' && (
             <div className="animate-in fade-in slide-in-from-right-4">
                 <div className="flex justify-between items-end mb-8 border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
                    <h2 className="text-2xl font-bold uppercase text-black dark:text-white">Answer Key & Explanations</h2>
                 </div>

                 <div className="space-y-12">
                     {localQuiz.map((q, i) => (
                         <div key={`ans-q-${i}`} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                             <div className="flex gap-2 mb-4">
                                <span className="font-bold text-brand-yellow">Q{i+1} (MCQ)</span>
                                <span className="text-black dark:text-white font-medium"><MarkdownRenderer content={q.question} inline /></span>
                             </div>
                             
                             <div className="flex items-center gap-3 mb-4 bg-brand-yellow/10 p-3 w-fit border-l-4 border-brand-yellow">
                                 <CheckCircle className="w-5 h-5 text-brand-yellow" />
                                 <span className="font-bold text-black dark:text-white">Correct Answer: {String.fromCharCode(65 + q.correctIndex)}</span>
                             </div>
                             
                             <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                 <strong className="text-black dark:text-white">Explanation:</strong> <MarkdownRenderer content={q.explanation} inline />
                             </p>

                             <QuestionChat questionText={q.question} />
                         </div>
                     ))}

                     {localTheory.map((q, i) => (
                        <div key={`ans-t-${i}`} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <div className="flex gap-2 mb-4">
                                <span className="font-bold text-brand-yellow">Q{localQuiz.length + i + 1} (Theory)</span>
                                <span className="text-black dark:text-white font-medium"><MarkdownRenderer content={q.question} inline /></span>
                            </div>
                            
                            {/* Display Answer and Explanation if available */}
                            {(q.answer || q.explanation) ? (
                                <div className="space-y-4 mb-4">
                                     {q.answer && (
                                         <div className="bg-zinc-50 dark:bg-zinc-800 p-4 border-l-4 border-brand-yellow/50">
                                             <strong className="block text-black dark:text-white text-xs uppercase mb-1">Answer / Result</strong>
                                             <MarkdownRenderer content={q.answer} inline />
                                         </div>
                                     )}
                                     {q.explanation && (
                                         <div className="bg-zinc-50 dark:bg-zinc-800 p-4 border-l-4 border-zinc-300">
                                             <strong className="block text-black dark:text-white text-xs uppercase mb-1">Method & Explanation</strong>
                                             <MarkdownRenderer content={q.explanation} />
                                         </div>
                                     )}
                                </div>
                            ) : (
                                <div className="bg-zinc-50 dark:bg-zinc-800 p-4 border-l-4 border-zinc-300 mb-4">
                                    <p className="italic text-zinc-500 text-sm">Theory questions do not have a single fixed answer, but rely on the concepts from the source material.</p>
                                </div>
                            )}

                            <QuestionChat questionText={q.question} />
                        </div>
                     ))}
                 </div>
             </div>
         )}
      </div>

      {/* --- HIDDEN PRINT REF (STRUCTURED FOR ITERATION) --- */}
      <div ref={printRef} className="hidden bg-white text-black p-10 font-sans" style={{ color: 'black' }}>
         {/* Title Block */}
         <div className="print-element text-center mb-10 border-b-2 border-black pb-5">
            <div className="flex justify-center mb-4">
                <Logo className="w-16 h-16" />
            </div>
            <h1 className="text-4xl font-bold uppercase mb-2 text-black">{title}</h1>
            <p className="text-zinc-500 font-bold uppercase">Exam Paper</p>
         </div>

         {localQuiz.length > 0 && (
             <>
                {/* Header for Section A */}
                <div className="print-element mb-6">
                    <h2 className="text-2xl font-bold uppercase border-b border-black pb-2 text-black">Section A: Multiple Choice</h2>
                </div>
                
                {/* Individual Question Blocks - Layout Fixed for Capture */}
                {localQuiz.map((q, idx) => (
                    <div key={`print-mcq-${idx}`} className="print-element mb-8 break-inside-avoid border-l-2 border-transparent pl-2">
                        <div className="flex flex-col gap-2 mb-3">
                            <div className="flex gap-2">
                                <span className="font-bold text-lg text-black">Q{idx + 1}.</span>
                                <div className="text-lg text-black"><MarkdownRenderer content={q.question} inline /></div>
                            </div>
                            {q.diagramSVG && (
                                <div className="ml-8 my-4 p-2 flex justify-center w-full">
                                    {/* Updated Container for PDF rendering */}
                                    <div style={{ width: '100%', maxWidth: '500px' }} dangerouslySetInnerHTML={{ __html: q.diagramSVG }} />
                                </div>
                            )}
                        </div>
                        {/* Use Flex Column instead of Grid for better html2canvas support */}
                        <div className="pl-6 flex flex-col gap-2">
                            {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex gap-3 items-start">
                                    <span className="font-bold text-black min-w-[20px]">{String.fromCharCode(65 + optIdx)}.</span>
                                    <span className="text-black"><MarkdownRenderer content={opt} inline /></span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
             </>
         )}

         {localTheory.length > 0 && (
             <>
                {/* Header for Section B */}
                <div className="print-element mb-6 mt-8">
                    <h2 className="text-2xl font-bold uppercase border-b border-black pb-2 text-black">Section B: Theory Questions</h2>
                </div>

                {/* Individual Theory Blocks */}
                {localTheory.map((q, idx) => (
                    <div key={`print-theory-${idx}`} className="print-element mb-8 break-inside-avoid">
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-3">
                                <span className="font-bold text-lg text-black">Q{localQuiz.length + idx + 1}.</span>
                                <div className="text-lg text-black"><MarkdownRenderer content={q.question} /></div>
                            </div>
                            {q.diagramSVG && (
                                <div className="ml-8 my-4 p-2 flex justify-center w-full">
                                    <div style={{ width: '100%', maxWidth: '500px' }} dangerouslySetInnerHTML={{ __html: q.diagramSVG }} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
             </>
         )}
         
         <div className="answer-section-print mt-10">
            <div className="print-element">
                <h2 className="text-3xl font-bold uppercase mb-6 border-b-2 border-black pb-4 text-black">Answer Key</h2>
            </div>
            {localQuiz.map((q, i) => (
                <div key={`print-ans-${i}`} className="print-element mb-4 break-inside-avoid bg-zinc-50 p-4 border-l-2 border-black">
                    <p className="font-bold text-black">Q{i+1}: {String.fromCharCode(65 + q.correctIndex)}</p>
                    <p className="text-sm text-zinc-600 italic mt-1 text-black">{q.explanation}</p>
                </div>
            ))}
             {localTheory.map((q, i) => (
                <div key={`print-ans-t-${i}`} className="print-element mb-6 break-inside-avoid bg-zinc-50 p-4 border-l-2 border-black">
                    <p className="font-bold text-black mb-2">Q{localQuiz.length + i + 1} (Theory)</p>
                    {q.answer && <p className="text-black font-bold mb-2">Answer: <span className="font-normal">{q.answer}</span></p>}
                    {q.explanation && (
                        <div>
                             <p className="text-xs font-bold uppercase text-zinc-500">Method:</p>
                             <div className="text-sm text-black"><MarkdownRenderer content={q.explanation} /></div>
                        </div>
                    )}
                </div>
            ))}
         </div>
      </div>

      {/* --- PDF MODAL --- */}
      {showPdfModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95">
                  <h2 className="text-2xl font-bold uppercase mb-6 text-black dark:text-white flex items-center gap-2">
                      <Download className="w-6 h-6" /> Download PDF
                  </h2>
                  
                  <div className="space-y-6 mb-8">
                      <div>
                          <label className="block text-sm font-bold uppercase text-zinc-500 mb-3">Select Format</label>
                          <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => setIncludeAnswers(false)}
                                className={`p-4 border-2 font-bold text-center transition-all ${!includeAnswers ? 'bg-black text-white border-black' : 'bg-transparent text-zinc-500 border-zinc-200'}`}
                              >
                                  Student Copy
                                  <span className="block text-xs font-normal mt-1 opacity-70">Questions Only</span>
                              </button>
                              <button 
                                onClick={() => setIncludeAnswers(true)}
                                className={`p-4 border-2 font-bold text-center transition-all ${includeAnswers ? 'bg-black text-white border-black' : 'bg-transparent text-zinc-500 border-zinc-200'}`}
                              >
                                  Teacher Copy
                                  <span className="block text-xs font-normal mt-1 opacity-70">With Answers</span>
                              </button>
                          </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700">
                           <input 
                              type="checkbox" 
                              id="qr-check"
                              checked={includeQr}
                              onChange={(e) => setIncludeQr(e.target.checked)}
                              className="w-5 h-5 accent-brand-yellow"
                           />
                           <label htmlFor="qr-check" className="flex-1 cursor-pointer">
                               <div className="flex items-center gap-2 font-bold text-black dark:text-white uppercase text-sm">
                                  <QrCode className="w-4 h-4" /> Include QR Code
                               </div>
                               <div className="text-xs text-zinc-500">Links to Answer Key PDF</div>
                           </label>
                      </div>
                  </div>

                  <div className="flex gap-4">
                      <button 
                        onClick={() => setShowPdfModal(false)}
                        className="flex-1 py-3 font-bold uppercase text-zinc-500 hover:text-black dark:hover:text-white"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={generatePDF}
                        disabled={isGeneratingPdf}
                        className="flex-1 py-3 bg-brand-yellow text-black font-bold uppercase hover:bg-black hover:text-brand-yellow transition-colors flex items-center justify-center gap-2"
                      >
                          {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Download'}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default PaperView;