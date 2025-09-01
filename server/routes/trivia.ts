import { Router } from "express";
import OpenAI from "openai";

const router = Router();

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-fake-key-for-demo'
});

interface GenerateQuestionsRequest {
  category: string;
  difficulty: string;
  count: number;
}

// Generate trivia questions using OpenAI
router.post("/generate-questions", async (req, res) => {
  try {
    const { category, difficulty, count = 10 }: GenerateQuestionsRequest = req.body;

    if (!category || !difficulty) {
      return res.status(400).json({ 
        error: "Category and difficulty are required" 
      });
    }

    const categoryMap: Record<string, string> = {
      general: 'General Knowledge',
      science: 'Science and Nature',
      history: 'History',
      geography: 'Geography',
      sports: 'Sports',
      entertainment: 'Entertainment and Pop Culture'
    };

    const mappedCategory = categoryMap[category] || 'General Knowledge';

    const prompt = `Generate ${count} multiple choice trivia questions about ${mappedCategory} with ${difficulty} difficulty level.

Requirements:
- Each question should have exactly 4 answer choices
- Only one answer should be correct
- Include brief explanations for the correct answers
- Make sure questions are appropriate for a global audience
- For Arabic language support, ensure questions work well in both English and Arabic
- Vary the question types and topics within the category

Respond with a JSON object in this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 2,
      "category": "${mappedCategory}",
      "difficulty": "${difficulty}",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}`;

    console.log('Generating questions:', { category, difficulty, count });

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert trivia question generator. Always respond with valid JSON in the exact format requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '{"questions":[]}');
    
    if (!result.questions || !Array.isArray(result.questions)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Validate and clean the questions
    const questions = result.questions.map((q: any, index: number) => ({
      id: `${Date.now()}_${index}`,
      question: q.question || `Sample question ${index + 1}?`,
      options: Array.isArray(q.options) && q.options.length === 4 
        ? q.options 
        : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < 4 
        ? q.correctAnswer 
        : 0,
      category: q.category || mappedCategory,
      difficulty: q.difficulty || difficulty,
      explanation: q.explanation || 'No explanation provided',
      timeLimit: 30,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
    }));

    res.json({ questions });

  } catch (error) {
    console.error('Error generating questions:', error);
    
    // Return fallback questions on error
    const fallbackQuestions = generateFallbackQuestions(req.body.category, req.body.difficulty, req.body.count);
    res.json({ questions: fallbackQuestions });
  }
});

// Get leaderboard
router.get("/leaderboard", async (req, res) => {
  // Mock leaderboard data - in production, this would come from database
  const mockLeaderboard = {
    daily: [
      { id: '1', name: 'Ahmed_92', score: 450, country: 'EG' },
      { id: '2', name: 'Sarah_K', score: 420, country: 'US' },
      { id: '3', name: 'محمد_احمد', score: 380, country: 'SA' },
    ],
    weekly: [
      { id: '1', name: 'Lisa_Chen', score: 2850, country: 'CN' },
      { id: '2', name: 'عمر_الشمري', score: 2640, country: 'KW' },
      { id: '3', name: 'Ahmed_92', score: 2510, country: 'EG' },
    ],
    monthly: [
      { id: '1', name: 'Sarah_K', score: 12450, country: 'US' },
      { id: '2', name: 'Lisa_Chen', score: 11890, country: 'CN' },
      { id: '3', name: 'محمد_احمد', score: 10230, country: 'SA' },
    ]
  };

  res.json(mockLeaderboard);
});

// Submit game results
router.post("/submit-score", async (req, res) => {
  try {
    const { 
      score, 
      correctAnswers, 
      totalQuestions, 
      category, 
      difficulty, 
      timeSpent 
    } = req.body;

    // In production, this would save to database and update leaderboards
    console.log('Score submitted:', {
      score,
      correctAnswers,
      totalQuestions,
      category,
      difficulty,
      timeSpent
    });

    // Mock response
    res.json({ 
      success: true, 
      message: 'Score submitted successfully',
      newRank: Math.floor(Math.random() * 100) + 1 // Mock ranking
    });

  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

function generateFallbackQuestions(category: string, difficulty: string, count: number) {
  const fallbackQuestions = [
    {
      id: '1',
      question: "What is the largest planet in our solar system?",
      options: ["Earth", "Jupiter", "Saturn", "Mars"],
      correctAnswer: 1,
      category: "General Knowledge",
      difficulty,
      explanation: "Jupiter is the largest planet in our solar system.",
      timeLimit: 30,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
    },
    {
      id: '2',
      question: "Which element has the chemical symbol 'O'?",
      options: ["Gold", "Silver", "Oxygen", "Iron"],
      correctAnswer: 2,
      category: "Science",
      difficulty,
      explanation: "Oxygen has the chemical symbol 'O'.",
      timeLimit: 30,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
    },
    {
      id: '3',
      question: "In which year did World War II end?",
      options: ["1944", "1945", "1946", "1947"],
      correctAnswer: 1,
      category: "History",
      difficulty,
      explanation: "World War II ended in 1945.",
      timeLimit: 30,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
    }
  ];

  // Repeat questions to reach desired count
  const result = [];
  for (let i = 0; i < count; i++) {
    const questionIndex = i % fallbackQuestions.length;
    result.push({
      ...fallbackQuestions[questionIndex],
      id: `fallback_${i}`,
    });
  }

  return result;
}

export default router;
