import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import triviaRoutes from "./routes/trivia";
import paymentsRoutes from "./routes/payments";
import authRoutes from "./routes/auth";
import { getLeaderboard, getPlayerStats, awardAdReward, updateScore } from "./routes/leaderboard";
import questionsRoutes from "./routes/questions.js";
import rewardsRoutes from "./routes/rewards";

export async function registerRoutes(app: Express, httpServer?: Server): Promise<Server> {
  // Register trivia routes
  app.use("/api/trivia", triviaRoutes);
  
  // Register payments routes
  app.use("/api/payments", paymentsRoutes);
  
  // Register auth routes
  app.use("/api/auth", authRoutes);
  
  // Register AI questions routes
  app.use("/api/questions", questionsRoutes);
  
  // Register rewards routes
  app.use("/api/rewards", rewardsRoutes);
  
  // Leaderboard routes
  app.get("/api/leaderboard", getLeaderboard);
  app.get("/api/player/:playerId/stats", getPlayerStats);
  
  // Scoring routes
  app.post("/api/player/score", updateScore);
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "Mirage Trivia API"
    });
  });

  // User routes (using existing storage interface)
  app.get("/api/user/:id", async (req, res) => {
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

  return httpServer || createServer(app);
}
