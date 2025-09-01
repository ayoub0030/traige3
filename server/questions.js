// AI Question Generation with OpenAI integration
// Supports multilingual generation (English/Arabic) with predefined categories

import OpenAI from 'openai';
import { errorLogger, ErrorCategory } from './utils/errorLogger.js';

// Initialize OpenAI client only if an API key is provided
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Predefined categories with subcategories
export const QUESTION_CATEGORIES = {
  'general-knowledge': {
    name: {
      en: 'General Knowledge',
      ar: 'المعرفة العامة'
    },
    icon: '🧠',
    subcategories: {
      en: ['Basic Facts', 'World Knowledge', 'Common Sense', 'Trivia'],
      ar: ['الحقائق الأساسية', 'المعرفة العالمية', 'الحس العام', 'معلومات عامة']
    }
  },
  'sports': {
    name: {
      en: 'Sports',
      ar: 'الرياضة'
    },
    icon: '⚽',
    subcategories: {
      en: ['Football', 'Basketball', 'Olympics', 'Tennis', 'Soccer'],
      ar: ['كرة القدم الأمريكية', 'كرة السلة', 'الألعاب الأولمبية', 'التنس', 'كرة القدم']
    }
  },
  'news': {
    name: {
      en: 'Current News',
      ar: 'الأخبار الحالية'
    },
    icon: '📰',
    subcategories: {
      en: ['World Events', 'Politics', 'Technology News', 'Economy'],
      ar: ['الأحداث العالمية', 'السياسة', 'أخبار التكنولوجيا', 'الاقتصاد']
    }
  },
  'music': {
    name: {
      en: 'Music',
      ar: 'الموسيقى'
    },
    icon: '🎵',
    subcategories: {
      en: ['Pop Music', 'Classical', 'Rock', 'Hip Hop', 'Country'],
      ar: ['الموسيقى الشعبية', 'الكلاسيكية', 'الروك', 'الهيب هوب', 'الريفية']
    }
  },
  'history': {
    name: {
      en: 'History',
      ar: 'التاريخ'
    },
    icon: '🏛️',
    subcategories: {
      en: ['Ancient History', 'World Wars', 'Medieval Times', 'Modern History'],
      ar: ['التاريخ القديم', 'الحروب العالمية', 'العصور الوسطى', 'التاريخ الحديث']
    }
  },
  'science': {
    name: {
      en: 'Science',
      ar: 'العلوم'
    },
    icon: '🔬',
    subcategories: {
      en: ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Medicine'],
      ar: ['الفيزياء', 'الكيمياء', 'علم الأحياء', 'علم الفلك', 'الطب']
    }
  },
  'movies': {
    name: {
      en: 'Movies & Entertainment',
      ar: 'الأفلام والترفيه'
    },
    icon: '🎬',
    subcategories: {
      en: ['Hollywood', 'TV Shows', 'Celebrities', 'Animation', 'Classics'],
      ar: ['هوليوود', 'البرامج التلفزيونية', 'المشاهير', 'الرسوم المتحركة', 'الكلاسيكيات']
    }
  }
};

// Difficulty levels
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

// Track used fallback questions per session to avoid duplicates
const usedFallbackQuestions = new Map();

// Generate AI questions using OpenAI GPT-5
export async function generateAIQuestions(category, difficulty = 'medium', count = 5, language = 'en', excludeQuestions = [], sessionId = null) {
  if (!process.env.OPENAI_API_KEY) {
    errorLogger.logWarning(ErrorCategory.AI_GENERATION, 'OpenAI API key not found, using fallback questions');
    return generateFallbackQuestions(category, difficulty, count, language, sessionId);
  }

  try {
    const categoryInfo = QUESTION_CATEGORIES[category];
    if (!categoryInfo) {
      throw new Error(`Invalid category: ${category}`);
    }

    const categoryName = categoryInfo.name[language] || categoryInfo.name.en;
    const subcategories = categoryInfo.subcategories[language] || categoryInfo.subcategories.en;

    // Create stronger exclusion list for the prompt
    const exclusionPrompt = excludeQuestions && excludeQuestions.length > 0 ? 
      (language === 'ar' ? 
        `\n\nمهم جداً: لا تكرر أي من هذه الأسئلة أو أسئلة مشابهة لها. يجب أن تكون الأسئلة الجديدة مختلفة تماماً:\n${excludeQuestions.slice(-15).map(q => `- ${q}`).join('\n')}\n\nأنشئ أسئلة جديدة ومختلفة تماماً عن الأسئلة أعلاه.` :
        `\n\nVERY IMPORTANT: DO NOT repeat any of these questions or create similar variations. The new questions must be completely different:\n${excludeQuestions.slice(-15).map(q => `- ${q}`).join('\n')}\n\nGenerate completely NEW and DIFFERENT questions from the ones above.`) : '';

    // Create multilingual prompt
    const isArabic = language === 'ar';
    const prompt = isArabic ? 
      `قم بإنشاء ${count} أسئلة ثقافية باللغة العربية لفئة "${categoryName}" بمستوى صعوبة "${difficulty}".

المتطلبات:
- اُرجع بتنسيق JSON صالح فقط
- كل سؤال يجب أن يحتوي على: question, options (4 خيارات), correctAnswer (فهرس 0-3), category, difficulty, explanation
- الأسئلة يجب أن تكون مشوقة وتعليمية
- تجنب المواضيع الغامضة جداً أو المثيرة للجدل
- تأكد من أن الإجابة الصحيحة ليست دائماً في نفس الموضع
- اشمل مواضيع متنوعة ضمن الفئة
- يجب أن تكون جميع النصوص باللغة العربية

مثال على التنسيق:
{
  "questions": [
    {
      "question": "ما هو أكبر كوكب في نظامنا الشمسي؟",
      "options": ["الأرض", "المشتري", "زحل", "المريخ"],
      "correctAnswer": 1,
      "category": "العلوم",
      "difficulty": "سهل",
      "explanation": "المشتري هو أكبر كوكب في نظامنا الشمسي."
    }
  ]
}

الفئة: ${categoryName}
مستوى الصعوبة: ${difficulty}
عدد الأسئلة: ${count}
الفئات الفرعية المقترحة: ${subcategories.join(', ')}${exclusionPrompt}` :

      `Generate ${count} UNIQUE and DIVERSE trivia questions in English for category "${categoryName}" with difficulty "${difficulty}".

Requirements:
- Return valid JSON format only
- Each question must have: question, options (4 choices), correctAnswer (0-3 index), category, difficulty, explanation
- Questions MUST be completely different from each other - no similar topics or variations
- Cover DIFFERENT aspects and subcategories within "${categoryName}"
- Questions should be engaging and educational
- Avoid very obscure or controversial topics
- Randomize the position of correct answers (not always the same index)
- Include diverse topics within the category
- All text must be in English

Example format:
{
  "questions": [
    {
      "question": "What is the largest planet in our solar system?",
      "options": ["Earth", "Jupiter", "Saturn", "Mars"],
      "correctAnswer": 1,
      "category": "Science",
      "difficulty": "easy",
      "explanation": "Jupiter is the largest planet in our solar system, with a mass greater than all other planets combined."
    }
  ]
}

Category: ${categoryName}
Difficulty: ${difficulty}
Count: ${count}
Suggested subcategories: ${subcategories.join(', ')}${exclusionPrompt}`;

    // Add timeout to OpenAI API call
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await openai.chat.completions.create({
        model: 'gpt-5', // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: isArabic ? 
              'أنت مولد أسئلة ثقافية متنوع ومبدع. مهمتك هي إنشاء أسئلة فريدة ومختلفة في كل مرة. تجنب تكرار المواضيع أو الأسئلة المشابهة. اُرجع دائماً بتنسيق JSON صالح يحتوي على مجموعة من الأسئلة الثقافية المتنوعة باللغة العربية.' :
              'You are a creative and diverse trivia question generator. Your task is to create unique and different questions each time. Avoid repeating topics or similar questions. Always respond with valid JSON format containing an array of diverse trivia questions in English. Each batch of questions should explore different aspects of the category.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 1, // GPT-5 only supports default temperature
        max_completion_tokens: 4000
    }, {
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    const content = response.choices[0].message.content;
    console.log('OpenAI Response:', content);

    // Parse the JSON response
    const data = JSON.parse(content);
    let questions = data.questions || data;

    // Ensure we have an array
    if (!Array.isArray(questions)) {
      questions = [questions];
    }

    // Validate and format questions
    const validatedQuestions = questions.slice(0, count).map((q, index) => ({
      id: `ai_${category}_${Date.now()}_${index}`,
      question: q.question,
      options: q.options || [],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      category: q.category || categoryName,
      difficulty: q.difficulty || difficulty,
      explanation: q.explanation || '',
      timeLimit: 30,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30,
      language: language,
      source: 'ai-generated'
    }));

    // Ensure we have enough questions
    if (validatedQuestions.length < count) {
      console.warn(`Only generated ${validatedQuestions.length} of ${count} requested questions`);
      // Fill with fallback questions if needed
      const fallbackQuestions = generateFallbackQuestions(category, difficulty, count - validatedQuestions.length, language, sessionId);
      validatedQuestions.push(...fallbackQuestions);
    }

    console.log(`Successfully generated ${validatedQuestions.length} AI questions for ${category} in ${language}`);
    return validatedQuestions.slice(0, count);

  } catch (error) {
    errorLogger.logError(
      ErrorCategory.AI_GENERATION,
      'Failed to generate AI questions',
      error,
      { category, difficulty, count, language, sessionId }
    );
    console.log('Falling back to predefined questions');
    return generateFallbackQuestions(category, difficulty, count, language, sessionId);
  }
}

// Fallback questions for when AI generation fails
export function generateFallbackQuestions(category, difficulty = 'medium', count = 5, language = 'en', sessionId = null) {
  // Track used questions per session to avoid duplicates
  const sessionKey = sessionId || 'default';
  if (!usedFallbackQuestions.has(sessionKey)) {
    usedFallbackQuestions.set(sessionKey, new Set());
  }
  const usedQuestions = usedFallbackQuestions.get(sessionKey);
  
  // Clear used questions if it gets too large (reset after 30 questions)
  if (usedQuestions.size > 30) {
    usedQuestions.clear();
  }
  const questionBank = {
    en: {
      'general-knowledge': [
        {
          question: "What is the largest planet in our solar system?",
          options: ["Earth", "Jupiter", "Saturn", "Mars"],
          correctAnswer: 1,
          explanation: "Jupiter is the largest planet in our solar system."
        },
        {
          question: "Which element has the chemical symbol 'O'?",
          options: ["Gold", "Silver", "Oxygen", "Iron"],
          correctAnswer: 2,
          explanation: "Oxygen has the chemical symbol 'O'."
        },
        {
          question: "What is the capital of Australia?",
          options: ["Sydney", "Melbourne", "Canberra", "Perth"],
          correctAnswer: 2,
          explanation: "Canberra is the capital city of Australia."
        },
        {
          question: "How many continents are there?",
          options: ["5", "6", "7", "8"],
          correctAnswer: 2,
          explanation: "There are 7 continents: Africa, Antarctica, Asia, Europe, North America, Oceania, and South America."
        },
        {
          question: "What is the smallest country in the world?",
          options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
          correctAnswer: 1,
          explanation: "Vatican City is the smallest country in the world at 0.44 square kilometers."
        },
        {
          question: "Which ocean is the largest?",
          options: ["Atlantic", "Indian", "Pacific", "Arctic"],
          correctAnswer: 2,
          explanation: "The Pacific Ocean is the largest ocean, covering about 63 million square miles."
        },
        {
          question: "What year did World War II end?",
          options: ["1943", "1944", "1945", "1946"],
          correctAnswer: 2,
          explanation: "World War II ended in 1945."
        },
        {
          question: "Who painted the Mona Lisa?",
          options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"],
          correctAnswer: 1,
          explanation: "Leonardo da Vinci painted the Mona Lisa."
        },
        {
          question: "What is the hardest natural substance on Earth?",
          options: ["Gold", "Iron", "Diamond", "Quartz"],
          correctAnswer: 2,
          explanation: "Diamond is the hardest natural substance on Earth."
        },
        {
          question: "Which planet is known as the Red Planet?",
          options: ["Venus", "Mars", "Jupiter", "Mercury"],
          correctAnswer: 1,
          explanation: "Mars is known as the Red Planet due to iron oxide on its surface."
        }
      ],
      'sports': [
        {
          question: "How many players are on a basketball team on the court at one time?",
          options: ["4", "5", "6", "7"],
          correctAnswer: 1,
          explanation: "Each basketball team has 5 players on the court at one time."
        },
        {
          question: "In which sport would you perform a slam dunk?",
          options: ["Tennis", "Basketball", "Soccer", "Swimming"],
          correctAnswer: 1,
          explanation: "A slam dunk is a basketball move where a player jumps and scores by putting the ball directly through the hoop."
        }
      ],
      'science': [
        {
          question: "What is the speed of light in a vacuum?",
          options: ["299,792,458 m/s", "300,000,000 m/s", "186,000 mph", "3×10^8 m/s"],
          correctAnswer: 0,
          explanation: "The exact speed of light in a vacuum is 299,792,458 meters per second."
        }
      ]
    },
    ar: {
      'general-knowledge': [
        {
          question: "ما هو أكبر كوكب في نظامنا الشمسي؟",
          options: ["الأرض", "المشتري", "زحل", "المريخ"],
          correctAnswer: 1,
          explanation: "المشتري هو أكبر كوكب في نظامنا الشمسي."
        },
        {
          question: "ما هو الرمز الكيميائي للأكسجين؟",
          options: ["الذهب", "الفضة", "الأكسجين", "الحديد"],
          correctAnswer: 2,
          explanation: "الرمز الكيميائي للأكسجين هو O."
        },
        {
          question: "ما هي عاصمة أستراليا؟",
          options: ["سيدني", "ملبورن", "كانبرا", "بيرث"],
          correctAnswer: 2,
          explanation: "كانبرا هي عاصمة أستراليا."
        }
      ],
      'sports': [
        {
          question: "كم عدد اللاعبين في فريق كرة السلة على الملعب في نفس الوقت؟",
          options: ["4", "5", "6", "7"],
          correctAnswer: 1,
          explanation: "كل فريق كرة سلة يضم 5 لاعبين على الملعب في نفس الوقت."
        }
      ],
      'science': [
        {
          question: "ما هي سرعة الضوء في الفراغ؟",
          options: ["299,792,458 م/ث", "300,000,000 م/ث", "186,000 ميل/ساعة", "3×10^8 م/ث"],
          correctAnswer: 0,
          explanation: "السرعة الدقيقة للضوء في الفراغ هي 299,792,458 متر في الثانية."
        }
      ]
    }
  };

  // Get language-specific questions
  const langQuestions = questionBank[language] || questionBank.en;
  const categoryQuestions = langQuestions[category] || langQuestions['general-knowledge'];

  // Generate required number of questions
  const result = [];
  
  // Filter out already used questions
  let availableQuestions = categoryQuestions.filter(q => !usedQuestions.has(q.question));
  
  // If not enough unused questions, reset and use all
  if (availableQuestions.length < count) {
    usedQuestions.clear();
    availableQuestions = [...categoryQuestions];
  }
  
  for (let i = 0; i < count && availableQuestions.length > 0; i++) {
    // Pick a random question from available ones
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const baseQuestion = availableQuestions.splice(randomIndex, 1)[0];
    
    // Mark question as used
    usedQuestions.add(baseQuestion.question);
    
    // Always shuffle options for variety
    const shuffledOptions = [...baseQuestion.options].sort(() => Math.random() - 0.5);
    const newCorrectIndex = shuffledOptions.indexOf(baseQuestion.options[baseQuestion.correctAnswer]);
    
    result.push({
      id: `fallback_${category}_${language}_${i}_${Date.now()}`,
      question: baseQuestion.question,
      options: shuffledOptions,
      correctAnswer: newCorrectIndex,
      category: QUESTION_CATEGORIES[category]?.name[language] || category,
      difficulty: difficulty,
      explanation: baseQuestion.explanation,
      timeLimit: 30,
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30,
      language: language,
      source: 'fallback'
    });
  }

  return result;
}

// Get all categories for display in frontend
export function getCategories(language = 'en') {
  return Object.entries(QUESTION_CATEGORIES).map(([key, value]) => ({
    id: key,
    name: value.name[language] || value.name.en,
    icon: value.icon,
    subcategories: value.subcategories[language] || value.subcategories.en
  }));
}

// Validate question format
export function validateQuestion(question) {
  const required = ['question', 'options', 'correctAnswer', 'category', 'difficulty'];
  const missing = required.filter(field => !(field in question));
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    throw new Error('Options must be an array of 4 choices');
  }
  
  if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer > 3) {
    throw new Error('correctAnswer must be a number between 0 and 3');
  }
  
  return true;
}

// Export for use in routes
export default {
  generateAIQuestions,
  generateFallbackQuestions,
  getCategories,
  validateQuestion,
  QUESTION_CATEGORIES,
  DIFFICULTY_LEVELS
};