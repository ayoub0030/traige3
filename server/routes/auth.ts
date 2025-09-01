import { Router } from "express";
import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { users, insertUserSchema } from "../../shared/schema";
import { scoringService } from "../services/scoring";

const router = Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { username, password, language = 'en' } = req.body;

    // Validate input
    const validation = insertUserSchema.safeParse({ username, password, language });
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: validation.error.errors 
      });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        language,
        coins: 1000, // Starting coins
        rank: "Bronze", // Starting rank
        premium: false
      })
      .returning({
        id: users.id,
        username: users.username,
        coins: users.coins,
        rank: users.rank,
        language: users.language,
        premium: users.premium,
        createdAt: users.createdAt
      });

    // Set session
    (req.session as any).userId = newUser[0].id;

    res.status(201).json({ 
      user: newUser[0],
      message: "User created successfully" 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set session
    (req.session as any).userId = user[0].id;

    // Return user without password
    const { password: _, ...userWithoutPassword } = user[0];
    
    res.json({ 
      user: userWithoutPassword,
      message: "Login successful" 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout user
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not logout" });
    }
    res.clearCookie('connect.sid');
    res.json({ message: "Logout successful" });
  });
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await db
      .select({
        id: users.id,
        username: users.username,
        coins: users.coins,
        rank: users.rank,
        language: users.language,
        premium: users.premium,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: user[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user coins
router.post("/add-coins", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    const { amount } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!amount || amount < 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const updatedUser = await db
      .update(users)
      .set({ 
        coins: amount,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning({
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
    console.error('Add coins error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user premium status
router.post("/upgrade-premium", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const updatedUser = await db
      .update(users)
      .set({ 
        premium: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning({
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
    console.error('Upgrade premium error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate unique referral code
function generateReferralCode(username: string): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${username.substring(0, 3).toUpperCase()}${random}`;
}

// Get user's referral code
router.get("/referral-code", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await db
      .select({
        id: users.id,
        username: users.username,
        referralCode: users.referralCode,
        totalReferrals: users.totalReferrals
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    let referralCode = user[0].referralCode;
    
    // Generate referral code if doesn't exist
    if (!referralCode) {
      referralCode = generateReferralCode(user[0].username);
      
      try {
        await db
          .update(users)
          .set({ 
            referralCode: referralCode,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
      } catch (error) {
        // If unique constraint fails, generate another code
        referralCode = generateReferralCode(user[0].username + Math.random().toString(36).substring(2, 4));
        await db
          .update(users)
          .set({ 
            referralCode: referralCode,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
      }
    }

    res.json({ 
      referralCode,
      totalReferrals: user[0].totalReferrals,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?ref=${referralCode}`
    });
  } catch (error) {
    console.error('Get referral code error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Use referral code
router.post("/use-referral", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    const { referralCode } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!referralCode) {
      return res.status(400).json({ error: "Referral code is required" });
    }

    // Check if user already used a referral code
    const currentUser = await db
      .select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (currentUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (currentUser[0].referredBy) {
      return res.status(400).json({ error: "You have already used a referral code" });
    }

    // Find the referrer
    const referrer = await db
      .select({
        id: users.id,
        username: users.username,
        referralCode: users.referralCode
      })
      .from(users)
      .where(eq(users.referralCode, referralCode.toUpperCase()))
      .limit(1);

    if (referrer.length === 0) {
      return res.status(404).json({ error: "Invalid referral code" });
    }

    if (referrer[0].id === userId) {
      return res.status(400).json({ error: "You cannot use your own referral code" });
    }

    // Update referred user
    await db
      .update(users)
      .set({ 
        referredBy: referrer[0].id,
        coins: sql`${users.coins} + 50`, // Give 50 coins to new user
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Update referrer
    await db
      .update(users)
      .set({ 
        totalReferrals: sql`${users.totalReferrals} + 1`,
        coins: sql`${users.coins} + 50`, // Give 50 coins to referrer
        updatedAt: new Date()
      })
      .where(eq(users.id, referrer[0].id));

    // Record referral bonus rewards
    const rewardDescription = `Referral bonus from ${referrer[0].username}`;
    
    try {
      // Award coins using scoring service for proper tracking
      await scoringService.awardCoins(
        userId,
        50,
        'referral_bonus',
        'Used referral code - welcome bonus',
        undefined
      );

      await scoringService.awardCoins(
        referrer[0].id,
        50,
        'referral_bonus',
        `Referral reward for inviting new user`,
        undefined
      );
    } catch (error) {
      console.error('Error recording referral rewards:', error);
    }

    res.json({ 
      message: "Referral code used successfully! You and your referrer both received 50 coins.",
      coinsEarned: 50
    });
  } catch (error) {
    console.error('Use referral code error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;