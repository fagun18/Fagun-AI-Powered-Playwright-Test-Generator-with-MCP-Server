import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { WebsiteAnalysis, WebsitePage, WebsiteElement } from '../types';
import config from '../config';

export class WebsiteAnalyzer {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private visitedUrls: Set<string> = new Set();
  private analysis: WebsiteAnalysis | null = null;

  constructor() {
    this.visitedUrls = new Set();
  }

  async analyzeWebsite(baseUrl: string): Promise<WebsiteAnalysis> {
    console.log(`🔍 Starting analysis of website: ${baseUrl}`);
    
    this.browser = await chromium.launch({ 
      headless: config.playwright.headless,
      timeout: config.playwright.timeout 
    });
    this.context = await this.browser.newContext({
      userAgent: config.playwright.userAgent,
      viewport: config.playwright.viewport,
      ignoreHTTPSErrors: true,
    });
    this.context.setDefaultNavigationTimeout(config.playwright.timeout);
    // Speed up crawling by skipping heavy resources
    await this.context.route('**/*', (route) => {
      const r = route.request();
      const type = r.resourceType();
      if (type === 'image' || type === 'media' || type === 'font' || type === 'video') {
        return route.abort();
      }
      return route.continue();
    });

    try {
      this.analysis = {
        baseUrl,
        pages: [],
        sitemap: [],
        technologies: [],
        forms: [],
        navigation: [],
        totalElements: 0,
        analysisDate: new Date(),
        brokenLinks: [],
      };

      // Try to seed from sitemap, then crawl
      const seeds = await this.fetchSitemapUrls(baseUrl);
      const initialSeeds = [baseUrl, ...seeds].filter(Boolean);
      for (const seed of initialSeeds) {
        if (this.analysis!.pages.length >= config.analysis.maxPages) break;
        await this.crawlWebsite(seed, 0);
      }
      
      // Analyze technologies and performance
      await this.analyzeTechnologies();
      
      console.log(`✅ Analysis completed. Found ${this.analysis.pages.length} pages and ${this.analysis.totalElements} elements.`);
      
      return this.analysis;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private async crawlWebsite(url: string, depth: number): Promise<void> {
    if (depth > config.analysis.maxDepth || this.visitedUrls.has(url) || this.analysis!.pages.length >= config.analysis.maxPages) {
      return;
    }

    // Skip obvious non-navigable or fragment-only URLs
    if (url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      return;
    }

    this.visitedUrls.add(url);
    console.log(`📄 Analyzing page: ${url} (depth: ${depth})`);

    const page = await this.context!.newPage();
    
    try {
      await this.navigateWithRetry(page, url);

      const pageAnalysis = await this.analyzePage(page, url);
      this.analysis!.pages.push(pageAnalysis);
      this.analysis!.sitemap.push(url);
      this.analysis!.totalElements += pageAnalysis.elements.length;

      // Extract and follow internal links
      const internalLinks = await this.extractInternalLinks(page, this.analysis!.baseUrl);
      // Check for broken links on this page quickly (HEAD requests)
      await this.checkLinksForErrors(internalLinks);
      
      for (const link of internalLinks) {
        if (!this.visitedUrls.has(link)) {
          await this.crawlWebsite(link, depth + 1);
          // Add delay to be respectful
          await new Promise(resolve => setTimeout(resolve, config.analysis.crawlDelay));
        }
      }

    } catch (error) {
      console.error(`❌ Error analyzing page ${url}:`, error);
    } finally {
      await page.close();
    }
  }

  private async analyzePage(page: Page, url: string): Promise<WebsitePage> {
    const title = await page.title();
    
    // Extract all interactive elements
    const elements = await this.extractElements(page);
    const forms = elements.filter(el => el.type === 'form');
    const links = elements.filter(el => el.type === 'link');
    const images = elements.filter(el => el.type === 'image');

    // Extract meta information
    const meta = await this.extractMetaInformation(page);

    // Measure performance
    const performance = await this.measurePerformance(page);

    return {
      url,
      title,
      elements,
      forms,
      links,
      images,
      meta,
      performance,
    };
  }

  private async extractElements(page: Page): Promise<WebsiteElement[]> {
    const elements: WebsiteElement[] = [];

    // Extract buttons
    const buttons = await page.$$eval('button, input[type="button"], input[type="submit"], input[type="reset"]', 
      (elements: any[]) => elements.map((el: any, index: number) => ({
        type: 'button' as const,
        selector: `button:nth-of-type(${index + 1}), input[type="button"]:nth-of-type(${index + 1}), input[type="submit"]:nth-of-type(${index + 1}), input[type="reset"]:nth-of-type(${index + 1})`,
        text: el.textContent?.trim() || '',
        attributes: Object.fromEntries(Array.from(el.attributes).map((attr: any) => [attr.name, attr.value])),
      }))
    );
    elements.push(...buttons);

    // Extract input fields
    const inputs = await page.$$eval('input:not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select', 
      (elements: any[]) => elements.map((el: any, index: number) => ({
        type: (el.tagName.toLowerCase() === 'select' ? 'select' : 
              el.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'input') as 'input' | 'select' | 'textarea',
        selector: `${el.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
        placeholder: el.getAttribute('placeholder') || '',
        required: el.hasAttribute('required'),
        inputType: el.getAttribute('type') || 'text',
        options: el.tagName.toLowerCase() === 'select' ? 
          Array.from(el.querySelectorAll('option')).map((opt: any) => opt.textContent?.trim() || '') : [],
        attributes: Object.fromEntries(Array.from(el.attributes).map((attr: any) => [attr.name, attr.value])),
      }))
    );
    elements.push(...inputs);

    // Extract forms
    const forms = await page.$$eval('form', 
      (elements: any[]) => elements.map((el: any, index: number) => ({
        type: 'form' as const,
        selector: `form:nth-of-type(${index + 1})`,
        action: el.getAttribute('action') || '',
        method: el.getAttribute('method') || 'get',
        attributes: Object.fromEntries(Array.from(el.attributes).map((attr: any) => [attr.name, attr.value])),
      }))
    );
    elements.push(...forms);

    // Extract links
    const links = await page.$$eval('a[href]', 
      (elements: any[]) => elements.map((el: any, index: number) => ({
        type: 'link' as const,
        selector: `a:nth-of-type(${index + 1})`,
        text: el.textContent?.trim() || '',
        href: el.getAttribute('href') || '',
        attributes: Object.fromEntries(Array.from(el.attributes).map((attr: any) => [attr.name, attr.value])),
      }))
    );
    elements.push(...links);

    // Extract images
    const images = await page.$$eval('img', 
      (elements: any[]) => elements.map((el: any, index: number) => ({
        type: 'image' as const,
        selector: `img:nth-of-type(${index + 1})`,
        attributes: Object.fromEntries(Array.from(el.attributes).map((attr: any) => [attr.name, attr.value])),
      }))
    );
    elements.push(...images);

    // Extract navigation elements
    const navigation = await page.$$eval('nav, .nav, .navigation, .menu, .navbar', 
      (elements: any[]) => elements.map((el: any, index: number) => ({
        type: 'navigation' as const,
        selector: `nav:nth-of-type(${index + 1}), .nav:nth-of-type(${index + 1}), .navigation:nth-of-type(${index + 1}), .menu:nth-of-type(${index + 1}), .navbar:nth-of-type(${index + 1})`,
        text: el.textContent?.trim() || '',
        attributes: Object.fromEntries(Array.from(el.attributes).map((attr: any) => [attr.name, attr.value])),
      }))
    );
    elements.push(...navigation);

    return elements;
  }

  private async extractInternalLinks(page: Page, baseUrl: string): Promise<string[]> {
    const links = await page.$$eval('a[href]', (elements: any[], base: string) => {
      const baseUrl = new URL(base);
      return elements
        .map((el: any) => el.getAttribute('href'))
        .filter((href: string | null) => href)
        .map((href: string) => {
          try {
            const url = new URL(href, base);
            return url.href.split('#')[0];
          } catch {
            return null;
          }
        })
        .filter((url: string | null) => url && url.startsWith(baseUrl.origin))
        .filter((url: string | null) => url && !url.startsWith('javascript:') && !url.startsWith('mailto:') && !url.startsWith('tel:'))
        .filter((url: string | null) => url !== baseUrl.href) as string[];
    }, baseUrl);

    // Remove duplicates and cap per page to avoid long crawls on slow sites
    return [...new Set(links)].slice(0, 20);
  }

  private async checkLinksForErrors(urls: string[]): Promise<void> {
    if (!this.analysis) return;
    const unique = Array.from(new Set(urls)).slice(0, 50); // cap per page
    for (const url of unique) {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (!res.ok) {
          this.analysis.brokenLinks!.push({ url, status: res.status });
        }
      } catch {
        this.analysis.brokenLinks!.push({ url, status: 0 });
      }
    }
  }

  private async extractMetaInformation(page: Page): Promise<WebsitePage['meta']> {
    return await page.evaluate(() => {
      const meta: any = {};
      
      const description = document.querySelector('meta[name="description"]');
      if (description) meta.description = description.getAttribute('content');
      
      const keywords = document.querySelector('meta[name="keywords"]');
      if (keywords) meta.keywords = keywords.getAttribute('content');
      
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) meta.viewport = viewport.getAttribute('content');
      
      return meta;
    });
  }

  private async measurePerformance(page: Page): Promise<WebsitePage['performance']> {
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domSize: document.querySelectorAll('*').length,
        resourceCount: performance.getEntriesByType('resource').length,
      };
    });

    return performanceMetrics;
  }

  private async analyzeTechnologies(): Promise<void> {
    if (!this.analysis || this.analysis.pages.length === 0) return;

    const page = await this.context!.newPage();
    
    try {
      await this.navigateWithRetry(page, this.analysis.baseUrl);
      
      const technologies = await page.evaluate(() => {
        const techs: string[] = [];
        
        // Check for common frameworks and libraries
        if ((window as any).jQuery) techs.push('jQuery');
        if ((window as any).React) techs.push('React');
        if ((window as any).Vue) techs.push('Vue.js');
        if ((window as any).Angular) techs.push('Angular');
        if ((window as any).angular) techs.push('AngularJS');
        
        // Check for CSS frameworks
        const body = document.body;
        if (body.classList.contains('bootstrap') || document.querySelector('[class*="bootstrap"]')) {
          techs.push('Bootstrap');
        }
        if (body.classList.contains('foundation') || document.querySelector('[class*="foundation"]')) {
          techs.push('Foundation');
        }
        if (body.classList.contains('materialize') || document.querySelector('[class*="materialize"]')) {
          techs.push('Materialize');
        }
        
        // Check for analytics
        if (document.querySelector('script[src*="google-analytics"]') || 
            document.querySelector('script[src*="gtag"]') ||
            (window as any).gtag) {
          techs.push('Google Analytics');
        }
        
        return techs;
      });
      
      this.analysis.technologies = technologies;
      
    } catch (error) {
      console.error('Error analyzing technologies:', error);
    } finally {
      await page.close();
    }
  }

  private async fetchSitemapUrls(baseUrl: string): Promise<string[]> {
    try {
      const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
      const res = await fetch(sitemapUrl, { method: 'GET' });
      if (!res.ok) return [];
      const xml = await res.text();
      const matches = Array.from(xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)).map(m => m[1]);
      const unique = Array.from(new Set(matches));
      return unique.slice(0, Math.max(10, Math.min(30, config.analysis.maxPages)));
    } catch {
      return [];
    }
  }

  private async navigateWithRetry(page: Page, url: string): Promise<void> {
    const attempts = [
      { waitUntil: 'domcontentloaded' as const, timeout: Math.min(config.playwright.timeout, 45000) },
      { waitUntil: 'commit' as const, timeout: Math.min(config.playwright.timeout, 45000) },
      { waitUntil: 'load' as const, timeout: Math.min(config.playwright.timeout, 45000) },
    ];
    let lastError: any = null;
    for (let i = 0; i < attempts.length; i++) {
      try {
        await page.goto(url, { waitUntil: attempts[i].waitUntil, timeout: attempts[i].timeout });
        // Give the page a brief moment to settle
        await page.waitForTimeout(500);
        try { await page.waitForLoadState('domcontentloaded', { timeout: 5000 }); } catch {}
        return;
      } catch (err) {
        lastError = err;
        if (i < attempts.length - 1) {
          await page.waitForTimeout(500);
          continue;
        }
      }
    }
    throw lastError;
  }
}

