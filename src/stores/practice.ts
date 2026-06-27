import { create } from "zustand";
import type { Question, PracticeMode } from "~/types";

interface PracticeState {
  mode: PracticeMode | null;
  questions: Question[];
  currentIndex: number;
  answers: Map<string, string | string[]>;
  startTime: number | null;
  isFinished: boolean;

  startPractice: (questions: Question[], mode: PracticeMode) => void;
  answerQuestion: (questionId: string, answer: string | string[]) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  finishPractice: () => void;
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  mode: null,
  questions: [],
  currentIndex: 0,
  answers: new Map(),
  startTime: null,
  isFinished: false,

  startPractice: (questions, mode) => {
    set({
      mode,
      questions,
      currentIndex: 0,
      answers: new Map(),
      startTime: Date.now(),
      isFinished: false,
    });
  },

  answerQuestion: (questionId, answer) => {
    const { answers } = get();
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, answer);
    set({ answers: newAnswers });
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },

  finishPractice: () => {
    set({ isFinished: true });
  },

  reset: () => {
    set({
      mode: null,
      questions: [],
      currentIndex: 0,
      answers: new Map(),
      startTime: null,
      isFinished: false,
    });
  },
}));
