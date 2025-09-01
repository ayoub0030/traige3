import { Router } from "express";
import Stripe from "stripe";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { scoringService } from "../services/scoring";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// Premium subscription plans
const PLANS = {
  premium: {
    price: 999, // $9.99 in cents
    name: "Premium Plan",
    features: ["Unlimited questions", "No ads", "Premium themes", "Priority support"]
  }
};

// Coin packs
const COIN_PACKS = {
  small: { coins: 100, price: 100, name: "Small Pack" }, // $1.00 for 100 coins
  medium: { coins: 250, price: 199, name: "Medium Pack" }, // $1.99 for 250 coins
  large: { coins: 500, price: 399, name: "Large Pack" }, // $3.99 for 500 coins
  premium: { coins: 1000, price: 999, name: "Premium Pack" }, // $9.99 for 1000 coins
};

// Create payment intent for premium subscription
router.post("/create-subscription-intent", async (req, res) => {
  try {
    const { planType = 'premium', userId } = req.body;
    
    if (!PLANS[planType as keyof typeof PLANS]) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const plan = PLANS[planType as keyof typeof PLANS];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price,
      currency: 'usd',
      metadata: {
        type: 'subscription',
        plan: planType,
        userId: userId.toString(),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: plan.price,
      plan: plan
    });
  } catch (error) {
    console.error('Error creating subscription payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Create payment intent for coin packs
router.post("/create-coins-intent", async (req, res) => {
  try {
    const { packType, userId } = req.body;
    
    if (!COIN_PACKS[packType as keyof typeof COIN_PACKS]) {
      return res.status(400).json({ error: "Invalid pack type" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const pack = COIN_PACKS[packType as keyof typeof COIN_PACKS];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pack.price,
      currency: 'usd',
      metadata: {
        type: 'coins',
        pack: packType,
        coins: pack.coins.toString(),
        userId: userId.toString(),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: pack.price,
      pack: pack
    });
  } catch (error) {
    console.error('Error creating coins payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Webhook to handle successful payments
router.post("/webhook", async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook signature verification failed');
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = parseInt(paymentIntent.metadata.userId || '0');
      
      if (!userId) {
        console.error('No user ID in payment metadata:', paymentIntent.id);
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      // Handle the successful payment
      if (paymentIntent.metadata.type === 'subscription') {
        // Update user's premium status
        console.log('Premium subscription activated for user:', userId, 'payment:', paymentIntent.id);
        
        // Set premium status and give bonus coins
        await db.update(users)
          .set({ 
            premium: true,
            coins: sql`${users.coins} + 1000`, // Bonus 1000 coins for premium
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
          
        // Record the premium purchase as a reward
        await scoringService.awardCoins(
          userId, 
          1000, 
          'premium_bonus', 
          'Premium subscription bonus coins',
          undefined
        );
        
        console.log(`Premium subscription activated for user ${userId} with 1000 bonus coins`);
        
      } else if (paymentIntent.metadata.type === 'coins') {
        // Add coins to user's account
        const coins = parseInt(paymentIntent.metadata.coins || '0');
        console.log(`Adding ${coins} coins for user:`, userId, 'payment:', paymentIntent.id);
        
        // Award coins through the scoring service
        await scoringService.awardCoins(
          userId,
          coins,
          'coin_purchase',
          `Purchased ${paymentIntent.metadata.pack} pack`,
          undefined
        );
        
        console.log(`Successfully added ${coins} coins to user ${userId}`);
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
});

// Get available plans and coin packs
router.get("/plans", (req, res) => {
  res.json({
    subscriptions: PLANS,
    coinPacks: COIN_PACKS
  });
});

// Remove ads for premium users
router.post("/remove-ads", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user is premium
    const user = await db.select({ premium: users.premium })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
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
    console.error('Error removing ads:', error);
    res.status(500).json({ error: 'Failed to remove ads' });
  }
});

// Check premium status and benefits
router.get("/premium-status/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await db.select({ 
      premium: users.premium, 
      coins: users.coins, 
      rank: users.rank 
    })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const premiumBenefits = {
      unlimitedGames: user[0].premium,
      noAds: user[0].premium,
      bonusCoins: user[0].premium ? 100 : 0, // Daily bonus for premium users
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
    console.error('Error checking premium status:', error);
    res.status(500).json({ error: 'Failed to check premium status' });
  }
});

export default router;