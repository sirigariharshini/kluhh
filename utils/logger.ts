// backend/utils/logger.ts
// Structured logging system

enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  requestId?: string;
  error?: string;
}

class Logger {
  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry, null, 2);
  }

  private log(level: LogLevel, message: string, data?: any, userId?: string, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userId,
      error: error?.message,
    };

    const formatted = this.formatLog(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.log(formatted);
        break;
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(formatted);
        }
        break;
    }
  }

  error(message: string, error?: Error, userId?: string) {
    this.log(LogLevel.ERROR, message, { stack: error?.stack }, userId, error);
  }

  warn(message: string, data?: any, userId?: string) {
    this.log(LogLevel.WARN, message, data, userId);
  }

  info(message: string, data?: any, userId?: string) {
    this.log(LogLevel.INFO, message, data, userId);
  }

  debug(message: string, data?: any, userId?: string) {
    this.log(LogLevel.DEBUG, message, data, userId);
  }
}

export const logger = new Logger();
