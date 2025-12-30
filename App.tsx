import React, { useState, useEffect } from 'react';
import { User, FileText, ChevronRight, Sparkles, LogOut, LayoutGrid, FileSpreadsheet, BrainCircuit, Moon, Sun, CheckCircle, Upload, Globe, ArrowLeft, Layers, Network, Lock, Mail, Chrome, Monitor, Star, Clock, Calendar, Zap, TrendingUp, Plus, MoreHorizontal, File, Github } from 'lucide-react';
import FileUpload from './components/FileUpload';
import AnalysisView from './components/AnalysisView';
import FormulasView from './components/FormulasView';
import QuizView from './components/QuizView';
import TheoryView from './components/TheoryView';
import FlashcardsView from './components/FlashcardsView';
import MindMapView from './components/MindMapView';
import GeneratorWizard from './components/GeneratorWizard';
import FormulaWizard from './components/FormulaWizard';
import FormulaSheetView from './components/FormulaSheetView';
import PaperView from './components/PaperView';
import ReviewSession from './components/ReviewSession';
import HomeView from './components/HomeView';
import ProModal from './components/ProModal';
import Logo from './components/Logo'; // Import Custom Logo
import { processDocument, generateMoreQuestions, generateMoreFormulas, askDocumentQuestion, generateTestPaper, generateFormulaSheet } from './services/geminiService';
import { extractTextFromPdf } from './services/pdfService';
import { auth, supabase } from './services/supabaseService';
import { AppState, AppMode, StudyData, AnalysisSection, QuestionMode, GeneratorParams } from './types';
import { getReviewCount, getDeck } from './services/srsService';

// --- TYPES ---
interface HistoryItem {
    id: string;
    title: string;
    type: 'DOCUMENT' | 'PAPER';
    date: string;
    tags?: string[];
}

// --- LOCKED FEATURE COMPONENT ---
const LockedFeature = ({ title, description, onUpgrade }: { title: string; description: string, onUpgrade: () => void }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="p-4 bg-black dark:bg-white rounded-full mb-6 relative">
             <Lock className="w-8 h-8 text-white dark:text-black" />
             <div className="absolute -top-1 -right-1 bg-brand-light p-1 rounded-full border-2 border-black">
                <Star className="w-3 h-3 text-black" fill="black" />
             </div>
        </div>
        <h3 className="text-3xl font-bold uppercase text-black dark:text-white mb-2">{title}</h3>
        <p className="text-zinc-500 dark:text-zinc-400 font-bold max-w-md mb-8">{description}</p>
        <button 
            onClick={onUpgrade}
            className="px-8 py-3 bg-brand-light text-black font-bold uppercase hover:bg-black hover:text-brand-light transition-all border-2 border-black flex items-center gap-2"
        >
             Upgrade to Pro <ChevronRight className="w-5 h-5" />
        </button>
    </div>
);

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [appMode, setAppMode] = useState<AppMode>(AppMode.ANALYSIS);
  // Auth state
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [passwordInput, setPasswordInput] = useState('');
  
  // Pro Modal & Logic
  const [showProModal, setShowProModal] = useState(false);
  const [isPro, setIsPro] = useState(false); 

  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisSection>(AnalysisSection.OVERVIEW);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // SRS Review Count
  const [reviewCount, setReviewCount] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  
  // User Stats (Supabase)
  const [userStats, setUserStats] = useState({ streak: 0, totalGenerated: 0 });

  // File Context State
  const [fileContext, setFileContext] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>('application/pdf');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [paperContextTitle, setPaperContextTitle] = useState('');

  // Dashboard History
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Dashboard UI State
  const [showUpload, setShowUpload] = useState(false);

  // Auth Mode State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Toggle dark mode class on html/body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auth Listener
  useEffect(() => {
      const checkUser = async (session: any) => {
          if (session) {
              setUserData({
                  name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Scholar',
                  email: session.user.email || ''
              });
              
              // Fetch Profile to check Pro Status
              const { data: profile } = await auth.getProfile(session.user.id);
              if (profile) {
                  setIsPro(!!profile.is_pro);
              }
              
              setAppState(AppState.DASHBOARD);
          } else {
              setAppState(AppState.LANDING);
              setUserData({ name: '', email: '' });
              setIsPro(false);
          }
      };

      auth.getSession().then(checkUser);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          checkUser(session);
      });

      return () => subscription.unsubscribe();
  }, []);

  // Load history and SRS on Dashboard entry
  useEffect(() => {
    if (appState === AppState.DASHBOARD) {
        setReviewCount(getReviewCount());
        setTotalCards(getDeck().length);
        refreshStats();
        
        // Load History
        const savedHistory = localStorage.getItem('crazu_history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }
  }, [appState]);

  const addToHistory = (title: string, type: 'DOCUMENT' | 'PAPER', tags: string[] = []) => {
      const newItem: HistoryItem = {
          id: Date.now().toString(),
          title,
          type,
          date: new Date().toLocaleDateString(),
          tags
      };
      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('crazu_history', JSON.stringify(updatedHistory));
  };

  // --- LIMIT CHECK LOGIC ---
  const checkLimit = async () => {
      if (isPro) return true;
      try {
          const usage = await auth.getDailyUsage();
          if (usage >= 5) {
              alert("You have reached your daily limit of 5 generations. Please upgrade to Pro for unlimited access.");
              setShowProModal(true);
              return false;
          }
          return true;
      } catch (e) {
          console.error("Limit check failed", e);
          return true; // Fail open if DB error
      }
  };

  const refreshStats = async () => {
      const stats = await auth.getUserStats();
      setUserStats({ streak: stats.streak, totalGenerated: stats.total });
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    try {
        if (authMode === 'SIGNUP') {
            const { error } = await auth.signUp(userData.email, passwordInput, userData.name);
            if (error) throw error;
            alert("Account created! Please check your email to verify.");
            setAuthMode('LOGIN');
        } else {
            const { error } = await auth.signIn(userData.email, passwordInput);
            if (error) throw error;
            // Session listener will handle redirection
        }
    } catch (err: any) {
        setAuthError(err.message);
    } finally {
        setIsAuthLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
      setAuthError(null);
      try {
          const { error } = await auth.signInWithOAuth(provider);
          if (error) throw error;
      } catch (err: any) {
          setAuthError(err.message);
      }
  };

  // --- FILE UPLOAD HANDLER ---
  const handleFileSelect = async (file: File) => {
    const allowed = await checkLimit();
    if (!allowed) return;

    setAppState(AppState.PROCESSING);
    setAppMode(AppMode.ANALYSIS);
    setIsAnalyzing(true);
    // We now convert everything to text, so MIME type passed to AI is always text
    setFileMimeType('text/plain');
    
    // Hide dashboard upload overlay if open
    setShowUpload(false);

    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPdf(file);
      } else {
        // Fallback for text files
        extractedText = await file.text();
      }

      setFileContext(extractedText);
      
      // Pass the EXTRACTED TEXT to the AI service as 'text/plain'
      // This bypasses the need for Groq Vision models
      const data = await processDocument(extractedText, 'text/plain');
      
      setStudyData(data);
      await auth.logAction('PDF_UPLOAD', { filename: file.name });
      addToHistory(file.name, 'DOCUMENT', ['Analysis', 'PDF']);
      setAppState(AppState.RESULTS);

    } catch (error) {
      console.error("File processing error", error);
      setIsAnalyzing(false);
      setAppState(AppState.DASHBOARD);
      alert("Failed to analyze the file. Please try again or use a smaller file.");
    }
  };

  // --- WEB GENERATOR HANDLER ---
  const handleGeneratorSubmit = async (params: GeneratorParams) => {
      const allowed = await checkLimit();
      if (!allowed) return;

      setAppState(AppState.PROCESSING);
      setAppMode(AppMode.PAPER);
      setIsAnalyzing(true);
      
      const contextTitle = `${params.grade} ${params.subject} - ${params.topic}`;
      setPaperContextTitle(contextTitle);
      // For web generated content, we set a dummy context string
      setFileContext(`Class: ${params.grade}, Board: ${params.board}, Subject: ${params.subject}, Topic: ${params.topic}`);
      setFileMimeType('text/plain');

      try {
          // Generate just the test paper questions
          const paperData = await generateTestPaper(params);
          
          // Check for empty/invalid response based on our validation prompt
          const quiz = paperData.quiz || [];
          const theory = paperData.theoryQuestions || [];

          if (quiz.length === 0 && theory.length === 0) {
              alert("Could not fulfill the request. The provided topic info may be unrelated or invalid. Please check your inputs and try again.");
              setAppState(AppState.DASHBOARD);
              return;
          }

          // Populate a StudyData object but with empty analysis/formulas since we are in PAPER mode
          const fullData: StudyData = {
            analysis: "",
            keyTopics: [],
            formulas: [],
            quiz: quiz,
            theoryQuestions: theory,
            flashcards: [],
            mindMap: { label: "Root", children: [] }
          };
          
          setStudyData(fullData);
          await auth.logAction('WEB_GEN', { params });
          addToHistory(contextTitle, 'PAPER', [params.subject, params.grade]);
          setAppState(AppState.RESULTS);
      } catch (error) {
          console.error("Generator failed", error);
          setAppState(AppState.DASHBOARD);
          alert("Failed to generate study material. Please try again.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleFormulaSubmit = async (params: any) => {
      const allowed = await checkLimit();
      if (!allowed) return;
      setAppState(AppState.PROCESSING);
      setAppMode(AppMode.ANALYSIS); // Re-use analysis view for now
      setActiveTab(AnalysisSection.FORMULAS); // Force formula tab
      setIsAnalyzing(true);

      const title = `${params.grade} ${params.subject} - ${params.topic}`;
      setPaperContextTitle(title);
      setFileContext(`Subject: ${params.subject}, Topic: ${params.topic}`); 

      try {
          const formulas = await generateFormulaSheet(params.grade, params.subject, params.topic);
          
          if (formulas.length === 0) {
              alert("Could not generate formulas. Please try again.");
              setAppState(AppState.DASHBOARD);
              return;
          }

          const fullData: StudyData = {
              analysis: `# Formula Sheet: ${params.topic}\n\nGenerated by Crazu.`,
              keyTopics: [],
              formulas: formulas,
              quiz: [],
              theoryQuestions: [],
              flashcards: [],
              mindMap: { label: params.topic, children: [] }
          };

          setStudyData(fullData);
          await auth.logAction('FORMULA_GEN', { params });
          addToHistory(title, 'DOCUMENT', ['Formula Sheet', params.subject]);
          setAppState(AppState.FORMULA_RESULT);
      } catch (error) {
          console.error("Formula gen failed", error);
          setAppState(AppState.DASHBOARD);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleGenerateMoreQs = async (count: number = 5) => {
    if (!fileContext || !studyData) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    
    let mode = QuestionMode.MCQ;
    if (activeTab === AnalysisSection.THEORY) {
      mode = QuestionMode.THEORY;
    }

    setIsLoadingMore(true);
    try {
      const currentCount = mode === QuestionMode.MCQ 
        ? (studyData.quiz?.length || 0)
        : (studyData.theoryQuestions?.length || 0);

      const newData = await generateMoreQuestions(fileContext, fileMimeType, mode, currentCount, count);
      
      setStudyData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          quiz: newData.quiz ? [...(prev.quiz || []), ...newData.quiz] : prev.quiz,
          theoryQuestions: newData.theoryQuestions 
            ? [...(prev.theoryQuestions || []), ...newData.theoryQuestions] 
            : prev.theoryQuestions
        };
      });
      await auth.logAction('WEB_GEN', { type: 'more_questions' });
    } catch (e) {
      console.error("Failed to generate more questions", e);
      alert("Could not generate more questions at this time.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleGenerateMoreFormulas = async () => {
      if (!fileContext || !studyData) return;
      const allowed = await checkLimit();
      if (!allowed) return;

      setIsLoadingMore(true);
      try {
          const newData = await generateMoreFormulas(fileContext, fileMimeType);
          setStudyData(prev => {
              if(!prev) return null;
              return {
                  ...prev,
                  formulas: newData.formulas ? [...(prev.formulas || []), ...newData.formulas] : prev.formulas
              }
          });
          await auth.logAction('FORMULA_GEN', { type: 'more_formulas' });
      } catch(e) {
          console.error("Failed to generate formulas", e);
          alert("Could not generate more formulas.");
      } finally {
          setIsLoadingMore(false);
      }
  }

  const handleAskQuestion = async (question: string): Promise<string> => {
    if (!fileContext) return "Document context is missing. Please reload.";
    return await askDocumentQuestion(fileContext, fileMimeType, question);
  };

  const handleStartReview = () => {
      setAppMode(AppMode.REVIEW);
      setAppState(AppState.RESULTS); // Reusing RESULTS state container for now, but with REVIEW mode
  };

  // Reusable Components within App
  const ThemeToggle = () => (
    <button 
      onClick={toggleTheme}
      className="p-3 bg-white dark:bg-black border-2 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all text-black dark:text-white"
    >
      {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );

  const renderAuth = () => (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-brand-white dark:bg-brand-black transition-colors duration-300">
      
      {/* Left Panel - Brand / Hero */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-brand-light border-r-4 border-black relative overflow-hidden">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10">
            <button 
                onClick={() => setAppState(AppState.LANDING)}
                className="inline-flex items-center gap-3 p-4 bg-black text-white border-2 border-white mb-8 hover:bg-white hover:text-black transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-bold uppercase tracking-widest">Back to Home</span>
            </button>
            <h1 className="text-7xl font-bold text-black mb-6 tracking-tighter leading-tight">
                STUDY <br/> SMARTER, <br/> NOT HARDER.
            </h1>
            <p className="text-xl font-bold text-black max-w-md leading-relaxed border-l-4 border-black pl-6">
                Transform any PDF into interactive quizzes, mind maps, and detailed analyses instantly using Generative AI.
            </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6 mt-12">
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <BrainCircuit className="w-8 h-8 mb-4 text-black" />
                <h3 className="font-bold uppercase">Active Recall</h3>
                <p className="text-sm text-zinc-600 mt-2">Built-in SRS algorithms.</p>
            </div>
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Network className="w-8 h-8 mb-4 text-black" />
                <h3 className="font-bold uppercase">Mind Mapping</h3>
                <p className="text-sm text-zinc-600 mt-2">Visual knowledge graphs.</p>
            </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex flex-col items-center justify-center p-6 md:p-12 lg:p-24 relative bg-white dark:bg-black">
         <div className="absolute top-6 right-6 z-20">
            <ThemeToggle />
         </div>

         <div className="absolute top-6 left-6 lg:hidden">
             <button onClick={() => setAppState(AppState.LANDING)} className="p-2 border-2 border-black dark:border-white">
                 <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
             </button>
         </div>

         {/* Mobile Logo */}
         <div className="lg:hidden mb-8 text-center">
             <div className="inline-flex items-center gap-2 font-bold tracking-tighter text-4xl text-black dark:text-white">
                 <div className="border-2 border-black p-1">
                    <Logo className="w-10 h-10" />
                 </div>
                 CRAZU
             </div>
         </div>

         <div className="w-full max-w-md space-y-8">
             {/* Auth Tabs */}
             <div className="grid grid-cols-2 border-2 border-black dark:border-white mb-8">
                 <button 
                    onClick={() => setAuthMode('LOGIN')}
                    className={`p-4 font-bold uppercase tracking-wider transition-colors ${authMode === 'LOGIN' ? 'bg-brand-yellow text-black' : 'bg-transparent text-zinc-500 hover:text-black dark:hover:text-white'}`}
                 >
                     Sign In
                 </button>
                 <button 
                    onClick={() => setAuthMode('SIGNUP')}
                    className={`p-4 font-bold uppercase tracking-wider transition-colors ${authMode === 'SIGNUP' ? 'bg-brand-yellow text-black' : 'bg-transparent text-zinc-500 hover:text-black dark:hover:text-white'}`}
                 >
                     Create Account
                 </button>
             </div>

             <div className="space-y-4">
                 <h2 className="text-2xl font-bold text-black dark:text-white uppercase mb-6">
                     {authMode === 'LOGIN' ? 'Welcome Back' : 'Join Crazu'}
                 </h2>

                 {/* Social Buttons */}
                 <div className="grid grid-cols-2 gap-4">
                     <button 
                        onClick={() => handleSocialLogin('google')}
                        className="flex items-center justify-center gap-2 p-3 border-2 border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors bg-white dark:bg-zinc-900 text-black dark:text-white font-bold"
                     >
                         <Chrome className="w-5 h-5" /> Google
                     </button>
                     <button 
                        onClick={() => handleSocialLogin('github')}
                        className="flex items-center justify-center gap-2 p-3 border-2 border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors bg-white dark:bg-zinc-900 text-black dark:text-white font-bold"
                     >
                         <Github className="w-5 h-5" /> GitHub
                     </button>
                 </div>

                 <div className="relative flex py-4 items-center">
                    <div className="flex-grow border-t-2 border-zinc-200 dark:border-zinc-800"></div>
                    <span className="flex-shrink-0 mx-4 text-zinc-400 text-xs font-bold uppercase">Or continue with email</span>
                    <div className="flex-grow border-t-2 border-zinc-200 dark:border-zinc-800"></div>
                 </div>

                 {authError && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/20 border-2 border-red-500 text-red-700 dark:text-red-400 text-sm font-bold">
                        {authError}
                    </div>
                 )}

                 <form onSubmit={handleLogin} className="space-y-4">
                    {authMode === 'SIGNUP' && (
                        <div className="group">
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 group-focus-within:text-brand-light">Full Name</label>
                            <div className="flex items-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black group-focus-within:border-brand-light transition-colors">
                                <div className="p-3 border-r-2 border-transparent"><User className="w-5 h-5 text-zinc-400" /></div>
                                <input
                                    type="text"
                                    required={authMode === 'SIGNUP'}
                                    className="w-full p-3 bg-transparent outline-none text-black dark:text-white font-medium"
                                    placeholder="John Doe"
                                    value={userData.name}
                                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="group">
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 group-focus-within:text-brand-light">Email Address</label>
                        <div className="flex items-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black group-focus-within:border-brand-light transition-colors">
                            <div className="p-3 border-r-2 border-transparent"><Mail className="w-5 h-5 text-zinc-400" /></div>
                            <input
                                type="email"
                                required
                                className="w-full p-3 bg-transparent outline-none text-black dark:text-white font-medium"
                                placeholder="name@example.com"
                                value={userData.email}
                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 group-focus-within:text-brand-light">Password</label>
                        <div className="flex items-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black group-focus-within:border-brand-light transition-colors">
                            <div className="p-3 border-r-2 border-transparent"><Lock className="w-5 h-5 text-zinc-400" /></div>
                            <input
                                type="password"
                                required
                                className="w-full p-3 bg-transparent outline-none text-black dark:text-white font-medium"
                                placeholder="••••••••"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="w-full py-4 mt-6 bg-brand-yellow text-black font-bold text-lg uppercase tracking-widest hover:bg-black hover:text-brand-yellow dark:hover:bg-brand-yellow dark:hover:text-black transition-all flex items-center justify-center gap-3 border-2 border-transparent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isAuthLoading ? 'Please Wait...' : (authMode === 'LOGIN' ? 'Sign In' : 'Create Account')} {!isAuthLoading && <ChevronRight className="w-5 h-5" />}
                    </button>
                 </form>

                 <p className="text-center text-xs text-zinc-500 font-bold mt-6">
                     By continuing, you agree to our Terms of Service and Privacy Policy.
                 </p>
             </div>
         </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-brand-white dark:bg-brand-black transition-colors duration-300 relative text-black dark:text-white">
       {/* Header */}
       <header className="fixed top-0 w-full z-50 border-b-2 border-black dark:border-white/20 bg-brand-white/90 dark:bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 font-bold tracking-tighter text-2xl text-black dark:text-white cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowUpload(false)}
          >
            <div className="border-2 border-black p-1">
                <Logo className="w-8 h-8" />
            </div>
            CRAZU
          </div>
          <div className="flex items-center gap-6">
            <div 
                onClick={() => !isPro && setShowProModal(true)}
                className={`text-xs font-bold uppercase px-2 py-1 cursor-pointer transition-colors border ${isPro ? 'bg-brand-light text-black border-black' : 'bg-transparent text-zinc-500 border-zinc-300 hover:border-black hover:text-black dark:border-zinc-700 dark:hover:border-white dark:hover:text-white'}`}
            >
                {isPro ? 'Pro Plan' : 'Free Plan'}
            </div>
            <ThemeToggle />
            <button 
              onClick={async () => {
                await auth.signOut();
                setAppState(AppState.LANDING);
                setUserData({name: '', email: ''});
                setPasswordInput('');
                setStudyData(null);
                setFileContext(null);
                setIsPro(false);
                setHistory([]);
              }}
              className="p-2 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        
        {/* Welcome Section */}
        <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold uppercase text-black dark:text-white mb-2">
                Hello, {userData.name.split(' ')[0] || 'Scholar'}.
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">
                Ready to accelerate your learning today?
            </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-bold uppercase text-xs text-zinc-500">Study Streak</span>
                    <TrendingUp className="w-5 h-5 text-brand-yellow" />
                </div>
                <div className="text-4xl font-bold mb-1">{userStats.streak} <span className="text-lg font-bold text-zinc-400">Days</span></div>
            </div>
            <div className="p-6 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-bold uppercase text-xs text-zinc-500">Total Generated</span>
                    <FileText className="w-5 h-5 text-brand-yellow" />
                </div>
                <div className="text-4xl font-bold mb-1">{userStats.totalGenerated}</div>
            </div>
            <div className="p-6 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-bold uppercase text-xs text-zinc-500">Due for Review</span>
                    <Layers className="w-5 h-5 text-brand-yellow" />
                </div>
                <div className="text-4xl font-bold mb-1">{reviewCount} <span className="text-lg font-bold text-zinc-400">Cards</span></div>
            </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-2xl font-bold uppercase text-black dark:text-white mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-brand-light" /> Quick Actions
        </h2>
        
        {showUpload ? (
             <div className="mb-12 animate-in fade-in slide-in-from-top-4 border-2 border-black dark:border-white p-8 bg-zinc-50 dark:bg-zinc-900 relative">
                 <button onClick={() => setShowUpload(false)} className="absolute top-4 right-4 p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800"><LogOut className="w-5 h-5 rotate-180" /></button>
                 <h3 className="text-xl font-bold uppercase mb-6 text-center">Upload Document</h3>
                 <FileUpload onFileSelect={handleFileSelect} />
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <button 
                    onClick={() => setShowUpload(true)}
                    className="group p-8 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black transition-all text-left flex flex-col justify-between h-48"
                >
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 w-fit group-hover:bg-black group-hover:text-brand-yellow dark:group-hover:bg-black dark:group-hover:text-brand-yellow transition-colors">
                        <Upload className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold uppercase mb-1">Upload PDF</h3>
                        <p className="text-sm opacity-60 font-medium group-hover:opacity-100">Analyze lectures & notes</p>
                    </div>
                </button>

                <button 
                    onClick={() => setAppState(AppState.WIZARD)}
                    className="group p-8 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black transition-all text-left flex flex-col justify-between h-48"
                >
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 w-fit group-hover:bg-black group-hover:text-brand-yellow dark:group-hover:bg-black dark:group-hover:text-brand-yellow transition-colors">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold uppercase mb-1">Web Generator</h3>
                        <p className="text-sm opacity-60 font-medium group-hover:opacity-100">Create custom papers</p>
                    </div>
                </button>

                <button 
                    onClick={() => setAppState(AppState.FORMULA_WIZARD)}
                    className="group p-8 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black transition-all text-left flex flex-col justify-between h-48"
                >
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 w-fit group-hover:bg-black group-hover:text-brand-yellow dark:group-hover:bg-black dark:group-hover:text-brand-yellow transition-colors">
                        <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold uppercase mb-1">Formula Sheet</h3>
                        <p className="text-sm opacity-60 font-medium group-hover:opacity-100">Instant Math/Physics Helper</p>
                    </div>
                </button>

                <button 
                    onClick={handleStartReview}
                    disabled={totalCards === 0}
                    className={`group p-8 border-2 border-black dark:border-white transition-all text-left flex flex-col justify-between h-48 ${totalCards === 0 ? 'bg-zinc-100 dark:bg-zinc-900 opacity-50 cursor-not-allowed' : 'bg-white dark:bg-zinc-900 hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black'}`}
                >
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 w-fit group-hover:bg-black group-hover:text-brand-yellow dark:group-hover:bg-black dark:group-hover:text-brand-yellow transition-colors">
                        <BrainCircuit className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold uppercase mb-1">Review Cards</h3>
                        <p className="text-sm opacity-60 font-medium group-hover:opacity-100">{reviewCount} due today</p>
                    </div>
                </button>
            </div>
        )}

        {/* Recent Activity */}
        <h2 className="text-2xl font-bold uppercase text-black dark:text-white mb-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-brand-dark" /> Recent Activity
        </h2>

        <div className="border-2 border-black dark:border-white bg-white dark:bg-zinc-900">
            {history.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">
                    <p className="font-bold uppercase tracking-wider">No activity yet</p>
                </div>
            ) : (
                <div className="divide-y-2 divide-zinc-100 dark:divide-zinc-800">
                    {history.slice(0, 5).map((item) => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 border-2 border-black dark:border-white ${item.type === 'DOCUMENT' ? 'bg-zinc-100 text-black dark:bg-zinc-800 dark:text-white' : 'bg-brand-light/30 text-brand-dark'}`}>
                                    {item.type === 'DOCUMENT' ? <File className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-black dark:text-white truncate max-w-[200px] md:max-w-md">{item.title}</h4>
                                    <div className="flex gap-2 mt-1">
                                        {item.tags?.map(tag => (
                                            <span key={tag} className="text-[10px] font-bold uppercase bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-zinc-600 dark:text-zinc-300">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs font-bold uppercase text-zinc-400">{item.date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </main>
    </div>
  );

  const renderWizard = () => (
     <div className="min-h-screen bg-brand-white dark:bg-brand-black transition-colors duration-300 flex flex-col text-black dark:text-white">
         {/* Simple Header */}
        <header className="w-full border-b-2 border-black dark:border-white/20 bg-brand-white dark:bg-black p-6 flex justify-between items-center">
            <div 
                className="flex items-center gap-3 font-bold tracking-tighter text-xl text-black dark:text-white cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setAppState(AppState.DASHBOARD)}
            >
                <div className="border-2 border-black p-1"><Logo className="w-6 h-6" /></div>
                Crazu Generator
            </div>
            <ThemeToggle />
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center p-6">
            <GeneratorWizard 
                onGenerate={handleGeneratorSubmit}
                onCancel={() => setAppState(AppState.DASHBOARD)}
            />
        </main>
     </div>
  );

  const renderProcessing = () => (
    <div className="min-h-screen bg-brand-white dark:bg-brand-black flex flex-col items-center justify-center p-6 transition-colors duration-300 text-black dark:text-white">
      <div className="z-10 text-center max-w-lg w-full border-2 border-black dark:border-white p-12 bg-brand-light/10 dark:bg-white/5">
        <h2 className="text-4xl font-bold text-black dark:text-white mb-4 uppercase animate-pulse">
           {appMode === AppMode.PAPER ? 'Generating' : 'Analyzing'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase tracking-widest">
           {appMode === AppMode.PAPER ? 'Creating custom test paper...' : 'Generating detailed study material...'}
        </p>
      </div>
    </div>
  );

  const renderResults = () => {
    // REVIEW MODE
    if (appMode === AppMode.REVIEW) {
        return (
            <ReviewSession onExit={() => setAppState(AppState.DASHBOARD)} />
        )
    }

    if (!studyData) return null;

    // PAPER MODE VIEW
    if (appMode === AppMode.PAPER) {
      return (
        <div className="min-h-screen bg-brand-white dark:bg-brand-black transition-colors duration-300 text-black dark:text-white">
           <header className="sticky top-0 w-full z-50 border-b-2 border-black dark:border-white/20 bg-brand-white/95 dark:bg-black/95 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                 <div className="flex items-center gap-3 font-bold tracking-tighter text-2xl cursor-pointer text-black dark:text-white" onClick={() => setAppState(AppState.DASHBOARD)}>
                    <div className="border-2 border-black p-1">
                      <Logo className="w-6 h-6" />
                    </div>
                    CRAZU
                 </div>
                 <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <button 
                      onClick={() => {
                        setStudyData(null);
                        setAppState(AppState.DASHBOARD);
                      }}
                      className="text-sm font-bold uppercase text-black dark:text-white hover:text-brand-light dark:hover:text-brand-light transition-colors border-b-2 border-transparent hover:border-brand-light"
                    >
                      New Paper
                    </button>
                 </div>
              </div>
           </header>
           
           <main className="max-w-7xl mx-auto px-6 py-12">
              <PaperView 
                title={paperContextTitle} 
                quiz={studyData.quiz || []} 
                theory={studyData.theoryQuestions || []}
                isPro={isPro}
              />
           </main>
        </div>
      );
    }

    // ANALYSIS MODE VIEW (Standard Tabbed Interface)
    return (
      <div className="min-h-screen bg-brand-white dark:bg-brand-black transition-colors duration-300 text-black dark:text-white">
        <header className="sticky top-0 w-full z-50 border-b-2 border-black dark:border-white/20 bg-brand-white/95 dark:bg-black/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 font-bold tracking-tighter text-2xl cursor-pointer text-black dark:text-white" onClick={() => setAppState(AppState.DASHBOARD)}>
              <div className="border-2 border-black p-1">
                <Logo className="w-6 h-6" />
              </div>
              CRAZU
            </div>
            
            <nav className="hidden lg:flex items-center border-2 border-black dark:border-white overflow-x-auto">
               <button 
                onClick={() => setActiveTab(AnalysisSection.OVERVIEW)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === AnalysisSection.OVERVIEW ? 'bg-brand-yellow text-black' : 'bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
               >
                 <LayoutGrid className="w-4 h-4" />
                 Analysis
               </button>
               <button 
                onClick={() => setActiveTab(AnalysisSection.FORMULAS)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-2 border-black dark:border-white ${activeTab === AnalysisSection.FORMULAS ? 'bg-brand-yellow text-black' : 'bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
               >
                 <FileSpreadsheet className="w-4 h-4" />
                 Formulas
               </button>
               <button 
                onClick={() => setActiveTab(AnalysisSection.QUIZ)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-2 border-black dark:border-white ${activeTab === AnalysisSection.QUIZ ? 'bg-brand-yellow text-black' : 'bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
               >
                 <BrainCircuit className="w-4 h-4" />
                 Quiz
               </button>
               <button 
                onClick={() => setActiveTab(AnalysisSection.THEORY)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-2 border-black dark:border-white ${activeTab === AnalysisSection.THEORY ? 'bg-brand-yellow text-black' : 'bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
               >
                 <FileText className="w-4 h-4" />
                 Theory
               </button>
               <button 
                onClick={() => setActiveTab(AnalysisSection.FLASHCARDS)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-2 border-black dark:border-white ${activeTab === AnalysisSection.FLASHCARDS ? 'bg-brand-yellow text-black' : 'bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
               >
                 <Layers className="w-4 h-4" />
                 Cards
               </button>
               <button 
                onClick={() => setActiveTab(AnalysisSection.MINDMAP)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-2 border-black dark:border-white ${activeTab === AnalysisSection.MINDMAP ? 'bg-brand-yellow text-black' : 'bg-transparent text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
               >
                 <Network className="w-4 h-4" />
                 Map
               </button>
            </nav>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button 
                onClick={() => {
                  setStudyData(null);
                  setAppState(AppState.DASHBOARD);
                  setShowUpload(false);
                  setActiveTab(AnalysisSection.OVERVIEW);
                  setFileContext(null);
                }}
                className="text-sm font-bold uppercase text-black dark:text-white hover:text-brand-light dark:hover:text-brand-light transition-colors border-b-2 border-transparent hover:border-brand-light"
              >
                New Material
              </button>
            </div>
          </div>
          
          {/* Mobile Nav */}
          <div className="lg:hidden flex border-t-2 border-black dark:border-white/20 overflow-x-auto">
             <button onClick={() => setActiveTab(AnalysisSection.OVERVIEW)} className={`flex-shrink-0 px-4 py-3 text-xs font-bold uppercase ${activeTab === AnalysisSection.OVERVIEW ? 'bg-brand-light text-black' : 'text-zinc-500 dark:text-zinc-400'}`}>Analysis</button>
             <button onClick={() => setActiveTab(AnalysisSection.FORMULAS)} className={`flex-shrink-0 px-4 py-3 text-xs font-bold uppercase border-l-2 border-r-2 border-black dark:border-white/20 ${activeTab === AnalysisSection.FORMULAS ? 'bg-brand-light text-black' : 'text-zinc-500 dark:text-zinc-400'}`}>Formulas</button>
             <button onClick={() => setActiveTab(AnalysisSection.QUIZ)} className={`flex-shrink-0 px-4 py-3 text-xs font-bold uppercase border-r-2 border-black dark:border-white/20 ${activeTab === AnalysisSection.QUIZ ? 'bg-brand-light text-black' : 'text-zinc-500 dark:text-zinc-400'}`}>Quiz</button>
             <button onClick={() => setActiveTab(AnalysisSection.THEORY)} className={`flex-shrink-0 px-4 py-3 text-xs font-bold uppercase ${activeTab === AnalysisSection.THEORY ? 'bg-brand-light text-black' : 'text-zinc-500 dark:text-zinc-400'}`}>Theory</button>
             <button onClick={() => setActiveTab(AnalysisSection.FLASHCARDS)} className={`flex-shrink-0 px-4 py-3 text-xs font-bold uppercase border-l-2 border-black dark:border-white/20 ${activeTab === AnalysisSection.FLASHCARDS ? 'bg-brand-light text-black' : 'text-zinc-500 dark:text-zinc-400'}`}>Cards</button>
             <button onClick={() => setActiveTab(AnalysisSection.MINDMAP)} className={`flex-shrink-0 px-4 py-3 text-xs font-bold uppercase border-l-2 border-black dark:border-white/20 ${activeTab === AnalysisSection.MINDMAP ? 'bg-brand-light text-black' : 'text-zinc-500 dark:text-zinc-400'}`}>Map</button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-12">
          {activeTab === AnalysisSection.OVERVIEW && (
            <AnalysisView 
              analysis={studyData.analysis} 
              keyTopics={studyData.keyTopics} 
              onAskQuestion={handleAskQuestion}
            />
          )}
          {activeTab === AnalysisSection.FORMULAS && (
            <FormulasView 
                formulas={studyData.formulas || []} 
                onGenerateMore={handleGenerateMoreFormulas}
                isLoadingMore={isLoadingMore}
            />
          )}
          {activeTab === AnalysisSection.QUIZ && (
            <QuizView 
              questions={studyData.quiz || []} 
              onGenerateMore={() => handleGenerateMoreQs(5)} 
              isLoadingMore={isLoadingMore}
              fileContext={fileContext}
              fileMimeType={fileMimeType}
              isPro={isPro}
            />
          )}
          {activeTab === AnalysisSection.THEORY && (
            <TheoryView 
              questions={studyData.theoryQuestions || []} 
              onGenerateMore={handleGenerateMoreQs}
              isLoadingMore={isLoadingMore}
              isPro={isPro}
            />
          )}
          {activeTab === AnalysisSection.FLASHCARDS && (
            isPro ? (
              <FlashcardsView cards={studyData.flashcards || []} />
            ) : (
              <LockedFeature 
                 title="Flashcards Locked" 
                 description="Upgrade to the Pro plan to unlock AI-powered flashcards with Spaced Repetition logic for better memory retention."
                 onUpgrade={() => setShowProModal(true)}
              />
            )
          )}
          {activeTab === AnalysisSection.MINDMAP && (
            isPro ? (
              <MindMapView data={studyData.mindMap || { label: "Root", children: [] }} />
            ) : (
              <LockedFeature 
                 title="Mind Maps Locked" 
                 description="Visual learning is powerful. Upgrade to Pro to automatically generate interactive mind maps for every document you upload."
                 onUpgrade={() => setShowProModal(true)}
              />
            )
          )}
        </main>
      </div>
    );
  };

  return (
    <>
      {appState === AppState.LANDING && (
          <HomeView 
             onGetStarted={() => setAppState(AppState.AUTH)}
             onLogin={() => setAppState(AppState.AUTH)} 
             onGoPro={() => setShowProModal(true)}
          />
      )}
      {appState === AppState.AUTH && renderAuth()}
      {appState === AppState.DASHBOARD && renderDashboard()}
      {appState === AppState.WIZARD && renderWizard()}
      {appState === AppState.FORMULA_WIZARD && (
        <div className="min-h-screen bg-brand-white dark:bg-brand-black transition-colors duration-300 flex flex-col items-center justify-center p-6 text-black dark:text-white">
            <FormulaWizard 
                onGenerate={handleFormulaSubmit}
                onCancel={() => setAppState(AppState.DASHBOARD)}
            />
        </div>
      )}
      {appState === AppState.PROCESSING && renderProcessing()}
      {appState === AppState.RESULTS && renderResults()}
      {appState === AppState.FORMULA_RESULT && studyData && (
          <FormulaSheetView 
            title={paperContextTitle}
            formulas={studyData.formulas}
            onBack={() => setAppState(AppState.DASHBOARD)}
            isPro={isPro}
            onGoPro={() => setShowProModal(true)}
          />
      )}
      
      <ProModal 
        isOpen={showProModal} 
        onClose={() => setShowProModal(false)}
        onUpgrade={() => {
            setIsPro(true);
            setShowProModal(false);
        }}
      />
    </>
  );
}

export default App;