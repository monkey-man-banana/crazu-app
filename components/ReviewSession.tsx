import React, { useState, useEffect } from 'react';
import { Layers, RotateCcw, Check, ThumbsUp, Zap, ArrowLeft, Brain } from 'lucide-react';
import { ReviewItem } from '../types';
import { getDueItems, processReview, getDeck } from '../services/srsService';
import MarkdownRenderer from './MarkdownRenderer';

interface ReviewSessionProps {
    onExit: () => void;
}

const ReviewSession: React.FC<ReviewSessionProps> = ({ onExit }) => {
    const [queue, setQueue] = useState<ReviewItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewMode, setReviewMode] = useState<'DUE' | 'ALL'>('DUE');

    useEffect(() => {
        const due = getDueItems();
        if (due.length > 0) {
            setQueue(due);
            setReviewMode('DUE');
        } else {
            const all = getDeck();
            // Sort by staleness (nextReviewDate ascending)
            all.sort((a, b) => a.nextReviewDate - b.nextReviewDate);
            setQueue(all);
            setReviewMode('ALL');
        }
        setLoading(false);
    }, []);

    const handleRate = (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
        if (!queue[currentIndex]) return;

        processReview(queue[currentIndex].id, rating);
        
        // Move to next
        if (currentIndex < queue.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    if (loading) return <div className="p-12 text-center text-black dark:text-white">Loading Deck...</div>;

    if (isFinished || queue.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-white dark:bg-black text-black dark:text-white p-6">
                <div className="max-w-md w-full text-center border-2 border-black dark:border-white p-12 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                    <div className="inline-block p-4 bg-brand-yellow rounded-full border-2 border-black mb-6">
                        <Check className="w-8 h-8 text-black" />
                    </div>
                    {queue.length === 0 ? (
                        <>
                           <h2 className="text-3xl font-bold uppercase mb-4">No Cards Found</h2>
                           <p className="text-zinc-500 dark:text-zinc-400 mb-8">You haven't added any cards to your review deck yet. Analyze a document to create some!</p>
                        </>
                    ) : (
                        <>
                           <h2 className="text-3xl font-bold uppercase mb-4">All Caught Up!</h2>
                           <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                               {reviewMode === 'DUE' 
                                 ? "You've reviewed all cards due for today." 
                                 : "You've reviewed your entire deck!"
                               }
                           </p>
                        </>
                    )}
                    
                    <button 
                        onClick={onExit}
                        className="w-full py-4 bg-brand-yellow text-black font-bold uppercase hover:bg-black hover:text-brand-yellow transition-colors border-2 border-transparent"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentItem = queue[currentIndex];

    return (
        <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col">
            {/* Header */}
            <header className="p-4 flex items-center justify-between max-w-3xl mx-auto w-full">
                <button onClick={onExit} className="flex items-center gap-2 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white font-bold uppercase text-sm">
                    <ArrowLeft className="w-4 h-4" /> Exit
                </button>
                <div className="flex items-center gap-4">
                    {reviewMode === 'ALL' && (
                        <span className="text-xs font-bold uppercase bg-zinc-200 dark:bg-zinc-800 px-2 py-1 text-zinc-500 dark:text-zinc-400">Cram Mode</span>
                    )}
                    <div className="text-sm font-bold uppercase text-zinc-400 dark:text-zinc-500">
                        Card {currentIndex + 1} of {queue.length}
                    </div>
                </div>
            </header>

            {/* Main Card Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-3xl mx-auto">
                
                <div className="w-full bg-white dark:bg-black border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] p-8 md:p-16 min-h-[400px] flex flex-col justify-between animate-in fade-in zoom-in-95">
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-brand-yellow text-xs font-bold uppercase tracking-widest mb-4">
                            <Brain className="w-4 h-4" /> Recall Question
                        </div>
                        
                        {/* Question (Front) */}
                        <div className="text-2xl md:text-3xl font-bold text-black dark:text-white leading-tight">
                            <MarkdownRenderer content={currentItem.question} />
                        </div>

                        {/* Divider */}
                        {isFlipped && (
                            <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 my-8"></div>
                        )}

                        {/* Answer (Back) */}
                        {isFlipped && (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <div className="text-xs font-bold uppercase text-zinc-400 mb-2">Answer</div>
                                <div className="text-lg md:text-xl text-black dark:text-white leading-relaxed">
                                    <MarkdownRenderer content={currentItem.answer} />
                                </div>
                                {currentItem.explanation && (
                                    <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900 border-l-4 border-brand-yellow text-sm text-zinc-600 dark:text-zinc-400">
                                        <MarkdownRenderer content={currentItem.explanation} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-12 pt-8 border-t-2 border-transparent">
                        {!isFlipped ? (
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="w-full py-4 bg-brand-yellow text-black font-bold uppercase tracking-widest hover:bg-black hover:text-brand-yellow transition-colors"
                            >
                                Show Answer
                            </button>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <button
                                    onClick={() => handleRate('AGAIN')}
                                    className="p-4 border-2 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-900 text-black dark:text-white flex flex-col items-center gap-2 transition-all opacity-70 hover:opacity-100"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    <span className="font-bold uppercase text-xs">Again</span>
                                    <span className="text-[10px] opacity-60">1d</span>
                                </button>
                                <button
                                    onClick={() => handleRate('HARD')}
                                    className="p-4 border-2 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-900 text-black dark:text-white flex flex-col items-center gap-2 transition-all opacity-80 hover:opacity-100"
                                >
                                    <Layers className="w-5 h-5" />
                                    <span className="font-bold uppercase text-xs">Hard</span>
                                    <span className="text-[10px] opacity-60">2d</span>
                                </button>
                                <button
                                    onClick={() => handleRate('GOOD')}
                                    className="p-4 border-2 border-black dark:border-white bg-zinc-100 dark:bg-zinc-900 hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black text-black dark:text-white flex flex-col items-center gap-2 transition-all"
                                >
                                    <ThumbsUp className="w-5 h-5" />
                                    <span className="font-bold uppercase text-xs">Good</span>
                                    <span className="text-[10px] opacity-60">4d</span>
                                </button>
                                <button
                                    onClick={() => handleRate('EASY')}
                                    className="p-4 border-2 border-black dark:border-white bg-brand-yellow text-black hover:bg-black hover:text-brand-yellow flex flex-col items-center gap-2 transition-all"
                                >
                                    <Zap className="w-5 h-5" />
                                    <span className="font-bold uppercase text-xs">Easy</span>
                                    <span className="text-[10px] opacity-60">7d</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReviewSession;