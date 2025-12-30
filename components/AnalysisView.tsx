import React, { useState } from 'react';
import { BookOpen, Hash, MessageSquare, Send, Loader2, Info } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface AnalysisViewProps {
  analysis: string;
  keyTopics: string[];
  onAskQuestion: (question: string) => Promise<string>;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, keyTopics, onAskQuestion }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsAsking(true);
    setAnswer(null);
    try {
      const result = await onAskQuestion(query);
      setAnswer(result);
    } catch (error) {
      setAnswer("Failed to get an answer. Please try again.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleExplainMore = async () => {
    const topic = selectedTopic || "the main concepts";
    setIsExplaining(true);
    setExplanation(null);
    try {
      const result = await onAskQuestion(`Explain ${selectedTopic ? `'${selectedTopic}'` : 'the key concepts of this document'} in detail, providing context and examples if possible.`);
      setExplanation(result);
    } catch (error) {
      setExplanation("Failed to generate explanation.");
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Main Analysis Block */}
          <div className="border-2 border-black dark:border-white p-8 bg-brand-white dark:bg-black">
            <div className="flex items-center gap-4 mb-8 border-b-2 border-black dark:border-white/20 pb-6">
              <div className="p-3 bg-brand-yellow text-black">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-black dark:text-white uppercase">Analysis</h2>
            </div>
            
            <MarkdownRenderer content={analysis} />
          </div>

          {/* Ask AI Section */}
          <div className="border-2 border-black dark:border-white p-8 bg-zinc-50 dark:bg-zinc-900/50">
             <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-black dark:bg-white text-white dark:text-black">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white uppercase">Ask AI Agent</h3>
             </div>
             
             <form onSubmit={handleAsk} className="flex gap-4 mb-6">
               <input 
                 type="text" 
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 placeholder="Ask a question about this document..."
                 className="flex-1 px-4 py-3 bg-brand-white dark:bg-black border-2 border-black dark:border-white/50 text-black dark:text-white focus:border-brand-yellow dark:focus:border-brand-yellow outline-none transition-colors"
               />
               <button 
                type="submit" 
                disabled={isAsking || !query.trim()}
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase hover:bg-brand-yellow hover:text-black dark:hover:bg-brand-yellow dark:hover:text-black disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors flex items-center gap-2"
               >
                 {isAsking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                 Ask
               </button>
             </form>

             {answer && (
               <div className="p-6 border-l-4 border-brand-yellow bg-white dark:bg-black animate-in fade-in slide-in-from-top-2">
                 <h4 className="font-bold uppercase text-xs text-black dark:text-white mb-2">AI Answer:</h4>
                 <MarkdownRenderer content={answer} />
               </div>
             )}
          </div>

          {/* Topic Deep Dive Section */}
          <div className="border-2 border-black dark:border-white p-8 bg-brand-white dark:bg-black">
             <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-brand-yellow text-black">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white uppercase">Topic Deep Dive</h3>
             </div>

             <div className="mb-6">
                <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm font-medium">
                   {selectedTopic 
                     ? <span>Selected Topic: <span className="font-bold text-black dark:text-white bg-brand-yellow/30 px-2 py-1 ml-1">{selectedTopic}</span></span>
                     : "Select a keyword from the sidebar to focus, or get a general explanation of key concepts."
                   }
                </p>
                
                <button
                  onClick={handleExplainMore}
                  disabled={isExplaining}
                  className="w-full sm:w-auto px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                >
                  {isExplaining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Info className="w-4 h-4" />}
                  {selectedTopic ? `Explain '${selectedTopic}'` : 'Explain Key Concepts'}
                </button>
             </div>

             {explanation && (
               <div className="p-6 border-l-4 border-brand-yellow bg-zinc-50 dark:bg-zinc-900 animate-in fade-in">
                 <h4 className="font-bold uppercase text-xs text-black dark:text-white mb-2">AI Explanation:</h4>
                 <MarkdownRenderer content={explanation} />
               </div>
             )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-2 border-black dark:border-white p-6 bg-brand-white dark:bg-black sticky top-28">
            <div className="flex items-center gap-4 mb-6 border-b-2 border-black dark:border-white/20 pb-4">
              <div className="p-3 bg-black dark:bg-white text-white dark:text-black">
                <Hash className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white uppercase">Keywords</h3>
            </div>
            
            <p className="text-xs text-zinc-500 mb-4 uppercase font-bold tracking-wider">Click to select context</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {keyTopics.map((topic, index) => (
                <button 
                  key={index}
                  onClick={() => setSelectedTopic(topic === selectedTopic ? null : topic)}
                  className={`
                    w-full text-left px-4 py-3 border-2 text-sm font-bold transition-colors
                    ${selectedTopic === topic 
                      ? 'bg-brand-yellow border-black text-black' 
                      : 'border-black dark:border-zinc-600 text-black dark:text-white hover:border-brand-yellow'
                    }
                  `}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;