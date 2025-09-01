export interface TriviaQuestion {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  timeLimit?: number;
  points?: number;
}

export interface GameSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  questions: TriviaQuestion[];
  answers: Answer[];
  score: number;
  category: string;
  difficulty: string;
}

export interface Answer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
  points: number;
}

export interface Player {
  id: string;
  name: string;
  level: number;
  totalScore: number;
  gamesPlayed: number;
  wins: number;
  averageScore: number;
  bestStreak: number;
  country?: string;
  avatar?: string;
  lastPlayed: Date;
}

export interface MultiplayerGame {
  id: string;
  mode: '1v1' | '2v2';
  status: 'waiting' | 'in_progress' | 'completed';
  players: Player[];
  currentQuestion?: TriviaQuestion;
  questionIndex: number;
  answers: Record<string, Answer>; // playerId -> Answer
  scores: Record<string, number>; // playerId -> score
  startTime: Date;
  endTime?: Date;
}

export interface Leaderboard {
  daily: Player[];
  weekly: Player[];
  monthly: Player[];
  allTime: Player[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  points: number;
  unlockedAt?: Date;
}

export interface UserProfile extends Player {
  achievements: Achievement[];
  statistics: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    timeSpent: number;
    favoriteCategory: string;
    strongestDifficulty: string;
    weeklyGoal: number;
    weeklyProgress: number;
  };
  preferences: {
    language: 'en' | 'ar';
    soundEnabled: boolean;
    notifications: boolean;
    defaultDifficulty: string;
    defaultCategory: string;
  };
}

export interface TournamentInfo {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'active' | 'completed';
  rules: string[];
}

export interface Subscription {
  id: string;
  plan: 'basic' | 'premium' | 'elite';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  price: number;
  features: string[];
  status: 'active' | 'cancelled' | 'expired';
}
