import { Utils } from '../../src/utils/helpers';
import { Validator } from '../../src/utils/validator';
import { ErrorFactory, ErrorHandler } from '../../src/utils/errors';
import { TestCase, TestStep, WebsiteElement } from '../../src/types';

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = Utils.generateId();
      const id2 = Utils.generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(Utils.isValidUrl('https://example.com')).toBe(true);
      expect(Utils.isValidUrl('http://example.com')).toBe(true);
      expect(Utils.isValidUrl('https://subdomain.example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(Utils.isValidUrl('not-a-url')).toBe(false);
      expect(Utils.isValidUrl('')).toBe(false);
      expect(Utils.isValidUrl('ftp://example.com')).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filenames correctly', () => {
      expect(Utils.sanitizeFilename('test file.txt')).toBe('test_file_txt');
      expect(Utils.sanitizeFilename('test@#$%file')).toBe('test_file');
      expect(Utils.sanitizeFilename('  test  ')).toBe('test');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(Utils.formatDuration(500)).toBe('500ms');
      expect(Utils.formatDuration(1500)).toBe('1.5s');
      expect(Utils.formatDuration(65000)).toBe('1.1m');
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(Utils.calculatePercentage(25, 100)).toBe(25);
      expect(Utils.calculatePercentage(1, 3)).toBe(33.33);
      expect(Utils.calculatePercentage(0, 100)).toBe(0);
    });
  });

  describe('generateTestData', () => {
    it('should generate appropriate test data', () => {
      expect(Utils.generateTestData('email')).toBe('test@example.com');
      expect(Utils.generateTestData('password')).toBe('TestPassword123!');
      expect(Utils.generateTestData('text')).toBe('Test Input');
    });
  });

  describe('chunkArray', () => {
    it('should chunk array correctly', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chunks = Utils.chunkArray(array, 3);
      
      expect(chunks).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10]
      ]);
    });
  });

  describe('removeDuplicates', () => {
    it('should remove duplicates from array', () => {
      const array = [1, 2, 2, 3, 3, 3, 4];
      const unique = Utils.removeDuplicates(array);
      
      expect(unique).toEqual([1, 2, 3, 4]);
    });

    it('should remove duplicates using key function', () => {
      const array = [
        { id: 1, name: 'test' },
        { id: 2, name: 'test' },
        { id: 3, name: 'other' }
      ];
      const unique = Utils.removeDuplicates(array, item => item.name);
      
      expect(unique).toHaveLength(2);
    });
  });
});

describe('Validator', () => {
  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(() => Validator.validateUrl('https://example.com')).not.toThrow();
      expect(() => Validator.validateUrl('http://example.com')).not.toThrow();
    });

    it('should throw for invalid URLs', () => {
      expect(() => Validator.validateUrl('not-a-url')).toThrow();
      expect(() => Validator.validateUrl('')).toThrow();
      expect(() => Validator.validateUrl('ftp://example.com')).toThrow();
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct API key', () => {
      expect(() => Validator.validateApiKey('valid-api-key-123456789')).not.toThrow();
    });

    it('should throw for invalid API key', () => {
      expect(() => Validator.validateApiKey('')).toThrow();
      expect(() => Validator.validateApiKey('short')).toThrow();
    });
  });

  describe('validateTestCase', () => {
    const validTestCase: TestCase = {
      id: 'test-1',
      name: 'Test Case',
      description: 'Test description',
      type: 'functional',
      priority: 'high',
      steps: [
        {
          action: 'navigate',
          target: 'https://example.com',
          description: 'Navigate to page',
          timeout: 30000
        }
      ],
      expectedResult: 'Page loads',
      page: 'https://example.com'
    };

    it('should validate correct test case', () => {
      expect(() => Validator.validateTestCase(validTestCase)).not.toThrow();
    });

    it('should throw for missing required fields', () => {
      const invalidTestCase = { ...validTestCase };
      delete invalidTestCase.id;
      
      expect(() => Validator.validateTestCase(invalidTestCase)).toThrow();
    });

    it('should throw for invalid type', () => {
      const invalidTestCase = { ...validTestCase, type: 'invalid' };
      
      expect(() => Validator.validateTestCase(invalidTestCase)).toThrow();
    });
  });

  describe('validateTestStep', () => {
    const validStep: TestStep = {
      action: 'click',
      target: 'button',
      description: 'Click button',
      timeout: 5000
    };

    it('should validate correct test step', () => {
      expect(() => Validator.validateTestStep(validStep)).not.toThrow();
    });

    it('should throw for missing required fields', () => {
      const invalidStep = { ...validStep };
      delete invalidStep.action;
      
      expect(() => Validator.validateTestStep(invalidStep)).toThrow();
    });

    it('should throw for invalid action', () => {
      const invalidStep = { ...validStep, action: 'invalid' };
      
      expect(() => Validator.validateTestStep(invalidStep)).toThrow();
    });
  });

  describe('validateWebsiteElement', () => {
    const validElement: WebsiteElement = {
      type: 'button',
      selector: 'button.submit',
      text: 'Submit',
      attributes: { class: 'submit' }
    };

    it('should validate correct website element', () => {
      expect(() => Validator.validateWebsiteElement(validElement)).not.toThrow();
    });

    it('should throw for missing required fields', () => {
      const invalidElement = { ...validElement };
      delete invalidElement.type;
      
      expect(() => Validator.validateWebsiteElement(invalidElement)).toThrow();
    });

    it('should throw for invalid type', () => {
      const invalidElement = { ...validElement, type: 'invalid' };
      
      expect(() => Validator.validateWebsiteElement(invalidElement)).toThrow();
    });
  });
});

describe('ErrorFactory', () => {
  describe('missingApiKey', () => {
    it('should create correct error', () => {
      const error = ErrorFactory.missingApiKey();
      
      expect(error.name).toBe('ConfigurationError');
      expect(error.message).toContain('API key');
    });
  });

  describe('invalidUrl', () => {
    it('should create correct error', () => {
      const error = ErrorFactory.invalidUrl('invalid-url');
      
      expect(error.name).toBe('ValidationError');
      expect(error.message).toContain('Invalid URL');
    });
  });

  describe('elementNotFound', () => {
    it('should create correct error', () => {
      const error = ErrorFactory.elementNotFound('button');
      
      expect(error.name).toBe('TestExecutionError');
      expect(error.message).toContain('Element not found');
    });
  });
});

describe('ErrorHandler', () => {
  describe('handle', () => {
    it('should handle custom errors', () => {
      const customError = ErrorFactory.invalidUrl('test');
      const handled = ErrorHandler.handle(customError);
      
      expect(handled).toBe(customError);
    });

    it('should convert generic errors', () => {
      const genericError = new Error('Test error');
      const handled = ErrorHandler.handle(genericError);
      
      expect(handled.name).toBe('FagunAutomationError');
    });
  });

  describe('getErrorMessage', () => {
    it('should return user-friendly messages', () => {
      const error = ErrorFactory.missingApiKey();
      const message = ErrorHandler.getErrorMessage(error);
      
      expect(message).toContain('API key');
    });
  });

  describe('getRecoverySuggestion', () => {
    it('should return recovery suggestions', () => {
      const error = ErrorFactory.missingApiKey();
      const suggestion = ErrorHandler.getRecoverySuggestion(error);
      
      expect(suggestion).toContain('makersuite.google.com');
    });
  });
});
