import React, { useState, useEffect } from 'react';
import { 
    Brain, Settings, ArrowRight, Check, X, 
    RefreshCw, Play, BarChart, ChevronRight, 
    CheckCircle, AlertCircle, HelpCircle, Loader2
} from 'lucide-react';
import { QuizConfig, QuizType, Difficulty, InteractiveQuestion } from '../types';
import { generateCustomQuiz } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';

interface InteractiveQuizProps {
    fileContext: string;
    fileMimeType: string;
    onExit: () => void;
}

type QuizStep = 'SETUP' | 'LOADING' | 'ACTIVE' | 'RESULTS';

// --- FLEXIBLE CHECKING HELPERS ---

// Levenshtein distance for fuzzy matching typos
function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function checkFIB(user: string, correct: string, keywords: string[] = []): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s\d]/g, '').trim();
    const u = normalize(user);
    const c = normalize(correct);
    
    // Exact (normalized) match
    if (u === c) return true;

    // Check against keywords (synonyms)
    if (keywords.length > 0) {
        for (const k of keywords) {
             if (normalize(k) === u) return true;
        }
    }
    
    // Number check
    const uNum = parseFloat(user);
    const cNum = parseFloat(correct);
    if (!isNaN(uNum) && !isNaN(cNum)) {
        return Math.abs(uNum - cNum) < 0.01; // Epsilon
    }

    // Levenshtein for typos on longer words
    if (c.length > 3) {
        const dist = getLevenshteinDistance(u, c);
        // Allow 1 error for 4-5 chars, 2 errors for 6+
        const allowed = c.length > 5 ? 2 : 1;
        if (dist <= allowed) return true;
    }
    return false;
}

function checkOpenEnded(user: string, keywords: string[]): boolean {
    const u = user.toLowerCase();
    
    // If no keywords provided by AI, fallback to length check (effort based)
    if (!keywords || keywords.length === 0) return user.trim().length > 5;
    
    let matches = 0;
    for (const k of keywords) {
        if (u.includes(k.toLowerCase())) matches++;
    }
    // Pass if at least 50% of keywords are found
    // Or if they found at least 1 keyword for short answers
    const threshold = Math.max(1, Math.ceil(keywords.length / 2));
    return matches >= threshold;
}

const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({ fileContext, fileMimeType, onExit }) => {
    const [step, setStep] = useState<QuizStep>('SETUP');
    const [questions, setQuestions] = useState<InteractiveQuestion[]>([]);
    const [config, setConfig] = useState<QuizConfig>({
        types: [QuizType.MULTIPLE_CHOICE],
        difficulty: 'Medium',
        count: 10
    });

    // Active Session State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string | number>>({});
    const [feedbackState, setFeedbackState] = useState<Record<number, 'correct' | 'incorrect' | 'unanswered'>>({});
    const [inputVal, setInputVal] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const startQuiz = async () => {
        setStep('LOADING');
        try {
            const generatedQuestions = await generateCustomQuiz(fileContext, fileMimeType, config);
            if (generatedQuestions && generatedQuestions.length > 0) {
                setQuestions(generatedQuestions);
                setStep('ACTIVE');
                setCurrentIndex(0);
                setScore(0);
                setUserAnswers({});
                setFeedbackState({});
                setIsSubmitted(false);
                setInputVal('');
            } else {
                alert("Could not generate questions. Please try different settings.");
                setStep('SETUP');
            }
        } catch (e) {
            console.error(e);
            alert("Error starting quiz. Please try again.");
            setStep('SETUP');
        }
    };

    const handleAnswerSubmit = () => {
        const q = questions[currentIndex];
        let isCorrect = false;
        let answerToStore: string | number = inputVal;

        if (q.type === QuizType.MULTIPLE_CHOICE) {
            answerToStore = parseInt(inputVal); // inputVal stores index as string
            if (answerToStore === q.correctIndex) isCorrect = true;
        } else if (q.type === QuizType.FILL_IN_THE_BLANK) {
            if (checkFIB(inputVal, q.answer || '', q.keywords)) {
                isCorrect = true;
            }
        } else if (q.type === QuizType.OPEN_ENDED) {
            if (checkOpenEnded(inputVal, q.keywords || [])) {
                isCorrect = true;
            }
        }

        if (isCorrect) setScore(prev => prev + 1);

        setUserAnswers(prev => ({ ...prev, [q.id]: answerToStore }));
        setFeedbackState(prev => ({ ...prev, [q.id]: isCorrect ? 'correct' : 'incorrect' }));
        setIsSubmitted(true);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsSubmitted(false);
            setInputVal('');
        } else {
            setStep('RESULTS');
        }
    };

    const handleRetake = () => {
        setCurrentIndex(0);
        setScore(0);
        setUserAnswers({});
        setFeedbackState({});
        setIsSubmitted(false);
        setInputVal('');
        setStep('ACTIVE');
    };

    // Render Logic
    if (step === 'SETUP') {
        return (
            <div className="animate-in fade-in zoom-in-95 max-w-2xl mx-auto border-2 border-black dark:border-white bg-white dark:bg-black p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-8 border-b-2 border-black dark:border-white pb-6">
                    <Settings className="w-8 h-8 text-brand-yellow" />
                    <h2 className="text-3xl font-bold uppercase text-black dark:text-white">Quiz Setup</h2>
                </div>

                {/* Types */}
                <div className="mb-8">
                    <label className="block text-sm font-bold uppercase text-zinc-500 mb-3">Quiz Types</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { id: QuizType.MULTIPLE_CHOICE, label: 'Multiple Choice' },
                            { id: QuizType.FILL_IN_THE_BLANK, label: 'Fill in Blank' },
                            { id: QuizType.OPEN_ENDED, label: 'Open Ended' }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => {
                                    setConfig(prev => {
                                        const newTypes = prev.types.includes(type.id)
                                            ? prev.types.filter(t => t !== type.id)
                                            : [...prev.types, type.id];
                                        // Ensure at least one is selected
                                        if (newTypes.length === 0) return prev;
                                        return { ...prev, types: newTypes };
                                    });
                                }}
                                className={`p-4 border-2 font-bold text-sm transition-all ${
                                    config.types.includes(type.id)
                                        ? 'bg-black text-white border-black dark:bg-white dark:text-black'
                                        : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-700'
                                }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Difficulty */}
                <div className="mb-8">
                    <label className="block text-sm font-bold uppercase text-zinc-500 mb-3">Difficulty</label>
                    <div className="flex gap-4 p-2 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800">
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
                            <label key={level} className="flex-1 cursor-pointer">
                                <input 
                                    type="radio" 
                                    className="peer hidden"
                                    name="difficulty"
                                    checked={config.difficulty === level}
                                    onChange={() => setConfig(prev => ({...prev, difficulty: level}))}
                                />
                                <div className="text-center py-2 font-bold text-zinc-500 peer-checked:bg-brand-yellow peer-checked:text-black transition-all">
                                    {level}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Count */}
                <div className="mb-10">
                    <div className="flex justify-between mb-2">
                        <label className="block text-sm font-bold uppercase text-zinc-500">Question Count</label>
                        <span className="font-bold text-black dark:text-white text-xl">{config.count}</span>
                    </div>
                    <input 
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        value={config.count}
                        onChange={(e) => setConfig(prev => ({...prev, count: parseInt(e.target.value)}))}
                        className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-yellow"
                    />
                </div>

                <div className="flex gap-4">
                     <button
                        onClick={onExit}
                        className="flex-1 py-4 font-bold uppercase text-zinc-500 hover:text-black dark:hover:text-white"
                     >
                        Cancel
                     </button>
                     <button
                        onClick={startQuiz}
                        disabled={config.types.length === 0}
                        className="flex-[2] py-4 bg-black dark:bg-white text-white dark:text-black font-bold uppercase hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black transition-colors flex items-center justify-center gap-2"
                     >
                        <Play className="w-5 h-5" /> Start Quiz
                     </button>
                </div>
            </div>
        );
    }

    if (step === 'LOADING') {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                <Loader2 className="w-12 h-12 animate-spin text-brand-yellow mb-6" />
                <h3 className="text-2xl font-bold uppercase text-black dark:text-white mb-2">Generating Quiz...</h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-mono">Crafting {config.difficulty} questions based on your document.</p>
            </div>
        );
    }

    if (step === 'RESULTS') {
        const percentage = Math.round((score / questions.length) * 100);
        let message = "Good effort!";
        if (percentage > 90) message = "Outstanding!";
        else if (percentage > 70) message = "Great job!";
        else if (percentage < 50) message = "Keep studying!";

        return (
            <div className="max-w-2xl mx-auto border-2 border-black dark:border-white bg-white dark:bg-black p-8 animate-in fade-in zoom-in-95 text-center">
                 <div className="mb-8">
                     <div className="inline-flex items-center justify-center p-6 bg-brand-yellow border-4 border-black dark:border-white rounded-full mb-6">
                         <BarChart className="w-10 h-10 text-black" />
                     </div>
                     <h2 className="text-4xl font-bold uppercase text-black dark:text-white mb-2">{message}</h2>
                     <p className="text-zinc-500 font-bold uppercase tracking-widest">Quiz Completed</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-10 max-w-md mx-auto">
                     <div className="p-4 border-2 border-zinc-200 dark:border-zinc-800">
                         <span className="block text-3xl font-bold text-black dark:text-white mb-1">{score} / {questions.length}</span>
                         <span className="text-xs font-bold uppercase text-zinc-500">Score</span>
                     </div>
                     <div className="p-4 border-2 border-zinc-200 dark:border-zinc-800">
                         <span className="block text-3xl font-bold text-black dark:text-white mb-1">{percentage}%</span>
                         <span className="text-xs font-bold uppercase text-zinc-500">Accuracy</span>
                     </div>
                 </div>

                 <div className="flex gap-4">
                     <button
                        onClick={onExit}
                        className="flex-1 py-4 border-2 border-transparent hover:border-black dark:hover:border-white font-bold uppercase text-zinc-500 hover:text-black dark:hover:text-white"
                     >
                        Exit
                     </button>
                     <button
                        onClick={handleRetake}
                        className="flex-[2] py-4 bg-black dark:bg-white text-white dark:text-black font-bold uppercase hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black transition-colors flex items-center justify-center gap-2"
                     >
                        <RefreshCw className="w-5 h-5" /> Retake Quiz
                     </button>
                 </div>
            </div>
        )
    }

    // --- ACTIVE QUIZ RENDER ---
    const q = questions[currentIndex];
    const isCorrect = feedbackState[q.id] === 'correct';
    // const isIncorrect = feedbackState[q.id] === 'incorrect'; // Unused

    const renderInput = () => {
        if (q.type === QuizType.MULTIPLE_CHOICE) {
            return (
                <div className="grid grid-cols-1 gap-3">
                    {q.options?.map((opt, idx) => {
                        let btnClass = "border-2 p-4 text-left font-bold transition-all hover:border-black dark:hover:border-white ";
                        // Logic for styling during result view vs selection view
                        if (isSubmitted) {
                            if (idx === q.correctIndex) btnClass += "bg-brand-yellow border-black text-black "; // Correct (Yellow)
                            else if (parseInt(inputVal) === idx) btnClass += "bg-black border-black text-white dark:bg-zinc-800 dark:border-white "; // Incorrect (Black/Dark)
                            else btnClass += "border-zinc-200 text-zinc-400 dark:border-zinc-800 ";
                        } else {
                            if (parseInt(inputVal) === idx) btnClass += "bg-black text-white border-black dark:bg-white dark:text-black ";
                            else btnClass += "bg-transparent border-zinc-200 text-zinc-700 dark:text-zinc-300 dark:border-zinc-700 ";
                        }

                        return (
                            <button
                                key={idx}
                                disabled={isSubmitted}
                                onClick={() => {
                                    // Toggle selection
                                    if (inputVal === idx.toString()) {
                                        setInputVal('');
                                    } else {
                                        setInputVal(idx.toString());
                                    }
                                }}
                                className={btnClass}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="flex gap-3">
                                        <span className="opacity-50">{String.fromCharCode(65 + idx)}.</span>
                                        <MarkdownRenderer content={opt} inline className="!text-inherit" />
                                    </span>
                                    {isSubmitted && idx === q.correctIndex && <CheckCircle className="w-5 h-5" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            );
        }

        if (q.type === QuizType.FILL_IN_THE_BLANK) {
            // Split question by [____]
            const parts = q.question.split('[____]');
            return (
                <div className="my-8 text-xl leading-loose font-medium text-black dark:text-white">
                    {parts.map((part, i) => (
                        <React.Fragment key={i}>
                            <MarkdownRenderer content={part} inline />
                            {i < parts.length - 1 && (
                                <input 
                                    type="text"
                                    disabled={isSubmitted}
                                    value={inputVal}
                                    onChange={(e) => setInputVal(e.target.value)}
                                    placeholder="type answer..."
                                    className={`
                                        mx-2 px-2 py-1 border-b-4 outline-none font-bold min-w-[150px] text-center bg-transparent transition-colors
                                        ${isSubmitted 
                                            ? isCorrect ? 'border-brand-yellow text-black bg-brand-yellow/10' : 'border-black dark:border-white text-zinc-500 line-through'
                                            : 'border-black dark:border-white focus:border-brand-yellow text-black dark:text-white'
                                        }
                                    `}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            );
        }

        if (q.type === QuizType.OPEN_ENDED) {
            return (
                <div className="space-y-4">
                     <p className="text-lg font-medium text-black dark:text-white"><MarkdownRenderer content={q.question} /></p>
                     <textarea 
                        rows={5}
                        disabled={isSubmitted}
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="Type your explanation here..."
                        className={`w-full p-4 border-2 outline-none font-mono text-sm bg-transparent transition-colors text-black dark:text-white
                             ${isSubmitted 
                                ? isCorrect ? 'border-brand-yellow bg-brand-yellow/10' : 'border-black dark:border-white bg-zinc-100 dark:bg-zinc-900'
                                : 'border-zinc-300 dark:border-zinc-700 focus:border-black dark:focus:border-white'
                             }
                        `}
                     />
                </div>
            );
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
             {/* Header */}
             <div className="mb-8 flex justify-between items-center bg-white dark:bg-black p-4 border-2 border-black dark:border-white shadow-lg">
                 <div className="flex items-center gap-3">
                     <div className="p-2 bg-brand-yellow text-black font-bold font-mono">
                         Q{currentIndex + 1}
                     </div>
                     <span className="text-zinc-500 font-bold uppercase text-xs tracking-widest">of {questions.length}</span>
                 </div>
                 
                 {/* Progress Bar */}
                 <div className="flex-1 mx-8 h-3 bg-zinc-100 dark:bg-zinc-800 border border-black dark:border-zinc-700">
                     <div 
                        className="h-full bg-brand-yellow transition-all duration-300" 
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                     />
                 </div>

                 <div className="font-bold text-black dark:text-white">
                     Score: {score}
                 </div>
             </div>

             {/* Question Card */}
             <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-8 md:p-12 shadow-2xl min-h-[400px] flex flex-col">
                 <div className="flex-1">
                     {/* For MCQ/Open, show question at top. For FIB, it's integrated in input render */}
                     {q.type !== QuizType.FILL_IN_THE_BLANK && (
                         <div className="text-2xl font-bold mb-8 text-black dark:text-white">
                             <MarkdownRenderer content={q.question} />
                         </div>
                     )}

                     {renderInput()}
                 </div>

                 {/* Feedback Area */}
                 {isSubmitted && (
                     <div className={`mt-8 p-6 border-l-4 animate-in fade-in slide-in-from-top-2 ${isCorrect ? 'bg-brand-yellow/10 border-brand-yellow' : 'bg-zinc-100 dark:bg-zinc-900 border-black dark:border-white'}`}>
                         <div className="flex items-start gap-3 mb-2">
                             {isCorrect ? <CheckCircle className="w-6 h-6 text-brand-yellow" /> : <AlertCircle className="w-6 h-6 text-black dark:text-white" />}
                             <h4 className={`font-bold uppercase ${isCorrect ? 'text-black dark:text-white' : 'text-zinc-500'}`}>
                                 {isCorrect ? 'Correct!' : 'Incorrect'}
                             </h4>
                         </div>
                         
                         {!isCorrect && q.answer && (
                             <div className="mb-4 text-sm font-mono bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 p-2">
                                 <span className="font-bold text-zinc-500 mr-2">ANSWER:</span>
                                 <span className="text-black dark:text-white">{q.answer}</span>
                             </div>
                         )}
                         
                         {/* Keywords Tip */}
                         {!isCorrect && q.keywords && q.keywords.length > 0 && (
                            <div className="mb-4 text-xs font-mono text-zinc-500">
                                KEYWORDS: {q.keywords.join(', ')}
                            </div>
                         )}

                         <div className="text-zinc-600 dark:text-zinc-300">
                             <MarkdownRenderer content={q.explanation} />
                         </div>
                     </div>
                 )}

                 {/* Footer Actions */}
                 <div className="mt-10 flex justify-end">
                     {!isSubmitted ? (
                         <button
                            onClick={handleAnswerSubmit}
                            disabled={!inputVal}
                            className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold uppercase hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                         >
                            Submit Answer
                         </button>
                     ) : (
                        <button
                            onClick={handleNext}
                            className="px-8 py-4 bg-brand-yellow text-black font-bold uppercase hover:bg-black hover:text-brand-yellow transition-colors flex items-center gap-2"
                         >
                            {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                            <ArrowRight className="w-5 h-5" />
                         </button>
                     )}
                 </div>
             </div>
        </div>
    );
};

export default InteractiveQuiz;