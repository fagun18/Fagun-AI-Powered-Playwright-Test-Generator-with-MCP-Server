import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs-extra';
import * as path from 'path';

export class Utils {
  /**
   * Generate a unique ID
   */
  static generateId(): string {
    return uuidv4();
  }

  /**
   * Generate a test suite ID
   */
  static generateTestSuiteId(): string {
    return `test_suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a test case ID
   */
  static generateTestCaseId(type: string, index: number): string {
    return `${type}_${index}_${Date.now()}`;
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize filename for safe file system usage
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  /**
   * Create directory if it doesn't exist
   */
  static async ensureDir(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  /**
   * Write JSON file with pretty formatting
   */
  static async writeJsonFile(filePath: string, data: any): Promise<void> {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, { spaces: 2 });
  }

  /**
   * Read JSON file
   */
  static async readJsonFile<T>(filePath: string): Promise<T> {
    return await fs.readJson(filePath);
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current timestamp
   */
  static getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Format duration in milliseconds to human readable format
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      return `${(ms / 60000).toFixed(1)}m`;
    }
  }

  /**
   * Calculate percentage
   */
  static calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Sleep for specified milliseconds
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Extract domain from URL
   */
  static extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  /**
   * Normalize URL
   */
  static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      return url;
    }
  }

  /**
   * Check if URL is internal (same domain)
   */
  static isInternalUrl(url: string, baseUrl: string): boolean {
    try {
      const urlObj = new URL(url);
      const baseObj = new URL(baseUrl);
      return urlObj.origin === baseObj.origin;
    } catch {
      return false;
    }
  }

  /**
   * Generate test data based on input type
   */
  static generateTestData(inputType: string): string {
    const testDataMap: Record<string, string> = {
      'email': 'test@example.com',
      'password': 'TestPassword123!',
      'text': 'Test Input',
      'number': '123',
      'tel': '+1234567890',
      'url': 'https://example.com',
      'date': '2024-01-01',
      'time': '12:00',
      'datetime-local': '2024-01-01T12:00',
      'search': 'test search',
      'color': '#ff0000',
      'range': '50',
      'file': 'test.txt',
      'hidden': 'hidden_value'
    };

    return testDataMap[inputType] || 'Test Input';
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Generate random string
   */
  static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Deep clone object
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Merge objects deeply
   */
  static deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Remove duplicates from array
   */
  static removeDuplicates<T>(array: T[], keyFn?: (item: T) => any): T[] {
    if (!keyFn) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Group array by key
   */
  static groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Sort array by key
   */
  static sortBy<T>(array: T[], keyFn: (item: T) => any, direction: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = keyFn(a);
      const bVal = keyFn(b);
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Filter array by condition
   */
  static filterBy<T>(array: T[], condition: (item: T) => boolean): T[] {
    return array.filter(condition);
  }

  /**
   * Map array with index
   */
  static mapWithIndex<T, U>(array: T[], mapFn: (item: T, index: number) => U): U[] {
    return array.map(mapFn);
  }

  /**
   * Find item in array by condition
   */
  static findWhere<T>(array: T[], condition: (item: T) => boolean): T | undefined {
    return array.find(condition);
  }

  /**
   * Check if all items in array satisfy condition
   */
  static all<T>(array: T[], condition: (item: T) => boolean): boolean {
    return array.every(condition);
  }

  /**
   * Check if any item in array satisfies condition
   */
  static any<T>(array: T[], condition: (item: T) => boolean): boolean {
    return array.some(condition);
  }

  /**
   * Count items in array that satisfy condition
   */
  static count<T>(array: T[], condition: (item: T) => boolean): number {
    return array.filter(condition).length;
  }

  /**
   * Get unique values from array
   */
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  /**
   * Flatten nested arrays
   */
  static flatten<T>(array: (T | T[])[]): T[] {
    return array.reduce((flat: T[], item: T | T[]) => {
      return flat.concat(Array.isArray(item) ? this.flatten(item) : item);
    }, [] as T[]);
  }

  /**
   * Create range of numbers
   */
  static range(start: number, end: number, step: number = 1): number[] {
    const result: number[] = [];
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
    return result;
  }

  /**
   * Debounce function
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
