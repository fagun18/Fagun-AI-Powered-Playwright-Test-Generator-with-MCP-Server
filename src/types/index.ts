export interface WebsiteElement {
  type: 'button' | 'input' | 'link' | 'form' | 'select' | 'textarea' | 'image' | 'navigation';
  selector: string;
  text?: string;
  placeholder?: string;
  href?: string;
  action?: string;
  method?: string;
  required?: boolean;
  inputType?: string;
  options?: string[];
  xpath?: string;
  attributes?: Record<string, string>;
}

export interface WebsitePage {
  url: string;
  title: string;
  elements: WebsiteElement[];
  forms: WebsiteElement[];
  links: WebsiteElement[];
  images: WebsiteElement[];
  meta: {
    description?: string;
    keywords?: string;
    viewport?: string;
  };
  performance?: {
    loadTime: number;
    domSize: number;
    resourceCount: number;
  };
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'functional' | 'ui' | 'accessibility' | 'performance' | 'security' | 'integration';
  priority: 'high' | 'medium' | 'low';
  steps: TestStep[];
  expectedResult: string;
  page: string;
  element?: WebsiteElement;
  data?: Record<string, any>;
}

export interface TestStep {
  action: 'click' | 'type' | 'select' | 'hover' | 'scroll' | 'wait' | 'assert' | 'navigate';
  target?: string;
  value?: string;
  assertion?: string;
  timeout?: number;
  description: string;
}

export interface TestResult {
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error' | 'pending';
  duration: number;
  error?: string;
  screenshot?: string;
  video?: string;
  logs: string[];
  timestamp: Date;
  httpErrors?: { url: string; status: number }[];
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  website: string;
  testCases: TestCase[];
  results: TestResult[];
  createdAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  analysis?: WebsiteAnalysis;
}

export interface LoginConfig {
  required: boolean;
  loginUrl?: string;
  username?: string;
  password?: string;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
}

export interface WebsiteAnalysis {
  baseUrl: string;
  pages: WebsitePage[];
  sitemap: string[];
  technologies: string[];
  forms: WebsiteElement[];
  navigation: WebsiteElement[];
  totalElements: number;
  analysisDate: Date;
  brokenLinks?: { url: string; status: number }[];
}

