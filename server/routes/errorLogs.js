import express from 'express';
import { errorLogger, ErrorCategory, ErrorSeverity } from '../utils/errorLogger.js';

const router = express.Router();

// Get error summary dashboard
router.get('/summary', async (req, res) => {
  try {
    const summary = errorLogger.getErrorSummary();
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error fetching error summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error summary'
    });
  }
});

// Get error logs with filters
router.get('/logs', async (req, res) => {
  try {
    const { severity, category, limit = 100, date } = req.query;
    
    const logs = errorLogger.getLogs({
      severity: severity,
      category: category,
      limit: parseInt(limit),
      date: date
    });

    res.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs'
    });
  }
});

// Log client-side errors
router.post('/client-error', async (req, res) => {
  try {
    const { 
      message, 
      stack, 
      category = 'CLIENT', 
      severity = 'ERROR',
      url,
      userAgent,
      details 
    } = req.body;

    errorLogger.log({
      timestamp: new Date().toISOString(),
      severity: severity,
      category: category,
      message: `[CLIENT] ${message}`,
      details: {
        url,
        userAgent,
        ...details
      },
      stack,
      userId: req.session?.userId,
      sessionId: req.sessionID
    });

    res.json({
      success: true,
      message: 'Error logged successfully'
    });
  } catch (error) {
    console.error('Error logging client error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log error'
    });
  }
});

// Clear old logs (admin only)
router.delete('/clear-old', async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    
    // In production, add admin authentication check here
    errorLogger.clearOldLogs(parseInt(daysToKeep));
    
    res.json({
      success: true,
      message: `Cleared logs older than ${daysToKeep} days`
    });
  } catch (error) {
    console.error('Error clearing old logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear old logs'
    });
  }
});

// Get error statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = errorLogger.getErrorSummary();
    
    // Add time-based statistics
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = errorLogger.getLogs({ date: today });
    
    const hourlyStats = {};
    todayLogs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        ...stats,
        today: {
          total: todayLogs.length,
          byHour: hourlyStats
        }
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;