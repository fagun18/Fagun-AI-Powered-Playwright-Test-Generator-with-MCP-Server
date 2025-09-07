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
  type: 'functional' | 'ui' | 'accessibility' | 'performance' | 'security' | 'integration' | 'api' | 'cross-browser' | 'visual-regression' | 'e2e-workflow' | 'edge-case' | 'mobile' | 'data-driven' | 'stress' | 'load' | 'usability' | 'compatibility' | 'content-quality' | 'seo' | 'grammar-check' | 'url-testing' | 'button-testing' | 'form-testing';
  priority: 'high' | 'medium' | 'low';
  steps: TestStep[];
  expectedResult: string;
  page: string;
  element?: WebsiteElement;
  data?: Record<string, any>;
  tags?: string[];
  category?: string;
  browser?: string[];
  device?: string[];
  viewport?: { width: number; height: number };
  testData?: any[];
  preconditions?: string[];
  postconditions?: string[];
}

export interface TestStep {
  action: 'click' | 'type' | 'select' | 'hover' | 'scroll' | 'wait' | 'assert' | 'navigate' | 'api-call' | 'screenshot' | 'drag' | 'drop' | 'keyboard' | 'mouse' | 'file-upload' | 'download' | 'clear' | 'focus' | 'blur' | 'double-click' | 'right-click' | 'swipe' | 'pinch' | 'rotate' | 'shake' | 'network-throttle' | 'emulate-device' | 'set-cookie' | 'clear-cookies' | 'local-storage' | 'session-storage' | 'geolocation' | 'permissions' | 'notification' | 'push' | 'pop' | 'back' | 'forward' | 'refresh' | 'reload' | 'close' | 'minimize' | 'maximize' | 'fullscreen' | 'exit-fullscreen';
  target?: string;
  value?: string;
  assertion?: string;
  timeout?: number;
  description: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number;
  expectedResponse?: any;
  retries?: number;
  delay?: number;
  coordinates?: { x: number; y: number };
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  speed?: number;
  key?: string;
  modifier?: 'ctrl' | 'alt' | 'shift' | 'meta';
  filePath?: string;
  selector?: string;
  attribute?: string;
  text?: string;
  regex?: string;
  threshold?: number;
  device?: string;
  userAgent?: string;
  viewport?: { width: number; height: number };
  network?: 'slow-3g' | 'fast-3g' | '4g' | 'offline';
  cookies?: Array<{ name: string; value: string; domain?: string; path?: string; expires?: number; httpOnly?: boolean; secure?: boolean; sameSite?: 'Strict' | 'Lax' | 'None' }>;
  storage?: Record<string, any>;
  location?: { latitude: number; longitude: number; accuracy?: number };
  permissions?: string[];
  notification?: { title: string; body: string; icon?: string };
}

export interface TestResult {
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error' | 'pending';
  duration: number;
  error?: string;
  screenshot?: string;
  video?: string;
  logs: string[];
  timestamp: Date | string;
  httpErrors?: { url: string; status: number }[];
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  website: string;
  testCases: TestCase[];
  results: TestResult[];
  createdAt: Date | string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  analysis?: WebsiteAnalysis;
  suggestions?: Array<{
    type: string;
    name: string;
    description: string;
    priority: string;
    implementation: string;
  }>;
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
  apis?: ApiEndpoint[];
  userFlows?: UserFlow[];
  criticalPaths?: CriticalPath[];
  mobileCompatibility?: MobileCompatibility;
  performanceMetrics?: PerformanceMetrics;
  securityVulnerabilities?: SecurityVulnerability[];
}

export interface ApiEndpoint {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  parameters?: Record<string, any>;
  headers?: Record<string, string>;
  response?: any;
  statusCode?: number;
  authentication?: 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth';
  rateLimit?: { requests: number; period: string };
}

export interface UserFlow {
  id: string;
  name: string;
  description: string;
  steps: UserFlowStep[];
  priority: 'high' | 'medium' | 'low';
  frequency: 'daily' | 'weekly' | 'monthly' | 'rare';
  userType: 'guest' | 'registered' | 'admin' | 'premium';
}

export interface UserFlowStep {
  action: string;
  page: string;
  element?: string;
  data?: any;
  expectedResult: string;
}

export interface CriticalPath {
  id: string;
  name: string;
  description: string;
  pages: string[];
  businessImpact: 'high' | 'medium' | 'low';
  userImpact: 'high' | 'medium' | 'low';
  frequency: number;
}

export interface MobileCompatibility {
  responsive: boolean;
  touchFriendly: boolean;
  mobileNavigation: boolean;
  mobileForms: boolean;
  mobilePerformance: number;
  deviceSupport: string[];
}

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  speedIndex: number;
  timeToInteractive: number;
}

export interface SecurityVulnerability {
  type: 'xss' | 'csrf' | 'sql-injection' | 'insecure-headers' | 'mixed-content' | 'weak-ssl' | 'exposed-data';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedPages: string[];
  recommendation: string;
}

export interface TestTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  template: TestCase;
  variables: string[];
  tags: string[];
}

export interface TestData {
  id: string;
  name: string;
  type: 'user' | 'product' | 'order' | 'payment' | 'content' | 'configuration';
  data: Record<string, any>[];
  validation?: Record<string, any>;
}

export interface BrowserConfig {
  name: string;
  version: string;
  platform: string;
  headless: boolean;
  viewport: { width: number; height: number };
  userAgent?: string;
  capabilities?: Record<string, any>;
}

export interface DeviceConfig {
  name: string;
  type: 'mobile' | 'tablet' | 'desktop';
  viewport: { width: number; height: number };
  pixelRatio: number;
  userAgent: string;
  touch: boolean;
  orientation: 'portrait' | 'landscape';
}

export interface TestEnvironment {
  name: string;
  baseUrl: string;
  apiUrl?: string;
  database?: string;
  externalServices?: string[];
  configuration: Record<string, any>;
}

