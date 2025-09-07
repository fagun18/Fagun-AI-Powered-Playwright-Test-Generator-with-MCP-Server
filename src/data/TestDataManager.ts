import { TestData } from '../types';

export class TestDataManager {
  private static testDataSets: TestData[] = [
    {
      id: 'user_credentials',
      name: 'User Credentials',
      type: 'user',
      data: [
        { username: 'admin@example.com', password: 'Admin123!', role: 'admin' },
        { username: 'user@example.com', password: 'User123!', role: 'user' },
        { username: 'guest@example.com', password: 'Guest123!', role: 'guest' },
        { username: 'premium@example.com', password: 'Premium123!', role: 'premium' },
        { username: 'invalid@invalid.com', password: 'wrong', role: 'invalid' },
        { username: '', password: '', role: 'empty' },
        { username: 'test@test.com', password: 'Test123!', role: 'test' }
      ],
      validation: {
        username: { required: true, format: 'email' },
        password: { required: true, minLength: 8, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]' },
        role: { required: true, enum: ['admin', 'user', 'guest', 'premium', 'invalid', 'empty', 'test'] }
      }
    },
    {
      id: 'form_validation_data',
      name: 'Form Validation Data',
      type: 'content',
      data: [
        { field: 'email', value: 'valid@example.com', expected: 'valid' },
        { field: 'email', value: 'invalid-email', expected: 'invalid' },
        { field: 'email', value: '', expected: 'required' },
        { field: 'phone', value: '+1234567890', expected: 'valid' },
        { field: 'phone', value: '123', expected: 'invalid' },
        { field: 'phone', value: '', expected: 'required' },
        { field: 'name', value: 'John Doe', expected: 'valid' },
        { field: 'name', value: 'A', expected: 'invalid' },
        { field: 'name', value: '', expected: 'required' },
        { field: 'age', value: '25', expected: 'valid' },
        { field: 'age', value: '150', expected: 'invalid' },
        { field: 'age', value: '-5', expected: 'invalid' },
        { field: 'age', value: '', expected: 'required' }
      ],
      validation: {
        email: { format: 'email' },
        phone: { format: 'phone' },
        name: { minLength: 2, maxLength: 50 },
        age: { type: 'number', min: 0, max: 120 }
      }
    },
    {
      id: 'product_data',
      name: 'Product Data',
      type: 'product',
      data: [
        { name: 'Laptop Pro', price: 1299.99, category: 'Electronics', stock: 50 },
        { name: 'Wireless Mouse', price: 29.99, category: 'Accessories', stock: 100 },
        { name: 'Gaming Keyboard', price: 149.99, category: 'Electronics', stock: 25 },
        { name: 'Office Chair', price: 299.99, category: 'Furniture', stock: 15 },
        { name: 'Monitor 4K', price: 599.99, category: 'Electronics', stock: 30 },
        { name: 'Desk Lamp', price: 49.99, category: 'Furniture', stock: 75 },
        { name: 'USB Cable', price: 9.99, category: 'Accessories', stock: 200 },
        { name: 'Webcam HD', price: 79.99, category: 'Electronics', stock: 40 }
      ],
      validation: {
        name: { required: true, minLength: 1, maxLength: 100 },
        price: { required: true, type: 'number', min: 0 },
        category: { required: true, enum: ['Electronics', 'Accessories', 'Furniture'] },
        stock: { required: true, type: 'number', min: 0 }
      }
    },
    {
      id: 'order_data',
      name: 'Order Data',
      type: 'order',
      data: [
        { orderId: 'ORD-001', customerId: 'CUST-001', total: 1299.99, status: 'pending' },
        { orderId: 'ORD-002', customerId: 'CUST-002', total: 29.99, status: 'shipped' },
        { orderId: 'ORD-003', customerId: 'CUST-003', total: 149.99, status: 'delivered' },
        { orderId: 'ORD-004', customerId: 'CUST-004', total: 299.99, status: 'cancelled' },
        { orderId: 'ORD-005', customerId: 'CUST-005', total: 599.99, status: 'processing' }
      ],
      validation: {
        orderId: { required: true, pattern: '^ORD-\\d{3}$' },
        customerId: { required: true, pattern: '^CUST-\\d{3}$' },
        total: { required: true, type: 'number', min: 0 },
        status: { required: true, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] }
      }
    },
    {
      id: 'payment_data',
      name: 'Payment Data',
      type: 'payment',
      data: [
        { cardNumber: '4111111111111111', expiry: '12/25', cvv: '123', type: 'visa' },
        { cardNumber: '5555555555554444', expiry: '06/26', cvv: '456', type: 'mastercard' },
        { cardNumber: '378282246310005', expiry: '09/27', cvv: '789', type: 'amex' },
        { cardNumber: '6011111111111117', expiry: '03/28', cvv: '012', type: 'discover' },
        { cardNumber: '4000000000000002', expiry: '12/25', cvv: '123', type: 'declined' },
        { cardNumber: '4000000000000119', expiry: '12/25', cvv: '123', type: 'insufficient_funds' },
        { cardNumber: '4000000000000069', expiry: '12/25', cvv: '123', type: 'expired' }
      ],
      validation: {
        cardNumber: { required: true, pattern: '^\\d{13,19}$' },
        expiry: { required: true, pattern: '^(0[1-9]|1[0-2])\\/(\\d{2})$' },
        cvv: { required: true, pattern: '^\\d{3,4}$' },
        type: { required: true, enum: ['visa', 'mastercard', 'amex', 'discover', 'declined', 'insufficient_funds', 'expired'] }
      }
    },
    {
      id: 'api_test_data',
      name: 'API Test Data',
      type: 'configuration',
      data: [
        { endpoint: '/api/users', method: 'GET', expectedStatus: 200, auth: 'bearer' },
        { endpoint: '/api/users', method: 'POST', expectedStatus: 201, auth: 'bearer' },
        { endpoint: '/api/users/1', method: 'GET', expectedStatus: 200, auth: 'bearer' },
        { endpoint: '/api/users/1', method: 'PUT', expectedStatus: 200, auth: 'bearer' },
        { endpoint: '/api/users/1', method: 'DELETE', expectedStatus: 204, auth: 'bearer' },
        { endpoint: '/api/public', method: 'GET', expectedStatus: 200, auth: 'none' },
        { endpoint: '/api/protected', method: 'GET', expectedStatus: 401, auth: 'none' },
        { endpoint: '/api/rate-limit', method: 'GET', expectedStatus: 429, auth: 'bearer' }
      ],
      validation: {
        endpoint: { required: true, pattern: '^/api/' },
        method: { required: true, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
        expectedStatus: { required: true, type: 'number', min: 100, max: 599 },
        auth: { required: true, enum: ['none', 'bearer', 'basic', 'api-key'] }
      }
    },
    {
      id: 'mobile_device_data',
      name: 'Mobile Device Data',
      type: 'configuration',
      data: [
        { name: 'iPhone 12', width: 390, height: 844, pixelRatio: 3, userAgent: 'iPhone' },
        { name: 'iPhone 12 Pro', width: 390, height: 844, pixelRatio: 3, userAgent: 'iPhone' },
        { name: 'Samsung Galaxy S21', width: 384, height: 854, pixelRatio: 3, userAgent: 'Android' },
        { name: 'Samsung Galaxy S21 Ultra', width: 384, height: 854, pixelRatio: 3, userAgent: 'Android' },
        { name: 'iPad', width: 768, height: 1024, pixelRatio: 2, userAgent: 'iPad' },
        { name: 'iPad Pro', width: 1024, height: 1366, pixelRatio: 2, userAgent: 'iPad' },
        { name: 'Google Pixel 5', width: 393, height: 851, pixelRatio: 2.75, userAgent: 'Android' },
        { name: 'OnePlus 9', width: 412, height: 915, pixelRatio: 3.5, userAgent: 'Android' }
      ],
      validation: {
        name: { required: true, minLength: 1 },
        width: { required: true, type: 'number', min: 320, max: 1920 },
        height: { required: true, type: 'number', min: 568, max: 1080 },
        pixelRatio: { required: true, type: 'number', min: 1, max: 4 },
        userAgent: { required: true, enum: ['iPhone', 'Android', 'iPad'] }
      }
    },
    {
      id: 'browser_data',
      name: 'Browser Data',
      type: 'configuration',
      data: [
        { name: 'Chrome', version: '120', platform: 'Windows', headless: true },
        { name: 'Chrome', version: '120', platform: 'macOS', headless: true },
        { name: 'Chrome', version: '120', platform: 'Linux', headless: true },
        { name: 'Firefox', version: '121', platform: 'Windows', headless: true },
        { name: 'Firefox', version: '121', platform: 'macOS', headless: true },
        { name: 'Safari', version: '17', platform: 'macOS', headless: false },
        { name: 'Edge', version: '120', platform: 'Windows', headless: true },
        { name: 'WebKit', version: '17', platform: 'iOS', headless: false }
      ],
      validation: {
        name: { required: true, enum: ['Chrome', 'Firefox', 'Safari', 'Edge', 'WebKit'] },
        version: { required: true, pattern: '^\\d+$' },
        platform: { required: true, enum: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'] },
        headless: { required: true, type: 'boolean' }
      }
    },
    {
      id: 'performance_data',
      name: 'Performance Test Data',
      type: 'configuration',
      data: [
        { metric: 'loadTime', threshold: 3000, unit: 'ms', priority: 'high' },
        { metric: 'firstContentfulPaint', threshold: 1500, unit: 'ms', priority: 'high' },
        { metric: 'largestContentfulPaint', threshold: 2500, unit: 'ms', priority: 'high' },
        { metric: 'firstInputDelay', threshold: 100, unit: 'ms', priority: 'medium' },
        { metric: 'cumulativeLayoutShift', threshold: 0.1, unit: 'score', priority: 'medium' },
        { metric: 'totalBlockingTime', threshold: 300, unit: 'ms', priority: 'medium' },
        { metric: 'speedIndex', threshold: 3000, unit: 'ms', priority: 'low' },
        { metric: 'timeToInteractive', threshold: 5000, unit: 'ms', priority: 'low' }
      ],
      validation: {
        metric: { required: true, enum: ['loadTime', 'firstContentfulPaint', 'largestContentfulPaint', 'firstInputDelay', 'cumulativeLayoutShift', 'totalBlockingTime', 'speedIndex', 'timeToInteractive'] },
        threshold: { required: true, type: 'number', min: 0 },
        unit: { required: true, enum: ['ms', 'score', 'bytes'] },
        priority: { required: true, enum: ['high', 'medium', 'low'] }
      }
    },
    {
      id: 'security_payloads',
      name: 'Security Test Payloads',
      type: 'content',
      data: [
        { type: 'xss', payload: '<script>alert("XSS")</script>', expected: 'blocked' },
        { type: 'xss', payload: 'javascript:alert("XSS")', expected: 'blocked' },
        { type: 'xss', payload: '<img src=x onerror=alert("XSS")>', expected: 'blocked' },
        { type: 'sql_injection', payload: "'; DROP TABLE users; --", expected: 'blocked' },
        { type: 'sql_injection', payload: "' OR '1'='1", expected: 'blocked' },
        { type: 'sql_injection', payload: "1' UNION SELECT * FROM users--", expected: 'blocked' },
        { type: 'path_traversal', payload: '../../../etc/passwd', expected: 'blocked' },
        { type: 'path_traversal', payload: '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts', expected: 'blocked' },
        { type: 'command_injection', payload: '; ls -la', expected: 'blocked' },
        { type: 'command_injection', payload: '| whoami', expected: 'blocked' },
        { type: 'ldap_injection', payload: '*)(uid=*))(|(uid=*', expected: 'blocked' },
        { type: 'no_sql_injection', payload: '{"$ne": null}', expected: 'blocked' }
      ],
      validation: {
        type: { required: true, enum: ['xss', 'sql_injection', 'path_traversal', 'command_injection', 'ldap_injection', 'no_sql_injection'] },
        payload: { required: true, minLength: 1 },
        expected: { required: true, enum: ['blocked', 'allowed', 'sanitized'] }
      }
    }
  ];

  static getTestData(dataId: string): TestData | undefined {
    return this.testDataSets.find(data => data.id === dataId);
  }

  static getAllTestData(): TestData[] {
    return this.testDataSets;
  }

  static getTestDataByType(type: string): TestData[] {
    return this.testDataSets.filter(data => data.type === type);
  }

  static getRandomTestData(dataId: string): any {
    const testData = this.getTestData(dataId);
    if (!testData || !testData.data.length) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * testData.data.length);
    return testData.data[randomIndex];
  }

  static getTestDataByFilter(dataId: string, filter: (item: any) => boolean): any[] {
    const testData = this.getTestData(dataId);
    if (!testData) {
      return [];
    }
    
    return testData.data.filter(filter);
  }

  static validateTestData(dataId: string, data: any): { valid: boolean; errors: string[] } {
    const testData = this.getTestData(dataId);
    if (!testData || !testData.validation) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    const validation = testData.validation;

    Object.keys(validation).forEach(field => {
      const rules = validation[field];
      const value = data[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rules.type === 'number' && typeof value !== 'number') {
          errors.push(`${field} must be a number`);
        }
        
        if (rules.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${field} must be a boolean`);
        }

        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters long`);
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
        }

        if (rules.min && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }

        if (rules.max && value > rules.max) {
          errors.push(`${field} must be no more than ${rules.max}`);
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
        }

        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
          errors.push(`${field} format is invalid`);
        }

        if (rules.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${field} must be a valid email address`);
        }

        if (rules.format === 'phone' && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          errors.push(`${field} must be a valid phone number`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }

  static addTestData(testData: TestData): void {
    const existingIndex = this.testDataSets.findIndex(data => data.id === testData.id);
    if (existingIndex >= 0) {
      this.testDataSets[existingIndex] = testData;
    } else {
      this.testDataSets.push(testData);
    }
  }

  static removeTestData(dataId: string): boolean {
    const index = this.testDataSets.findIndex(data => data.id === dataId);
    if (index >= 0) {
      this.testDataSets.splice(index, 1);
      return true;
    }
    return false;
  }
}
