import React, { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Check, GraduationCap, Globe, Hash, LayoutList, Loader2, Sparkles, FileQuestion, Sliders, Activity, Plus, Database, Bot, Lock, Target } from 'lucide-react';
import { GeneratorParams } from '../types';
import { getCurriculumTopics } from '../services/geminiService';

interface GeneratorWizardProps {
  onGenerate: (params: GeneratorParams) => void;
  onCancel: () => void;
}

const GeneratorWizard: React.FC<GeneratorWizardProps> = ({ onGenerate, onCancel }) => {
  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState('11'); // Default to 11
  const [board, setBoard] = useState('JEE Main'); // Default to JEE
  const [subject, setSubject] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  
  // Separate counts
  const [mcqCount, setMcqCount] = useState<number>(10);
  const [theoryCount, setTheoryCount] = useState<number>(5);

  // Difficulty State
  const [isVariableDifficulty, setIsVariableDifficulty] = useState(true);
  const [difficultyLevel, setDifficultyLevel] = useState<number>(75); // Higher default for competitive
  
  // Source State
  const [sourceType, setSourceType] = useState<'AI_GENERATED' | 'NON_AI'>('AI_GENERATED');

  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Fetch topics when subject is selected
  useEffect(() => {
    if (step === 3 && suggestedTopics.length === 0 && grade && board && subject) {
      const fetchTopics = async () => {
        setIsLoadingTopics(true);
        try {
          const topics = await getCurriculumTopics(grade, board, subject);
          setSuggestedTopics(topics);
        } catch (error) {
          console.error("Failed to load topics");
        } finally {
          setIsLoadingTopics(false);
        }
      };
      fetchTopics();
    }
  }, [step, grade, board, subject]);

  const getDifficultyString = () => {
    if (isVariableDifficulty) return "Variable (Mixed Difficulty)";
    if (difficultyLevel < 20) return `Very Easy (${difficultyLevel}%)`;
    if (difficultyLevel < 40) return `Easy (${difficultyLevel}%)`;
    if (difficultyLevel < 60) return `Medium (${difficultyLevel}%)`;
    if (difficultyLevel < 80) return `Hard (${difficultyLevel}%)`;
    return `Expert/Olympiad (${difficultyLevel}%)`;
  };

  const handleNext = () => {
    if (step === 6) { // Final Step (Index 6, i.e., Step 7)
      onGenerate({ 
        grade, 
        board, 
        subject, 
        topic: selectedTopics.join(', '), 
        mcqCount,
        theoryCount,
        difficulty: getDifficultyString(),
        sourceType
      });
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (step === 3 && isAddingCustom) {
           addCustomTopic();
        } else if (isStepValid()) {
            handleNext();
        }
    }
  };

  const toggleTopic = (topic: string) => {
      setSelectedTopics(prev => {
          if (prev.includes(topic)) {
              return prev.filter(t => t !== topic);
          } else {
              return [...prev, topic];
          }
      });
  };

  const addCustomTopic = () => {
      if (customTopic.trim()) {
          setSelectedTopics(prev => [...prev, customTopic.trim()]);
          setCustomTopic('');
          setIsAddingCustom(false);
      }
  };

  const isStepValid = () => {
    switch (step) {
      case 0: return grade.length > 0;
      case 1: return board.length > 0;
      case 2: return subject.length > 0;
      case 3: return selectedTopics.length > 0;
      case 4: return mcqCount >= 0 && theoryCount >= 0 && (mcqCount + theoryCount > 0);
      case 5: return true; 
      case 6: return true; // Source toggle is always valid (has default)
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-yellow text-black border-2 border-black">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold uppercase text-black dark:text-white">Select Class</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
                {['11', '12'].map((cls) => (
                    <button
                        key={cls}
                        onClick={() => setGrade(cls)}
                        className={`p-8 border-2 text-2xl font-black uppercase transition-all ${grade === cls ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-300 dark:border-zinc-700 hover:border-brand-yellow'}`}
                    >
                        Class {cls}
                    </button>
                ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-yellow text-black border-2 border-black">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold uppercase text-black dark:text-white">Target Exam</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['JEE Main', 'JEE Advanced', 'NEET', 'CBSE Boards'].map(b => (
                <button
                  key={b}
                  onClick={() => setBoard(b)}
                  className={`p-4 border-2 font-bold uppercase text-lg transition-all ${board === b ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-transparent border-zinc-300 dark:border-zinc-700 hover:border-brand-yellow text-zinc-500 dark:text-zinc-400'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-yellow text-black border-2 border-black">
                <LayoutList className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold uppercase text-black dark:text-white">Select Subject</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`p-6 border-2 font-bold uppercase text-lg transition-all ${subject === s ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-transparent border-zinc-300 dark:border-zinc-700 hover:border-brand-yellow text-zinc-500 dark:text-zinc-400'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-yellow text-black border-2 border-black">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold uppercase text-black dark:text-white">Select Topics</h3>
            </div>
            
            <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase text-sm">Select chapters from syllabus</p>

            {isLoadingTopics ? (
              <div className="flex flex-col items-center justify-center py-12">
                 <Loader2 className="w-8 h-8 animate-spin text-brand-yellow mb-4" />
                 <p className="text-zinc-500 font-bold uppercase">Analyzing Syllabus...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {suggestedTopics.map((t, idx) => {
                   const isSelected = selectedTopics.includes(t);
                   return (
                    <button
                        key={idx}
                        onClick={() => toggleTopic(t)}
                        className={`w-full text-left p-4 border-2 font-bold transition-all flex justify-between items-center ${isSelected ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-transparent border-zinc-200 dark:border-zinc-700 hover:border-brand-yellow text-zinc-600 dark:text-zinc-400'}`}
                    >
                        {t}
                        {isSelected && <Check className="w-5 h-5" />}
                    </button>
                   );
                })}
                
                {selectedTopics.filter(t => !suggestedTopics.includes(t)).map((t, idx) => (
                    <button
                        key={`custom-${idx}`}
                        onClick={() => toggleTopic(t)}
                        className="w-full text-left p-4 border-2 font-bold transition-all flex justify-between items-center bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                    >
                        {t}
                        <Check className="w-5 h-5" />
                    </button>
                ))}

                <div className={`w-full p-0 border-2 transition-all ${isAddingCustom ? 'border-brand-yellow bg-zinc-50 dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-700'}`}>
                    {isAddingCustom ? (
                       <div className="flex items-center p-2">
                            <input 
                                type="text"
                                autoFocus
                                placeholder="Enter specific topic..."
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full p-2 bg-transparent outline-none font-bold text-black dark:text-white placeholder:text-zinc-400"
                            />
                            <button onClick={addCustomTopic} className="p-2 bg-brand-yellow text-black">
                                <Plus className="w-5 h-5" />
                            </button>
                       </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingCustom(true)}
                            className="w-full text-left p-4 font-bold text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Custom Topic
                        </button>
                    )}
                </div>
              </div>
            )}
          </div>
        );
      case 4:
        return (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-yellow text-black border-2 border-black">
                <Hash className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold uppercase text-black dark:text-white">Question Counts</h3>
            </div>
            
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent hover:border-brand-yellow transition-colors">
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">Number of MCQs</label>
                    <span className="text-xs font-bold text-zinc-500">Max 100</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={mcqCount}
                        onChange={(e) => setMcqCount(parseInt(e.target.value))}
                        className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-yellow"
                    />
                    <input 
                        type="number"
                        min="0"
                        max="100"
                        value={mcqCount}
                        onChange={(e) => setMcqCount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        onKeyDown={handleKeyDown}
                        className="w-20 p-3 bg-black dark:bg-white text-white dark:text-black font-bold text-center text-xl outline-none border-2 border-transparent focus:border-brand-yellow"
                    />
                 </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent hover:border-brand-yellow transition-colors">
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">Number of Theory Questions</label>
                    <span className="text-xs font-bold text-zinc-500">Max 100</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={theoryCount}
                        onChange={(e) => setTheoryCount(parseInt(e.target.value))}
                        className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-yellow"
                    />
                    <input 
                        type="number"
                        min="0"
                        max="100"
                        value={theoryCount}
                        onChange={(e) => setTheoryCount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        onKeyDown={handleKeyDown}
                        className="w-20 p-3 bg-black dark:bg-white text-white dark:text-black font-bold text-center text-xl outline-none border-2 border-transparent focus:border-brand-yellow"
                    />
                 </div>
            </div>

            <div className="bg-brand-yellow/10 p-4 border-l-4 border-brand-yellow">
                <p className="text-black dark:text-white font-bold text-sm flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-brand-yellow" />
                   Total Questions: <span className="text-xl">{mcqCount + theoryCount}</span>
                </p>
            </div>
          </div>
        );
      case 5:
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-brand-yellow text-black border-2 border-black">
                        <Activity className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold uppercase text-black dark:text-white">Difficulty Modulator</h3>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-2 border-black dark:border-white">
                    <label className="flex items-center gap-4 cursor-pointer group">
                        <div className={`w-8 h-8 border-2 border-black dark:border-white flex items-center justify-center transition-all ${isVariableDifficulty ? 'bg-brand-yellow' : 'bg-transparent'}`}>
                             {isVariableDifficulty && <Check className="w-6 h-6 text-black" />}
                        </div>
                        <input 
                            type="checkbox" 
                            className="hidden"
                            checked={isVariableDifficulty}
                            onChange={(e) => setIsVariableDifficulty(e.target.checked)}
                        />
                        <div>
                            <span className="block text-xl font-bold text-black dark:text-white uppercase group-hover:text-brand-yellow transition-colors">Variable Difficulty</span>
                            <span className="text-sm text-zinc-500 font-bold">Auto-balanced mix of Easy, Medium, and Hard questions (Recommended)</span>
                        </div>
                    </label>

                    {!isVariableDifficulty && (
                         <div className="mt-8 pt-8 border-t-2 border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-black dark:text-white uppercase tracking-wider">Set Difficulty Level</span>
                                <span className="font-mono text-brand-yellow text-xl font-bold">{getDifficultyString()}</span>
                            </div>
                            
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={difficultyLevel}
                                onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
                                className="w-full h-4 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-brand-yellow"
                            />

                            <div className="flex justify-between mt-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                <span>Very Easy</span>
                                <span>Medium</span>
                                <span>Expert</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
      case 6: // Step 7: Source Toggle
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-brand-yellow text-black border-2 border-black">
                        <Database className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold uppercase text-black dark:text-white">Question Source</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <button
                        onClick={() => {
                            setSourceType('AI_GENERATED');
                        }}
                        className={`p-8 border-2 transition-all flex flex-col items-center gap-4 text-center group relative ${sourceType === 'AI_GENERATED' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-brand-yellow'}`}
                     >
                         <div className={`p-4 rounded-full ${sourceType === 'AI_GENERATED' ? 'bg-brand-yellow text-black' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                             <Bot className="w-8 h-8" />
                         </div>
                         <div>
                             <h4 className="text-xl font-bold uppercase mb-2">AI Generated</h4>
                             <p className="text-sm opacity-80">Creates unique, creative questions tailored to your topic. Infinite variety.</p>
                         </div>
                         {sourceType === 'AI_GENERATED' && <Check className="w-6 h-6 text-brand-yellow mt-2" />}
                     </button>

                     <button
                        onClick={() => setSourceType('NON_AI')}
                        className={`p-8 border-2 transition-all flex flex-col items-center gap-4 text-center group ${sourceType === 'NON_AI' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-brand-yellow'}`}
                     >
                         <div className={`p-4 rounded-full ${sourceType === 'NON_AI' ? 'bg-brand-yellow text-black' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                             <FileQuestion className="w-8 h-8" />
                         </div>
                         <div>
                             <h4 className="text-xl font-bold uppercase mb-2">Previous Year Questions (PYQ)</h4>
                             <p className="text-sm opacity-80">Prioritizes retrieval of standard, curriculum-aligned questions resembling past papers.</p>
                         </div>
                         {sourceType === 'NON_AI' && <Check className="w-6 h-6 text-brand-yellow mt-2" />}
                     </button>
                </div>
            </div>
        );
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-brand-white dark:bg-brand-black border-2 border-black dark:border-white/20 p-8 shadow-2xl relative">
       {/* Progress Bar */}
       <div className="absolute top-0 left-0 h-2 bg-brand-yellow transition-all duration-500" style={{ width: `${((step + 1) / 7) * 100}%` }}></div>

       <div className="mb-8 flex justify-between items-center">
          <h2 className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Step {step + 1} of 7</h2>
          {/* Cancel button removed */}
       </div>

       <div className="min-h-[300px]">
          {renderStepContent()}
       </div>

       <div className="mt-8 pt-8 border-t-2 border-black dark:border-white/20 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="flex items-center gap-2 px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest hover:bg-brand-yellow hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 6 ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Paper
                </>
            ) : (
                <>
                  Next Step
                  <ArrowRight className="w-5 h-5" />
                </>
            )}
          </button>
       </div>
    </div>
  );
};

export default GeneratorWizard;