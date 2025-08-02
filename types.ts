import { Chat } from "@google/genai";

export enum ActiveTab {
  STUDY = 'STUDY',
  CHAT = 'CHAT',
  QUIZ = 'QUIZ',
  FLASHCARDS = 'FLASHCARDS',
}

export enum SummaryLength {
  SHORT = 'a short, one-paragraph summary',
  MEDIUM = 'a medium-length summary of a few paragraphs',
  DETAILED = 'a detailed, multi-point summary',
}

export enum QuizType {
  MCQ = 'Multiple-Choice',
  TRUE_FALSE = 'True/False',
  FILL_IN_BLANK = 'Fill-in-the-Blanks',
  SHORT_ANSWER = 'Short Answer',
}

export interface QuizQuestion {
  question: string;
  options?: string[];
  answer: string;
  type: QuizType;
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface TextContext {
  type: 'text';
  content: string;
}

export interface FileContext {
  type: 'file';
  file: File;
  fileName: string;
}

export type AppContext = TextContext | FileContext | null;


export interface GeminiService {
  getSummary: (context: AppContext, length: SummaryLength) => Promise<string>;
  initChat: (context: AppContext) => Promise<Chat | null>;
  generateQuiz: (context: AppContext, type: QuizType, count: number) => Promise<QuizQuestion[]>;
  generateFlashcards: (context: AppContext, count: number) => Promise<Flashcard[]>;
}