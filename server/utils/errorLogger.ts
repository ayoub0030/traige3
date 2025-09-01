import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error severity levels
export enum ErrorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Error categories
export enum ErrorCategory {
  DATABASE = 'DATABASE',
  API = 'API',
  AUTH = 'AUTH',
  PAYMENT = 'PAYMENT',
  MULTIPLAYER = 'MULTIPLAYER',
  AI_GENERATION = 'AI_GENERATION',
  VALIDATION = 'VALIDATION',
  SYSTEM = 'SYSTEM'
}

interface ErrorLog {
  timestamp: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  details?: any;
  stack?: string;
  userId?: number;
  sessionId?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
}

class ErrorLogger {
  private logDir: string;
  private currentLogFile: string;
  private errorStats: Map<string, number> = new Map();

  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
    this.currentLogFile = this.getLogFileName();
    this.initializeErrorStats();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return path.join(this.logDir, `error-${dateStr}.log`);
  }

  private initializeErrorStats() {
    // Load existing stats if available
    const statsFile = path.join(this.logDir, 'error-stats.json');
    if (fs.existsSync(statsFile)) {
      try {
        const stats = JSON.parse(fs.readFileSync(statsFile, 'utf-8'));
        this.errorStats = new Map(Object.entries(stats));
      } catch (error) {
        console.error('Failed to load error stats:', error);
      }
    }
  }

  private saveErrorStats() {
    const statsFile = path.join(this.logDir, 'error-stats.json');
    const stats = Object.fromEntries(this.errorStats);
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  }

  public log(error: ErrorLog) {
    // Check if we need to rotate to a new log file
    const newLogFile = this.getLogFileName();
    if (newLogFile !== this.currentLogFile) {
      this.currentLogFile = newLogFile;
    }

    // Format the log entry
    const logEntry = JSON.stringify(error) + '\n';

    // Write to file
    fs.appendFileSync(this.currentLogFile, logEntry);

    // Update statistics
    const errorKey = `${error.category}:${error.severity}`;
    this.errorStats.set(errorKey, (this.errorStats.get(errorKey) || 0) + 1);
    this.saveErrorStats();

    // Console output for development
    if (process.env.NODE_ENV !== 'production') {
      this.consoleLog(error);
    }

    // For critical errors, trigger alerts
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(error);
    }
  }

  private consoleLog(error: ErrorLog) {
    const colors = {
      [ErrorSeverity.DEBUG]: '\x1b[37m',    // White
      [ErrorSeverity.INFO]: '\x1b[36m',     // Cyan
      [ErrorSeverity.WARNING]: '\x1b[33m',  // Yellow
      [ErrorSeverity.ERROR]: '\x1b[31m',    // Red
      [ErrorSeverity.CRITICAL]: '\x1b[35m'  // Magenta
    };

    const color = colors[error.severity] || '\x1b[0m';
    const reset = '\x1b[0m';

    console.log(`${color}[${error.severity}] ${error.timestamp} - ${error.category}: ${error.message}${reset}`);
    
    if (error.details) {
      console.log('Details:', error.details);
    }
    
    if (error.stack && error.severity !== ErrorSeverity.DEBUG) {
      console.log('Stack:', error.stack);
    }
  }

  private handleCriticalError(error: ErrorLog) {
    // Create a critical error file for immediate attention
    const criticalFile = path.join(this.logDir, 'CRITICAL-ERRORS.log');
    const criticalEntry = `
================================================================================
CRITICAL ERROR DETECTED
Timestamp: ${error.timestamp}
Category: ${error.category}
Message: ${error.message}
Details: ${JSON.stringify(error.details, null, 2)}
Stack: ${error.stack || 'N/A'}
================================================================================
`;
    fs.appendFileSync(criticalFile, criticalEntry);
    
    // In production, this could trigger email/SMS alerts
    console.error('\n🚨 CRITICAL ERROR - IMMEDIATE ATTENTION REQUIRED 🚨');
  }

  public logError(
    category: ErrorCategory,
    message: string,
    error?: Error | any,
    additionalData?: any
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      severity: ErrorSeverity.ERROR,
      category,
      message,
      details: additionalData,
      stack: error?.stack || error?.toString(),
      ...this.getRequestContext()
    });
  }

  public logWarning(
    category: ErrorCategory,
    message: string,
    details?: any
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      severity: ErrorSeverity.WARNING,
      category,
      message,
      details,
      ...this.getRequestContext()
    });
  }

  public logInfo(
    category: ErrorCategory,
    message: string,
    details?: any
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      severity: ErrorSeverity.INFO,
      category,
      message,
      details,
      ...this.getRequestContext()
    });
  }

  public logCritical(
    category: ErrorCategory,
    message: string,
    error?: Error | any,
    additionalData?: any
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      severity: ErrorSeverity.CRITICAL,
      category,
      message,
      details: additionalData,
      stack: error?.stack || error?.toString(),
      ...this.getRequestContext()
    });
  }

  private getRequestContext(): Partial<ErrorLog> {
    // This would be populated from request context in middleware
    return {};
  }

  public getErrorSummary(): any {
    const summary = {
      totalErrors: 0,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      topErrors: [] as any[]
    };

    for (const [key, count] of this.errorStats.entries()) {
      const [category, severity] = key.split(':');
      
      summary.totalErrors += count;
      
      summary.byCategory[category] = (summary.byCategory[category] || 0) + count;
      summary.bySeverity[severity] = (summary.bySeverity[severity] || 0) + count;
      
      summary.topErrors.push({ category, severity, count });
    }

    summary.topErrors.sort((a, b) => b.count - a.count);
    summary.topErrors = summary.topErrors.slice(0, 10);

    return summary;
  }

  public getLogs(options: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    limit?: number;
    date?: string;
  } = {}): ErrorLog[] {
    const { severity, category, limit = 100, date } = options;
    
    const logFile = date 
      ? path.join(this.logDir, `error-${date}.log`)
      : this.currentLogFile;

    if (!fs.existsSync(logFile)) {
      return [];
    }

    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    let logs: ErrorLog[] = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean) as ErrorLog[];

    // Apply filters
    if (severity) {
      logs = logs.filter(log => log.severity === severity);
    }
    
    if (category) {
      logs = logs.filter(log => log.category === category);
    }

    // Return most recent logs first
    return logs.reverse().slice(0, limit);
  }

  public clearOldLogs(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const files = fs.readdirSync(this.logDir);
    
    for (const file of files) {
      if (file.startsWith('error-') && file.endsWith('.log')) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old log file: ${file}`);
        }
      }
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Express middleware for error logging
export function errorLoggingMiddleware(req: any, res: any, next: any) {
  // Store request context for error logging
  const context = {
    endpoint: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userId: req.session?.userId,
    sessionId: req.sessionID
  };

  // Attach context to request for use in error handlers
  req.errorContext = context;

  // Override res.status to catch error responses
  const originalStatus = res.status;
  res.status = function(code: number) {
    if (code >= 400) {
      errorLogger.logWarning(
        ErrorCategory.API,
        `HTTP ${code} response`,
        {
          ...context,
          statusCode: code,
          body: req.body,
          query: req.query
        }
      );
    }
    return originalStatus.call(this, code);
  };

  next();
}

// Global error handler for Express
export function globalErrorHandler(err: any, req: any, res: any, next: any) {
  const context = req.errorContext || {};
  
  errorLogger.logError(
    ErrorCategory.SYSTEM,
    err.message || 'Unhandled error',
    err,
    {
      ...context,
      body: req.body,
      query: req.query,
      params: req.params
    }
  );

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message,
    requestId: context.sessionId
  });
}