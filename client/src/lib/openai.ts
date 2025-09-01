import OpenAI from "openai";
import type { Category, Difficulty, TriviaQuestion } from "./stores/useTriviaGame";

// For browser usage, we'll use server-side API instead of direct OpenAI calls
// This is more secure and avoids exposing API keys

// Generate a unique session ID for each game to avoid duplicate buildup
let currentGameSessionId: string | null = null;

const getSessionId = () => {
  // Generate a new session ID for each game/quiz
  if (!currentGameSessionId) {
    currentGameSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return currentGameSessionId;
};

// Reset session ID when starting a new game
export const resetSessionId = () => {
  currentGameSessionId = null;
};

// Category mapping for fallback display names
const categoryMap: Record<Category, string> = {
  'general-knowledge': 'General Knowledge',
  science: 'Science and Nature',
  history: 'History',
  geography: 'Geography',
  sports: 'Sports',
  entertainment: 'Entertainment and Pop Culture',
  music: 'Music',
  nature: 'Nature',
  general: 'General Knowledge'
};

export async function generateQuestions(
  category: Category, 
  difficulty: Difficulty, 
  count: number = 10
): Promise<TriviaQuestion[]> {
  try {
    console.log('Requesting questions from server API:', { category, difficulty, count });

    // Use server-side API instead of direct OpenAI calls
    const response = await fetch('/api/questions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        difficulty,
        count,
        language: 'en', // Default to English, can be made configurable
        sessionId: getSessionId() // Include session ID to track questions
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Server response:', data);
    
    if (!data.success || !data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid response format from server');
    }

    // Extract just the questions array and map them to the correct format
    const questions = data.questions.map((q: any): TriviaQuestion => ({
      question: q.question || 'Sample question?',
      options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      category: q.category || categoryMap[category],
      difficulty: q.difficulty || difficulty,
      explanation: q.explanation || 'No explanation provided'
    }));

    console.log('Processed questions:', questions);
    return questions;

  } catch (error) {
    console.error('Error generating questions with OpenAI:', error);
    
    // Fallback questions for demo purposes
    return generateFallbackQuestions(category, difficulty, count);
  }
}

function generateFallbackQuestions(category: Category, difficulty: Difficulty, count: number): TriviaQuestion[] {
  const fallbackQuestions: Record<Category, TriviaQuestion[]> = {
    general: [
      {
        question: "What is the largest planet in our solar system?",
        options: ["Earth", "Jupiter", "Saturn", "Mars"],
        correctAnswer: 1,
        category: "General Knowledge",
        difficulty,
        explanation: "Jupiter is the largest planet in our solar system."
      },
      {
        question: "Which element has the chemical symbol 'O'?",
        options: ["Gold", "Silver", "Oxygen", "Iron"],
        correctAnswer: 2,
        category: "General Knowledge", 
        difficulty,
        explanation: "Oxygen has the chemical symbol 'O'."
      }
    ],
    science: [
      {
        question: "What is the process by which plants make their own food?",
        options: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
        correctAnswer: 1,
        category: "Science",
        difficulty,
        explanation: "Photosynthesis is the process by which plants use sunlight to make food."
      }
    ],
    history: [
      {
        question: "In which year did World War II end?",
        options: ["1944", "1945", "1946", "1947"],
        correctAnswer: 1,
        category: "History",
        difficulty,
        explanation: "World War II ended in 1945."
      }
    ],
    geography: [
      {
        question: "What is the capital of Australia?",
        options: ["Sydney", "Melbourne", "Canberra", "Perth"],
        correctAnswer: 2,
        category: "Geography",
        difficulty,
        explanation: "Canberra is the capital city of Australia."
      }
    ],
    sports: [
      {
        question: "How many players are on a basketball team on the court at one time?",
        options: ["4", "5", "6", "7"],
        correctAnswer: 1,
        category: "Sports",
        difficulty,
        explanation: "Each basketball team has 5 players on the court at one time."
      }
    ],
    entertainment: [
      {
        question: "Which movie won the Academy Award for Best Picture in 2020?",
        options: ["Joker", "1917", "Parasite", "Once Upon a Time in Hollywood"],
        correctAnswer: 2,
        category: "Entertainment",
        difficulty,
        explanation: "Parasite won the Academy Award for Best Picture in 2020."
      }
    ]
  };

  const categoryQuestions = fallbackQuestions[category] || fallbackQuestions.general;
  
  // Repeat questions if we need more than available
  const result: TriviaQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const questionIndex = i % categoryQuestions.length;
    result.push({
      ...categoryQuestions[questionIndex],
      difficulty // Ensure difficulty matches request
    });
  }
  
  return result;
}
