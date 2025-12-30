import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, GraduationCap, Calculator, Loader2, ArrowLeft } from 'lucide-react';
import { getCurriculumTopics } from '../services/geminiService';

interface FormulaWizardProps {
    onGenerate: (params: any) => void;
    onCancel: () => void;
}

const CLASSES = ['Class 11', 'Class 12'];
const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];

const FormulaWizard: React.FC<FormulaWizardProps> = ({ onGenerate, onCancel }) => {
    const [isLoadingTopics, setIsLoadingTopics] = useState(false);
    
    // Form State
    const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [fetchedTopics, setFetchedTopics] = useState<string[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('');

    const fetchTopicsForSubject = async (subject: string) => {
        setSelectedSubject(subject);
        setIsLoadingTopics(true);
        setFetchedTopics([]);
        
        try {
            const topics = await getCurriculumTopics(selectedClass, "JEE/NEET", subject);
            setFetchedTopics(topics);
        } catch (error) {
            console.error("Failed to fetch topics", error);
            alert("Could not load topics. Please check your internet.");
        } finally {
            setIsLoadingTopics(false);
        }
    };

    const handleGenerate = () => {
        if (!selectedTopic) return;
        onGenerate({
            grade: selectedClass,
            subject: selectedSubject,
            topic: selectedTopic,
            mode: 'FORMULA_SHEET'
        });
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 border-2 border-black dark:border-white p-8 shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] animate-in slide-in-from-bottom-4">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b-2 border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-yellow border-2 border-black text-black">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold uppercase text-black dark:text-white">Formula Sheet Gen</h2>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-zinc-500" />
                </button>
            </div>

            <div className="space-y-8">
                {/* Step 1: Class */}
                <div className="space-y-4">
                    <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">1. Select Class</label>
                    <div className="grid grid-cols-2 gap-4">
                        {CLASSES.map(cls => (
                            <button
                                key={cls}
                                onClick={() => setSelectedClass(cls)}
                                className={`p-4 font-bold border-2 transition-all ${selectedClass === cls ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-white'}`}
                            >
                                {cls}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Subject */}
                <div className="space-y-4">
                    <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">2. Choose Subject</label>
                    <div className="grid grid-cols-2 gap-3">
                        {SUBJECTS.map(subj => (
                            <button
                                key={subj}
                                onClick={() => fetchTopicsForSubject(subj)}
                                className={`p-4 text-left font-bold border-2 transition-all flex justify-between items-center ${selectedSubject === subj ? 'bg-zinc-100 dark:bg-zinc-800 border-black dark:border-white text-black dark:text-white' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'}`}
                            >
                                {subj}
                                {selectedSubject === subj && (isLoadingTopics ? <Loader2 className="w-4 h-4 animate-spin"/> : <ChevronRight className="w-4 h-4"/>)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 3: Topic (Dynamic) */}
                {selectedSubject && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                         <label className="block text-xs font-bold uppercase text-zinc-500 tracking-wider">3. Select Syllabus Topic</label>
                         {isLoadingTopics ? (
                             <div className="p-8 text-center text-zinc-400 font-medium italic border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                 Fetching latest JEE/NEET topics...
                             </div>
                         ) : (
                             <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                 {fetchedTopics.length > 0 ? fetchedTopics.map(topic => (
                                     <button
                                         key={topic}
                                         onClick={() => setSelectedTopic(topic)}
                                         className={`p-3 text-left font-bold border-2 transition-all ${selectedTopic === topic ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-black dark:hover:border-white'}`}
                                     >
                                         {topic}
                                     </button>
                                 )) : (
                                     <div className="text-red-500 text-sm font-bold">No topics found. Try again.</div>
                                 )}
                             </div>
                         )}
                    </div>
                )}

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={!selectedTopic || isLoadingTopics}
                    className={`
                        w-full py-4 font-bold uppercase tracking-widest text-lg transition-all border-2 border-transparent
                        ${!selectedTopic 
                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                            : 'bg-brand-yellow text-black border-black hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_#000]'
                        }
                    `}
                >
                    Generate Cheat Sheet
                </button>

            </div>
        </div>
    );
};

export default FormulaWizard;