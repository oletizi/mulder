import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Represents a feature or requirement extracted from a SPEC document.
 */
export interface SpecFeature {
  /**
   * Unique identifier for the feature/requirement
   */
  readonly id: string;

  /**
   * Display title of the feature/requirement
   */
  readonly title: string;

  /**
   * Full description/content of the feature/requirement
   */
  readonly description: string;

  /**
   * Type of the spec item (feature, requirement, task, etc.)
   */
  readonly type: 'feature' | 'requirement' | 'task' | 'epic' | 'story';

  /**
   * Priority level if specified in the SPEC
   */
  readonly priority?: 'low' | 'medium' | 'high' | 'critical' | undefined;

  /**
   * Tags or labels associated with this feature
   */
  readonly tags?: readonly string[] | undefined;

  /**
   * Section in the SPEC where this feature was found
   */
  readonly section?: string | undefined;

  /**
   * Line number range in the source SPEC document
   */
  readonly lineRange?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
}

/**
 * Result of parsing a SPEC document.
 */
export interface SpecParseResult {
  /**
   * Path to the parsed SPEC document
   */
  readonly specPath: string;

  /**
   * Title/name of the SPEC document
   */
  readonly title?: string | undefined;

  /**
   * Version of the SPEC if specified
   */
  readonly version?: string | undefined;

  /**
   * All features/requirements found in the SPEC
   */
  readonly features: readonly SpecFeature[];

  /**
   * Metadata extracted from the SPEC document
   */
  readonly metadata?: {
    readonly author?: string | undefined;
    readonly created?: string | undefined;
    readonly modified?: string | undefined;
    readonly description?: string | undefined;
  } | undefined;
}

/**
 * Parser for SPEC documents to extract features and requirements.
 * Supports markdown-based SPEC documents with structured content.
 */
export class SpecParser {
  /**
   * Parse a SPEC document and extract features/requirements.
   *
   * @param specPath - Absolute path to the SPEC document
   * @returns Promise that resolves to the parsed SPEC content
   * @throws Error when SPEC document doesn't exist or is invalid
   */
  async parseSpec(specPath: string): Promise<SpecParseResult> {
    if (!path.isAbsolute(specPath)) {
      throw new Error(`SPEC path must be absolute, got: ${specPath}`);
    }

    let content: string;
    try {
      content = await fs.readFile(specPath, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to read SPEC document at ${specPath}: ${error.message}`);
    }

    if (content.trim().length === 0) {
      throw new Error(`SPEC document is empty: ${specPath}`);
    }

    const lines = content.split('\n');
    const result: SpecParseResult = {
      specPath,
      title: this.extractTitle(lines),
      version: this.extractVersion(lines),
      features: this.extractFeatures(lines),
      metadata: this.extractMetadata(lines)
    };

    return result;
  }

  /**
   * Find a specific feature/requirement by identifier.
   *
   * @param specPath - Absolute path to the SPEC document
   * @param featureId - Identifier of the feature to find
   * @returns Promise that resolves to the found feature
   * @throws Error when feature is not found
   */
  async findFeature(specPath: string, featureId: string): Promise<SpecFeature> {
    const parseResult = await this.parseSpec(specPath);

    const feature = parseResult.features.find(
      f => f.id === featureId || f.id.toLowerCase() === featureId.toLowerCase()
    );

    if (!feature) {
      const availableIds = parseResult.features.map(f => f.id).join(', ');
      throw new Error(
        `Feature '${featureId}' not found in SPEC document. Available features: ${availableIds}`
      );
    }

    return feature;
  }

  /**
   * Extract the document title from SPEC content.
   */
  private extractTitle(lines: string[]): string | undefined {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.substring(2).trim();
      }
    }
    return undefined;
  }

  /**
   * Extract version information from SPEC content.
   */
  private extractVersion(lines: string[]): string | undefined {
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.includes('version:') || trimmed.includes('version ')) {
        const match = line.match(/version[:\s]+([^\s,]+)/i);
        return match?.[1];
      }
    }
    return undefined;
  }

  /**
   * Extract features and requirements from SPEC content.
   */
  private extractFeatures(lines: string[]): SpecFeature[] {
    const features: SpecFeature[] = [];
    let currentSection = '';
    let currentFeature: Partial<SpecFeature> | null = null;
    let currentDescription: string[] = [];
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const trimmed = line.trim();

      // Track current section
      if (trimmed.startsWith('#')) {
        currentSection = trimmed.replace(/^#+\s*/, '');
        if (currentFeature) {
          this.finalizeFeature(currentFeature, currentDescription, features, lineNumber - 1);
          currentFeature = null;
          currentDescription = [];
        }
        continue;
      }

      // Feature/requirement headers (bold text or specific patterns)
      if (this.isFeatureHeader(trimmed)) {
        if (currentFeature) {
          this.finalizeFeature(currentFeature, currentDescription, features, lineNumber - 1);
        }

        const lineRange = { start: lineNumber, end: lineNumber };
        currentFeature = {
          id: this.extractFeatureId(trimmed),
          title: this.extractFeatureTitle(trimmed),
          type: this.inferFeatureType(trimmed, currentSection),
          section: currentSection,
          lineRange
        };
        currentDescription = [];
        continue;
      }

      // Collect description content
      if (currentFeature && trimmed.length > 0) {
        currentDescription.push(trimmed);
        const existingRange: { start: number; end: number } | undefined = currentFeature.lineRange;
        if (existingRange) {
          currentFeature = {
            ...currentFeature,
            lineRange: {
              start: existingRange.start,
              end: lineNumber
            }
          };
        }
      }
    }

    // Finalize the last feature if any
    if (currentFeature) {
      this.finalizeFeature(currentFeature, currentDescription, features, lineNumber);
    }

    return features;
  }

  /**
   * Check if a line represents a feature/requirement header.
   */
  private isFeatureHeader(line: string): boolean {
    // Look for bold text, numbered items, or specific keywords
    return /^\*\*.*\*\*$/.test(line) || // Bold text
           /^\d+\.\s/.test(line) ||      // Numbered list
           /^-\s+\*\*/.test(line) ||     // Dash with bold
           /^(feature|requirement|story|epic|task)[:\s]/i.test(line); // Keywords
  }

  /**
   * Extract feature ID from header text.
   */
  private extractFeatureId(headerText: string): string {
    // Remove markdown formatting
    let cleaned = headerText.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').replace(/^-\s*/, '');

    // Look for explicit ID patterns like [FEAT-1] or (REQ-1)
    const idMatch = cleaned.match(/[\[\(]([A-Z]+-\d+)[\]\)]/);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }

    // Generate ID from title
    return cleaned
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  /**
   * Extract feature title from header text.
   */
  private extractFeatureTitle(headerText: string): string {
    // Remove markdown formatting and numbering
    let cleaned = headerText.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').replace(/^-\s*/, '');

    // Remove ID patterns
    cleaned = cleaned.replace(/[\[\(][A-Z]+-\d+[\]\)]/g, '').trim();

    return cleaned || 'untitled';
  }

  /**
   * Infer the type of feature based on text and context.
   */
  private inferFeatureType(text: string, section: string): SpecFeature['type'] {
    const lowerText = text.toLowerCase();
    const lowerSection = section.toLowerCase();

    if (lowerText.includes('epic') || lowerSection.includes('epic')) {
      return 'epic';
    }
    if (lowerText.includes('story') || lowerSection.includes('story')) {
      return 'story';
    }
    if (lowerText.includes('task') || lowerSection.includes('task')) {
      return 'task';
    }
    if (lowerText.includes('requirement') || lowerSection.includes('requirement')) {
      return 'requirement';
    }

    return 'feature'; // Default
  }

  /**
   * Finalize a feature by setting its description and adding to results.
   */
  private finalizeFeature(
    feature: Partial<SpecFeature>,
    description: string[],
    features: SpecFeature[],
    endLine: number
  ): void {
    if (feature.id && feature.title && feature.type) {
      const descriptionText = description.join(' ').trim();
      const finalFeature: SpecFeature = {
        id: feature.id,
        title: feature.title,
        description: descriptionText,
        type: feature.type
      };

      if (feature.section !== undefined) {
        (finalFeature as any).section = feature.section;
      }

      if (feature.lineRange) {
        (finalFeature as any).lineRange = { ...feature.lineRange, end: endLine };
      }

      const priority = this.extractPriority(descriptionText);
      if (priority !== undefined) {
        (finalFeature as any).priority = priority;
      }

      const tags = this.extractTags(descriptionText);
      if (tags !== undefined) {
        (finalFeature as any).tags = tags;
      }

      features.push(finalFeature);
    }
  }

  /**
   * Extract priority from feature description.
   */
  private extractPriority(text: string): SpecFeature['priority'] | undefined {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('critical') || lowerText.includes('urgent')) {
      return 'critical';
    }
    if (lowerText.includes('high priority') || lowerText.includes('important')) {
      return 'high';
    }
    if (lowerText.includes('medium priority') || lowerText.includes('normal')) {
      return 'medium';
    }
    if (lowerText.includes('low priority') || lowerText.includes('nice to have')) {
      return 'low';
    }
    return undefined;
  }

  /**
   * Extract tags from feature description.
   */
  private extractTags(text: string): string[] | undefined {
    const tagMatches = text.match(/#([a-zA-Z0-9_-]+)/g);
    if (tagMatches) {
      return tagMatches.map(tag => tag.substring(1));
    }
    return undefined;
  }

  /**
   * Extract metadata from SPEC document.
   */
  private extractMetadata(lines: string[]): SpecParseResult['metadata'] {
    const metadata: any = {};

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for metadata patterns
      const authorMatch = trimmed.match(/author[:\s]+(.+)/i);
      if (authorMatch && authorMatch[1]) {
        metadata.author = authorMatch[1].trim();
        continue;
      }

      const createdMatch = trimmed.match(/created[:\s]+(.+)/i);
      if (createdMatch && createdMatch[1]) {
        metadata.created = createdMatch[1].trim();
        continue;
      }

      const modifiedMatch = trimmed.match(/modified[:\s]+(.+)/i);
      if (modifiedMatch && modifiedMatch[1]) {
        metadata.modified = modifiedMatch[1].trim();
        continue;
      }

      const descMatch = trimmed.match(/description[:\s]+(.+)/i);
      if (descMatch && descMatch[1]) {
        metadata.description = descMatch[1].trim();
        continue;
      }
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }
}

/**
 * Factory function for creating SpecParser instances.
 * Provides backward compatibility and easier testing.
 */
export function createSpecParser(): SpecParser {
  return new SpecParser();
}