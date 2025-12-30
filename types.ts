
export interface Formula {
  title: string;
  expression: string;
  method: string;
  section?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  section?: string;
  diagramSVG?: string; // Optional SVG code for diagram
}

export interface TheoryQuestion {
  question: string;
  section?: string;
  diagramSVG?: string; // Optional SVG code for diagram
  answer?: string; // Short final answer
  explanation?: string; // Detailed method/explanation
}

export interface Flashcard {
  id: number;
  term: string;
  definition: string;
}

export interface MindMapNode {
  label: string;
  children?: MindMapNode[];
}

export interface StudyData {
  paperId?: string; // Unique ID for QR generation
  analysis: string;
  keyTopics: string[];
  formulas: Formula[];
  quiz: QuizQuestion[];
  theoryQuestions: TheoryQuestion[];
  flashcards: Flashcard[];
  mindMap: MindMapNode; // Root node
}

export enum AppState {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  WIZARD = 'WIZARD',
  FORMULA_WIZARD = 'FORMULA_WIZARD',
  PROCESSING = 'PROCESSING',
  RESULTS = 'RESULTS',
  FORMULA_RESULT = 'FORMULA_RESULT'
}

export enum AppMode {
  ANALYSIS = 'ANALYSIS',
  PAPER = 'PAPER',
  REVIEW = 'REVIEW'
}

export interface User {
  name: string;
  email: string;
}

export enum AnalysisSection {
  OVERVIEW = 'overview',
  FORMULAS = 'formulas',
  QUIZ = 'quiz',
  THEORY = 'theory',
  FLASHCARDS = 'flashcards',
  MINDMAP = 'mindmap'
}

export enum QuestionMode {
  MCQ = 'MCQ',
  THEORY = 'THEORY'
}

export interface GeneratorParams {
  grade: string;
  board: string;
  subject: string;
  topic: string;
  mcqCount: number;
  theoryCount: number;
  difficulty: string;
  sourceType: 'AI_GENERATED' | 'NON_AI';
}

// --- NEW QUIZ TYPES ---

export enum QuizType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  OPEN_ENDED = 'OPEN_ENDED'
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuizConfig {
  types: QuizType[];
  difficulty: Difficulty;
  count: number;
}

export interface InteractiveQuestion {
  id: number;
  type: QuizType;
  question: string;
  options?: string[]; // For MCQ
  correctIndex?: number; // For MCQ
  answer?: string; // For FIB (Exact match) or Open Ended (Model answer)
  explanation: string;
  keywords?: string[]; // For checking answers (FIB synonyms or Open Ended keywords)
}

// --- SRS TYPES ---

export interface ReviewItem {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  nextReviewDate: number; // Timestamp
  interval: number; // Days
  easeFactor: number;
  repetitions: number;
  type: QuizType | 'GENERAL'; 
}