import { Page } from 'playwright';

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: 'meta' | 'content' | 'structure' | 'performance' | 'accessibility';
  message: string;
  suggestion: string;
  element?: string;
  value?: string;
  expected?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SEOTestResult {
  url: string;
  score: number;
  issues: SEOIssue[];
  recommendations: string[];
  metrics: {
    titleLength: number;
    descriptionLength: number;
    headingCount: number;
    imageCount: number;
    linkCount: number;
    wordCount: number;
  };
}

export class SEOTester {
  async testPage(page: Page, url: string): Promise<SEOTestResult> {
    const issues: SEOIssue[] = [];
    const recommendations: string[] = [];

    // Test title tag
    const title = await page.title();
    const titleLength = title.length;
    
    if (!title) {
      issues.push({
        type: 'error',
        category: 'meta',
        message: 'Missing title tag',
        suggestion: 'Add a descriptive title tag',
        severity: 'critical'
      });
    } else if (titleLength < 30) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Title too short',
        suggestion: 'Title should be 30-60 characters',
        element: 'title',
        value: title,
        expected: '30-60 characters',
        severity: 'medium'
      });
    } else if (titleLength > 60) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Title too long',
        suggestion: 'Title should be 30-60 characters',
        element: 'title',
        value: title,
        expected: '30-60 characters',
        severity: 'medium'
      });
    }

    // Test meta description
    const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
    const descriptionLength = metaDescription?.length || 0;

    if (!metaDescription) {
      issues.push({
        type: 'error',
        category: 'meta',
        message: 'Missing meta description',
        suggestion: 'Add a compelling meta description',
        severity: 'high'
      });
    } else if (descriptionLength < 120) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Meta description too short',
        suggestion: 'Description should be 120-160 characters',
        element: 'meta[name="description"]',
        value: metaDescription,
        expected: '120-160 characters',
        severity: 'medium'
      });
    } else if (descriptionLength > 160) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Meta description too long',
        suggestion: 'Description should be 120-160 characters',
        element: 'meta[name="description"]',
        value: metaDescription,
        expected: '120-160 characters',
        severity: 'medium'
      });
    }

    // Test heading structure
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
      elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim() || '',
        level: parseInt(el.tagName.charAt(1))
      }))
    );

    const h1Count = headings.filter(h => h.tag === 'h1').length;
    if (h1Count === 0) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: 'Missing H1 tag',
        suggestion: 'Add a single H1 tag per page',
        severity: 'high'
      });
    } else if (h1Count > 1) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: 'Multiple H1 tags found',
        suggestion: 'Use only one H1 tag per page',
        element: 'h1',
        value: `${h1Count} H1 tags found`,
        expected: '1 H1 tag',
        severity: 'medium'
      });
    }

    // Check heading hierarchy
    let previousLevel = 0;
    for (const heading of headings) {
      if (heading.level > previousLevel + 1) {
        issues.push({
          type: 'warning',
          category: 'structure',
          message: 'Heading hierarchy skipped',
          suggestion: `Don't skip heading levels (H${previousLevel} to H${heading.level})`,
          element: heading.tag,
          value: heading.text,
          severity: 'medium'
        });
      }
      previousLevel = heading.level;
    }

    // Test images for alt text
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        title: img.title
      }))
    );

    const imagesWithoutAlt = images.filter(img => !img.alt);
    imagesWithoutAlt.forEach(img => {
      issues.push({
        type: 'error',
        category: 'accessibility',
        message: 'Image missing alt text',
        suggestion: 'Add descriptive alt text to all images',
        element: 'img',
        value: img.src,
        severity: 'high'
      });
    });

    // Test internal links
    const links = await page.$$eval('a[href]', links => 
      links.map(link => ({
        href: (link as HTMLAnchorElement).href,
        text: link.textContent?.trim() || '',
        title: (link as HTMLAnchorElement).title
      }))
    );

    const internalLinks = links.filter(link => 
      link.href.startsWith(url.split('/')[0] + '//' + url.split('/')[2])
    );

    const linksWithoutText = internalLinks.filter(link => !link.text);
    linksWithoutText.forEach(link => {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Link missing descriptive text',
        suggestion: 'Add descriptive text to links',
        element: 'a',
        value: link.href,
        severity: 'medium'
      });
    });

    // Test for duplicate content
    const duplicateTitles = headings.filter(h => h.text).reduce((acc, h) => {
      acc[h.text] = (acc[h.text] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(duplicateTitles).forEach(([text, count]) => {
      if (count > 1) {
        issues.push({
          type: 'warning',
          category: 'content',
          message: 'Duplicate heading text',
          suggestion: 'Make heading text unique',
          element: 'heading',
          value: text,
          severity: 'medium'
        });
      }
    });

    // Test page speed indicators
    const wordCount = await page.evaluate(() => 
      document.body.textContent?.split(/\s+/).length || 0
    );

    if (wordCount < 300) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Page content too short',
        suggestion: 'Add more valuable content (minimum 300 words)',
        element: 'body',
        value: `${wordCount} words`,
        expected: '300+ words',
        severity: 'medium'
      });
    }

    // Test for broken images
    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.complete || img.naturalHeight === 0);
    });

    brokenImages.forEach(img => {
      issues.push({
        type: 'error',
        category: 'performance',
        message: 'Broken image detected',
        suggestion: 'Fix or remove broken images',
        element: 'img',
        value: img.src,
        severity: 'high'
      });
    });

    // Test viewport meta tag
    const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
    if (!viewport) {
      issues.push({
        type: 'error',
        category: 'meta',
        message: 'Missing viewport meta tag',
        suggestion: 'Add viewport meta tag for mobile responsiveness',
        severity: 'high'
      });
    }

    // Test Open Graph tags
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');

    if (!ogTitle) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Missing Open Graph title',
        suggestion: 'Add og:title meta tag for social sharing',
        severity: 'medium'
      });
    }

    if (!ogDescription) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Missing Open Graph description',
        suggestion: 'Add og:description meta tag for social sharing',
        severity: 'medium'
      });
    }

    if (!ogImage) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Missing Open Graph image',
        suggestion: 'Add og:image meta tag for social sharing',
        severity: 'medium'
      });
    }

    // Calculate SEO score
    const totalIssues = issues.length;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;

    const score = Math.max(0, 100 - (criticalIssues * 20 + highIssues * 10 + mediumIssues * 5 + lowIssues * 2));

    // Generate recommendations
    if (criticalIssues > 0) {
      recommendations.push('Fix critical SEO issues immediately');
    }
    if (highIssues > 0) {
      recommendations.push('Address high-priority SEO issues');
    }
    if (mediumIssues > 0) {
      recommendations.push('Improve medium-priority SEO elements');
    }
    if (imagesWithoutAlt.length > 0) {
      recommendations.push('Add alt text to all images for accessibility');
    }
    if (linksWithoutText.length > 0) {
      recommendations.push('Add descriptive text to all links');
    }

    return {
      url,
      score: Math.round(score),
      issues,
      recommendations,
      metrics: {
        titleLength,
        descriptionLength,
        headingCount: headings.length,
        imageCount: images.length,
        linkCount: links.length,
        wordCount
      }
    };
  }
}
