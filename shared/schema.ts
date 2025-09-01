import { pgTable, text, serial, integer, boolean, timestamp, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  coins: integer("coins").default(1000).notNull(),
  rank: text("rank").default("Bronze").notNull(),
  language: text("language").default("en").notNull(),
  premium: boolean("premium").default(false).notNull(),
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"),
  totalReferrals: integer("total_referrals").default(0).notNull(),
  lastDailyBonus: timestamp("last_daily_bonus"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull(), // '1v1', '2v2', 'single'
  players: json("players").$type<string[]>().notNull(),
  scores: json("scores").$type<Record<string, number>>().notNull(),
  winner: text("winner"), // Winner username or null for draw
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  language: text("language").default("en").notNull(),
  status: text("status").default("completed").notNull(), // 'waiting', 'in_progress', 'completed'
  totalQuestions: integer("total_questions").default(10).notNull(),
  duration: integer("duration"), // Game duration in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const userStats = pgTable("user_stats", {
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
  perfectGames: integer("perfect_games").default(0).notNull(), // Games with 100% correct answers
  lastPlayed: timestamp("last_played"),
  rank: text("rank").default("Bronze").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'game_win', 'ad_reward', 'daily_bonus', 'streak_bonus', 'referral_bonus'
  amount: integer("amount").notNull(), // Coins earned
  gameId: integer("game_id"), // Reference to game if applicable
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(), // User who sent the referral
  referredId: integer("referred_id").notNull(), // User who was referred
  referralCode: text("referral_code").notNull(),
  rewardGiven: boolean("reward_given").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text_en: text("text_en").notNull(),
  text_ar: text("text_ar").notNull(),
  options_en: json("options_en").$type<string[]>().notNull(),
  options_ar: json("options_ar").$type<string[]>().notNull(),
  answer: integer("answer").notNull(), // Index of correct answer (0-3)
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  image_url: text("image_url"),
  explanation_en: text("explanation_en"),
  explanation_ar: text("explanation_ar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  language: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  mode: true,
  players: true,
  scores: true,
  winner: true,
  category: true,
  difficulty: true,
  language: true,
  totalQuestions: true,
  duration: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
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
  rank: true,
});

export const insertRewardSchema = createInsertSchema(rewards).pick({
  userId: true,
  type: true,
  amount: true,
  gameId: true,
  description: true,
});

export const insertReferralSchema = createInsertSchema(referrals).pick({
  referrerId: true,
  referredId: true,
  referralCode: true,
  rewardGiven: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  text_en: true,
  text_ar: true,
  options_en: true,
  options_ar: true,
  answer: true,
  category: true,
  difficulty: true,
  image_url: true,
  explanation_en: true,
  explanation_ar: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
