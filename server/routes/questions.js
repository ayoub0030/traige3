// API routes for AI question generation
import express from 'express';
import { generateAIQuestions, getCategories, QUESTION_CATEGORIES, DIFFICULTY_LEVELS } from '../questions.js';

const router = express.Router();

// Track generated questions per session with a sliding window
const sessionQuestions = new Map();
const MAX_TRACKED_QUESTIONS = 20; // Only track last 20 questions per session

// Get all available categories
router.get('/categories', (req, res) => {
  try {
    const language = req.query.language || 'en';
    const categories = getCategories(language);
    
    res.json({
      success: true,
      categories,
      totalCategories: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// Get difficulty levels
router.get('/difficulties', (req, res) => {
  res.json({
    success: true,
    difficulties: DIFFICULTY_LEVELS
  });
});

// Generate AI questions for a specific category
router.post('/generate', async (req, res) => {
  try {
    const { 
      category = 'general-knowledge', 
      difficulty = 'medium', 
      count = 5, 
      language = 'en',
      sessionId 
    } = req.body;
    
    // Create a unique session key
    const sessionKey = sessionId || `${req.ip}_${Date.now()}`;

    // Validate input parameters
    if (!QUESTION_CATEGORIES[category]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category',
        availableCategories: Object.keys(QUESTION_CATEGORIES)
      });
    }

    if (!DIFFICULTY_LEVELS.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty level',
        availableDifficulties: DIFFICULTY_LEVELS
      });
    }

    if (count < 1 || count > 20) {
      return res.status(400).json({
        success: false,
        error: 'Count must be between 1 and 20'
      });
    }

    if (!['en', 'ar'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language',
        supportedLanguages: ['en', 'ar']
      });
    }

    console.log(`Generating ${count} questions for category: ${category}, difficulty: ${difficulty}, language: ${language}`);

    // Get previous questions but limit to recent ones to avoid too many duplicates
    let previousQuestions = sessionQuestions.get(sessionKey) || [];
    
    // Only keep the last MAX_TRACKED_QUESTIONS to prevent accumulating too many
    if (previousQuestions.length > MAX_TRACKED_QUESTIONS) {
      previousQuestions = previousQuestions.slice(-MAX_TRACKED_QUESTIONS);
      sessionQuestions.set(sessionKey, previousQuestions);
    }
    
    // Extract just the recent question texts to exclude
    const excludeQuestions = previousQuestions.slice(-10).map(q => q.question);
    
    // Generate questions with exclusion list and sessionId
    const allQuestions = await generateAIQuestions(category, difficulty, count, language, excludeQuestions, sessionId);
    
    // Check for duplicates only within recent questions
    const uniqueQuestions = [];
    const recentQuestions = previousQuestions.slice(-10); // Only check last 10 questions
    
    for (const q of allQuestions) {
      // Check for exact duplicates in recent history only
      const isDuplicate = recentQuestions.some(pq => 
        pq.question.toLowerCase().trim() === q.question.toLowerCase().trim()
      );
      
      if (!isDuplicate && uniqueQuestions.length < count) {
        q.uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${uniqueQuestions.length}`;
        uniqueQuestions.push(q);
      }
    }
    
    // If we don't have enough unique questions, get more from fallback
    let questions = uniqueQuestions;
    if (questions.length < count) {
      console.log(`Only found ${questions.length} unique questions, need ${count}. Getting more from fallback.`);
      const additionalNeeded = count - questions.length;
      const { generateFallbackQuestions } = await import('../questions.js');
      
      // Generate more fallback questions than needed to ensure we have enough unique ones
      const additionalQuestions = generateFallbackQuestions(category, difficulty, additionalNeeded + 5, language, sessionId);
      
      // Add additional questions that aren't duplicates
      for (const q of additionalQuestions) {
        const isDuplicate = [...previousQuestions, ...questions].some(pq => 
          pq.question.toLowerCase().trim() === q.question.toLowerCase().trim()
        );
        if (!isDuplicate && questions.length < count) {
          q.uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${questions.length}`;
          questions.push(q);
        }
      }
      
      // If still not enough, force add fallback questions with shuffled options
      if (questions.length === 0) {
        console.log('Emergency fallback: Adding questions regardless of duplicates');
        const emergencyQuestions = generateFallbackQuestions(category, difficulty, count, language, sessionId);
        questions = emergencyQuestions.map((q, idx) => ({
          ...q,
          uniqueId: `${Date.now()}_emergency_${idx}`
        }));
      }
    }
    
    // Update session questions with sliding window
    const updatedSessionQuestions = [...previousQuestions, ...questions];
    // Keep only the last MAX_TRACKED_QUESTIONS to prevent memory issues
    sessionQuestions.set(sessionKey, updatedSessionQuestions.slice(-MAX_TRACKED_QUESTIONS));
    
    // Clean up old sessions (keep only last 50)
    if (sessionQuestions.size > 50) {
      const firstKey = sessionQuestions.keys().next().value;
      sessionQuestions.delete(firstKey);
    }

    res.json({
      success: true,
      questions,
      metadata: {
        category,
        difficulty,
        count: questions.length,
        language,
        generatedAt: new Date().toISOString(),
        source: questions[0]?.source || 'ai-generated',
        sessionId: sessionKey,
        totalQuestionsAsked: updatedSessionQuestions.length
      }
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate questions',
      message: error.message
    });
  }
});

// Get questions for multiplayer games (no duplicate tracking for fresh games)
router.post('/multiplayer', async (req, res) => {
  try {
    const { 
      category = 'general-knowledge', 
      difficulty = 'medium', 
      gameMode = '1vs1',
      language = 'en' 
    } = req.body;

    // Determine question count based on game mode
    const questionCount = gameMode === '1vs1' ? 10 : 15; // More questions for team games

    // Generate fresh questions without exclusion list for multiplayer
    const questions = await generateAIQuestions(category, difficulty, questionCount, language, []);

    res.json({
      success: true,
      questions,
      metadata: {
        category,
        difficulty,
        gameMode,
        language,
        questionCount,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating multiplayer questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate multiplayer questions',
      message: error.message
    });
  }
});

// Get specific category information
router.get('/categories/:categoryId', (req, res) => {
  try {
    const { categoryId } = req.params;
    const language = req.query.language || 'en';
    
    const categoryInfo = QUESTION_CATEGORIES[categoryId];
    if (!categoryInfo) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      category: {
        id: categoryId,
        name: categoryInfo.name[language] || categoryInfo.name.en,
        icon: categoryInfo.icon,
        subcategories: categoryInfo.subcategories[language] || categoryInfo.subcategories.en
      }
    });
  } catch (error) {
    console.error('Error fetching category info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category information',
      message: error.message
    });
  }
});

// Health check endpoint for AI service
router.get('/health', (req, res) => {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  
  res.json({
    success: true,
    status: 'operational',
    services: {
      openai: hasOpenAI ? 'available' : 'fallback-mode',
      categories: Object.keys(QUESTION_CATEGORIES).length,
      languages: ['en', 'ar'],
      difficulties: DIFFICULTY_LEVELS
    },
    timestamp: new Date().toISOString()
  });
});

export default router;