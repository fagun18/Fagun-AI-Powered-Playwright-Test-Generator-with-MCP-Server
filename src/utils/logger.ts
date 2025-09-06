import * as fs from 'fs-extra';
import * as path from 'path';
import config from '../config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logFile: string;
  private isInitialized: boolean = false;

  private constructor() {
    this.logLevel = LogLevel.INFO;
    this.logFile = path.join(config.output.logsDir, `fagun-automation-${new Date().toISOString().split('T')[0]}.log`);
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await fs.ensureDir(config.output.logsDir);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  private async writeToFile(message: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await fs.appendFile(this.logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  public debug(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const formattedMessage = this.formatMessage('DEBUG', message, meta);
    console.debug(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  public info(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const formattedMessage = this.formatMessage('INFO', message, meta);
    console.info(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  public warn(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const formattedMessage = this.formatMessage('WARN', message, meta);
    console.warn(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  public error(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const formattedMessage = this.formatMessage('ERROR', message, meta);
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  public async logTestResult(testId: string, status: string, duration: number, error?: string): Promise<void> {
    const message = `Test ${testId} ${status} in ${duration}ms`;
    const meta = { testId, status, duration, error };
    
    if (status === 'passed') {
      this.info(message, meta);
    } else if (status === 'failed') {
      this.error(message, meta);
    } else {
      this.warn(message, meta);
    }
  }

  public async logTestSuiteStart(suiteId: string, testCount: number): Promise<void> {
    this.info(`Starting test suite ${suiteId} with ${testCount} test cases`);
  }

  public async logTestSuiteEnd(suiteId: string, results: any): Promise<void> {
    const { total, passed, failed, skipped } = results;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    this.info(`Test suite ${suiteId} completed: ${passed}/${total} passed (${passRate}%)`, {
      total,
      passed,
      failed,
      skipped,
      passRate: parseFloat(passRate)
    });
  }

  public async logWebsiteAnalysis(url: string, pageCount: number, elementCount: number): Promise<void> {
    this.info(`Website analysis completed for ${url}: ${pageCount} pages, ${elementCount} elements`);
  }

  public async logAITestGeneration(testCount: number): Promise<void> {
    this.info(`AI generated ${testCount} test cases`);
  }

  public async logError(error: Error, context?: string): Promise<void> {
    const message = context ? `${context}: ${error.message}` : error.message;
    this.error(message, {
      name: error.name,
      stack: error.stack,
      context
    });
  }

  public getLogFile(): string {
    return this.logFile;
  }

  public async clearLogs(): Promise<void> {
    if (await fs.pathExists(this.logFile)) {
      await fs.remove(this.logFile);
    }
  }

  public async getLogs(limit?: number): Promise<string[]> {
    if (!await fs.pathExists(this.logFile)) {
      return [];
    }

    const content = await fs.readFile(this.logFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (limit) {
      return lines.slice(-limit);
    }
    
    return lines;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
