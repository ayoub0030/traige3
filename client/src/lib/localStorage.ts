export const getLocalStorage = (key: string): any => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn(`Error reading from localStorage key "${key}":`, error);
    return null;
  }
};

export const setLocalStorage = (key: string, value: any): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error writing to localStorage key "${key}":`, error);
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error);
  }
};

// Game-specific localStorage helpers
export const getHighScore = (): number => {
  return getLocalStorage('mirage_high_score') || 0;
};

export const setHighScore = (score: number): void => {
  const currentHigh = getHighScore();
  if (score > currentHigh) {
    setLocalStorage('mirage_high_score', score);
  }
};

export const getGameSettings = () => {
  return {
    language: getLocalStorage('mirage_language') || 'en',
    soundEnabled: getLocalStorage('mirage_sound_enabled') !== false,
    difficulty: getLocalStorage('mirage_difficulty') || 'medium',
    category: getLocalStorage('mirage_category') || 'general'
  };
};

export const saveGameSettings = (settings: {
  language?: string;
  soundEnabled?: boolean;
  difficulty?: string;
  category?: string;
}) => {
  Object.entries(settings).forEach(([key, value]) => {
    if (value !== undefined) {
      setLocalStorage(`mirage_${key}`, value);
    }
  });
};

// Statistics tracking
export interface GameStats {
  totalGames: number;
  totalCorrect: number;
  totalQuestions: number;
  bestStreak: number;
  averageScore: number;
  timeSpent: number; // in seconds
  categoriesPlayed: Record<string, number>;
  difficultiesPlayed: Record<string, number>;
}

export const getGameStats = (): GameStats => {
  return getLocalStorage('mirage_stats') || {
    totalGames: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    bestStreak: 0,
    averageScore: 0,
    timeSpent: 0,
    categoriesPlayed: {},
    difficultiesPlayed: {}
  };
};

export const updateGameStats = (gameResult: {
  correct: number;
  total: number;
  score: number;
  streak: number;
  timeSpent: number;
  category: string;
  difficulty: string;
}) => {
  const stats = getGameStats();
  
  stats.totalGames += 1;
  stats.totalCorrect += gameResult.correct;
  stats.totalQuestions += gameResult.total;
  stats.bestStreak = Math.max(stats.bestStreak, gameResult.streak);
  stats.timeSpent += gameResult.timeSpent;
  
  // Update average score
  stats.averageScore = Math.round(
    (stats.averageScore * (stats.totalGames - 1) + gameResult.score) / stats.totalGames
  );
  
  // Track categories and difficulties
  stats.categoriesPlayed[gameResult.category] = (stats.categoriesPlayed[gameResult.category] || 0) + 1;
  stats.difficultiesPlayed[gameResult.difficulty] = (stats.difficultiesPlayed[gameResult.difficulty] || 0) + 1;
  
  setLocalStorage('mirage_stats', stats);
  return stats;
};
