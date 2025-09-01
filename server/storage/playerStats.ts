// Simple in-memory storage for player statistics
interface PlayerStats {
  id: string;
  name: string;
  level: number;
  totalWins: number;
  totalLosses: number;
  totalGames: number;
  totalScore: number;
  highestStreak: number;
  lastPlayed: Date;
}

class PlayerStatsStorage {
  private stats: Map<string, PlayerStats> = new Map();

  getPlayerStats(playerId: string): PlayerStats | null {
    return this.stats.get(playerId) || null;
  }

  createOrUpdatePlayer(playerId: string, name: string): PlayerStats {
    const existing = this.stats.get(playerId);
    
    if (existing) {
      existing.name = name; // Update name if changed
      existing.lastPlayed = new Date();
      return existing;
    }

    const newStats: PlayerStats = {
      id: playerId,
      name,
      level: 1,
      totalWins: 0,
      totalLosses: 0,
      totalGames: 0,
      totalScore: 0,
      highestStreak: 0,
      lastPlayed: new Date()
    };

    this.stats.set(playerId, newStats);
    return newStats;
  }

  updateGameResult(playerId: string, isWin: boolean, score: number, maxStreak: number): PlayerStats | null {
    const stats = this.stats.get(playerId);
    if (!stats) return null;

    stats.totalGames++;
    stats.totalScore += score;
    stats.lastPlayed = new Date();

    if (isWin) {
      stats.totalWins++;
    } else {
      stats.totalLosses++;
    }

    if (maxStreak > stats.highestStreak) {
      stats.highestStreak = maxStreak;
    }

    // Calculate level based on total score
    stats.level = Math.floor(stats.totalScore / 1000) + 1;

    return stats;
  }

  getLeaderboard(limit: number = 10): PlayerStats[] {
    return Array.from(this.stats.values())
      .sort((a, b) => {
        // Sort by total score first, then by wins
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return b.totalWins - a.totalWins;
      })
      .slice(0, limit);
  }

  getAllPlayers(): PlayerStats[] {
    return Array.from(this.stats.values())
      .sort((a, b) => b.lastPlayed.getTime() - a.lastPlayed.getTime());
  }
}

export const playerStatsStorage = new PlayerStatsStorage();
export type { PlayerStats };