import * as fs from 'fs/promises';
import * as path from 'path';
import type { WorkplanCreator } from '@/interfaces/workplan-creator';
import type { WorkplanOptions } from '@/interfaces/workplan-options';
import type { WorkplanTemplate } from '@/interfaces/workplan-template';
import { ClaudeIntegration, type ClaudeIntegrationOptions } from '@/services/claude-integration';
import { SpecParser, type SpecFeature } from '@/utils/spec-parser';

/**
 * Options for configuring the WorkplanCreatorService.
 */
export interface WorkplanCreatorOptions {
  /**
   * Custom Claude integration instance for testing
   */
  claudeIntegration?: ClaudeIntegration;

  /**
   * Custom spec parser instance for testing
   */
  specParser?: SpecParser;

  /**
   * Default template to use when none specified in options
   */
  defaultTemplate?: WorkplanTemplate | undefined;
}

/**
 * Implementation of WorkplanCreator interface.
 * Provides core functionality for creating WORKPLAN documents from SPEC features.
 */
export class WorkplanCreatorService implements WorkplanCreator {
  private readonly claudeIntegration: ClaudeIntegration;
  private readonly specParser: SpecParser;
  private readonly defaultTemplate?: WorkplanTemplate | undefined;

  constructor(options: WorkplanCreatorOptions = {}) {
    this.claudeIntegration = options.claudeIntegration ?? new ClaudeIntegration({
      timeout: 300000, // 5 minutes default for workplan generation
    });
    this.specParser = options.specParser ?? new SpecParser();
    this.defaultTemplate = options.defaultTemplate;
  }

  /**
   * Creates a new WORKPLAN document for specified features or requirements.
   */
  async create(
    specPath: string,
    featureId: string,
    options: WorkplanOptions = {}
  ): Promise<string> {
    // Validate inputs
    await this.validateInputs(specPath, featureId, options);

    // Parse SPEC and find the feature
    const feature = await this.specParser.findFeature(specPath, featureId);

    // Generate workplan filename
    const workplanPath = await this.generateWorkplanPath(specPath, feature, options);

    // Check for existing workplan conflicts
    await this.checkExistingWorkplan(workplanPath, options);

    // Generate workplan content using Claude
    const workplanContent = await this.generateWorkplanContent(feature, specPath, options);

    // Validate generated content if requested
    if (options.validation?.validateMarkdown !== false) {
      this.validateMarkdownContent(workplanContent);
    }

    if (options.validation?.validateSections !== false) {
      this.validateRequiredSections(workplanContent, options.template);
    }

    // Write workplan to filesystem
    await this.writeWorkplan(workplanPath, workplanContent);

    return workplanPath;
  }

  /**
   * Validate input parameters.
   */
  private async validateInputs(
    specPath: string,
    featureId: string,
    options: WorkplanOptions
  ): Promise<void> {
    if (!path.isAbsolute(specPath)) {
      throw new Error(`SPEC path must be absolute, got: ${specPath}`);
    }

    if (!featureId || featureId.trim().length === 0) {
      throw new Error('Feature ID cannot be empty');
    }

    // Check if SPEC document exists
    try {
      const stats = await fs.stat(specPath);
      if (!stats.isFile()) {
        throw new Error(`SPEC path is not a file: ${specPath}`);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`SPEC document does not exist: ${specPath}`);
      }
      throw new Error(`Failed to access SPEC document at ${specPath}: ${error.message}`);
    }

    // Validate output directory if specified
    if (options.outputDir) {
      if (!path.isAbsolute(options.outputDir)) {
        throw new Error(`Output directory must be absolute, got: ${options.outputDir}`);
      }

      try {
        const stats = await fs.stat(options.outputDir);
        if (!stats.isDirectory()) {
          throw new Error(`Output path is not a directory: ${options.outputDir}`);
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          throw new Error(`Output directory does not exist: ${options.outputDir}`);
        }
        throw new Error(`Failed to access output directory at ${options.outputDir}: ${error.message}`);
      }
    }

    // Check Claude availability if not already tested
    const isAvailable = await this.claudeIntegration.checkAvailability();
    if (!isAvailable) {
      throw new Error(
        'Claude Code CLI is not available. Please ensure it is installed and accessible in PATH'
      );
    }
  }

  /**
   * Generate the workplan file path based on feature and options.
   */
  private async generateWorkplanPath(
    specPath: string,
    feature: SpecFeature,
    options: WorkplanOptions
  ): Promise<string> {
    // Determine output directory
    const outputDir = options.outputDir ?? path.dirname(specPath);

    // Generate filename based on feature
    const filename = this.generateWorkplanFilename(feature);

    return path.join(outputDir, filename);
  }

  /**
   * Generate workplan filename following the WORKPLAN-<identifier>.md convention.
   */
  private generateWorkplanFilename(feature: SpecFeature): string {
    // Clean the feature ID to make it filesystem-safe
    let identifier = feature.id
      .replace(/[^a-zA-Z0-9\-_]/g, '-')  // Replace invalid chars with dashes
      .replace(/-+/g, '-')               // Collapse multiple dashes
      .replace(/^-|-$/g, '')             // Remove leading/trailing dashes
      .toUpperCase();

    // Ensure identifier is not empty
    if (!identifier) {
      identifier = feature.title
        .replace(/[^a-zA-Z0-9\s]/g, '')   // Remove special chars
        .replace(/\s+/g, '-')             // Replace spaces with dashes
        .toUpperCase()
        .substring(0, 50);                // Limit length
    }

    // Ensure we have a valid identifier
    if (!identifier) {
      identifier = 'FEATURE-' + Date.now();
    }

    return `WORKPLAN-${identifier}.md`;
  }

  /**
   * Check for existing workplan conflicts.
   */
  private async checkExistingWorkplan(
    workplanPath: string,
    options: WorkplanOptions
  ): Promise<void> {
    try {
      await fs.access(workplanPath);

      // File exists - check if overwrite is allowed
      if (!options.overwrite) {
        throw new Error(
          `Workplan already exists at ${workplanPath}. Use overwrite option to replace it.`
        );
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        // File exists but overwrite not allowed, or other access error
        throw error;
      }
      // File doesn't exist - this is what we want
    }
  }

  /**
   * Generate workplan content using Claude Code integration.
   */
  private async generateWorkplanContent(
    feature: SpecFeature,
    specPath: string,
    options: WorkplanOptions
  ): Promise<string> {
    // Read SPEC content for context
    const specContent = await fs.readFile(specPath, 'utf-8');

    // Prepare the prompt for workplan generation
    const prompt = this.buildWorkplanPrompt(feature, options.template);

    try {
      const result = await this.claudeIntegration.executeWithSpec({
        specContent,
        promptTemplate: prompt,
        outputFormat: 'markdown',
        context: {
          featureId: feature.id,
          featureTitle: feature.title,
          featureType: feature.type,
          featureDescription: feature.description,
          priority: feature.priority ?? 'medium',
          section: feature.section ?? 'Unknown'
        }
      });

      if (!result.stdout || result.stdout.trim().length === 0) {
        throw new Error('Claude Code generated empty workplan content');
      }

      return result.stdout.trim();
    } catch (error: any) {
      throw new Error(`Failed to generate workplan content: ${error.message}`);
    }
  }

  /**
   * Build the prompt for Claude to generate workplan content.
   */
  private buildWorkplanPrompt(feature: SpecFeature, template?: WorkplanTemplate): string {
    const templateInfo = template ?
      `Use the provided custom template structure.` :
      'Use a canonical workplan template structure.';

    return `
# Workplan Generation Task

You are tasked with creating a comprehensive WORKPLAN document for a specific feature/requirement from a SPEC document.

## Feature Information
- **ID**: {{featureId}}
- **Title**: {{featureTitle}}
- **Type**: {{featureType}}
- **Priority**: {{priority}}
- **Section**: {{section}}
- **Description**: {{featureDescription}}

## Instructions

1. Analyze the provided SPEC document to understand the context and requirements
2. Create a detailed workplan for implementing the specified feature
3. ${templateInfo}
4. Include the following sections:
   - Feature Description: Clear overview of what needs to be implemented
   - Goals & Objectives: What success looks like
   - Task Breakdown: Detailed, actionable tasks with checkboxes
   - Progress Tracking: Section for status updates and milestones
   - Implementation Notes: Technical decisions and considerations
   - Notes and Decisions: Space for tracking decisions and blockers

## Format Requirements

- Use proper markdown formatting
- Include checkboxes for actionable tasks (- [ ] format)
- Organize tasks into logical phases or categories
- Provide realistic time estimates where appropriate
- Include clear acceptance criteria
- Make tasks specific and measurable

## Template Structure

The workplan should follow this structure:

\`\`\`markdown
# WORKPLAN-{{featureId}}: {{featureTitle}}

## Feature Description
[Clear description of the feature/requirement]

## Goals & Objectives
[What success looks like]

## Task Breakdown
[Detailed tasks organized by phase/category]

## Progress Tracking
[Milestones and status updates]

## Implementation Notes
[Technical decisions and considerations]

## Notes and Decisions
[Decision log and blockers]
\`\`\`

Generate a comprehensive workplan that a development team can use to successfully implement this feature.
`;
  }

  /**
   * Validate markdown content structure.
   */
  private validateMarkdownContent(content: string): void {
    // Basic markdown validation
    if (!content.trim().startsWith('#')) {
      throw new Error('Generated workplan does not start with a proper markdown header');
    }

    // Check for basic structure
    const requiredSections = ['feature description', 'task breakdown'];
    const lowerContent = content.toLowerCase();

    for (const section of requiredSections) {
      if (!lowerContent.includes(section)) {
        throw new Error(`Generated workplan is missing required section: ${section}`);
      }
    }

    // Check for at least one task checkbox
    if (!content.includes('- [ ]') && !content.includes('- [x]')) {
      throw new Error('Generated workplan does not contain any task checkboxes');
    }
  }

  /**
   * Validate that required template sections are present.
   */
  private validateRequiredSections(content: string, template?: WorkplanTemplate): void {
    if (!template) {
      return; // Skip validation if no template specified
    }

    const lowerContent = content.toLowerCase();
    const requiredSections = template.sections
      .filter(section => section.required)
      .map(section => section.title.toLowerCase());

    for (const sectionTitle of requiredSections) {
      if (!lowerContent.includes(sectionTitle)) {
        throw new Error(`Generated workplan is missing required template section: ${sectionTitle}`);
      }
    }
  }

  /**
   * Write the workplan content to the filesystem.
   */
  private async writeWorkplan(workplanPath: string, content: string): Promise<void> {
    try {
      // Ensure the directory exists
      const dir = path.dirname(workplanPath);
      await fs.mkdir(dir, { recursive: true });

      // Write the workplan file
      await fs.writeFile(workplanPath, content, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to write workplan to ${workplanPath}: ${error.message}`);
    }
  }
}

/**
 * Factory function for creating WorkplanCreatorService instances.
 * Provides backward compatibility and easier testing.
 */
export function createWorkplanCreator(options?: WorkplanCreatorOptions): WorkplanCreatorService {
  return new WorkplanCreatorService(options);
}

/**
 * Main entry point function for creating workplans.
 * Provides a simple interface for the most common use case.
 *
 * @param specPath - Absolute path to the SPEC document
 * @param featureId - Identifier of the feature to create workplan for
 * @param options - Optional configuration
 * @returns Promise that resolves to the path of the created workplan
 */
export async function createWorkplan(
  specPath: string,
  featureId: string,
  options?: WorkplanOptions
): Promise<string> {
  const creator = createWorkplanCreator();
  return creator.create(specPath, featureId, options);
}