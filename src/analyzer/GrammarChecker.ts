import * as fs from 'fs-extra';
import * as path from 'path';

export interface GrammarError {
  text: string;
  error: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
  position: {
    line: number;
    column: number;
  };
  context: string;
}

export interface GrammarCheckResult {
  errors: GrammarError[];
  score: number;
  suggestions: string[];
}

export class GrammarChecker {
  private commonErrors: Map<string, string> = new Map([
    // Common typos and grammatical errors
    ['teh', 'the'],
    ['adn', 'and'],
    ['recieve', 'receive'],
    ['seperate', 'separate'],
    ['occured', 'occurred'],
    ['definately', 'definitely'],
    ['accomodate', 'accommodate'],
    ['begining', 'beginning'],
    ['neccessary', 'necessary'],
    ['occurence', 'occurrence'],
    ['priviledge', 'privilege'],
    ['seperate', 'separate'],
    ['succesful', 'successful'],
    ['untill', 'until'],
    ['withing', 'within'],
    ['writting', 'writing'],
    ['your welcome', 'you\'re welcome'],
    ['its a', 'it\'s a'],
    ['dont', 'don\'t'],
    ['wont', 'won\'t'],
    ['cant', 'can\'t'],
    ['shouldnt', 'shouldn\'t'],
    ['wouldnt', 'wouldn\'t'],
    ['couldnt', 'couldn\'t'],
    ['havent', 'haven\'t'],
    ['hasnt', 'hasn\'t'],
    ['hadnt', 'hadn\'t'],
    ['isnt', 'isn\'t'],
    ['arent', 'aren\'t'],
    ['werent', 'weren\'t'],
    ['wasnt', 'wasn\'t'],
    ['didnt', 'didn\'t'],
    ['doesnt', 'doesn\'t'],
    ['wouldve', 'would\'ve'],
    ['couldve', 'could\'ve'],
    ['shouldve', 'should\'ve'],
    ['mightve', 'might\'ve'],
    ['mustve', 'must\'ve'],
    ['ive', 'I\'ve'],
    ['youve', 'you\'ve'],
    ['weve', 'we\'ve'],
    ['theyve', 'they\'ve'],
    ['thats', 'that\'s'],
    ['theres', 'there\'s'],
    ['heres', 'here\'s'],
    ['wheres', 'where\'s'],
    ['whos', 'who\'s'],
    ['whats', 'what\'s'],
    ['whens', 'when\'s'],
    ['hows', 'how\'s'],
    ['whys', 'why\'s']
  ]);

  private grammarRules: Array<{
    pattern: RegExp;
    message: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
  }> = [
    // Double spaces
    {
      pattern: /\s{2,}/g,
      message: 'Multiple consecutive spaces found',
      suggestion: 'Use single space',
      severity: 'low'
    },
    // Missing space after punctuation
    {
      pattern: /[.!?][A-Z]/g,
      message: 'Missing space after punctuation',
      suggestion: 'Add space after punctuation',
      severity: 'medium'
    },
    // Missing comma before "and" in lists
    {
      pattern: /\w+\s+and\s+\w+/g,
      message: 'Consider adding comma before "and" in lists',
      suggestion: 'Add comma before "and" in lists',
      severity: 'low'
    },
    // Inconsistent capitalization
    {
      pattern: /\b(website|web site|Website|Web Site)\b/g,
      message: 'Inconsistent capitalization of "website"',
      suggestion: 'Use consistent capitalization',
      severity: 'low'
    },
    // Missing articles
    {
      pattern: /\b(website|application|software|system)\b(?!\s+(is|was|will|can|should|may|might|must|shall|would|could|has|have|had|do|does|did|are|were|be|been|being))\b/g,
      message: 'Consider adding article (a, an, the)',
      suggestion: 'Add appropriate article',
      severity: 'low'
    },
    // Passive voice detection
    {
      pattern: /\b(is|are|was|were|be|been|being)\s+\w+ed\b/g,
      message: 'Passive voice detected',
      suggestion: 'Consider using active voice',
      severity: 'medium'
    },
    // Word repetition
    {
      pattern: /\b(\w+)\s+\1\b/g,
      message: 'Repeated word found',
      suggestion: 'Remove duplicate word',
      severity: 'high'
    },
    // Missing apostrophes in contractions
    {
      pattern: /\b(dont|cant|wont|shouldnt|wouldnt|couldnt|havent|hasnt|hadnt|isnt|arent|werent|wasnt|didnt|doesnt)\b/g,
      message: 'Missing apostrophe in contraction',
      suggestion: 'Add apostrophe to contraction',
      severity: 'high'
    }
  ];

  async checkText(text: string, context: string = ''): Promise<GrammarCheckResult> {
    const errors: GrammarError[] = [];
    const lines = text.split('\n');

    // Check for common typos
    this.commonErrors.forEach((correction, error) => {
      const regex = new RegExp(`\\b${error}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const lineNumber = text.substring(0, match.index).split('\n').length;
        const columnNumber = match.index - text.lastIndexOf('\n', match.index);
        
        errors.push({
          text: match[0],
          error: error,
          suggestion: correction,
          severity: 'high',
          position: {
            line: lineNumber,
            column: columnNumber
          },
          context: context || lines[lineNumber - 1]?.trim() || ''
        });
      }
    });

    // Check grammar rules
    this.grammarRules.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        const lineNumber = text.substring(0, match.index).split('\n').length;
        const columnNumber = match.index - text.lastIndexOf('\n', match.index);
        
        errors.push({
          text: match[0],
          error: rule.message,
          suggestion: rule.suggestion,
          severity: rule.severity,
          position: {
            line: lineNumber,
            column: columnNumber
          },
          context: context || lines[lineNumber - 1]?.trim() || ''
        });
      }
    });

    // Calculate score (0-100, higher is better)
    const totalWords = text.split(/\s+/).length;
    const errorCount = errors.length;
    const score = Math.max(0, 100 - (errorCount / totalWords) * 100);

    // Generate suggestions
    const suggestions = this.generateSuggestions(errors);

    return {
      errors,
      score: Math.round(score),
      suggestions
    };
  }

  private generateSuggestions(errors: GrammarError[]): string[] {
    const suggestions: string[] = [];
    const errorTypes = new Set(errors.map(e => e.error));

    if (errorTypes.has('Missing apostrophe in contraction')) {
      suggestions.push('Review contractions and ensure proper apostrophe usage');
    }
    if (errorTypes.has('Repeated word found')) {
      suggestions.push('Check for and remove duplicate words');
    }
    if (errorTypes.has('Passive voice detected')) {
      suggestions.push('Consider rewriting in active voice for better clarity');
    }
    if (errorTypes.has('Multiple consecutive spaces found')) {
      suggestions.push('Remove extra spaces and use single spaces consistently');
    }

    return suggestions;
  }

  async checkWebsiteContent(pages: Array<{ url: string; title: string; content: string }>): Promise<Map<string, GrammarCheckResult>> {
    const results = new Map<string, GrammarCheckResult>();

    for (const page of pages) {
      const content = `${page.title}\n${page.content}`;
      const result = await this.checkText(content, `Page: ${page.url}`);
      results.set(page.url, result);
    }

    return results;
  }
}
