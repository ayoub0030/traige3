var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";
import { createServer as createServer2 } from "http";
import { Server as SocketIOServer } from "socket.io";
import session from "express-session";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  currentId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.currentId = 1;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
};
var storage = new MemStorage();

// server/routes/trivia.ts
import { Router } from "express";
import OpenAI from "openai";
var router = Router();
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-fake-key-for-demo"
});
router.post("/generate-questions", async (req, res) => {
  try {
    const { category, difficulty, count = 10 } = req.body;
    if (!category || !difficulty) {
      return res.status(400).json({
        error: "Category and difficulty are required"
      });
    }
    const categoryMap = {
      general: "General Knowledge",
      science: "Science and Nature",
      history: "History",
      geography: "Geography",
      sports: "Sports",
      entertainment: "Entertainment and Pop Culture"
    };
    const mappedCategory = categoryMap[category] || "General Knowledge";
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
    console.log("Generating questions:", { category, difficulty, count });
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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
      max_tokens: 2e3
    });
    const result = JSON.parse(response.choices[0].message.content || '{"questions":[]}');
    if (!result.questions || !Array.isArray(result.questions)) {
      throw new Error("Invalid response format from OpenAI");
    }
    const questions2 = result.questions.map((q, index) => ({
      id: `${Date.now()}_${index}`,
      question: q.question || `Sample question ${index + 1}?`,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer < 4 ? q.correctAnswer : 0,
      category: q.category || mappedCategory,
      difficulty: q.difficulty || difficulty,
      explanation: q.explanation || "No explanation provided",
      timeLimit: 30,
      points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30
    }));
    res.json({ questions: questions2 });
  } catch (error) {
    console.error("Error generating questions:", error);
    const fallbackQuestions = generateFallbackQuestions(req.body.category, req.body.difficulty, req.body.count);
    res.json({ questions: fallbackQuestions });
  }
});
router.get("/leaderboard", async (req, res) => {
  const mockLeaderboard = {
    daily: [
      { id: "1", name: "Ahmed_92", score: 450, country: "EG" },
      { id: "2", name: "Sarah_K", score: 420, country: "US" },
      { id: "3", name: "\u0645\u062D\u0645\u062F_\u0627\u062D\u0645\u062F", score: 380, country: "SA" }
    ],
    weekly: [
      { id: "1", name: "Lisa_Chen", score: 2850, country: "CN" },
      { id: "2", name: "\u0639\u0645\u0631_\u0627\u0644\u0634\u0645\u0631\u064A", score: 2640, country: "KW" },
      { id: "3", name: "Ahmed_92", score: 2510, country: "EG" }
    ],
    monthly: [
      { id: "1", name: "Sarah_K", score: 12450, country: "US" },
      { id: "2", name: "Lisa_Chen", score: 11890, country: "CN" },
      { id: "3", name: "\u0645\u062D\u0645\u062F_\u0627\u062D\u0645\u062F", score: 10230, country: "SA" }
    ]
  };
  res.json(mockLeaderboard);
});
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
    console.log("Score submitted:", {
      score,
      correctAnswers,
      totalQuestions,
      category,
      difficulty,
      timeSpent
    });
    res.json({
      success: true,
      message: "Score submitted successfully",
      newRank: Math.floor(Math.random() * 100) + 1
      // Mock ranking
    });
  } catch (error) {
    console.error("Error submitting score:", error);
    res.status(500).json({ error: "Failed to submit score" });
  }
});
function generateFallbackQuestions(category, difficulty, count) {
  const fallbackQuestions = [
    {
      id: "1",
      question: "What is the largest planet in our solar system?",
      options: ["Earth", "Jupiter", "Saturn", "Mars"],
      correctAnswer: 1,
      category: "General Knowledge",
      difficulty,
      explanation: "Jupiter is the largest planet in our solar system.",
      timeLimit: 30,
      points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30
    },
    {
      id: "2",
      question: "Which element has the chemical symbol 'O'?",
      options: ["Gold", "Silver", "Oxygen", "Iron"],
      correctAnswer: 2,
      category: "Science",
      difficulty,
      explanation: "Oxygen has the chemical symbol 'O'.",
      timeLimit: 30,
      points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30
    },
    {
      id: "3",
      question: "In which year did World War II end?",
      options: ["1944", "1945", "1946", "1947"],
      correctAnswer: 1,
      category: "History",
      difficulty,
      explanation: "World War II ended in 1945.",
      timeLimit: 30,
      points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30
    }
  ];
  const result = [];
  for (let i = 0; i < count; i++) {
    const questionIndex = i % fallbackQuestions.length;
    result.push({
      ...fallbackQuestions[questionIndex],
      id: `fallback_${i}`
    });
  }
  return result;
}
var trivia_default = router;

// server/routes/payments.ts
import { Router as Router2 } from "express";
import Stripe from "stripe";

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  games: () => games,
  insertGameSchema: () => insertGameSchema,
  insertQuestionSchema: () => insertQuestionSchema,
  insertReferralSchema: () => insertReferralSchema,
  insertRewardSchema: () => insertRewardSchema,
  insertUserSchema: () => insertUserSchema,
  insertUserStatsSchema: () => insertUserStatsSchema,
  questions: () => questions,
  referrals: () => referrals,
  rewards: () => rewards,
  userStats: () => userStats,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  coins: integer("coins").default(1e3).notNull(),
  rank: text("rank").default("Bronze").notNull(),
  language: text("language").default("en").notNull(),
  premium: boolean("premium").default(false).notNull(),
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"),
  totalReferrals: integer("total_referrals").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var games = pgTable("games", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull(),
  // '1v1', '2v2', 'single'
  players: json("players").$type().notNull(),
  scores: json("scores").$type().notNull(),
  winner: text("winner"),
  // Winner username or null for draw
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  language: text("language").default("en").notNull(),
  status: text("status").default("completed").notNull(),
  // 'waiting', 'in_progress', 'completed'
  totalQuestions: integer("total_questions").default(10).notNull(),
  duration: integer("duration"),
  // Game duration in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});
var userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalGames: integer("total_games").default(0).notNull(),
  totalWins: integer("total_wins").default(0).notNull(),
  totalLosses: integer("total_losses").default(0).notNull(),
  totalScore: integer("total_score").default(0).notNull(),
  highestScore: integer("highest_score").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  maxStreak: integer("max_streak").default(0).notNull(),
  // Mode-specific stats
  singleplayerWins: integer("singleplayer_wins").default(0).notNull(),
  oneVsOneWins: integer("one_vs_one_wins").default(0).notNull(),
  twoVsTwoWins: integer("two_vs_two_wins").default(0).notNull(),
  singleplayerGames: integer("singleplayer_games").default(0).notNull(),
  oneVsOneGames: integer("one_vs_one_games").default(0).notNull(),
  twoVsTwoGames: integer("two_vs_two_games").default(0).notNull(),
  // Other stats
  averageScore: integer("average_score").default(0).notNull(),
  perfectGames: integer("perfect_games").default(0).notNull(),
  // Games with 100% correct answers
  lastPlayed: timestamp("last_played"),
  rank: text("rank").default("Bronze").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  // 'game_win', 'ad_reward', 'daily_bonus', 'streak_bonus', 'referral_bonus'
  amount: integer("amount").notNull(),
  // Coins earned
  gameId: integer("game_id"),
  // Reference to game if applicable
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  // User who sent the referral
  referredId: integer("referred_id").notNull(),
  // User who was referred
  referralCode: text("referral_code").notNull(),
  rewardGiven: boolean("reward_given").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text_en: text("text_en").notNull(),
  text_ar: text("text_ar").notNull(),
  options_en: json("options_en").$type().notNull(),
  options_ar: json("options_ar").$type().notNull(),
  answer: integer("answer").notNull(),
  // Index of correct answer (0-3)
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  image_url: text("image_url"),
  explanation_en: text("explanation_en"),
  explanation_ar: text("explanation_ar"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  language: true
});
var insertGameSchema = createInsertSchema(games).pick({
  mode: true,
  players: true,
  scores: true,
  winner: true,
  category: true,
  difficulty: true,
  language: true,
  totalQuestions: true,
  duration: true
});
var insertUserStatsSchema = createInsertSchema(userStats).pick({
  userId: true,
  totalGames: true,
  totalWins: true,
  totalLosses: true,
  totalScore: true,
  highestScore: true,
  currentStreak: true,
  maxStreak: true,
  singleplayerWins: true,
  oneVsOneWins: true,
  twoVsTwoWins: true,
  singleplayerGames: true,
  oneVsOneGames: true,
  twoVsTwoGames: true,
  averageScore: true,
  perfectGames: true,
  lastPlayed: true,
  rank: true
});
var insertRewardSchema = createInsertSchema(rewards).pick({
  userId: true,
  type: true,
  amount: true,
  gameId: true,
  description: true
});
var insertReferralSchema = createInsertSchema(referrals).pick({
  referrerId: true,
  referredId: true,
  referralCode: true,
  rewardGiven: true
});
var insertQuestionSchema = createInsertSchema(questions).pick({
  text_en: true,
  text_ar: true,
  options_en: true,
  options_ar: true,
  answer: true,
  category: true,
  difficulty: true,
  image_url: true,
  explanation_en: true,
  explanation_ar: true
});

// server/db.ts
var connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
var client = postgres(connectionString);
var db = drizzle(client, { schema: schema_exports });

// server/routes/payments.ts
import { eq as eq2, sql as sql2 } from "drizzle-orm";

// server/services/scoring.ts
import { eq, desc, sql } from "drizzle-orm";
var ScoringService = class {
  // Update user score and stats after a game
  async updatePlayerScore(userId, gameScore, isWin, gameMode, gameId, isPerfectGame = false) {
    try {
      let stats = await this.getUserStats(userId);
      if (!stats) {
        stats = await this.createUserStats(userId);
      }
      const newTotalGames = stats.totalGames + 1;
      const newTotalScore = stats.totalScore + gameScore;
      const newAverageScore = Math.round(newTotalScore / newTotalGames);
      const newTotalWins = isWin ? stats.totalWins + 1 : stats.totalWins;
      const newTotalLosses = !isWin ? stats.totalLosses + 1 : stats.totalLosses;
      const newCurrentStreak = isWin ? stats.currentStreak + 1 : 0;
      const newMaxStreak = Math.max(stats.maxStreak, newCurrentStreak);
      const newHighestScore = Math.max(stats.highestScore, gameScore);
      const newPerfectGames = isPerfectGame ? stats.perfectGames + 1 : stats.perfectGames;
      const modeUpdates = {};
      switch (gameMode) {
        case "single":
          modeUpdates.singleplayerGames = stats.singleplayerGames + 1;
          if (isWin) modeUpdates.singleplayerWins = stats.singleplayerWins + 1;
          break;
        case "1v1":
          modeUpdates.oneVsOneGames = stats.oneVsOneGames + 1;
          if (isWin) modeUpdates.oneVsOneWins = stats.oneVsOneWins + 1;
          break;
        case "2v2":
          modeUpdates.twoVsTwoGames = stats.twoVsTwoGames + 1;
          if (isWin) modeUpdates.twoVsTwoWins = stats.twoVsTwoWins + 1;
          break;
      }
      const newRank = this.calculateRank(newTotalScore, newTotalWins, newMaxStreak);
      await db.update(userStats).set({
        totalGames: newTotalGames,
        totalWins: newTotalWins,
        totalLosses: newTotalLosses,
        totalScore: newTotalScore,
        highestScore: newHighestScore,
        currentStreak: newCurrentStreak,
        maxStreak: newMaxStreak,
        averageScore: newAverageScore,
        perfectGames: newPerfectGames,
        lastPlayed: /* @__PURE__ */ new Date(),
        rank: newRank,
        updatedAt: /* @__PURE__ */ new Date(),
        ...modeUpdates
      }).where(eq(userStats.userId, userId));
      await db.update(users).set({
        rank: newRank,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userId));
      if (isWin) {
        await this.awardCoins(userId, 10, "game_win", `Win reward for ${gameMode} game`, gameId);
      }
      if (isPerfectGame) {
        await this.awardCoins(userId, 5, "streak_bonus", "Perfect game bonus", gameId);
      }
      if (newCurrentStreak > 0 && newCurrentStreak % 5 === 0) {
        await this.awardCoins(userId, newCurrentStreak, "streak_bonus", `${newCurrentStreak}-win streak bonus`, gameId);
      }
    } catch (error) {
      console.error("Error updating player score:", error);
      throw error;
    }
  }
  // Award coins to user and record transaction
  async awardCoins(userId, amount, type, description, gameId) {
    try {
      await db.update(users).set({
        coins: sql`${users.coins} + ${amount}`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userId));
      await db.insert(rewards).values({
        userId,
        type,
        amount,
        gameId,
        description: description || `${amount} coins awarded`
      });
    } catch (error) {
      console.error("Error awarding coins:", error);
      throw error;
    }
  }
  // Deduct coins (for entry fees, purchases)
  async deductCoins(userId, amount, description) {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length || user[0].coins < amount) {
        return false;
      }
      await db.update(users).set({
        coins: sql`${users.coins} - ${amount}`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userId));
      await db.insert(rewards).values({
        userId,
        type: "deduction",
        amount: -amount,
        description: description || `${amount} coins deducted`
      });
      return true;
    } catch (error) {
      console.error("Error deducting coins:", error);
      return false;
    }
  }
  // Get user statistics
  async getUserStats(userId) {
    try {
      const result = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getting user stats:", error);
      return null;
    }
  }
  // Create initial user stats
  async createUserStats(userId) {
    try {
      const result = await db.insert(userStats).values({ userId }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user stats:", error);
      throw error;
    }
  }
  // Get leaderboard with filters
  async getLeaderboard(mode, language, limit = 10, offset = 0) {
    try {
      let query = db.select({
        id: users.id,
        username: users.username,
        rank: users.rank,
        coins: users.coins,
        totalScore: userStats.totalScore,
        totalWins: userStats.totalWins,
        totalGames: userStats.totalGames,
        maxStreak: userStats.maxStreak,
        averageScore: userStats.averageScore,
        perfectGames: userStats.perfectGames,
        // Mode-specific wins
        singleplayerWins: userStats.singleplayerWins,
        oneVsOneWins: userStats.oneVsOneWins,
        twoVsTwoWins: userStats.twoVsTwoWins,
        // Mode-specific games
        singleplayerGames: userStats.singleplayerGames,
        oneVsOneGames: userStats.oneVsOneGames,
        twoVsTwoGames: userStats.twoVsTwoGames,
        lastPlayed: userStats.lastPlayed
      }).from(users).leftJoin(userStats, eq(users.id, userStats.userId)).orderBy(desc(userStats.totalScore)).limit(limit).offset(offset);
      if (language) {
        query = query.where(eq(users.language, language));
      }
      const results = await query;
      return results.map((user) => ({
        ...user,
        winRate: (user.totalGames || 0) > 0 ? ((user.totalWins || 0) / (user.totalGames || 1) * 100).toFixed(1) : "0.0",
        // Mode-specific win rates
        singleplayerWinRate: (user.singleplayerGames || 0) > 0 ? ((user.singleplayerWins || 0) / (user.singleplayerGames || 1) * 100).toFixed(1) : "0.0",
        oneVsOneWinRate: (user.oneVsOneGames || 0) > 0 ? ((user.oneVsOneWins || 0) / (user.oneVsOneGames || 1) * 100).toFixed(1) : "0.0",
        twoVsTwoWinRate: (user.twoVsTwoGames || 0) > 0 ? ((user.twoVsTwoWins || 0) / (user.twoVsTwoGames || 1) * 100).toFixed(1) : "0.0"
      }));
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    }
  }
  // Get filtered leaderboard by mode
  async getLeaderboardByMode(mode, limit = 10) {
    try {
      let orderByField;
      let winField;
      let gamesField;
      switch (mode) {
        case "single":
          orderByField = userStats.singleplayerWins;
          winField = "singleplayerWins";
          gamesField = "singleplayerGames";
          break;
        case "1v1":
          orderByField = userStats.oneVsOneWins;
          winField = "oneVsOneWins";
          gamesField = "oneVsOneGames";
          break;
        case "2v2":
          orderByField = userStats.twoVsTwoWins;
          winField = "twoVsTwoWins";
          gamesField = "twoVsTwoGames";
          break;
        default:
          return this.getLeaderboard(void 0, void 0, limit);
      }
      const results = await db.select({
        id: users.id,
        username: users.username,
        rank: users.rank,
        coins: users.coins,
        totalScore: userStats.totalScore,
        wins: orderByField,
        games: mode === "single" ? userStats.singleplayerGames : mode === "1v1" ? userStats.oneVsOneGames : userStats.twoVsTwoGames,
        maxStreak: userStats.maxStreak,
        averageScore: userStats.averageScore,
        lastPlayed: userStats.lastPlayed
      }).from(users).leftJoin(userStats, eq(users.id, userStats.userId)).orderBy(desc(orderByField)).limit(limit);
      return results.map((user) => ({
        ...user,
        winRate: (user.games || 0) > 0 ? ((user.wins || 0) / (user.games || 1) * 100).toFixed(1) : "0.0"
      }));
    } catch (error) {
      console.error("Error getting mode leaderboard:", error);
      throw error;
    }
  }
  // Calculate rank based on performance
  calculateRank(totalScore, totalWins, maxStreak) {
    const score = totalScore + totalWins * 10 + maxStreak * 5;
    if (score >= 1e4) return "Legendary";
    if (score >= 5e3) return "Diamond";
    if (score >= 2500) return "Platinum";
    if (score >= 1e3) return "Gold";
    if (score >= 500) return "Silver";
    return "Bronze";
  }
  // Get recent games for a user
  async getRecentGames(userId, limit = 10) {
    try {
      return await db.select().from(games).where(sql`${games.players}::jsonb @> ${JSON.stringify([userId.toString()])}`).orderBy(desc(games.completedAt)).limit(limit);
    } catch (error) {
      console.error("Error getting recent games:", error);
      return [];
    }
  }
  // Get user's rank position
  async getUserRankPosition(userId) {
    try {
      const userScore = await db.select({ totalScore: userStats.totalScore }).from(userStats).where(eq(userStats.userId, userId)).limit(1);
      if (!userScore.length) return 0;
      const result = await db.select({ count: sql`count(*)` }).from(userStats).where(sql`${userStats.totalScore} > ${userScore[0].totalScore}`);
      return (result[0]?.count || 0) + 1;
    } catch (error) {
      console.error("Error getting user rank position:", error);
      return 0;
    }
  }
};
var scoringService = new ScoringService();

// server/routes/payments.ts
var router2 = Router2();
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20"
});
var PLANS = {
  premium: {
    price: 999,
    // $9.99 in cents
    name: "Premium Plan",
    features: ["Unlimited questions", "No ads", "Premium themes", "Priority support"]
  }
};
var COIN_PACKS = {
  small: { coins: 100, price: 100, name: "Small Pack" },
  // $1.00 for 100 coins
  medium: { coins: 250, price: 199, name: "Medium Pack" },
  // $1.99 for 250 coins
  large: { coins: 500, price: 399, name: "Large Pack" },
  // $3.99 for 500 coins
  premium: { coins: 1e3, price: 999, name: "Premium Pack" }
  // $9.99 for 1000 coins
};
router2.post("/create-subscription-intent", async (req, res) => {
  try {
    const { planType = "premium", userId } = req.body;
    if (!PLANS[planType]) {
      return res.status(400).json({ error: "Invalid plan type" });
    }
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const plan = PLANS[planType];
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price,
      currency: "usd",
      metadata: {
        type: "subscription",
        plan: planType,
        userId: userId.toString()
      }
    });
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: plan.price,
      plan
    });
  } catch (error) {
    console.error("Error creating subscription payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});
router2.post("/create-coins-intent", async (req, res) => {
  try {
    const { packType, userId } = req.body;
    if (!COIN_PACKS[packType]) {
      return res.status(400).json({ error: "Invalid pack type" });
    }
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const pack = COIN_PACKS[packType];
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pack.price,
      currency: "usd",
      metadata: {
        type: "coins",
        pack: packType,
        coins: pack.coins.toString(),
        userId: userId.toString()
      }
    });
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: pack.price,
      pack
    });
  } catch (error) {
    console.error("Error creating coins payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});
router2.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send("Webhook signature verification failed");
  }
  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const userId = parseInt(paymentIntent.metadata.userId || "0");
      if (!userId) {
        console.error("No user ID in payment metadata:", paymentIntent.id);
        return res.status(400).json({ error: "Invalid user ID" });
      }
      if (paymentIntent.metadata.type === "subscription") {
        console.log("Premium subscription activated for user:", userId, "payment:", paymentIntent.id);
        await db.update(users).set({
          premium: true,
          coins: sql2`${users.coins} + 1000`,
          // Bonus 1000 coins for premium
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq2(users.id, userId));
        await scoringService.awardCoins(
          userId,
          1e3,
          "premium_bonus",
          "Premium subscription bonus coins",
          void 0
        );
        console.log(`Premium subscription activated for user ${userId} with 1000 bonus coins`);
      } else if (paymentIntent.metadata.type === "coins") {
        const coins = parseInt(paymentIntent.metadata.coins || "0");
        console.log(`Adding ${coins} coins for user:`, userId, "payment:", paymentIntent.id);
        await scoringService.awardCoins(
          userId,
          coins,
          "coin_purchase",
          `Purchased ${paymentIntent.metadata.pack} pack`,
          void 0
        );
        console.log(`Successfully added ${coins} coins to user ${userId}`);
      }
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
  res.json({ received: true });
});
router2.get("/plans", (req, res) => {
  res.json({
    subscriptions: PLANS,
    coinPacks: COIN_PACKS
  });
});
router2.post("/remove-ads", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const user = await db.select({ premium: users.premium }).from(users).where(eq2(users.id, userId)).limit(1);
    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user[0].premium) {
      return res.status(403).json({ error: "Premium subscription required" });
    }
    res.json({
      success: true,
      message: "Ads removed for premium user",
      adsRemoved: true
    });
  } catch (error) {
    console.error("Error removing ads:", error);
    res.status(500).json({ error: "Failed to remove ads" });
  }
});
router2.get("/premium-status/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const user = await db.select({
      premium: users.premium,
      coins: users.coins,
      rank: users.rank
    }).from(users).where(eq2(users.id, userId)).limit(1);
    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }
    const premiumBenefits = {
      unlimitedGames: user[0].premium,
      noAds: user[0].premium,
      bonusCoins: user[0].premium ? 100 : 0,
      // Daily bonus for premium users
      prioritySupport: user[0].premium,
      exclusiveThemes: user[0].premium
    };
    res.json({
      success: true,
      isPremium: user[0].premium,
      benefits: premiumBenefits,
      currentCoins: user[0].coins,
      rank: user[0].rank
    });
  } catch (error) {
    console.error("Error checking premium status:", error);
    res.status(500).json({ error: "Failed to check premium status" });
  }
});
var payments_default = router2;

// server/routes/auth.ts
import { Router as Router3 } from "express";
import bcrypt from "bcrypt";
import { eq as eq3, sql as sql3 } from "drizzle-orm";
var router3 = Router3();
router3.post("/register", async (req, res) => {
  try {
    const { username, password, language = "en" } = req.body;
    const validation = insertUserSchema.safeParse({ username, password, language });
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors
      });
    }
    const existingUser = await db.select().from(users).where(eq3(users.username, username)).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: "Username already exists" });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = await db.insert(users).values({
      username,
      password: hashedPassword,
      language,
      coins: 1e3,
      // Starting coins
      rank: "Bronze",
      // Starting rank
      premium: false
    }).returning({
      id: users.id,
      username: users.username,
      coins: users.coins,
      rank: users.rank,
      language: users.language,
      premium: users.premium,
      createdAt: users.createdAt
    });
    req.session.userId = newUser[0].id;
    res.status(201).json({
      user: newUser[0],
      message: "User created successfully"
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    const user = await db.select().from(users).where(eq3(users.username, username)).limit(1);
    if (user.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    req.session.userId = user[0].id;
    const { password: _, ...userWithoutPassword } = user[0];
    res.json({
      user: userWithoutPassword,
      message: "Login successful"
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not logout" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
});
router3.get("/me", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await db.select({
      id: users.id,
      username: users.username,
      coins: users.coins,
      rank: users.rank,
      language: users.language,
      premium: users.premium,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq3(users.id, userId)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: user[0] });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.post("/add-coins", async (req, res) => {
  try {
    const userId = req.session?.userId;
    const { amount } = req.body;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!amount || amount < 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const updatedUser = await db.update(users).set({
      coins: amount,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(users.id, userId)).returning({
      id: users.id,
      username: users.username,
      coins: users.coins,
      rank: users.rank,
      language: users.language,
      premium: users.premium
    });
    if (updatedUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: updatedUser[0] });
  } catch (error) {
    console.error("Add coins error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.post("/upgrade-premium", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const updatedUser = await db.update(users).set({
      premium: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(users.id, userId)).returning({
      id: users.id,
      username: users.username,
      coins: users.coins,
      rank: users.rank,
      language: users.language,
      premium: users.premium
    });
    if (updatedUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: updatedUser[0] });
  } catch (error) {
    console.error("Upgrade premium error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
function generateReferralCode(username) {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${username.substring(0, 3).toUpperCase()}${random}`;
}
router3.get("/referral-code", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await db.select({
      id: users.id,
      username: users.username,
      referralCode: users.referralCode,
      totalReferrals: users.totalReferrals
    }).from(users).where(eq3(users.id, userId)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    let referralCode = user[0].referralCode;
    if (!referralCode) {
      referralCode = generateReferralCode(user[0].username);
      try {
        await db.update(users).set({
          referralCode,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq3(users.id, userId));
      } catch (error) {
        referralCode = generateReferralCode(user[0].username + Math.random().toString(36).substring(2, 4));
        await db.update(users).set({
          referralCode,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq3(users.id, userId));
      }
    }
    res.json({
      referralCode,
      totalReferrals: user[0].totalReferrals,
      shareUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}?ref=${referralCode}`
    });
  } catch (error) {
    console.error("Get referral code error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.post("/use-referral", async (req, res) => {
  try {
    const userId = req.session?.userId;
    const { referralCode } = req.body;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!referralCode) {
      return res.status(400).json({ error: "Referral code is required" });
    }
    const currentUser = await db.select({ referredBy: users.referredBy }).from(users).where(eq3(users.id, userId)).limit(1);
    if (currentUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    if (currentUser[0].referredBy) {
      return res.status(400).json({ error: "You have already used a referral code" });
    }
    const referrer = await db.select({
      id: users.id,
      username: users.username,
      referralCode: users.referralCode
    }).from(users).where(eq3(users.referralCode, referralCode.toUpperCase())).limit(1);
    if (referrer.length === 0) {
      return res.status(404).json({ error: "Invalid referral code" });
    }
    if (referrer[0].id === userId) {
      return res.status(400).json({ error: "You cannot use your own referral code" });
    }
    await db.update(users).set({
      referredBy: referrer[0].id,
      coins: sql3`${users.coins} + 50`,
      // Give 50 coins to new user
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(users.id, userId));
    await db.update(users).set({
      totalReferrals: sql3`${users.totalReferrals} + 1`,
      coins: sql3`${users.coins} + 50`,
      // Give 50 coins to referrer
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(users.id, referrer[0].id));
    const rewardDescription = `Referral bonus from ${referrer[0].username}`;
    try {
      await scoringService.awardCoins(
        userId,
        50,
        "referral_bonus",
        "Used referral code - welcome bonus",
        void 0
      );
      await scoringService.awardCoins(
        referrer[0].id,
        50,
        "referral_bonus",
        `Referral reward for inviting new user`,
        void 0
      );
    } catch (error) {
      console.error("Error recording referral rewards:", error);
    }
    res.json({
      message: "Referral code used successfully! You and your referrer both received 50 coins.",
      coinsEarned: 50
    });
  } catch (error) {
    console.error("Use referral code error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
var auth_default = router3;

// server/routes/leaderboard.ts
import { eq as eq4 } from "drizzle-orm";
async function getLeaderboard(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const mode = req.query.mode;
    const language = req.query.language;
    let leaderboard;
    if (mode && ["single", "1v1", "2v2"].includes(mode)) {
      leaderboard = await scoringService.getLeaderboardByMode(mode, limit);
    } else {
      leaderboard = await scoringService.getLeaderboard(mode, language, limit, offset);
    }
    res.json({
      success: true,
      leaderboard,
      pagination: {
        limit,
        offset,
        hasMore: leaderboard.length === limit
      },
      filters: {
        mode: mode || "all",
        language: language || "all"
      }
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch leaderboard"
    });
  }
}
async function getPlayerStats(req, res) {
  try {
    const playerId = parseInt(req.params.playerId);
    const stats = await scoringService.getUserStats(playerId);
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "Player stats not found"
      });
    }
    const rankPosition = await scoringService.getUserRankPosition(playerId);
    const recentGames = await scoringService.getRecentGames(playerId, 5);
    res.json({
      success: true,
      player: {
        id: stats.userId,
        totalScore: stats.totalScore,
        totalWins: stats.totalWins,
        totalLosses: stats.totalLosses,
        totalGames: stats.totalGames,
        currentStreak: stats.currentStreak,
        maxStreak: stats.maxStreak,
        highestScore: stats.highestScore,
        averageScore: stats.averageScore,
        perfectGames: stats.perfectGames,
        rank: stats.rank,
        rankPosition,
        winRate: stats.totalGames > 0 ? (stats.totalWins / stats.totalGames * 100).toFixed(1) : "0.0",
        lastPlayed: stats.lastPlayed,
        // Mode-specific stats
        modeStats: {
          singleplayer: {
            wins: stats.singleplayerWins,
            games: stats.singleplayerGames,
            winRate: stats.singleplayerGames > 0 ? (stats.singleplayerWins / stats.singleplayerGames * 100).toFixed(1) : "0.0"
          },
          oneVsOne: {
            wins: stats.oneVsOneWins,
            games: stats.oneVsOneGames,
            winRate: stats.oneVsOneGames > 0 ? (stats.oneVsOneWins / stats.oneVsOneGames * 100).toFixed(1) : "0.0"
          },
          twoVsTwo: {
            wins: stats.twoVsTwoWins,
            games: stats.twoVsTwoGames,
            winRate: stats.twoVsTwoGames > 0 ? (stats.twoVsTwoWins / stats.twoVsTwoGames * 100).toFixed(1) : "0.0"
          }
        },
        recentGames
      }
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch player stats"
    });
  }
}
async function awardAdReward(req, res) {
  try {
    const userId = parseInt(req.body.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }
    await scoringService.awardCoins(userId, 5, "ad_reward", "Watched advertisement");
    const user = await db.select({ coins: users.coins }).from(users).where(eq4(users.id, userId)).limit(1);
    res.json({
      success: true,
      message: "Ad reward claimed successfully",
      reward: 5,
      newBalance: user.length > 0 ? user[0].coins : 0
    });
  } catch (error) {
    console.error("Error awarding ad reward:", error);
    res.status(500).json({
      success: false,
      error: "Failed to award ad reward"
    });
  }
}
async function updateScore(req, res) {
  try {
    const { userId, gameScore, isWin, gameMode, gameId, isPerfectGame } = req.body;
    if (!userId || gameScore === void 0 || isWin === void 0 || !gameMode) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters"
      });
    }
    await scoringService.updatePlayerScore(
      parseInt(userId),
      parseInt(gameScore),
      Boolean(isWin),
      gameMode,
      gameId ? parseInt(gameId) : void 0,
      Boolean(isPerfectGame)
    );
    const stats = await scoringService.getUserStats(parseInt(userId));
    res.json({
      success: true,
      message: "Score updated successfully",
      stats
    });
  } catch (error) {
    console.error("Error updating score:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update score"
    });
  }
}

// server/routes/questions.js
import express from "express";

// server/questions.js
import OpenAI2 from "openai";
var openai2 = new OpenAI2({
  apiKey: process.env.OPENAI_API_KEY
});
var QUESTION_CATEGORIES = {
  "general-knowledge": {
    name: {
      en: "General Knowledge",
      ar: "\u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u0639\u0627\u0645\u0629"
    },
    icon: "\u{1F9E0}",
    subcategories: {
      en: ["Basic Facts", "World Knowledge", "Common Sense", "Trivia"],
      ar: ["\u0627\u0644\u062D\u0642\u0627\u0626\u0642 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629", "\u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629", "\u0627\u0644\u062D\u0633 \u0627\u0644\u0639\u0627\u0645", "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0639\u0627\u0645\u0629"]
    }
  },
  "sports": {
    name: {
      en: "Sports",
      ar: "\u0627\u0644\u0631\u064A\u0627\u0636\u0629"
    },
    icon: "\u26BD",
    subcategories: {
      en: ["Football", "Basketball", "Olympics", "Tennis", "Soccer"],
      ar: ["\u0643\u0631\u0629 \u0627\u0644\u0642\u062F\u0645 \u0627\u0644\u0623\u0645\u0631\u064A\u0643\u064A\u0629", "\u0643\u0631\u0629 \u0627\u0644\u0633\u0644\u0629", "\u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0623\u0648\u0644\u0645\u0628\u064A\u0629", "\u0627\u0644\u062A\u0646\u0633", "\u0643\u0631\u0629 \u0627\u0644\u0642\u062F\u0645"]
    }
  },
  "news": {
    name: {
      en: "Current News",
      ar: "\u0627\u0644\u0623\u062E\u0628\u0627\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629"
    },
    icon: "\u{1F4F0}",
    subcategories: {
      en: ["World Events", "Politics", "Technology News", "Economy"],
      ar: ["\u0627\u0644\u0623\u062D\u062F\u0627\u062B \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629", "\u0627\u0644\u0633\u064A\u0627\u0633\u0629", "\u0623\u062E\u0628\u0627\u0631 \u0627\u0644\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627", "\u0627\u0644\u0627\u0642\u062A\u0635\u0627\u062F"]
    }
  },
  "music": {
    name: {
      en: "Music",
      ar: "\u0627\u0644\u0645\u0648\u0633\u064A\u0642\u0649"
    },
    icon: "\u{1F3B5}",
    subcategories: {
      en: ["Pop Music", "Classical", "Rock", "Hip Hop", "Country"],
      ar: ["\u0627\u0644\u0645\u0648\u0633\u064A\u0642\u0649 \u0627\u0644\u0634\u0639\u0628\u064A\u0629", "\u0627\u0644\u0643\u0644\u0627\u0633\u064A\u0643\u064A\u0629", "\u0627\u0644\u0631\u0648\u0643", "\u0627\u0644\u0647\u064A\u0628 \u0647\u0648\u0628", "\u0627\u0644\u0631\u064A\u0641\u064A\u0629"]
    }
  },
  "history": {
    name: {
      en: "History",
      ar: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E"
    },
    icon: "\u{1F3DB}\uFE0F",
    subcategories: {
      en: ["Ancient History", "World Wars", "Medieval Times", "Modern History"],
      ar: ["\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0642\u062F\u064A\u0645", "\u0627\u0644\u062D\u0631\u0648\u0628 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629", "\u0627\u0644\u0639\u0635\u0648\u0631 \u0627\u0644\u0648\u0633\u0637\u0649", "\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u062D\u062F\u064A\u062B"]
    }
  },
  "science": {
    name: {
      en: "Science",
      ar: "\u0627\u0644\u0639\u0644\u0648\u0645"
    },
    icon: "\u{1F52C}",
    subcategories: {
      en: ["Physics", "Chemistry", "Biology", "Astronomy", "Medicine"],
      ar: ["\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621", "\u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0621", "\u0639\u0644\u0645 \u0627\u0644\u0623\u062D\u064A\u0627\u0621", "\u0639\u0644\u0645 \u0627\u0644\u0641\u0644\u0643", "\u0627\u0644\u0637\u0628"]
    }
  },
  "movies": {
    name: {
      en: "Movies & Entertainment",
      ar: "\u0627\u0644\u0623\u0641\u0644\u0627\u0645 \u0648\u0627\u0644\u062A\u0631\u0641\u064A\u0647"
    },
    icon: "\u{1F3AC}",
    subcategories: {
      en: ["Hollywood", "TV Shows", "Celebrities", "Animation", "Classics"],
      ar: ["\u0647\u0648\u0644\u064A\u0648\u0648\u062F", "\u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646\u064A\u0629", "\u0627\u0644\u0645\u0634\u0627\u0647\u064A\u0631", "\u0627\u0644\u0631\u0633\u0648\u0645 \u0627\u0644\u0645\u062A\u062D\u0631\u0643\u0629", "\u0627\u0644\u0643\u0644\u0627\u0633\u064A\u0643\u064A\u0627\u062A"]
    }
  }
};
var DIFFICULTY_LEVELS = ["easy", "medium", "hard"];
async function generateAIQuestions(category, difficulty = "medium", count = 5, language = "en") {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OpenAI API key not found, using fallback questions");
    return generateFallbackQuestions2(category, difficulty, count, language);
  }
  try {
    const categoryInfo = QUESTION_CATEGORIES[category];
    if (!categoryInfo) {
      throw new Error(`Invalid category: ${category}`);
    }
    const categoryName = categoryInfo.name[language] || categoryInfo.name.en;
    const subcategories = categoryInfo.subcategories[language] || categoryInfo.subcategories.en;
    const isArabic = language === "ar";
    const prompt = isArabic ? `\u0642\u0645 \u0628\u0625\u0646\u0634\u0627\u0621 ${count} \u0623\u0633\u0626\u0644\u0629 \u062B\u0642\u0627\u0641\u064A\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0644\u0641\u0626\u0629 "${categoryName}" \u0628\u0645\u0633\u062A\u0648\u0649 \u0635\u0639\u0648\u0628\u0629 "${difficulty}".

\u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A:
- \u0627\u064F\u0631\u062C\u0639 \u0628\u062A\u0646\u0633\u064A\u0642 JSON \u0635\u0627\u0644\u062D \u0641\u0642\u0637
- \u0643\u0644 \u0633\u0624\u0627\u0644 \u064A\u062C\u0628 \u0623\u0646 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649: question, options (4 \u062E\u064A\u0627\u0631\u0627\u062A), correctAnswer (\u0641\u0647\u0631\u0633 0-3), category, difficulty, explanation
- \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0645\u0634\u0648\u0642\u0629 \u0648\u062A\u0639\u0644\u064A\u0645\u064A\u0629
- \u062A\u062C\u0646\u0628 \u0627\u0644\u0645\u0648\u0627\u0636\u064A\u0639 \u0627\u0644\u063A\u0627\u0645\u0636\u0629 \u062C\u062F\u0627\u064B \u0623\u0648 \u0627\u0644\u0645\u062B\u064A\u0631\u0629 \u0644\u0644\u062C\u062F\u0644
- \u062A\u0623\u0643\u062F \u0645\u0646 \u0623\u0646 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0635\u062D\u064A\u062D\u0629 \u0644\u064A\u0633\u062A \u062F\u0627\u0626\u0645\u0627\u064B \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u0645\u0648\u0636\u0639
- \u0627\u0634\u0645\u0644 \u0645\u0648\u0627\u0636\u064A\u0639 \u0645\u062A\u0646\u0648\u0639\u0629 \u0636\u0645\u0646 \u0627\u0644\u0641\u0626\u0629
- \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u062C\u0645\u064A\u0639 \u0627\u0644\u0646\u0635\u0648\u0635 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629

\u0645\u062B\u0627\u0644 \u0639\u0644\u0649 \u0627\u0644\u062A\u0646\u0633\u064A\u0642:
{
  "questions": [
    {
      "question": "\u0645\u0627 \u0647\u0648 \u0623\u0643\u0628\u0631 \u0643\u0648\u0643\u0628 \u0641\u064A \u0646\u0638\u0627\u0645\u0646\u0627 \u0627\u0644\u0634\u0645\u0633\u064A\u061F",
      "options": ["\u0627\u0644\u0623\u0631\u0636", "\u0627\u0644\u0645\u0634\u062A\u0631\u064A", "\u0632\u062D\u0644", "\u0627\u0644\u0645\u0631\u064A\u062E"],
      "correctAnswer": 1,
      "category": "\u0627\u0644\u0639\u0644\u0648\u0645",
      "difficulty": "\u0633\u0647\u0644",
      "explanation": "\u0627\u0644\u0645\u0634\u062A\u0631\u064A \u0647\u0648 \u0623\u0643\u0628\u0631 \u0643\u0648\u0643\u0628 \u0641\u064A \u0646\u0638\u0627\u0645\u0646\u0627 \u0627\u0644\u0634\u0645\u0633\u064A."
    }
  ]
}

\u0627\u0644\u0641\u0626\u0629: ${categoryName}
\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0635\u0639\u0648\u0628\u0629: ${difficulty}
\u0639\u062F\u062F \u0627\u0644\u0623\u0633\u0626\u0644\u0629: ${count}
\u0627\u0644\u0641\u0626\u0627\u062A \u0627\u0644\u0641\u0631\u0639\u064A\u0629 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0629: ${subcategories.join(", ")}` : `Generate ${count} trivia questions in English for category "${categoryName}" with difficulty "${difficulty}".

Requirements:
- Return valid JSON format only
- Each question must have: question, options (4 choices), correctAnswer (0-3 index), category, difficulty, explanation
- Questions should be engaging and educational
- Avoid very obscure or controversial topics
- Make sure the correct answer is not always in the same position
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
Suggested subcategories: ${subcategories.join(", ")}`;
    const response = await openai2.chat.completions.create({
      model: "gpt-4o",
      // Using the latest available OpenAI model
      messages: [
        {
          role: "system",
          content: isArabic ? "\u0623\u0646\u062A \u0645\u0648\u0644\u062F \u0623\u0633\u0626\u0644\u0629 \u062B\u0642\u0627\u0641\u064A\u0629. \u0627\u064F\u0631\u062C\u0639 \u062F\u0627\u0626\u0645\u0627\u064B \u0628\u062A\u0646\u0633\u064A\u0642 JSON \u0635\u0627\u0644\u062D \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0645\u062C\u0645\u0648\u0639\u0629 \u0645\u0646 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u062B\u0642\u0627\u0641\u064A\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629." : "You are a trivia question generator. Always respond with valid JSON format containing an array of trivia questions in English."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_completion_tokens: 4e3
    });
    const content = response.choices[0].message.content;
    console.log("OpenAI Response:", content);
    const data = JSON.parse(content);
    let questions2 = data.questions || data;
    if (!Array.isArray(questions2)) {
      questions2 = [questions2];
    }
    const validatedQuestions = questions2.slice(0, count).map((q, index) => ({
      id: `ai_${category}_${Date.now()}_${index}`,
      question: q.question,
      options: q.options || [],
      correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
      category: q.category || categoryName,
      difficulty: q.difficulty || difficulty,
      explanation: q.explanation || "",
      timeLimit: 30,
      points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30,
      language,
      source: "ai-generated"
    }));
    if (validatedQuestions.length < count) {
      console.warn(`Only generated ${validatedQuestions.length} of ${count} requested questions`);
      const fallbackQuestions = generateFallbackQuestions2(category, difficulty, count - validatedQuestions.length, language);
      validatedQuestions.push(...fallbackQuestions);
    }
    console.log(`Successfully generated ${validatedQuestions.length} AI questions for ${category} in ${language}`);
    return validatedQuestions.slice(0, count);
  } catch (error) {
    console.error("Error generating AI questions:", error);
    console.log("Falling back to predefined questions");
    return generateFallbackQuestions2(category, difficulty, count, language);
  }
}
function generateFallbackQuestions2(category, difficulty = "medium", count = 5, language = "en") {
  const questionBank = {
    en: {
      "general-knowledge": [
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
        }
      ],
      "sports": [
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
      "science": [
        {
          question: "What is the speed of light in a vacuum?",
          options: ["299,792,458 m/s", "300,000,000 m/s", "186,000 mph", "3\xD710^8 m/s"],
          correctAnswer: 0,
          explanation: "The exact speed of light in a vacuum is 299,792,458 meters per second."
        }
      ]
    },
    ar: {
      "general-knowledge": [
        {
          question: "\u0645\u0627 \u0647\u0648 \u0623\u0643\u0628\u0631 \u0643\u0648\u0643\u0628 \u0641\u064A \u0646\u0638\u0627\u0645\u0646\u0627 \u0627\u0644\u0634\u0645\u0633\u064A\u061F",
          options: ["\u0627\u0644\u0623\u0631\u0636", "\u0627\u0644\u0645\u0634\u062A\u0631\u064A", "\u0632\u062D\u0644", "\u0627\u0644\u0645\u0631\u064A\u062E"],
          correctAnswer: 1,
          explanation: "\u0627\u0644\u0645\u0634\u062A\u0631\u064A \u0647\u0648 \u0623\u0643\u0628\u0631 \u0643\u0648\u0643\u0628 \u0641\u064A \u0646\u0638\u0627\u0645\u0646\u0627 \u0627\u0644\u0634\u0645\u0633\u064A."
        },
        {
          question: "\u0645\u0627 \u0647\u0648 \u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0626\u064A \u0644\u0644\u0623\u0643\u0633\u062C\u064A\u0646\u061F",
          options: ["\u0627\u0644\u0630\u0647\u0628", "\u0627\u0644\u0641\u0636\u0629", "\u0627\u0644\u0623\u0643\u0633\u062C\u064A\u0646", "\u0627\u0644\u062D\u062F\u064A\u062F"],
          correctAnswer: 2,
          explanation: "\u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0626\u064A \u0644\u0644\u0623\u0643\u0633\u062C\u064A\u0646 \u0647\u0648 O."
        },
        {
          question: "\u0645\u0627 \u0647\u064A \u0639\u0627\u0635\u0645\u0629 \u0623\u0633\u062A\u0631\u0627\u0644\u064A\u0627\u061F",
          options: ["\u0633\u064A\u062F\u0646\u064A", "\u0645\u0644\u0628\u0648\u0631\u0646", "\u0643\u0627\u0646\u0628\u0631\u0627", "\u0628\u064A\u0631\u062B"],
          correctAnswer: 2,
          explanation: "\u0643\u0627\u0646\u0628\u0631\u0627 \u0647\u064A \u0639\u0627\u0635\u0645\u0629 \u0623\u0633\u062A\u0631\u0627\u0644\u064A\u0627."
        }
      ],
      "sports": [
        {
          question: "\u0643\u0645 \u0639\u062F\u062F \u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646 \u0641\u064A \u0641\u0631\u064A\u0642 \u0643\u0631\u0629 \u0627\u0644\u0633\u0644\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0644\u0639\u0628 \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u0648\u0642\u062A\u061F",
          options: ["4", "5", "6", "7"],
          correctAnswer: 1,
          explanation: "\u0643\u0644 \u0641\u0631\u064A\u0642 \u0643\u0631\u0629 \u0633\u0644\u0629 \u064A\u0636\u0645 5 \u0644\u0627\u0639\u0628\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u0645\u0644\u0639\u0628 \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u0648\u0642\u062A."
        }
      ],
      "science": [
        {
          question: "\u0645\u0627 \u0647\u064A \u0633\u0631\u0639\u0629 \u0627\u0644\u0636\u0648\u0621 \u0641\u064A \u0627\u0644\u0641\u0631\u0627\u063A\u061F",
          options: ["299,792,458 \u0645/\u062B", "300,000,000 \u0645/\u062B", "186,000 \u0645\u064A\u0644/\u0633\u0627\u0639\u0629", "3\xD710^8 \u0645/\u062B"],
          correctAnswer: 0,
          explanation: "\u0627\u0644\u0633\u0631\u0639\u0629 \u0627\u0644\u062F\u0642\u064A\u0642\u0629 \u0644\u0644\u0636\u0648\u0621 \u0641\u064A \u0627\u0644\u0641\u0631\u0627\u063A \u0647\u064A 299,792,458 \u0645\u062A\u0631 \u0641\u064A \u0627\u0644\u062B\u0627\u0646\u064A\u0629."
        }
      ]
    }
  };
  const langQuestions = questionBank[language] || questionBank.en;
  const categoryQuestions = langQuestions[category] || langQuestions["general-knowledge"];
  const result = [];
  for (let i = 0; i < count; i++) {
    const questionIndex = i % categoryQuestions.length;
    const baseQuestion = categoryQuestions[questionIndex];
    result.push({
      id: `fallback_${category}_${language}_${i}`,
      question: baseQuestion.question,
      options: baseQuestion.options,
      correctAnswer: baseQuestion.correctAnswer,
      category: QUESTION_CATEGORIES[category]?.name[language] || category,
      difficulty,
      explanation: baseQuestion.explanation,
      timeLimit: 30,
      points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30,
      language,
      source: "fallback"
    });
  }
  return result;
}
function getCategories(language = "en") {
  return Object.entries(QUESTION_CATEGORIES).map(([key, value]) => ({
    id: key,
    name: value.name[language] || value.name.en,
    icon: value.icon,
    subcategories: value.subcategories[language] || value.subcategories.en
  }));
}

// server/routes/questions.js
var router4 = express.Router();
router4.get("/categories", (req, res) => {
  try {
    const language = req.query.language || "en";
    const categories = getCategories(language);
    res.json({
      success: true,
      categories,
      totalCategories: categories.length
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
      message: error.message
    });
  }
});
router4.get("/difficulties", (req, res) => {
  res.json({
    success: true,
    difficulties: DIFFICULTY_LEVELS
  });
});
router4.post("/generate", async (req, res) => {
  try {
    const {
      category = "general-knowledge",
      difficulty = "medium",
      count = 5,
      language = "en"
    } = req.body;
    if (!QUESTION_CATEGORIES[category]) {
      return res.status(400).json({
        success: false,
        error: "Invalid category",
        availableCategories: Object.keys(QUESTION_CATEGORIES)
      });
    }
    if (!DIFFICULTY_LEVELS.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: "Invalid difficulty level",
        availableDifficulties: DIFFICULTY_LEVELS
      });
    }
    if (count < 1 || count > 20) {
      return res.status(400).json({
        success: false,
        error: "Count must be between 1 and 20"
      });
    }
    if (!["en", "ar"].includes(language)) {
      return res.status(400).json({
        success: false,
        error: "Unsupported language",
        supportedLanguages: ["en", "ar"]
      });
    }
    console.log(`Generating ${count} questions for category: ${category}, difficulty: ${difficulty}, language: ${language}`);
    const questions2 = await generateAIQuestions(category, difficulty, count, language);
    res.json({
      success: true,
      questions: questions2,
      metadata: {
        category,
        difficulty,
        count: questions2.length,
        language,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        source: questions2[0]?.source || "ai-generated"
      }
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate questions",
      message: error.message
    });
  }
});
router4.post("/multiplayer", async (req, res) => {
  try {
    const {
      category = "general-knowledge",
      difficulty = "medium",
      gameMode = "1vs1",
      language = "en"
    } = req.body;
    const questionCount = gameMode === "1vs1" ? 10 : 15;
    const questions2 = await generateAIQuestions(category, difficulty, questionCount, language);
    res.json({
      success: true,
      questions: questions2,
      metadata: {
        category,
        difficulty,
        gameMode,
        language,
        questionCount,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    console.error("Error generating multiplayer questions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate multiplayer questions",
      message: error.message
    });
  }
});
router4.get("/categories/:categoryId", (req, res) => {
  try {
    const { categoryId } = req.params;
    const language = req.query.language || "en";
    const categoryInfo = QUESTION_CATEGORIES[categoryId];
    if (!categoryInfo) {
      return res.status(404).json({
        success: false,
        error: "Category not found"
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
    console.error("Error fetching category info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch category information",
      message: error.message
    });
  }
});
router4.get("/health", (req, res) => {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  res.json({
    success: true,
    status: "operational",
    services: {
      openai: hasOpenAI ? "available" : "fallback-mode",
      categories: Object.keys(QUESTION_CATEGORIES).length,
      languages: ["en", "ar"],
      difficulties: DIFFICULTY_LEVELS
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var questions_default = router4;

// server/routes.ts
async function registerRoutes(app2, httpServer) {
  app2.use("/api/trivia", trivia_default);
  app2.use("/api/payments", payments_default);
  app2.use("/api/auth", auth_default);
  app2.use("/api/questions", questions_default);
  app2.get("/api/leaderboard", getLeaderboard);
  app2.get("/api/player/:playerId/stats", getPlayerStats);
  app2.post("/api/player/score", updateScore);
  app2.post("/api/rewards/ad", awardAdReward);
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: "Mirage Trivia API"
    });
  });
  app2.get("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  return httpServer || createServer(app2);
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import glsl from "vite-plugin-glsl";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    glsl()
    // Add GLSL shader support
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  // Add support for large models and audio files
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"]
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/matchmaking.js
async function generateQuestions(category, difficulty, count) {
  const fallbackQuestions = [
    {
      question: "What is the largest planet in our solar system?",
      options: ["Earth", "Jupiter", "Saturn", "Mars"],
      correctAnswer: 1,
      category: "General Knowledge",
      difficulty,
      explanation: "Jupiter is the largest planet in our solar system.",
      timeLimit: 30,
      points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30
    },
    {
      question: "Which element has the chemical symbol 'O'?",
      options: ["Gold", "Silver", "Oxygen", "Iron"],
      correctAnswer: 2,
      category: "Science",
      difficulty,
      explanation: "Oxygen has the chemical symbol 'O'.",
      timeLimit: 30,
      points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30
    },
    {
      question: "In which year did World War II end?",
      options: ["1944", "1945", "1946", "1947"],
      correctAnswer: 1,
      category: "History",
      difficulty,
      explanation: "World War II ended in 1945.",
      timeLimit: 30,
      points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30
    },
    {
      question: "What is the capital of Australia?",
      options: ["Sydney", "Melbourne", "Canberra", "Perth"],
      correctAnswer: 2,
      category: "Geography",
      difficulty,
      explanation: "Canberra is the capital city of Australia.",
      timeLimit: 30,
      points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30
    },
    {
      question: "How many players are on a basketball team on the court at one time?",
      options: ["4", "5", "6", "7"],
      correctAnswer: 1,
      category: "Sports",
      difficulty,
      explanation: "Each basketball team has 5 players on the court at one time.",
      timeLimit: 30,
      points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30
    }
  ];
  const result = [];
  for (let i = 0; i < count; i++) {
    const questionIndex = i % fallbackQuestions.length;
    result.push({
      ...fallbackQuestions[questionIndex],
      id: `mp_${i}`
    });
  }
  return result;
}
var MatchmakingService = class {
  constructor() {
    this.queues = {
      "1vs1": [],
      "2vs2": []
    };
    this.rooms = /* @__PURE__ */ new Map();
    this.playerLimits = /* @__PURE__ */ new Map();
    this.inviteCodes = /* @__PURE__ */ new Map();
  }
  // Join matchmaking queue
  joinQueue(socket, gameMode, playerData) {
    const player = {
      id: socket.id,
      socket,
      username: playerData.username || `Player${socket.id.slice(0, 6)}`,
      rank: playerData.rank || "Bronze",
      coins: playerData.coins || 0,
      premium: playerData.premium || false,
      joinedAt: Date.now()
    };
    if (!this.checkGameLimit(player)) {
      socket.emit("gameLimit", {
        message: "Daily game limit reached. Upgrade to premium for unlimited games.",
        gamesPlayed: this.getGamesPlayedToday(player.id),
        limit: player.premium ? "unlimited" : 5
      });
      return false;
    }
    this.queues[gameMode].push(player);
    console.log(`Player ${player.username} joined ${gameMode} queue. Queue size: ${this.queues[gameMode].length}`);
    socket.emit("queueJoined", {
      gameMode,
      position: this.queues[gameMode].length,
      estimatedWait: this.calculateWaitTime(gameMode)
    });
    this.tryCreateMatch(gameMode);
    return true;
  }
  // Leave matchmaking queue
  leaveQueue(socket, gameMode) {
    if (this.queues[gameMode]) {
      this.queues[gameMode] = this.queues[gameMode].filter((p) => p.id !== socket.id);
      socket.emit("queueLeft", { gameMode });
      console.log(`Player ${socket.id} left ${gameMode} queue`);
    }
  }
  // Create game room with invite code
  createPrivateRoom(socket, gameMode, playerData) {
    const roomCode = this.generateRoomCode();
    const roomId = `private_${roomCode}`;
    const player = {
      id: socket.id,
      socket,
      username: playerData.username || `Player${socket.id.slice(0, 6)}`,
      rank: playerData.rank || "Bronze",
      coins: playerData.coins || 0,
      premium: playerData.premium || false,
      isHost: true
    };
    const room = {
      id: roomId,
      code: roomCode,
      gameMode,
      players: [player],
      maxPlayers: gameMode === "1vs1" ? 2 : 4,
      isPrivate: true,
      createdAt: Date.now(),
      status: "waiting"
    };
    this.rooms.set(roomId, room);
    this.inviteCodes.set(roomCode, roomId);
    socket.join(roomId);
    socket.emit("privateRoomCreated", {
      roomCode,
      roomId,
      gameMode,
      maxPlayers: room.maxPlayers
    });
    console.log(`Private room created: ${roomCode} for ${gameMode}`);
    return roomCode;
  }
  // Join game room with invite code
  joinPrivateRoom(socket, roomCode, playerData) {
    const roomId = this.inviteCodes.get(roomCode);
    if (!roomId) {
      socket.emit("joinRoomError", { message: "Invalid room code" });
      return false;
    }
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit("joinRoomError", { message: "Room not found" });
      return false;
    }
    if (room.players.length >= room.maxPlayers) {
      socket.emit("joinRoomError", { message: "Room is full" });
      return false;
    }
    if (room.status !== "waiting") {
      socket.emit("joinRoomError", { message: "Game already in progress" });
      return false;
    }
    const player = {
      id: socket.id,
      socket,
      username: playerData.username || `Player${socket.id.slice(0, 6)}`,
      rank: playerData.rank || "Bronze",
      coins: playerData.coins || 0,
      premium: playerData.premium || false,
      isHost: false
    };
    room.players.push(player);
    socket.join(roomId);
    socket.to(roomId).emit("playerJoined", {
      player: {
        username: player.username,
        rank: player.rank,
        premium: player.premium
      },
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers
    });
    socket.emit("joinedPrivateRoom", {
      roomId,
      gameMode: room.gameMode,
      players: room.players.map((p) => ({
        username: p.username,
        rank: p.rank,
        premium: p.premium,
        isHost: p.isHost
      })),
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers
    });
    if (room.players.length === room.maxPlayers) {
      this.startGame(roomId);
    }
    return true;
  }
  // Try to create a match from queue
  async tryCreateMatch(gameMode) {
    const requiredPlayers = gameMode === "1vs1" ? 2 : 4;
    if (this.queues[gameMode].length >= requiredPlayers) {
      const players = this.queues[gameMode].splice(0, requiredPlayers);
      const roomId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const room = {
        id: roomId,
        gameMode,
        players,
        maxPlayers: requiredPlayers,
        isPrivate: false,
        createdAt: Date.now(),
        status: "starting",
        currentQuestion: 0,
        questions: [],
        scores: gameMode === "1vs1" ? { [players[0].id]: 0, [players[1].id]: 0 } : { team1: 0, team2: 0 },
        teams: gameMode === "2vs2" ? { team1: [players[0], players[1]], team2: [players[2], players[3]] } : null
      };
      this.rooms.set(roomId, room);
      players.forEach((player) => {
        player.socket.join(roomId);
      });
      players.forEach((player) => {
        player.socket.emit("matchFound", {
          roomId,
          gameMode,
          opponents: players.filter((p) => p.id !== player.id).map((p) => ({
            username: p.username,
            rank: p.rank,
            premium: p.premium
          })),
          teams: room.teams ? this.getPlayerTeam(player.id, room.teams) : null
        });
      });
      console.log(`Match created: ${roomId} for ${gameMode} with ${players.length} players`);
      setTimeout(() => {
        this.startGame(roomId);
      }, 3e3);
    }
  }
  // Start game in room
  async startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    try {
      const response = await fetch("http://localhost:5000/api/questions/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: "general-knowledge",
          difficulty: "medium",
          gameMode: room.gameMode,
          language: "en"
          // Default to English, can be configured per room
        })
      });
      let questions2;
      if (response.ok) {
        const data = await response.json();
        questions2 = data.success ? data.questions : await generateQuestions("general", "medium", 10);
      } else {
        questions2 = await generateQuestions("general", "medium", 10);
      }
      room.questions = questions2;
      room.status = "playing";
      room.gameStartTime = Date.now();
      room.currentQuestionStartTime = Date.now();
      room.players.forEach((player) => {
        this.incrementGameCount(player.id);
      });
      room.players.forEach((player) => {
        player.socket.emit("gameStarted", {
          roomId,
          gameMode: room.gameMode,
          totalQuestions: questions2.length,
          teams: room.teams,
          currentQuestion: questions2[0],
          questionIndex: 0,
          players: room.players.map((p) => ({
            id: p.id,
            username: p.username,
            rank: p.rank,
            premium: p.premium
          }))
        });
      });
      console.log(`Game started in room: ${roomId}`);
      this.startQuestionTimer(roomId);
    } catch (error) {
      console.error("Error starting game:", error);
      room.players.forEach((player) => {
        player.socket.emit("gameError", { message: "Failed to start game" });
      });
    }
  }
  // Handle answer submission
  handleAnswerSubmission(socket, roomId, answerData) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== "playing") return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;
    const currentQuestion = room.questions[room.currentQuestion];
    if (!currentQuestion) return;
    const timeBonus = Math.max(0, 30 - (Date.now() - room.currentQuestionStartTime) / 1e3);
    const isCorrect = answerData.answerIndex === currentQuestion.correctAnswer;
    const points = isCorrect ? Math.floor(10 + timeBonus) : -5;
    if (room.gameMode === "1vs1") {
      room.scores[player.id] = (room.scores[player.id] || 0) + points;
    } else {
      const team = this.getPlayerTeam(player.id, room.teams);
      if (team) {
        room.scores[team] = (room.scores[team] || 0) + points;
      }
    }
    if (!room.answers) room.answers = {};
    if (!room.answers[room.currentQuestion]) room.answers[room.currentQuestion] = {};
    room.answers[room.currentQuestion][player.id] = {
      answerIndex: answerData.answerIndex,
      isCorrect,
      points,
      submittedAt: Date.now()
    };
    socket.emit("answerResult", {
      isCorrect,
      points,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      currentScores: room.scores
    });
    const expectedAnswers = room.players.length;
    const actualAnswers = Object.keys(room.answers[room.currentQuestion] || {}).length;
    if (actualAnswers === expectedAnswers) {
      this.nextQuestion(roomId);
    }
  }
  // Move to next question or end game
  nextQuestion(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.currentQuestion++;
    if (room.currentQuestion >= room.questions.length) {
      this.endGame(roomId);
      return;
    }
    const nextQuestion = room.questions[room.currentQuestion];
    room.currentQuestionStartTime = Date.now();
    room.players.forEach((player) => {
      player.socket.emit("nextQuestion", {
        questionNumber: room.currentQuestion + 1,
        totalQuestions: room.questions.length,
        question: nextQuestion,
        currentScores: room.scores
      });
    });
    this.startQuestionTimer(roomId);
  }
  // End game and show results
  endGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.status = "ended";
    let winner;
    if (room.gameMode === "1vs1") {
      const [player1, player2] = room.players;
      const score1 = room.scores[player1.id] || 0;
      const score2 = room.scores[player2.id] || 0;
      if (score1 > score2) {
        winner = { type: "player", data: player1 };
      } else if (score2 > score1) {
        winner = { type: "player", data: player2 };
      } else {
        winner = { type: "tie" };
      }
    } else {
      const team1Score = room.scores.team1 || 0;
      const team2Score = room.scores.team2 || 0;
      if (team1Score > team2Score) {
        winner = { type: "team", data: "team1" };
      } else if (team2Score > team1Score) {
        winner = { type: "team", data: "team2" };
      } else {
        winner = { type: "tie" };
      }
    }
    room.players.forEach((player) => {
      player.socket.emit("gameEnded", {
        winner,
        finalScores: room.scores,
        playerStats: this.calculatePlayerStats(player.id, room),
        gameMode: room.gameMode,
        teams: room.teams
      });
      player.socket.leave(roomId);
    });
    console.log(`Game ended in room: ${roomId}`, winner);
    setTimeout(() => {
      this.rooms.delete(roomId);
      if (room.code) {
        this.inviteCodes.delete(room.code);
      }
    }, 3e4);
  }
  // Start question timer
  startQuestionTimer(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.questionTimer) {
      clearTimeout(room.questionTimer);
    }
    room.questionTimer = setTimeout(() => {
      room.players.forEach((player) => {
        player.socket.emit("timeUp", {
          correctAnswer: room.questions[room.currentQuestion].correctAnswer,
          currentScores: room.scores
        });
      });
      setTimeout(() => {
        this.nextQuestion(roomId);
      }, 2e3);
    }, 3e4);
  }
  // Handle player disconnect
  handleDisconnect(socket) {
    Object.keys(this.queues).forEach((gameMode) => {
      this.queues[gameMode] = this.queues[gameMode].filter((p) => p.id !== socket.id);
    });
    this.rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        if (room.status === "waiting") {
          room.players.splice(playerIndex, 1);
          room.players.forEach((p) => {
            p.socket.emit("playerLeft", {
              username: player.username,
              playerCount: room.players.length,
              maxPlayers: room.maxPlayers
            });
          });
          if (room.players.length === 0) {
            this.rooms.delete(roomId);
            if (room.code) {
              this.inviteCodes.delete(room.code);
            }
          }
        } else if (room.status === "playing") {
          room.players.forEach((p) => {
            if (p.id !== socket.id) {
              p.socket.emit("playerDisconnected", {
                username: player.username,
                canContinue: room.players.length > 2
              });
            }
          });
          if (room.players.length <= 1) {
            this.endGame(roomId);
          }
        }
      }
    });
    console.log(`Player ${socket.id} disconnected`);
  }
  // Utility functions
  generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  calculateWaitTime(gameMode) {
    const queueLength = this.queues[gameMode].length;
    const requiredPlayers = gameMode === "1vs1" ? 2 : 4;
    return Math.max(0, (requiredPlayers - queueLength) * 15);
  }
  getPlayerTeam(playerId, teams) {
    if (!teams) return null;
    if (teams.team1.some((p) => p.id === playerId)) return "team1";
    if (teams.team2.some((p) => p.id === playerId)) return "team2";
    return null;
  }
  calculatePlayerStats(playerId, room) {
    let correctAnswers = 0;
    let totalAnswers = 0;
    let totalPoints = 0;
    if (room.answers) {
      Object.values(room.answers).forEach((questionAnswers) => {
        if (questionAnswers[playerId]) {
          totalAnswers++;
          if (questionAnswers[playerId].isCorrect) {
            correctAnswers++;
          }
          totalPoints += questionAnswers[playerId].points;
        }
      });
    }
    return {
      correctAnswers,
      totalAnswers,
      accuracy: totalAnswers > 0 ? Math.round(correctAnswers / totalAnswers * 100) : 0,
      totalPoints
    };
  }
  // Game limit management
  checkGameLimit(player) {
    if (player.premium) return true;
    const today = (/* @__PURE__ */ new Date()).toDateString();
    const playerKey = `${player.id}_${today}`;
    const gamesPlayed = this.playerLimits.get(playerKey) || 0;
    return gamesPlayed < 5;
  }
  getGamesPlayedToday(playerId) {
    const today = (/* @__PURE__ */ new Date()).toDateString();
    const playerKey = `${playerId}_${today}`;
    return this.playerLimits.get(playerKey) || 0;
  }
  incrementGameCount(playerId) {
    const today = (/* @__PURE__ */ new Date()).toDateString();
    const playerKey = `${playerId}_${today}`;
    const current = this.playerLimits.get(playerKey) || 0;
    this.playerLimits.set(playerKey, current + 1);
  }
  // Get current room info
  getRoomInfo(roomId) {
    return this.rooms.get(roomId);
  }
  // Get queue status
  getQueueStatus() {
    return {
      "1vs1": this.queues["1vs1"].length,
      "2vs2": this.queues["2vs2"].length,
      activeRooms: this.rooms.size
    };
  }
};
var matchmaking_default = MatchmakingService;

// server/multiplayer.ts
var matchmaking = new matchmaking_default();
function setupMultiplayer(io) {
  console.log("Setting up multiplayer functionality...");
  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);
    socket.emit("playersOnline", io.engine.clientsCount);
    io.emit("onlineCount", io.engine.clientsCount);
    socket.on("joinQueue", (data) => {
      const success = matchmaking.joinQueue(socket, data.gameMode, data.playerData);
      if (success) {
        console.log(`Player ${data.playerData?.username || socket.id} joined ${data.gameMode} queue`);
      }
    });
    socket.on("leaveQueue", (data) => {
      matchmaking.leaveQueue(socket, data.gameMode);
    });
    socket.on("createPrivateRoom", (data) => {
      const roomCode = matchmaking.createPrivateRoom(socket, data.gameMode, data.playerData);
      console.log(`Private room created with code: ${roomCode}`);
    });
    socket.on("joinPrivateRoom", (data) => {
      const success = matchmaking.joinPrivateRoom(socket, data.roomCode, data.playerData);
      if (success) {
        console.log(`Player joined private room: ${data.roomCode}`);
      }
    });
    socket.on("answerSubmit", (data) => {
      matchmaking.handleAnswerSubmission(socket, data.roomId, data);
    });
    socket.on("requestNextQuestion", (data) => {
      const room = matchmaking.getRoomInfo(data.roomId);
      if (room && room.status === "playing") {
        matchmaking.nextQuestion(data.roomId);
      }
    });
    socket.on("requestRoomInfo", (data) => {
      const room = matchmaking.getRoomInfo(data.roomId);
      if (room) {
        socket.emit("roomInfo", {
          roomId: data.roomId,
          gameMode: room.gameMode,
          players: room.players.map((p) => ({
            username: p.username,
            rank: p.rank,
            premium: p.premium
          })),
          status: room.status,
          currentQuestion: room.currentQuestion,
          scores: room.scores
        });
      }
    });
    socket.on("getQueueStatus", () => {
      socket.emit("queueStatus", matchmaking.getQueueStatus());
    });
    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);
      matchmaking.handleDisconnect(socket);
      io.emit("onlineCount", io.engine.clientsCount - 1);
    });
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });
  console.log("Multiplayer functionality setup complete");
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || "mirage-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1e3
    // 24 hours
  }
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const httpServer = createServer2(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : "*",
      methods: ["GET", "POST"]
    }
  });
  setupMultiplayer(io);
  const server = await registerRoutes(app, httpServer);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  httpServer.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
