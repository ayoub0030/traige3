import { Router } from "express";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { scoringService } from "../services/scoring";

const router = Router();

// Ad reward endpoint - gives 5 coins for watching an ad
router.post("/ad", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }

    // Check if user exists
    const user = await db.select({ 
      id: users.id, 
      coins: users.coins,
      premium: users.premium 
    })
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);
      
    if (!user.length) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Award 5 coins for ad reward (double for premium users)
    const rewardAmount = user[0].premium ? 10 : 5;
    
    await scoringService.awardCoins(
      parseInt(userId),
      rewardAmount,
      'ad_reward',
      'Watched advertisement',
      undefined
    );

    // Get updated balance
    const updatedUser = await db.select({ coins: users.coins })
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    res.json({
      success: true,
      reward: rewardAmount,
      newBalance: updatedUser[0]?.coins || 0,
      message: user[0].premium 
        ? "Premium bonus: Double coins earned!" 
        : "Coins earned for watching ad!"
    });

  } catch (error) {
    console.error('Error processing ad reward:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process ad reward' 
    });
  }
});

// Daily bonus for all users - 25 coins per day
router.post("/daily-bonus", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }

    // Check if user exists
    const user = await db.select({ 
      id: users.id, 
      coins: users.coins,
      premium: users.premium,
      lastDailyBonus: users.lastDailyBonus 
    })
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);
      
    if (!user.length) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Check if user already claimed daily bonus today
    const today = new Date().toDateString();
    const lastBonus = user[0].lastDailyBonus ? new Date(user[0].lastDailyBonus).toDateString() : null;

    if (lastBonus === today) {
      return res.status(400).json({ 
        success: false, 
        error: "Daily bonus already claimed today",
        timeUntilNext: "Come back tomorrow for your next bonus!"
      });
    }

    // Award daily bonus (25 coins for all users, 50 for premium)
    const bonusAmount = user[0].premium ? 50 : 25;
    
    await scoringService.awardCoins(
      parseInt(userId),
      bonusAmount,
      'daily_bonus',
      'Daily bonus reward',
      undefined
    );

    // Update last daily bonus timestamp
    await db.update(users)
      .set({ lastDailyBonus: new Date() })
      .where(eq(users.id, parseInt(userId)));

    // Get updated balance
    const updatedUser = await db.select({ coins: users.coins })
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    res.json({
      success: true,
      reward: bonusAmount,
      newBalance: updatedUser[0]?.coins || 0,
      message: user[0].premium 
        ? "Premium daily bonus claimed! Double coins earned!"
        : "Daily bonus claimed! Come back tomorrow for more!"
    });

  } catch (error) {
    console.error('Error processing daily bonus:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process daily bonus' 
    });
  }
});

// Get reward status for user
router.get("/status/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid user ID" 
      });
    }

    const user = await db.select({ 
      premium: users.premium,
      lastDailyBonus: users.lastDailyBonus 
    })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
    if (!user.length) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Check if daily bonus can be claimed
    const today = new Date().toDateString();
    const lastBonus = user[0].lastDailyBonus ? new Date(user[0].lastDailyBonus).toDateString() : null;
    const canClaimDaily = user[0].premium && (lastBonus !== today);

    res.json({
      success: true,
      isPremium: user[0].premium,
      canClaimDailyBonus: canClaimDaily,
      adRewardMultiplier: user[0].premium ? 2 : 1,
      nextDailyBonus: user[0].premium && !canClaimDaily ? 
        new Date(new Date().getTime() + 24*60*60*1000).toISOString() : null
    });

  } catch (error) {
    console.error('Error checking reward status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check reward status' 
    });
  }
});

export default router;