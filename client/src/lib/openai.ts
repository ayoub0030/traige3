import type { Category, Difficulty, TriviaQuestion } from "./stores/useTriviaGame";
import { useLanguage } from "./stores/useLanguage";

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

// Category mapping for fallback display names (keys must match Category type)
const categoryMap: Record<Category, string> = {
  general: 'General Knowledge',
  science: 'Science and Nature',
  history: 'History',
  geography: 'Geography',
  sports: 'Sports',
  entertainment: 'Entertainment and Pop Culture'
};

export async function generateQuestions(
  category: Category, 
  difficulty: Difficulty, 
  count: number = 10
): Promise<TriviaQuestion[]> {
  try {
    const language = useLanguage.getState().language;
    console.log('Requesting questions from server API:', { category, difficulty, count, language });

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
        language, // Use current UI language
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
    // Fallback questions for demo purposes (respect current language)
    const language = useLanguage.getState().language;
    return generateFallbackQuestions(category, difficulty, count, language);
  }
}

function generateFallbackQuestions(
  category: Category,
  difficulty: Difficulty,
  count: number,
  language: 'en' | 'ar'
): TriviaQuestion[] {
  const en: Record<Category, TriviaQuestion[]> = {
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

  const ar: Record<Category, TriviaQuestion[]> = {
    general: [
      {
        question: "ما هو أكبر كوكب في نظامنا الشمسي؟",
        options: ["الأرض", "المشتري", "زحل", "المريخ"],
        correctAnswer: 1,
        category: "معلومات عامة",
        difficulty,
        explanation: "المشتري هو أكبر كوكب في نظامنا الشمسي."
      },
      {
        question: "ما هو الرمز الكيميائي لعنصر الأكسجين؟",
        options: ["Au", "Ag", "O", "Fe"],
        correctAnswer: 2,
        category: "معلومات عامة",
        difficulty,
        explanation: "الرمز الكيميائي للأكسجين هو O."
      }
    ],
    science: [
      {
        question: "ما العملية التي تصنع بها النباتات غذاءها؟",
        options: ["التنفس", "التمثيل الضوئي", "الهضم", "التخمير"],
        correctAnswer: 1,
        category: "علوم",
        difficulty,
        explanation: "التمثيل الضوئي هو عملية استخدام النباتات لضوء الشمس لإنتاج الغذاء."
      }
    ],
    history: [
      {
        question: "في أي عام انتهت الحرب العالمية الثانية؟",
        options: ["1944", "1945", "1946", "1947"],
        correctAnswer: 1,
        category: "تاريخ",
        difficulty,
        explanation: "انتهت الحرب العالمية الثانية عام 1945."
      }
    ],
    geography: [
      {
        question: "ما هي عاصمة أستراليا؟",
        options: ["سيدني", "ملبورن", "كانبرا", "بيرث"],
        correctAnswer: 2,
        category: "جغرافيا",
        difficulty,
        explanation: "كانبرا هي عاصمة أستراليا."
      }
    ],
    sports: [
      {
        question: "كم عدد اللاعبين في فريق كرة السلة على أرض الملعب في نفس الوقت؟",
        options: ["4", "5", "6", "7"],
        correctAnswer: 1,
        category: "رياضة",
        difficulty,
        explanation: "يتكون كل فريق كرة سلة من 5 لاعبين على أرض الملعب في نفس الوقت."
      }
    ],
    entertainment: [
      {
        question: "أي فيلم فاز بجائزة الأوسكار لأفضل فيلم عام 2020؟",
        options: ["جوكر", "1917", "الطفيلي Parasite", "ذات مرة في هوليوود"],
        correctAnswer: 2,
        category: "ترفيه",
        difficulty,
        explanation: "فاز فيلم الطفيلي (Parasite) بجائزة الأوسكار لأفضل فيلم عام 2020."
      }
    ]
  };

  const bank = language === 'ar' ? ar : en;
  const categoryQuestions = bank[category] || bank.general;

  const result: TriviaQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const idx = i % categoryQuestions.length;
    result.push({
      ...categoryQuestions[idx],
      difficulty
    });
  }
  return result;
}
