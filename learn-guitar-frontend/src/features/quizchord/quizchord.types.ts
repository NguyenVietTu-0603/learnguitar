import type { Chord } from '../chord/chord.types';

export interface QuizChordOption {
  id: string;          // ObjectId dạng string
  label: string;       // "C7", "E7"...
  diagramSvg: string | null;
}
export interface QuizChordQuestion {
  questionId: string;       // chính là chordId (đáp án đúng)
  question: string;
  diagramSvg: string | null;
  audioUrl: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string | null;
  options: QuizChordOption[];
  chordData?: Chord | null;
}
export interface QuizChordResponse {
  total: number;
  questions: QuizChordQuestion[];
}
export interface QuizChordAnswerRequest {
  questionId: string;
  selectedId: string;
}
export interface QuizChordAnswerResponse {
  isCorrect: boolean;
  correctId: string;
  correctLabel: string;
  explanation: string | null;
}