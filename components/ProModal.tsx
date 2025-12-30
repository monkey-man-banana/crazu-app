import React, { useState } from 'react';
import { X, Sparkles, Network, FileText, Zap, BrainCircuit, Check, ShieldCheck, ArrowRight, User, CreditCard, Calendar, Lock } from 'lucide-react';

interface ProModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose, onUpgrade }) => {
    const [paymentStep, setPaymentStep] = useState<'DETAILS' | 'PAYMENT'>('DETAILS');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    if (!isOpen) return null;

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessingPayment(true);
        setTimeout(() => {
            setIsProcessingPayment(false);
            onUpgrade();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-black overflow-y-auto animate-in slide-in-from-bottom-10">
            <div className="max-w-6xl mx-auto p-6 md:p-12 min-h-screen flex flex-col">
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-3 font-bold text-2xl tracking-tight">
                        <div className="bg-brand-yellow p-1 border-2 border-black">
                            <Zap className="w-5 h-5 text-black" />
                        </div>
                        <span className="text-black dark:text-white">Crazu Pro</span>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {paymentStep === 'DETAILS' ? (
                    <div className="flex flex-col lg:flex-row gap-16">
                        <div className="flex-1 space-y-8">
                            <div>
                                <div className="inline-block px-4 py-1 bg-black text-white font-bold uppercase text-xs mb-4">Most Popular Choice</div>
                                <h2 className="text-5xl md:text-6xl font-black uppercase text-black dark:text-white mb-6">Unlock Your <br/>Full Potential.</h2>
                                <p className="text-xl text-zinc-600 dark:text-zinc-400 font-medium">
                                    Get unlimited access to the most powerful study tools. Generate deeper insights, create infinite practice sets, and master any subject.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { icon: <Network className="w-6 h-6" />, title: "Unlimited Mind Maps", desc: "Visualize complex topics instantly." },
                                    { icon: <FileText className="w-6 h-6" />, title: "PDF & Word Export", desc: "Download study materials for offline use." },
                                    { icon: <Zap className="w-6 h-6" />, title: "Smart Flashcards", desc: "AI-powered active recall decks." },
                                    { icon: <BrainCircuit className="w-6 h-6" />, title: "AI Generated Papers", desc: "Infinite custom practice exams." }
                                ].map((feat, i) => (
                                    <div key={i} className="p-6 border-2 border-black dark:border-white bg-zinc-50 dark:bg-zinc-900">
                                        <div className="mb-4 text-brand-yellow">{feat.icon}</div>
                                        <h3 className="font-bold uppercase text-lg mb-2 text-black dark:text-white">{feat.title}</h3>
                                        <p className="text-sm text-zinc-500">{feat.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-full max-w-md">
                            <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-8 shadow-[12px_12px_0px_0px_#FFE600] sticky top-8">
                                <h3 className="text-2xl font-bold uppercase mb-6 text-black dark:text-white">Order Summary</h3>
                                <div className="flex justify-between items-center py-4 border-b-2 border-zinc-100 dark:border-zinc-800">
                                    <span className="font-medium text-zinc-600 dark:text-zinc-400">Scholar Pro (Monthly)</span>
                                    <span className="font-bold text-black dark:text-white">$9.00</span>
                                </div>
                                <div className="flex justify-between items-center py-4 mb-8">
                                    <span className="font-bold text-xl uppercase text-black dark:text-white">Total</span>
                                    <span className="font-bold text-3xl text-black dark:text-white">$9.00</span>
                                </div>
                                
                                <button 
                                    onClick={() => setPaymentStep('PAYMENT')}
                                    className="w-full py-4 bg-black text-white dark:bg-white dark:text-black font-bold uppercase hover:opacity-80 transition-opacity flex items-center justify-center gap-2 text-lg"
                                >
                                    Proceed to Payment <ArrowRight className="w-5 h-5" />
                                </button>
                                
                                <p className="text-center text-xs text-zinc-400 mt-4 font-bold uppercase">
                                    <ShieldCheck className="w-3 h-3 inline mr-1" /> Secure 256-bit SSL Encrypted
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-right-8">
                        <button 
                            onClick={() => setPaymentStep('DETAILS')}
                            className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white font-bold uppercase mb-8"
                        >
                            <ArrowRight className="w-4 h-4 rotate-180" /> Back to details
                        </button>

                        <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-8 shadow-xl">
                            <h3 className="text-2xl font-bold uppercase mb-6 text-black dark:text-white">Payment Details</h3>
                            
                            <form onSubmit={handlePaymentSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Cardholder Name</label>
                                    <div className="flex items-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black focus-within:border-brand-yellow transition-colors">
                                        <div className="p-3 border-r-2 border-transparent"><User className="w-5 h-5 text-zinc-400" /></div>
                                        <input 
                                            required 
                                            className="w-full p-3 bg-transparent outline-none font-medium text-black dark:text-white" 
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Card Number</label>
                                    <div className="flex items-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black focus-within:border-brand-yellow transition-colors">
                                        <div className="p-3 border-r-2 border-transparent"><CreditCard className="w-5 h-5 text-zinc-400" /></div>
                                        <input 
                                            required 
                                            type="text"
                                            pattern="\d*"
                                            maxLength={19}
                                            className="w-full p-3 bg-transparent outline-none font-medium text-black dark:text-white" 
                                            placeholder="0000 0000 0000 0000"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Expiry Date</label>
                                        <div className="flex items-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black focus-within:border-brand-yellow transition-colors">
                                            <div className="p-3 border-r-2 border-transparent"><Calendar className="w-5 h-5 text-zinc-400" /></div>
                                            <input 
                                                required 
                                                className="w-full p-3 bg-transparent outline-none font-medium text-black dark:text-white" 
                                                placeholder="MM/YY"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">CVC</label>
                                        <div className="flex items-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black focus-within:border-brand-yellow transition-colors">
                                            <div className="p-3 border-r-2 border-transparent"><Lock className="w-5 h-5 text-zinc-400" /></div>
                                            <input 
                                                required 
                                                type="password"
                                                maxLength={3}
                                                className="w-full p-3 bg-transparent outline-none font-medium text-black dark:text-white" 
                                                placeholder="123"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isProcessingPayment}
                                    className="w-full py-4 bg-brand-yellow text-black font-bold uppercase tracking-wider hover:bg-black hover:text-brand-yellow border-2 border-transparent hover:border-brand-yellow transition-all flex items-center justify-center gap-3"
                                >
                                    {isProcessingPayment ? (
                                        <>Processing...</>
                                    ) : (
                                        <>Pay $9.00 & Upgrade</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProModal;