import { db } from "../db";
import { users, userStats, games, rewards } from "../../shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import type { User, UserStats, Game, Reward } from "../../shared/schema";

export class ScoringService {
  // Update user score and stats after a game
  async updatePlayerScore(
    userId: number, 
    gameScore: number, 
    isWin: boolean, 
    gameMode: string,
    gameId?: number,
    isPerfectGame: boolean = false
  ): Promise<void> {
    try {
      // Get or create user stats
      let stats = await this.getUserStats(userId);
      
      if (!stats) {
        stats = await this.createUserStats(userId);
      }

      // Calculate new stats
      const newTotalGames = stats.totalGames + 1;
      const newTotalScore = stats.totalScore + gameScore;
      const newAverageScore = Math.round(newTotalScore / newTotalGames);
      const newTotalWins = isWin ? stats.totalWins + 1 : stats.totalWins;
      const newTotalLosses = !isWin ? stats.totalLosses + 1 : stats.totalLosses;
      const newCurrentStreak = isWin ? stats.currentStreak + 1 : 0;
      const newMaxStreak = Math.max(stats.maxStreak, newCurrentStreak);
      const newHighestScore = Math.max(stats.highestScore, gameScore);
      const newPerfectGames = isPerfectGame ? stats.perfectGames + 1 : stats.perfectGames;

      // Update mode-specific stats
      const modeUpdates: Partial<UserStats> = {};
      switch (gameMode) {
        case 'single':
          modeUpdates.singleplayerGames = stats.singleplayerGames + 1;
          if (isWin) modeUpdates.singleplayerWins = stats.singleplayerWins + 1;
          break;
        case '1v1':
          modeUpdates.oneVsOneGames = stats.oneVsOneGames + 1;
          if (isWin) modeUpdates.oneVsOneWins = stats.oneVsOneWins + 1;
          break;
        case '2v2':
          modeUpdates.twoVsTwoGames = stats.twoVsTwoGames + 1;
          if (isWin) modeUpdates.twoVsTwoWins = stats.twoVsTwoWins + 1;
          break;
      }

      // Calculate new rank
      const newRank = this.calculateRank(newTotalScore, newTotalWins, newMaxStreak);

      // Update user stats
      await db.update(userStats)
        .set({
          totalGames: newTotalGames,
          totalWins: newTotalWins,
          totalLosses: newTotalLosses,
          totalScore: newTotalScore,
          highestScore: newHighestScore,
          currentStreak: newCurrentStreak,
          maxStreak: newMaxStreak,
          averageScore: newAverageScore,
          perfectGames: newPerfectGames,
          lastPlayed: new Date(),
          rank: newRank,
          updatedAt: new Date(),
          ...modeUpdates
        })
        .where(eq(userStats.userId, userId));

      // Update user rank in users table
      await db.update(users)
        .set({ 
          rank: newRank,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Award coins for wins
      if (isWin) {
        await this.awardCoins(userId, 10, 'game_win', `Win reward for ${gameMode} game`, gameId);
      }

      // Bonus for perfect games
      if (isPerfectGame) {
        await this.awardCoins(userId, 5, 'streak_bonus', 'Perfect game bonus', gameId);
      }

      // Streak bonus (every 5 wins in a row)
      if (newCurrentStreak > 0 && newCurrentStreak % 5 === 0) {
        await this.awardCoins(userId, newCurrentStreak, 'streak_bonus', `${newCurrentStreak}-win streak bonus`, gameId);
      }

    } catch (error) {
      console.error('Error updating player score:', error);
      throw error;
    }
  }

  // Award coins to user and record transaction
  async awardCoins(
    userId: number, 
    amount: number, 
    type: string, 
    description?: string,
    gameId?: number
  ): Promise<void> {
    try {
      // Update user coins
      await db.update(users)
        .set({ 
          coins: sql`${users.coins} + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Record reward transaction
      await db.insert(rewards).values({
        userId,
        type,
        amount,
        gameId,
        description: description || `${amount} coins awarded`
      });

    } catch (error) {
      console.error('Error awarding coins:', error);
      throw error;
    }
  }

  // Deduct coins (for entry fees, purchases)
  async deductCoins(userId: number, amount: number, description?: string): Promise<boolean> {
    try {
      // Check if user has enough coins
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user.length || user[0].coins < amount) {
        return false; // Insufficient coins
      }

      // Deduct coins
      await db.update(users)
        .set({ 
          coins: sql`${users.coins} - ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Record transaction
      await db.insert(rewards).values({
        userId,
        type: 'deduction',
        amount: -amount,
        description: description || `${amount} coins deducted`
      });

      return true;
    } catch (error) {
      console.error('Error deducting coins:', error);
      return false;
    }
  }

  // Get user statistics
  async getUserStats(userId: number): Promise<UserStats | null> {
    try {
      const result = await db.select()
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // Create initial user stats
  async createUserStats(userId: number): Promise<UserStats> {
    try {
      const result = await db.insert(userStats)
        .values({ userId })
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error creating user stats:', error);
      throw error;
    }
  }

  // Get leaderboard with filters
  async getLeaderboard(
    mode?: string, 
    language?: string, 
    limit: number = 10,
    offset: number = 0
  ): Promise<any[]> {
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
      })
      .from(users)
      .leftJoin(userStats, eq(users.id, userStats.userId))
      .orderBy(desc(userStats.totalScore))
      .limit(limit)
      .offset(offset);

      // Apply language filter if specified
      if (language) {
        query = query.where(eq(users.language, language));
      }

      const results = await query;

      return results.map(user => ({
        ...user,
        winRate: (user.totalGames || 0) > 0 ? (((user.totalWins || 0) / (user.totalGames || 1)) * 100).toFixed(1) : '0.0',
        // Mode-specific win rates
        singleplayerWinRate: (user.singleplayerGames || 0) > 0 ? 
          (((user.singleplayerWins || 0) / (user.singleplayerGames || 1)) * 100).toFixed(1) : '0.0',
        oneVsOneWinRate: (user.oneVsOneGames || 0) > 0 ? 
          (((user.oneVsOneWins || 0) / (user.oneVsOneGames || 1)) * 100).toFixed(1) : '0.0',
        twoVsTwoWinRate: (user.twoVsTwoGames || 0) > 0 ? 
          (((user.twoVsTwoWins || 0) / (user.twoVsTwoGames || 1)) * 100).toFixed(1) : '0.0'
      }));

    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Get filtered leaderboard by mode
  async getLeaderboardByMode(mode: string, limit: number = 10): Promise<any[]> {
    try {
      let orderByField;
      let winField;
      let gamesField;

      switch (mode) {
        case 'single':
          orderByField = userStats.singleplayerWins;
          winField = 'singleplayerWins';
          gamesField = 'singleplayerGames';
          break;
        case '1v1':
          orderByField = userStats.oneVsOneWins;
          winField = 'oneVsOneWins';
          gamesField = 'oneVsOneGames';
          break;
        case '2v2':
          orderByField = userStats.twoVsTwoWins;
          winField = 'twoVsTwoWins';
          gamesField = 'twoVsTwoGames';
          break;
        default:
          return this.getLeaderboard(undefined, undefined, limit);
      }

      const results = await db.select({
        id: users.id,
        username: users.username,
        rank: users.rank,
        coins: users.coins,
        totalScore: userStats.totalScore,
        wins: orderByField,
        games: mode === 'single' ? userStats.singleplayerGames :
               mode === '1v1' ? userStats.oneVsOneGames : userStats.twoVsTwoGames,
        maxStreak: userStats.maxStreak,
        averageScore: userStats.averageScore,
        lastPlayed: userStats.lastPlayed
      })
      .from(users)
      .leftJoin(userStats, eq(users.id, userStats.userId))
      .orderBy(desc(orderByField))
      .limit(limit);

      return results.map(user => ({
        ...user,
        winRate: (user.games || 0) > 0 ? (((user.wins || 0) / (user.games || 1)) * 100).toFixed(1) : '0.0'
      }));

    } catch (error) {
      console.error('Error getting mode leaderboard:', error);
      throw error;
    }
  }

  // Calculate rank based on performance
  private calculateRank(totalScore: number, totalWins: number, maxStreak: number): string {
    const score = totalScore + (totalWins * 10) + (maxStreak * 5);

    if (score >= 10000) return 'Legendary';
    if (score >= 5000) return 'Diamond';
    if (score >= 2500) return 'Platinum';
    if (score >= 1000) return 'Gold';
    if (score >= 500) return 'Silver';
    return 'Bronze';
  }

  // Get recent games for a user
  async getRecentGames(userId: number, limit: number = 10): Promise<Game[]> {
    try {
      return await db.select()
        .from(games)
        .where(sql`${games.players}::jsonb @> ${JSON.stringify([userId.toString()])}`)
        .orderBy(desc(games.completedAt))
        .limit(limit);
    } catch (error) {
      console.error('Error getting recent games:', error);
      return [];
    }
  }

  // Get user's rank position
  async getUserRankPosition(userId: number): Promise<number> {
    try {
      const userScore = await db.select({ totalScore: userStats.totalScore })
        .from(userStats)
        .where(eq(userStats.userId, userId))
        .limit(1);
        
      if (!userScore.length) return 0;
      
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(userStats)
        .where(sql`${userStats.totalScore} > ${userScore[0].totalScore}`);

      return (result[0]?.count || 0) + 1;
    } catch (error) {
      console.error('Error getting user rank position:', error);
      return 0;
    }
  }
}

export const scoringService = new ScoringService();