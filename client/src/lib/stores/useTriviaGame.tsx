import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { generateQuestions } from "../openai";
import { getLocalStorage, setLocalStorage } from "../localStorage";

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: string;
  explanation?: string;
}

export type GameState = 'home' | 'quiz-zone' | 'question' | 'profile' | 'coin-store' | 'menu' | 'playing' | 'results' | 'multiplayer' | 'lobby' | 'multiplayer-lobby' | 'payment' | 'privacy' | 'terms' | 'leaderboard';
export type Category = 'general' | 'science' | 'history' | 'geography' | 'sports' | 'entertainment';
export type Difficulty = 'easy' | 'medium' | 'hard';

interface TriviaGameState {
  // Game state
  gameState: GameState;
  currentQuestion: TriviaQuestion | null;
  questions: TriviaQuestion[];
  questionNumber: number;
  totalQuestions: number;
  
  // User interaction
  selectedAnswer: number | null;
  showAnswer: boolean;
  timeRemaining: number;
  
  // Scoring
  score: number;
  correctAnswers: number;
  streak: number;
  maxStreak: number;
  totalTime: number;
  
  // Game settings
  category: Category;
  difficulty: Difficulty;
  
  // Persistent data
  highScore: number;
  isNewHighScore: boolean;
  
  // Loading states
  isLoadingQuestions: boolean;
  
  // Actions
  setGameState: (state: GameState) => void;
  setCategory: (category: Category) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  startGame: () => Promise<void>;
  answerQuestion: (answerIndex: number) => void;
  nextQuestion: () => void;
  resetGame: () => void;
  updateTimer: () => void;
}

export const useTriviaGame = create<TriviaGameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    gameState: 'home',
    currentQuestion: null,
    questions: [],
    questionNumber: 1,
    totalQuestions: 10,
    
    selectedAnswer: null,
    showAnswer: false,
    timeRemaining: 30,
    
    score: 0,
    correctAnswers: 0,
    streak: 0,
    maxStreak: 0,
    totalTime: 0,
    
    category: 'general',
    difficulty: 'medium',
    
    highScore: getLocalStorage('mirage_high_score') || 0,
    isNewHighScore: false,
    
    isLoadingQuestions: false,
    
    // Actions
    setGameState: (gameState) => set({ gameState }),
    
    setCategory: (category) => set({ category }),
    
    setDifficulty: (difficulty) => set({ difficulty }),
    
    startGame: async () => {
      const { category, difficulty, totalQuestions } = get();
      
      // Reset session ID for new game to get fresh questions
      const { resetSessionId } = await import('../../lib/openai');
      resetSessionId();
      
      set({ 
        gameState: 'playing',
        isLoadingQuestions: true,
        score: 0,
        correctAnswers: 0,
        streak: 0,
        maxStreak: 0,
        questionNumber: 1,
        totalTime: 0,
        isNewHighScore: false
      });

      try {
        console.log('Generating questions for:', { category, difficulty, count: totalQuestions });
        const questions = await generateQuestions(category, difficulty, totalQuestions);
        console.log('Generated questions:', questions);
        console.log('Setting current question:', questions[0]);
        
        set({ 
          questions,
          currentQuestion: questions[0] || null,
          isLoadingQuestions: false,
          timeRemaining: 30,
          selectedAnswer: null,
          showAnswer: false
        });
        
        // Start the timer
        get().updateTimer();
      } catch (error) {
        console.error('Failed to generate questions:', error);
        // Fallback to a sample question
        const fallbackQuestion: TriviaQuestion = {
          question: "What is the capital of France?",
          options: ["London", "Berlin", "Paris", "Madrid"],
          correctAnswer: 2,
          category: "Geography",
          difficulty: "easy",
          explanation: "Paris is the capital and most populous city of France."
        };
        
        set({ 
          questions: [fallbackQuestion],
          currentQuestion: fallbackQuestion,
          isLoadingQuestions: false,
          timeRemaining: 30,
          selectedAnswer: null,
          showAnswer: false
        });
      }
    },
    
    answerQuestion: (answerIndex) => {
      const state = get();
      const { currentQuestion, streak, maxStreak } = state;
      
      if (!currentQuestion || state.showAnswer) return;
      
      const isCorrect = answerIndex === currentQuestion.correctAnswer;
      const timeBonus = Math.max(0, state.timeRemaining - 10); // Bonus for quick answers
      const basePoints = state.difficulty === 'easy' ? 10 : state.difficulty === 'medium' ? 20 : 30;
      const streakMultiplier = Math.min(3, Math.floor(streak / 3) + 1); // Up to 3x multiplier
      
      const points = isCorrect ? (basePoints + timeBonus) * streakMultiplier : 0;
      const newStreak = isCorrect ? streak + 1 : 0;
      const newMaxStreak = Math.max(maxStreak, newStreak);
      
      set({
        selectedAnswer: answerIndex,
        showAnswer: true,
        score: state.score + points,
        correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
        streak: newStreak,
        maxStreak: newMaxStreak,
        totalTime: state.totalTime + (30 - state.timeRemaining)
      });
      
      console.log('Answer submitted:', {
        selected: answerIndex,
        correct: currentQuestion.correctAnswer,
        isCorrect,
        points,
        newStreak
      });
    },
    
    nextQuestion: () => {
      const state = get();
      const nextQuestionNumber = state.questionNumber + 1;
      
      if (nextQuestionNumber > state.totalQuestions) {
        // Game finished
        const newHighScore = Math.max(state.highScore, state.score);
        const isNewHighScore = state.score > state.highScore;
        
        if (isNewHighScore) {
          setLocalStorage('mirage_high_score', state.score);
        }
        
        set({ 
          gameState: 'results',
          highScore: newHighScore,
          isNewHighScore
        });
      } else {
        // Next question
        const nextQuestion = state.questions[nextQuestionNumber - 1];
        set({
          questionNumber: nextQuestionNumber,
          currentQuestion: nextQuestion,
          selectedAnswer: null,
          showAnswer: false,
          timeRemaining: 30
        });
        
        // Restart timer
        get().updateTimer();
      }
    },
    
    resetGame: () => {
      // Reset session ID for new game to get fresh questions
      import('../../lib/openai').then(({ resetSessionId }) => resetSessionId());
      
      set({
        gameState: 'menu',
        currentQuestion: null,
        questions: [],
        questionNumber: 1,
        selectedAnswer: null,
        showAnswer: false,
        timeRemaining: 30,
        score: 0,
        correctAnswers: 0,
        streak: 0,
        maxStreak: 0,
        totalTime: 0,
        isNewHighScore: false,
        isLoadingQuestions: false
      });
    },
    
    updateTimer: () => {
      const intervalId = setInterval(() => {
        const state = get();
        
        if (state.gameState !== 'playing' || state.showAnswer) {
          clearInterval(intervalId);
          return;
        }
        
        if (state.timeRemaining <= 0) {
          clearInterval(intervalId);
          // Auto-submit with no answer
          get().answerQuestion(-1); // Invalid answer index
          return;
        }
        
        set({ timeRemaining: state.timeRemaining - 1 });
      }, 1000);
    }
  }))
);
