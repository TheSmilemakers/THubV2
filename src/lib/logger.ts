/* eslint-disable no-console */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
}

class Logger {
  private level: LogLevel;
  private prefix: string;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    this.prefix = options.prefix || '[THub]';
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const formattedMessage = `${timestamp} ${this.prefix} [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      return `${formattedMessage}\n${JSON.stringify(data, null, 2)}`;
    }
    
    return formattedMessage;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug') && process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog('error')) {
      const errorData = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(this.formatMessage('error', message, errorData));
    }
  }

  createChild(prefix: string): Logger {
    return new Logger({
      level: this.level,
      prefix: `${this.prefix} [${prefix}]`,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating custom instances
export { Logger };