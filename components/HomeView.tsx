import React, { useState } from 'react';
import { 
    Sparkles, ArrowRight, BrainCircuit, Network, 
    FileText, Zap, Globe, Check, ChevronDown, 
    ChevronUp, Menu, X, Rocket, HelpCircle, Plus, Minus, Lock,
    Building2, Mail, User, Phone, Target, BookOpen, Calculator
} from 'lucide-react';
import Logo from './Logo';

interface HomeViewProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onGoPro?: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onGetStarted, onLogin, onGoPro }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [activeOverlay, setActiveOverlay] = useState<'NONE' | 'CONTACT'>('NONE');

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setMobileMenuOpen(false);
        }
    };

    // Features tailored for JEE/NEET
    const features = [
        {
            icon: <Target className="w-8 h-8" />,
            title: "JEE & NEET Drills",
            description: "Practice with exam-specific patterns. Numerical Types for JEE and Assertion-Reasoning for NEET/AIIMS.",
            color: "bg-brand-yellow"
        },
        {
            icon: <FileText className="w-8 h-8" />,
            title: "PYQ Generator",
            description: "Generate endless mock tests based on concepts from Previous Year Questions (2010-2024).",
            color: "bg-brand-yellow"
        },
        {
            icon: <Calculator className="w-8 h-8" />,
            title: "Formula Cheat Sheets",
            description: "Instant access to exhaustive formula lists for every chapter in Physics, Chemistry, and Math.",
            color: "bg-brand-yellow"
        },
        {
            icon: <Network className="w-8 h-8" />,
            title: "Reaction Maps",
            description: "Visualize Organic Chemistry mechanisms and Biology hierarchies with interactive AI mind maps.",
            color: "bg-brand-yellow"
        },
        {
            icon: <BrainCircuit className="w-8 h-8" />,
            title: "Smart Flashcards",
            description: "Memorize Inorganic Chemistry trends and Biology terminology with Spaced Repetition.",
            color: "bg-brand-yellow"
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: "Handwritten Notes",
            description: "Upload your coaching class notes. We digitize them into quizzes and summaries instantly.",
            color: "bg-brand-yellow"
        }
    ];

    const pricing = [
        {
            title: "Aspirant",
            price: "$0",
            period: "/month",
            features: [
                "5 Generations per Day", 
                "Standard Formula Sheets", 
                "Mock Test Mode (+4/-1)", 
                "No Downloads",
                "No Mind Maps"
            ],
            cta: "Start Free",
            highlight: false,
            color: "bg-brand-yellow",
            action: onGetStarted
        },
        {
            title: "Ranker Pro",
            price: "$9",
            period: "/month",
            features: [
                "Unlimited Generations", 
                "Advanced Handwritten OCR",
                "Unlock Mind Maps & Flashcards", 
                "Download PDF Sheets", 
                "Priority Support"
            ],
            cta: "Go Pro",
            highlight: true,
            color: "bg-brand-yellow",
            action: onGetStarted // Force login
        },
        {
            title: "Coaching Institute",
            price: "Custom",
            period: "",
            features: ["Bulk Licenses", "Student Analytics", "Custom Paper Branding", "API Access"],
            cta: "Contact Sales",
            highlight: false,
            color: "bg-brand-yellow",
            action: () => setActiveOverlay('CONTACT')
        }
    ];

    const faqs = [
        {
            q: "Is this strictly for JEE/NEET?",
            a: "Yes. Crazu is optimized specifically for the Class 11 and 12 Science curriculum. It may not work as well for Arts/Commerce subjects."
        },
        {
            q: "Does it cover the reduced syllabus?",
            a: "Our AI is updated with general topics, but we recommend verifying against the official NTA/CBSE syllabus for the current year."
        },
        {
            q: "How accurate are the chemical reactions?",
            a: "Crazu uses advanced LLMs fine-tuned on scientific data to generate high-accuracy reaction mechanisms and physical formulas."
        },
        {
            q: "Can I use it for BITSAT or VITEEE?",
            a: "Absolutely. The Physics, Chemistry, and Math content is highly relevant for all engineering entrance exams in India."
        }
    ];

    return (
        <div className="min-h-screen bg-brand-white dark:bg-black text-black dark:text-white font-sans scroll-smooth relative">
            
            {/* --- NAVBAR --- */}
            <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b-2 border-black dark:border-white/20">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 font-bold tracking-tighter text-2xl">
                        <div className="border-2 border-black p-1">
                            <Logo className="w-6 h-6" />
                        </div>
                        <span>CRAZU <span className="text-xs bg-black text-white px-1 py-0.5 ml-1">ENTRANCE</span></span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollToSection('features')} className="font-bold uppercase text-sm hover:bg-black hover:text-brand-yellow px-3 py-2 transition-all">Features</button>
                        <button onClick={() => scrollToSection('pricing')} className="font-bold uppercase text-sm hover:bg-black hover:text-brand-yellow px-3 py-2 transition-all">Pricing</button>
                        <button onClick={() => scrollToSection('faq')} className="font-bold uppercase text-sm hover:bg-black hover:text-brand-yellow px-3 py-2 transition-all">FAQ</button>
                        <div className="h-6 w-0.5 bg-zinc-200 dark:bg-zinc-800"></div>
                        <button onClick={onLogin} className="font-bold uppercase text-sm hover:underline decoration-brand-yellow decoration-4 underline-offset-4">Sign In</button>
                        <button 
                            onClick={onGetStarted}
                            className="bg-brand-yellow text-black px-6 py-2 font-bold uppercase hover:bg-black hover:text-brand-yellow transition-colors border-2 border-black"
                        >
                            Start Prep
                        </button>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-brand-white dark:bg-black border-b-2 border-black p-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
                         <button onClick={() => scrollToSection('features')} className="font-bold uppercase text-left">Features</button>
                         <button onClick={() => scrollToSection('pricing')} className="font-bold uppercase text-left">Pricing</button>
                         <button onClick={() => scrollToSection('faq')} className="font-bold uppercase text-left">FAQ</button>
                         <button onClick={() => { onLogin(); setMobileMenuOpen(false); }} className="font-bold uppercase text-left">Sign In</button>
                         <button onClick={() => { onGetStarted(); setMobileMenuOpen(false); }} className="bg-brand-yellow text-black px-6 py-3 font-bold uppercase border-2 border-black text-center">Start Prep</button>
                    </div>
                )}
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="pt-32 pb-20 px-6 bg-brand-yellow border-b-4 border-black relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest mb-6">
                            <Rocket className="w-4 h-4 text-brand-yellow" />
                            For JEE & NEET Aspirants
                        </div>
                        <h1 className="text-6xl md:text-8xl font-bold text-black mb-6 leading-[0.9] tracking-tighter">
                            CRACK THE <br/> EXAM.
                        </h1>
                        <p className="text-xl md:text-2xl font-bold text-black/80 mb-8 max-w-lg leading-relaxed">
                            The AI Study Companion for Class 11 & 12. Turn textbooks and notes into high-yield mock tests and formula sheets.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={onGetStarted}
                                className="px-8 py-5 bg-white text-black text-lg font-bold uppercase tracking-wider hover:bg-black hover:text-white border-2 border-black transition-all shadow-[6px_6px_0px_0px_#000]"
                            >
                                Start Solving
                            </button>
                            <button 
                                onClick={() => scrollToSection('features')}
                                className="px-8 py-5 bg-transparent text-black text-lg font-bold uppercase tracking-wider border-2 border-black hover:bg-black hover:text-white transition-all"
                            >
                                Features
                            </button>
                        </div>
                    </div>
                    
                    {/* Hero Graphic */}
                    <div className="hidden lg:block relative">
                         <div className="aspect-square bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] flex items-center justify-center p-8 relative">
                              <div className="absolute top-4 left-4 w-4 h-4 bg-brand-yellow border-2 border-black rounded-none"></div>
                              <div className="absolute top-4 right-4 w-4 h-4 bg-brand-yellow border-2 border-black rounded-none"></div>
                              <div className="absolute bottom-4 left-4 w-4 h-4 bg-brand-yellow border-2 border-black rounded-none"></div>
                              <div className="absolute bottom-4 right-4 w-4 h-4 bg-brand-yellow border-2 border-black rounded-none"></div>
                              
                              <div className="text-center">
                                  <Target className="w-24 h-24 mx-auto mb-4 text-black" />
                                  <div className="text-4xl font-bold uppercase text-black">Target</div>
                                  <div className="text-xl font-bold uppercase bg-brand-yellow inline-block px-2 border-2 border-black mt-2">IIT / AIIMS</div>
                              </div>

                              <div className="absolute -right-8 top-20 bg-black text-brand-yellow border-2 border-white p-4 font-bold uppercase shadow-[4px_4px_0px_0px_#000] animate-bounce">
                                  Physics
                              </div>
                              <div className="absolute -left-8 bottom-20 bg-black text-white border-2 border-white p-4 font-bold uppercase shadow-[4px_4px_0px_0px_#000] animate-pulse">
                                  Organic Chem
                              </div>
                         </div>
                    </div>
                </div>
            </header>

            {/* --- FEATURES SECTION --- */}
            <section id="features" className="py-24 px-6 border-b-2 border-black dark:border-white/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold uppercase mb-4">Rank Booster Tools</h2>
                        <p className="text-xl text-zinc-500 font-bold max-w-2xl mx-auto">Stop reading passively. Start solving actively with AI-generated drills.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <div key={i} className="p-8 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                <div className={`mb-6 p-4 ${f.color} border-2 border-black inline-block text-black`}>
                                    {f.icon}
                                </div>
                                <h3 className="text-2xl font-bold uppercase mb-3">{f.title}</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PRICING SECTION --- */}
            <section id="pricing" className="py-24 px-6 bg-zinc-50 dark:bg-zinc-950 border-b-2 border-black dark:border-white/20">
                 <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold uppercase mb-4">Aspirant Friendly</h2>
                        <p className="text-xl text-zinc-500 font-bold max-w-2xl mx-auto">Cheaper than a single coaching class.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        {pricing.map((p, i) => (
                            <div key={i} className={`relative p-8 border-2 border-black dark:border-white bg-white dark:bg-black flex flex-col ${p.highlight ? 'scale-105 shadow-[12px_12px_0px_0px_#000] dark:shadow-[12px_12px_0px_0px_#fff] z-10' : 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]'}`}>
                                {p.highlight && (
                                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${p.color} text-black border-2 border-black px-4 py-1 font-bold uppercase text-sm`}>
                                        Best Value
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold uppercase mb-2">{p.title}</h3>
                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className={`text-5xl font-bold ${p.highlight ? 'text-black dark:text-white' : ''}`}>{p.price}</span>
                                    <span className="text-zinc-500 font-bold">{p.period}</span>
                                </div>
                                
                                <ul className="space-y-4 mb-8 flex-1">
                                    {p.features.map((f, idx) => (
                                        <li key={idx} className="flex items-center gap-3 font-bold text-sm">
                                            {f.startsWith("No ") ? (
                                                <X className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                                            ) : (
                                                <div className={`p-0.5 rounded-full ${p.color}`}>
                                                    <Check className="w-3 h-3 text-black flex-shrink-0" />
                                                </div>
                                            )}
                                            <span className={f.startsWith("No ") ? "text-zinc-400 line-through" : ""}>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button 
                                    onClick={p.action}
                                    className={`w-full py-4 font-bold uppercase border-2 transition-all ${p.highlight ? `${p.color} text-black border-black hover:brightness-110` : 'bg-transparent text-black dark:text-white border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'}`}
                                >
                                    {p.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
            </section>

            {/* --- FAQ SECTION --- */}
            <section id="faq" className="py-24 px-6 bg-brand-yellow/10 dark:bg-zinc-900/50">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                         <div className="inline-block p-2 bg-brand-yellow border-2 border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <HelpCircle className="w-8 h-8 text-black" />
                        </div>
                        <h2 className="text-5xl font-bold uppercase mb-4">Aspirant FAQs</h2>
                        <p className="text-xl text-zinc-500 font-bold">Doubts? Cleared.</p>
                    </div>

                    <div className="space-y-6">
                        {faqs.map((faq, i) => (
                            <div 
                                key={i} 
                                className={`
                                    border-2 border-black dark:border-white transition-all duration-300
                                    ${openFaqIndex === i 
                                        ? 'bg-black dark:bg-white shadow-[8px_8px_0px_0px_#FFE600] -translate-y-1' 
                                        : 'bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                                    }
                                `}
                            >
                                <button 
                                    onClick={() => toggleFaq(i)}
                                    className="w-full flex justify-between items-center p-6 text-left group"
                                >
                                    <div className="flex items-start md:items-center gap-4 md:gap-6">
                                        <span className={`text-xl md:text-2xl font-mono font-bold pt-1 md:pt-0 ${openFaqIndex === i ? 'text-brand-yellow' : 'text-zinc-300 dark:text-zinc-600 group-hover:text-brand-yellow transition-colors'}`}>
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span className={`text-lg md:text-xl font-bold uppercase ${openFaqIndex === i ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>
                                            {faq.q}
                                        </span>
                                    </div>
                                    <div className={`
                                        flex-shrink-0 p-2 border-2 transition-all duration-300 ml-4
                                        ${openFaqIndex === i 
                                            ? 'bg-brand-yellow text-black border-brand-yellow rotate-180' 
                                            : 'border-black dark:border-white text-black dark:text-white group-hover:bg-brand-yellow group-hover:border-brand-yellow group-hover:text-black'
                                        }
                                    `}>
                                        {openFaqIndex === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    </div>
                                </button>
                                
                                {openFaqIndex === i && (
                                    <div className="px-6 pb-8 pl-[4.5rem] md:pl-24 animate-in fade-in slide-in-from-top-2">
                                        <div className={`h-0.5 w-12 bg-brand-yellow mb-4`}></div>
                                        <p className={`font-medium leading-relaxed text-lg ${openFaqIndex === i ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                            {faq.a}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-black text-white py-12 px-6 border-t-4 border-brand-yellow">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3 font-bold tracking-tighter text-2xl">
                        <div className="border-2 border-white p-1">
                            <Logo className="w-6 h-6" />
                        </div>
                        <span>CRAZU</span>
                    </div>
                    
                    <div className="flex gap-8 font-bold uppercase text-sm text-zinc-400">
                        <a href="#" className="hover:text-brand-yellow">Privacy</a>
                        <a href="#" className="hover:text-brand-yellow">Terms</a>
                        <a href="#" className="hover:text-brand-yellow">Contact</a>
                    </div>

                    <div className="text-zinc-500 text-sm font-bold">
                        © 2024 Crazu Academy.
                    </div>
                </div>
            </footer>

            {/* --- CONTACT SALES MODAL --- */}
            {activeOverlay === 'CONTACT' && (
                <div className="fixed inset-0 z-[100] bg-white dark:bg-black overflow-y-auto animate-in slide-in-from-bottom-10">
                    <div className="max-w-4xl mx-auto p-6 md:p-12 min-h-screen flex flex-col">
                        <div className="flex justify-between items-center mb-12">
                            <div className="flex items-center gap-3 font-bold tracking-tighter text-2xl">
                                <div className="bg-brand-yellow p-1 border-2 border-black">
                                    <Zap className="w-5 h-5 text-black" />
                                </div>
                                <span className="text-black dark:text-white">Crazu Sales</span>
                            </div>
                            <button 
                                onClick={() => setActiveOverlay('NONE')}
                                className="p-2 border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row gap-12">
                            <div className="flex-1">
                                <h2 className="text-5xl font-bold uppercase text-black dark:text-white mb-6">Partner <br/> With Us.</h2>
                                <p className="text-xl text-zinc-600 dark:text-zinc-400 font-medium mb-8">
                                    Empower your entire institution with Crazu's advanced learning technology. Get bulk licensing, custom curriculum integration, and dedicated support.
                                </p>
                                <ul className="space-y-4">
                                    {["Enterprise-grade Security", "Custom SSO Integration", "Teacher Analytics Dashboard", "Priority 24/7 Support"].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 font-bold text-black dark:text-white">
                                            <div className="p-1 bg-brand-yellow border-2 border-black text-black rounded-full">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 border-2 border-black dark:border-white p-8 shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff]">
                                {contactSubmitted ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                        <div className="p-4 bg-brand-yellow rounded-full text-black mb-6 border-2 border-black">
                                            <Check className="w-12 h-12" />
                                        </div>
                                        <h3 className="text-3xl font-bold uppercase mb-2 text-black dark:text-white">Request Sent!</h3>
                                        <p className="text-zinc-500 font-medium">Our team will contact you within 24 hours.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleContactSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Full Name</label>
                                            <div className="flex items-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black focus-within:border-brand-yellow transition-colors">
                                                <div className="p-3 border-r-2 border-transparent"><User className="w-5 h-5 text-zinc-400" /></div>
                                                <input 
                                                    required 
                                                    className="w-full p-3 bg-transparent outline-none font-medium text-black dark:text-white" 
                                                    placeholder="John Doe"
                                                    value={contactForm.name}
                                                    onChange={e => setContactForm({...contactForm, name: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Institution Name</label>
                                            <div className="flex items-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black focus-within:border-brand-yellow transition-colors">
                                                <div className="p-3 border-r-2 border-transparent"><Building2 className="w-5 h-5 text-zinc-400" /></div>
                                                <input 
                                                    required 
                                                    className="w-full p-3 bg-transparent outline-none font-medium text-black dark:text-white" 
                                                    placeholder="University of Tech"
                                                    value={contactForm.institution}
                                                    onChange={e => setContactForm({...contactForm, institution: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Work Email</label>
                                                <div className="flex items-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black focus-within:border-brand-yellow transition-colors">
                                                    <div className="p-3 border-r-2 border-transparent"><Mail className="w-5 h-5 text-zinc-400" /></div>
                                                    <input 
                                                        required 
                                                        type="email"
                                                        className="w-full p-3 bg-transparent outline-none font-medium text-black dark:text-white" 
                                                        placeholder="name@school.edu"
                                                        value={contactForm.email}
                                                        onChange={e => setContactForm({...contactForm, email: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Phone (Optional)</label>
                                                <div className="flex items-center border-2 border-black dark:border-zinc-700 bg-white dark:bg-black focus-within:border-brand-yellow transition-colors">
                                                    <div className="p-3 border-r-2 border-transparent"><Phone className="w-5 h-5 text-zinc-400" /></div>
                                                    <input 
                                                        type="tel"
                                                        className="w-full p-3 bg-transparent outline-none font-medium text-black dark:text-white" 
                                                        placeholder="+1 (555) 000-0000"
                                                        value={contactForm.phone}
                                                        onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Requirements</label>
                                            <textarea 
                                                rows={4}
                                                className="w-full p-3 border-2 border-black dark:border-zinc-700 bg-white dark:bg-black outline-none font-medium focus:border-brand-yellow transition-colors text-black dark:text-white" 
                                                placeholder="Tell us about your needs..."
                                                value={contactForm.requirements}
                                                onChange={e => setContactForm({...contactForm, requirements: e.target.value})}
                                            />
                                        </div>
                                        <button 
                                            type="submit"
                                            className="w-full py-4 bg-brand-yellow text-black font-bold uppercase tracking-wider hover:bg-black hover:text-brand-yellow border-2 border-transparent hover:border-brand-yellow transition-all"
                                        >
                                            Request Quote
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeView;