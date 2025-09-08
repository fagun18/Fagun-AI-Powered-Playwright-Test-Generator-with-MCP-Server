import { WebsiteAnalysis, WebsitePage, WebsiteElement } from '../types';
import { chromium, Browser, Page } from 'playwright';

export interface FormField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  selector: string;
  validation?: string;
}

export interface PageAnalysis {
  url: string;
  title: string;
  hasContactForm: boolean;
  formFields: FormField[];
  buttons: WebsiteElement[];
  links: WebsiteElement[];
  grammarErrors: string[];
  seoIssues: string[];
  urlIssues: string[];
  pageType: 'home' | 'contact' | 'about' | 'services' | 'blog' | 'other';
}

export class EnhancedPageAnalyzer {
  private browser: Browser | null = null;

  async analyzeAllPages(baseUrl: string): Promise<PageAnalysis[]> {
    console.log(`🔍 Starting comprehensive page analysis for: ${baseUrl}`);
    
    try {
      this.browser = await chromium.launch({ headless: true });
      const page = await this.browser.newPage();
      
      // First, discover all pages
      const discoveredPages = await this.discoverAllPages(page, baseUrl);
      console.log(`📄 Discovered ${discoveredPages.length} pages to analyze`);

      // Analyze each page in detail
      const pageAnalyses: PageAnalysis[] = [];
      
      for (const pageUrl of discoveredPages.slice(0, 10)) { // Limit to 10 pages for performance
        console.log(`🔍 Analyzing page: ${pageUrl}`);
        const analysis = await this.analyzePage(page, pageUrl);
        pageAnalyses.push(analysis);
      }

      await this.browser.close();
      return pageAnalyses;

    } catch (error) {
      console.error('❌ Error in page analysis:', error);
      if (this.browser) {
        await this.browser.close();
      }
      throw error;
    }
  }

  private async discoverAllPages(page: Page, baseUrl: string): Promise<string[]> {
    const visited = new Set<string>();
    const toVisit = [baseUrl];
    const discoveredPages: string[] = [];

    while (toVisit.length > 0 && discoveredPages.length < 20) { // Limit to 20 pages
      const currentUrl = toVisit.shift()!;
      
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 10000 });
        discoveredPages.push(currentUrl);

        // Extract all internal links
        const links = await page.evaluate((baseUrl) => {
          const linkElements = Array.from(document.querySelectorAll('a[href]'));
          const internalLinks: string[] = [];
          
          linkElements.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
              try {
                const url = new URL(href, baseUrl);
                if (url.origin === new URL(baseUrl).origin && !internalLinks.includes(url.href)) {
                  internalLinks.push(url.href);
                }
              } catch (e) {
                // Invalid URL, skip
              }
            }
          });
          
          return internalLinks;
        }, baseUrl);

        // Add new links to visit queue
        links.forEach(link => {
          if (!visited.has(link) && !toVisit.includes(link)) {
            toVisit.push(link);
          }
        });

      } catch (error) {
        console.log(`⚠️  Could not analyze page: ${currentUrl}`);
      }
    }

    return discoveredPages;
  }

  private async analyzePage(page: Page, pageUrl: string): Promise<PageAnalysis> {
    try {
      await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 15000 });
      
      const pageData = await page.evaluate(() => {
        // Extract page title
        const title = document.title || '';
        
        // Find contact forms
        const forms = Array.from(document.querySelectorAll('form'));
        const contactForms = forms.filter(form => {
          const formText = form.textContent?.toLowerCase() || '';
          return formText.includes('contact') || 
                 formText.includes('message') || 
                 formText.includes('inquiry') ||
                 formText.includes('email') ||
                 formText.includes('phone');
        });

        // Extract form fields
        const formFields: any[] = [];
        contactForms.forEach(form => {
          const inputs = Array.from(form.querySelectorAll('input, textarea, select'));
          inputs.forEach(input => {
            const element = input as HTMLInputElement;
            formFields.push({
              name: element.name || element.id || element.className || 'unnamed',
              type: element.type || element.tagName.toLowerCase(),
              required: element.required || false,
              placeholder: element.placeholder || '',
              selector: `input[name="${element.name}"], input[id="${element.id}"], ${element.tagName.toLowerCase()}[placeholder="${element.placeholder}"]`,
              validation: element.pattern || ''
            });
          });
        });

        // Extract buttons
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
        const buttonElements = buttons.map(btn => ({
          type: 'button' as const,
          selector: btn.tagName.toLowerCase() + (btn.id ? `#${btn.id}` : '') + (btn.className ? `.${btn.className.split(' ')[0]}` : ''),
          text: btn.textContent?.trim() || '',
          attributes: Array.from(btn.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {} as Record<string, string>)
        }));

        // Extract links
        const links = Array.from(document.querySelectorAll('a[href]'));
        const linkElements = links.map(link => ({
          type: 'link' as const,
          selector: `a[href="${link.getAttribute('href')}"]`,
          text: link.textContent?.trim() || '',
          href: link.getAttribute('href') || '',
          attributes: Array.from(link.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {} as Record<string, string>)
        }));

        // Extract page text for grammar analysis
        const pageText = document.body.textContent || '';
        
        return {
          title,
          hasContactForm: contactForms.length > 0,
          formFields,
          buttons: buttonElements,
          links: linkElements,
          pageText
        };
      });

      // Determine page type
      const pageType = this.determinePageType(pageUrl, pageData.title, pageData.pageText);
      
      // Analyze grammar
      const grammarErrors = this.analyzeGrammar(pageData.pageText);
      
      // Analyze SEO
      const seoIssues = this.analyzeSEO(pageData.title, pageData.pageText);
      
      // Analyze URL
      const urlIssues = this.analyzeURL(pageUrl);

      return {
        url: pageUrl,
        title: pageData.title,
        hasContactForm: pageData.hasContactForm,
        formFields: pageData.formFields,
        buttons: pageData.buttons,
        links: pageData.links,
        grammarErrors,
        seoIssues,
        urlIssues,
        pageType
      };

    } catch (error) {
      console.error(`❌ Error analyzing page ${pageUrl}:`, error);
      return {
        url: pageUrl,
        title: 'Error loading page',
        hasContactForm: false,
        formFields: [],
        buttons: [],
        links: [],
        grammarErrors: ['Failed to load page'],
        seoIssues: ['Failed to analyze SEO'],
        urlIssues: ['Failed to analyze URL'],
        pageType: 'other'
      };
    }
  }

  private determinePageType(url: string, title: string, text: string): PageAnalysis['pageType'] {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const textLower = text.toLowerCase();

    if (urlLower.includes('contact') || titleLower.includes('contact') || textLower.includes('contact us')) {
      return 'contact';
    }
    if (urlLower.includes('about') || titleLower.includes('about')) {
      return 'about';
    }
    if (urlLower.includes('service') || titleLower.includes('service')) {
      return 'services';
    }
    if (urlLower.includes('blog') || titleLower.includes('blog')) {
      return 'blog';
    }
    if (urlLower === url.toLowerCase() || urlLower.endsWith('/') || titleLower.includes('home')) {
      return 'home';
    }
    
    return 'other';
  }

  private analyzeGrammar(text: string): string[] {
    const errors: string[] = [];
    
    // Simple grammar checks
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      
      // Check for double spaces
      if (trimmed.includes('  ')) {
        errors.push(`Double space found: "${trimmed.substring(0, 50)}..."`);
      }
      
      // Check for missing capitalization after periods
      if (trimmed.match(/[.!?]\s+[a-z]/)) {
        errors.push(`Missing capitalization: "${trimmed.substring(0, 50)}..."`);
      }
      
      // Check for common typos
      const typos = [
        { pattern: /\bteh\b/g, correct: 'the' },
        { pattern: /\badn\b/g, correct: 'and' },
        { pattern: /\byoru\b/g, correct: 'your' },
        { pattern: /\byou\b\s+\byou\b/g, correct: 'you' }
      ];
      
      typos.forEach(typo => {
        if (typo.pattern.test(trimmed)) {
          errors.push(`Typo found: "${trimmed.substring(0, 50)}..." (should be "${typo.correct}")`);
        }
      });
    });
    
    return errors;
  }

  private analyzeSEO(title: string, text: string): string[] {
    const issues: string[] = [];
    
    // Check title length
    if (title.length < 30) {
      issues.push('Title is too short (less than 30 characters)');
    }
    if (title.length > 60) {
      issues.push('Title is too long (more than 60 characters)');
    }
    
    // Check for meta description (simplified)
    if (!text.includes('description') && text.length < 150) {
      issues.push('Page content is too short for good SEO');
    }
    
    // Check for headings
    if (!text.includes('h1') && !text.includes('h2')) {
      issues.push('Missing heading structure (h1, h2)');
    }
    
    return issues;
  }

  private analyzeURL(url: string): string[] {
    const issues: string[] = [];
    
    try {
      const urlObj = new URL(url);
      
      // Check for HTTPS
      if (urlObj.protocol !== 'https:') {
        issues.push('URL should use HTTPS for security');
      }
      
      // Check for trailing slash consistency
      if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
        issues.push('URL has trailing slash - consider consistency');
      }
      
      // Check for special characters
      if (urlObj.pathname.includes(' ')) {
        issues.push('URL contains spaces - use hyphens instead');
      }
      
      // Check for uppercase
      if (urlObj.pathname !== urlObj.pathname.toLowerCase()) {
        issues.push('URL contains uppercase letters - use lowercase');
      }
      
    } catch (error) {
      issues.push('Invalid URL format');
    }
    
    return issues;
  }
}
