import React, { useRef, useState, useEffect } from 'react';
import { Download, ArrowLeft, Printer, Lock, Loader2, FileSpreadsheet, Moon, Sun } from 'lucide-react';
import { Formula } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface FormulaSheetViewProps {
    title: string;
    formulas: Formula[];
    onBack: () => void;
    isPro: boolean;
    onGoPro: () => void;
}

const FormulaSheetView: React.FC<FormulaSheetViewProps> = ({ title, formulas, onBack, isPro, onGoPro }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    // Local theme state management to force re-render if needed, though mostly handled by CSS
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        }
    };

    // Group formulas by section
    const sections: Record<string, Formula[]> = {};
    formulas.forEach(f => {
        const sec = f.section || "General";
        if (!sections[sec]) sections[sec] = [];
        sections[sec].push(f);
    });

    const handleDownload = async () => {
        if (!isPro) {
            onGoPro();
            return;
        }
        if (!printRef.current) return;
        setIsDownloading(true);

        try {
            // Create a temporary container for PDF generation to ensure consistent styling
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '800px'; 
            container.style.zIndex = '-1000';
            container.style.backgroundColor = '#ffffff';
            
            const clone = printRef.current.cloneNode(true) as HTMLElement;
            clone.classList.remove('hidden');
            clone.style.display = 'block';
            
            // Force black text for PDF
            const allElements = clone.querySelectorAll('*');
            allElements.forEach((el) => {
                if (el instanceof HTMLElement) {
                    el.style.color = 'black';
                    el.style.borderColor = '#000';
                }
            });

            container.appendChild(clone);
            document.body.appendChild(container);

            // Wait for mathjax/katex if needed (heuristic delay)
            await new Promise(r => setTimeout(r, 1000));

            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                windowWidth: 800
            });

            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_cheatsheet.pdf`);

        } catch (e) {
            console.error(e);
            alert("Download failed. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 text-black dark:text-white">
            <div className="max-w-5xl mx-auto">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8 print:hidden">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 font-bold uppercase text-sm hover:text-brand-yellow transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <div className="flex gap-4">
                        <button 
                            onClick={toggleTheme}
                            className="p-3 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-black dark:text-white"
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button 
                            onClick={() => window.print()}
                            className="p-3 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title="Print View"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className={`
                                flex items-center gap-2 px-6 py-3 font-bold uppercase border-2 transition-all
                                ${!isPro 
                                    ? 'bg-zinc-200 text-zinc-500 border-zinc-300 cursor-not-allowed' 
                                    : 'bg-brand-yellow text-black border-black hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_#000]'
                                }
                            `}
                        >
                            {isDownloading ? <Loader2 className="w-5 h-5 animate-spin"/> : (isPro ? <Download className="w-5 h-5" /> : <Lock className="w-5 h-5" />)}
                            <span>{isPro ? 'Download PDF' : 'Upgrade to Download'}</span>
                        </button>
                    </div>
                </div>

                {/* Main Sheet Display */}
                <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-8 md:p-12 shadow-[12px_12px_0px_0px_#000] dark:shadow-[12px_12px_0px_0px_#fff] relative overflow-hidden text-black dark:text-white">
                    {/* Decor */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/20 -translate-y-1/2 translate-x-1/2 rounded-full blur-3xl"></div>

                    <div className="flex items-center gap-4 mb-8 border-b-4 border-black dark:border-white pb-6">
                         <div className="p-3 bg-black text-white dark:bg-white dark:text-black">
                             <FileSpreadsheet className="w-8 h-8" />
                         </div>
                         <div>
                             <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">{title}</h1>
                             <p className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-xs">Generated Formula Cheat Sheet</p>
                         </div>
                    </div>

                    <div className="columns-1 md:columns-2 gap-8 space-y-8">
                        {Object.entries(sections).map(([sectionName, items]) => (
                            <div key={sectionName} className="break-inside-avoid mb-8">
                                <h3 className="text-xl font-black uppercase mb-4 pb-2 border-b-2 border-dashed border-black dark:border-white flex items-center gap-2">
                                    <span className="w-2 h-2 bg-brand-yellow border border-black dark:border-white"></span>
                                    {sectionName}
                                </h3>
                                <div className="space-y-4">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/50 border-2 border-black dark:border-zinc-700 p-4 hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-sm uppercase text-black dark:text-white">{item.title}</span>
                                            </div>
                                            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-3 mb-2 flex justify-center">
                                                {/* Force black text for math in light mode, white in dark */}
                                                <div className="text-black dark:text-white">
                                                    <MarkdownRenderer content={item.expression} inline />
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 italic">
                                                {item.method}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 pt-6 border-t-2 border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                        <span className="font-bold uppercase text-xs text-zinc-400">Crazu Intelligent Study Companion</span>
                        <span className="font-bold uppercase text-xs text-zinc-400">Page 1 of 1</span>
                    </div>
                </div>
            </div>

            {/* Hidden PDF Template (Simplified for clear export) */}
            <div ref={printRef} className="hidden bg-white p-12 w-[800px] mx-auto text-black">
                <div className="flex items-center gap-4 mb-8 border-b-4 border-black pb-6">
                    <div className="p-3 bg-black text-white">
                        <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">{title}</h1>
                        <p className="font-bold text-zinc-500 uppercase tracking-widest text-xs">Crazu Formula Sheet</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                     {Object.entries(sections).map(([sectionName, items]) => (
                        <div key={sectionName} className="break-inside-avoid mb-6">
                            <h3 className="text-lg font-black uppercase mb-3 pb-1 border-b-2 border-black">
                                {sectionName}
                            </h3>
                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div key={idx} className="border border-black p-3 bg-zinc-50">
                                        <div className="font-bold text-xs uppercase mb-1">{item.title}</div>
                                        <div className="my-2 flex justify-center scale-90 origin-left">
                                            <MarkdownRenderer content={item.expression} inline />
                                        </div>
                                        <div className="text-[10px] text-zinc-600 italic leading-tight">
                                            {item.method}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     ))}
                </div>
            </div>

        </div>
    );
};

export default FormulaSheetView;
