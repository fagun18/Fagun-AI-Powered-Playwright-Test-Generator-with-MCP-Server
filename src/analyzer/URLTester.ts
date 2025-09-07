import { Page } from 'playwright';

export interface URLTestResult {
  url: string;
  status: 'success' | 'error' | 'timeout' | 'redirect';
  statusCode?: number;
  responseTime: number;
  error?: string;
  redirectUrl?: string;
  title?: string;
  contentLength?: number;
  isInternal: boolean;
  isBroken: boolean;
  issues: string[];
}

export class URLTester {
  private baseUrl: string;
  private visitedUrls = new Set<string>();
  private maxDepth: number = 3;
  private timeout: number = 10000;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async testAllUrls(page: Page): Promise<URLTestResult[]> {
    const results: URLTestResult[] = [];
    const urlsToTest = await this.collectAllUrls(page);
    
    console.log(`🔗 Found ${urlsToTest.length} URLs to test`);

    for (const url of urlsToTest) {
      if (!this.visitedUrls.has(url)) {
        const result = await this.testUrl(page, url);
        results.push(result);
        this.visitedUrls.add(url);
        
        // Add delay to avoid overwhelming the server
        await page.waitForTimeout(100);
      }
    }

    return results;
  }

  private async collectAllUrls(page: Page): Promise<string[]> {
    const urls = new Set<string>();
    
    // Get all links on the current page
    const links = await page.$$eval('a[href]', links => 
      links.map(link => (link as HTMLAnchorElement).href).filter(href => href && href !== 'javascript:void(0)')
    );

    // Get all form actions
    const formActions = await page.$$eval('form[action]', forms => 
      forms.map(form => (form as HTMLFormElement).action).filter(action => action)
    );

    // Get all image sources
    const imageSources = await page.$$eval('img[src]', imgs => 
      imgs.map(img => (img as HTMLImageElement).src).filter(src => src)
    );

    // Get all script sources
    const scriptSources = await page.$$eval('script[src]', scripts => 
      scripts.map(script => (script as HTMLScriptElement).src).filter(src => src)
    );

    // Get all CSS sources
    const cssSources = await page.$$eval('link[href]', links => 
      links.map(link => (link as HTMLLinkElement).href).filter(href => href)
    );

    // Combine all URLs
    [...links, ...formActions, ...imageSources, ...scriptSources, ...cssSources].forEach(url => {
      try {
        const normalizedUrl = this.normalizeUrl(url);
        if (normalizedUrl) {
          urls.add(normalizedUrl);
        }
      } catch (err) {
        console.warn(`Invalid URL: ${url}`);
      }
    });

    return Array.from(urls);
  }

  private normalizeUrl(url: string): string | null {
    try {
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${this.baseUrl}${url}`;
      }
      
      // Handle protocol-relative URLs
      if (url.startsWith('//')) {
        return `https:${url}`;
      }
      
      // Handle absolute URLs
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // Handle mailto and tel links
      if (url.startsWith('mailto:') || url.startsWith('tel:')) {
        return url;
      }
      
      return null;
    } catch (err) {
      return null;
    }
  }

  private async testUrl(page: Page, url: string): Promise<URLTestResult> {
    const startTime = Date.now();
    const isInternal = url.includes(this.baseUrl);
    
    try {
      // Handle special URLs
      if (url.startsWith('mailto:') || url.startsWith('tel:')) {
        return {
          url,
          status: 'success',
          responseTime: 0,
          isInternal,
          isBroken: false,
          issues: []
        };
      }

      // Test the URL
      const response = await page.request.get(url, { timeout: this.timeout });
      const responseTime = Date.now() - startTime;
      
      const statusCode = response.status();
      const isBroken = statusCode >= 400;
      
      let status: 'success' | 'error' | 'timeout' | 'redirect' = 'success';
      let issues: string[] = [];
      
      if (statusCode >= 300 && statusCode < 400) {
        status = 'redirect';
        const redirectUrl = response.headers()['location'];
        if (redirectUrl) {
          issues.push(`Redirects to: ${redirectUrl}`);
        }
      } else if (statusCode >= 400) {
        status = 'error';
        issues.push(`HTTP ${statusCode} error`);
      }
      
      // Check for common issues
      if (statusCode === 404) {
        issues.push('Page not found');
      } else if (statusCode === 500) {
        issues.push('Internal server error');
      } else if (statusCode === 403) {
        issues.push('Access forbidden');
      } else if (statusCode === 401) {
        issues.push('Authentication required');
      }
      
      // Check response time
      if (responseTime > 5000) {
        issues.push('Slow response time');
      }
      
      // Get additional info for successful requests
      let title: string | undefined;
      let contentLength: number | undefined;
      
      if (statusCode === 200) {
        try {
          const responseText = await response.text();
          contentLength = responseText.length;
          
          // Extract title from HTML
          const titleMatch = responseText.match(/<title[^>]*>([^<]*)<\/title>/i);
          if (titleMatch) {
            title = titleMatch[1].trim();
          }
        } catch (err) {
          // Ignore errors when reading response
        }
      }

      return {
        url,
        status,
        statusCode,
        responseTime,
        isInternal,
        isBroken,
        issues,
        title,
        contentLength
      };

    } catch (err) {
      const responseTime = Date.now() - startTime;
      const isBroken = true;
      
      let error = 'Unknown error';
      let status: 'success' | 'error' | 'timeout' | 'redirect' = 'error';
      
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('timeout')) {
        error = 'Request timeout';
        status = 'timeout';
      } else if (errorMessage.includes('net::ERR_NAME_NOT_RESOLVED')) {
        error = 'DNS resolution failed';
      } else if (errorMessage.includes('net::ERR_CONNECTION_REFUSED')) {
        error = 'Connection refused';
      } else if (errorMessage.includes('net::ERR_SSL')) {
        error = 'SSL certificate error';
      } else {
        error = errorMessage;
      }

      return {
        url,
        status,
        responseTime,
        error,
        isInternal,
        isBroken,
        issues: [error]
      };
    }
  }

  async testBrokenLinks(page: Page): Promise<URLTestResult[]> {
    const allResults = await this.testAllUrls(page);
    return allResults.filter(result => result.isBroken);
  }

  async testInternalLinks(page: Page): Promise<URLTestResult[]> {
    const allResults = await this.testAllUrls(page);
    return allResults.filter(result => result.isInternal);
  }

  async testExternalLinks(page: Page): Promise<URLTestResult[]> {
    const allResults = await this.testAllUrls(page);
    return allResults.filter(result => !result.isInternal);
  }

  generateBrokenLinksReport(results: URLTestResult[]): string {
    const brokenLinks = results.filter(r => r.isBroken);
    const slowLinks = results.filter(r => r.responseTime > 5000);
    const redirectLinks = results.filter(r => r.status === 'redirect');
    
    let report = `# URL Testing Report\n\n`;
    report += `## Summary\n`;
    report += `- Total URLs tested: ${results.length}\n`;
    report += `- Broken URLs: ${brokenLinks.length}\n`;
    report += `- Slow URLs (>5s): ${slowLinks.length}\n`;
    report += `- Redirect URLs: ${redirectLinks.length}\n\n`;
    
    if (brokenLinks.length > 0) {
      report += `## Broken URLs\n\n`;
      brokenLinks.forEach(link => {
        report += `- **${link.url}**\n`;
        report += `  - Status: ${link.statusCode || 'Unknown'}\n`;
        report += `  - Error: ${link.error || 'N/A'}\n`;
        report += `  - Issues: ${link.issues.join(', ')}\n\n`;
      });
    }
    
    if (slowLinks.length > 0) {
      report += `## Slow URLs\n\n`;
      slowLinks.forEach(link => {
        report += `- **${link.url}** (${link.responseTime}ms)\n`;
      });
    }
    
    return report;
  }
}
