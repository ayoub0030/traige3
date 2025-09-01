import { Request, Response } from 'express';
import { scoringService } from '../services/scoring';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export async function getLeaderboard(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const mode = req.query.mode as string;
    const language = req.query.language as string;
    
    let leaderboard;
    
    if (mode && ['single', '1v1', '2v2'].includes(mode)) {
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
        mode: mode || 'all',
        language: language || 'all'
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
}

export async function getPlayerStats(req: Request, res: Response) {
  try {
    const playerId = parseInt(req.params.playerId);
    const stats = await scoringService.getUserStats(playerId);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Player stats not found'
      });
    }

    // Get user's rank position
    const rankPosition = await scoringService.getUserRankPosition(playerId);
    
    // Get recent games
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
        winRate: stats.totalGames > 0 ? (stats.totalWins / stats.totalGames * 100).toFixed(1) : '0.0',
        lastPlayed: stats.lastPlayed,
        // Mode-specific stats
        modeStats: {
          singleplayer: {
            wins: stats.singleplayerWins,
            games: stats.singleplayerGames,
            winRate: stats.singleplayerGames > 0 ? (stats.singleplayerWins / stats.singleplayerGames * 100).toFixed(1) : '0.0'
          },
          oneVsOne: {
            wins: stats.oneVsOneWins,
            games: stats.oneVsOneGames,
            winRate: stats.oneVsOneGames > 0 ? (stats.oneVsOneWins / stats.oneVsOneGames * 100).toFixed(1) : '0.0'
          },
          twoVsTwo: {
            wins: stats.twoVsTwoWins,
            games: stats.twoVsTwoGames,
            winRate: stats.twoVsTwoGames > 0 ? (stats.twoVsTwoWins / stats.twoVsTwoGames * 100).toFixed(1) : '0.0'
          }
        },
        recentGames
      }
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player stats'
    });
  }
}

// Award ad rewards (simulate watching ad)
export async function awardAdReward(req: Request, res: Response) {
  try {
    const userId = parseInt(req.body.userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Award 5 coins for watching ad
    await scoringService.awardCoins(userId, 5, 'ad_reward', 'Watched advertisement');
    
    // Get updated user data
    const user = await db.select({ coins: users.coins })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    res.json({
      success: true,
      message: 'Ad reward claimed successfully',
      reward: 5,
      newBalance: user.length > 0 ? user[0].coins : 0
    });
  } catch (error) {
    console.error('Error awarding ad reward:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award ad reward'
    });
  }
}

// Update player score after game
export async function updateScore(req: Request, res: Response) {
  try {
    const { userId, gameScore, isWin, gameMode, gameId, isPerfectGame } = req.body;
    
    if (!userId || gameScore === undefined || isWin === undefined || !gameMode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    await scoringService.updatePlayerScore(
      parseInt(userId),
      parseInt(gameScore),
      Boolean(isWin),
      gameMode,
      gameId ? parseInt(gameId) : undefined,
      Boolean(isPerfectGame)
    );

    // Get updated stats
    const stats = await scoringService.getUserStats(parseInt(userId));
    
    res.json({
      success: true,
      message: 'Score updated successfully',
      stats
    });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update score'
    });
  }
}