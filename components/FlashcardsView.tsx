import React, { useState } from 'react';
import { Layers, ArrowLeft, ArrowRight, RotateCw, Plus, Check } from 'lucide-react';
import { Flashcard } from '../types';
import { addToDeck } from '../services/srsService';
import MarkdownRenderer from './MarkdownRenderer';

interface FlashcardsViewProps {
    cards: Flashcard[];
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ cards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length);
        }, 150);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        }, 150);
    };

    const handleAddToSRS = (e: React.MouseEvent) => {
        e.stopPropagation();
        const card = cards[currentIndex];
        const success = addToDeck(card.term, card.definition, '', 'GENERAL');
        if (success) {
            setSavedStatus(prev => ({ ...prev, [currentIndex]: true }));
        }
    };

    if (!cards || cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-black border-2 border-black dark:border-white text-black dark:text-white">
                <Layers className="w-12 h-12 text-zinc-300 mb-4" />
                <p className="text-zinc-500 font-bold uppercase">No Flashcards Available</p>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="flex flex-col items-center justify-center animate-in fade-in">
             <div className="w-full max-w-2xl">
                 <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-brand-yellow border-2 border-black">
                             <Layers className="w-6 h-6 text-black" />
                         </div>
                         <h2 className="text-2xl font-bold uppercase text-black dark:text-white">Flashcards</h2>
                     </div>
                     <span className="font-mono text-zinc-500 font-bold">{currentIndex + 1} / {cards.length}</span>
                 </div>

                 {/* Card Container */}
                 <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative w-full h-96 perspective-1000 cursor-pointer group"
                 >
                     <div className={`
                        relative w-full h-full duration-500 preserve-3d transition-all
                        ${isFlipped ? 'rotate-y-180' : ''}
                     `}>
                         {/* Front */}
                         <div className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-900 border-2 border-black dark:border-white p-8 flex flex-col items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                             <span className="absolute top-4 left-4 text-xs font-bold uppercase text-brand-yellow tracking-widest">Term</span>
                             <h3 className="text-3xl md:text-4xl font-bold text-center text-black dark:text-white">
                                <MarkdownRenderer content={currentCard.term} inline />
                             </h3>
                             <div className="absolute bottom-6 flex gap-2 text-zinc-400 text-xs font-bold uppercase items-center">
                                 <RotateCw className="w-4 h-4" /> Click to Flip
                             </div>
                         </div>

                         {/* Back */}
                         <div className="absolute inset-0 backface-hidden rotate-y-180 bg-zinc-900 dark:bg-white border-2 border-black dark:border-white p-8 flex flex-col items-center justify-center shadow-lg">
                             <span className="absolute top-4 left-4 text-xs font-bold uppercase text-brand-yellow tracking-widest">Definition</span>
                             {/* 
                                Force text color inversion for MarkdownRenderer on back card.
                                Dark Mode: Background is WHITE, so text MUST be BLACK.
                                Also need to override global .katex color (white) to black in this specific container.
                             */}
                             <div className="text-lg md:text-xl text-center leading-relaxed overflow-y-auto max-h-[70%] w-full dark:[&_.katex]:!text-black">
                                <MarkdownRenderer 
                                    content={currentCard.definition} 
                                    className="!text-white dark:!text-black"
                                />
                             </div>
                             
                             <button
                                onClick={handleAddToSRS}
                                disabled={savedStatus[currentIndex]}
                                className={`
                                    absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 font-bold uppercase text-xs transition-all border-2
                                    ${savedStatus[currentIndex] 
                                        ? 'bg-brand-yellow border-brand-yellow text-black' 
                                        : 'bg-transparent border-zinc-600 text-zinc-400 hover:border-brand-yellow hover:text-brand-yellow'
                                    }
                                `}
                             >
                                {savedStatus[currentIndex] ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {savedStatus[currentIndex] ? 'Added' : 'Add to Review'}
                             </button>
                         </div>
                     </div>
                 </div>

                 {/* Controls */}
                 <div className="flex justify-center gap-6 mt-8">
                     <button 
                        onClick={handlePrev}
                        className="p-4 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black transition-colors"
                     >
                         <ArrowLeft className="w-6 h-6" />
                     </button>
                     <button 
                        onClick={handleNext}
                        className="p-4 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black transition-colors"
                     >
                         <ArrowRight className="w-6 h-6" />
                     </button>
                 </div>
             </div>
        </div>
    );
};

export default FlashcardsView;