import type { WorkplanTemplate, TemplateVariable } from '@/interfaces/workplan-template';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Options for template rendering configuration.
 */
export interface TemplateRendererOptions {
  /**
   * Custom file system implementation for testing
   */
  readonly fileSystem?: {
    readonly readFile: (path: string, encoding: BufferEncoding) => Promise<string>;
  };
}

/**
 * Template rendering engine that supports variable substitution and maintains markdown formatting.
 * Implements the {{variable}} syntax for variable substitution in workplan templates.
 */
export class TemplateRenderer {
  private readonly fileSystem: {
    readonly readFile: (path: string, encoding: BufferEncoding) => Promise<string>;
  };

  constructor(options: TemplateRendererOptions = {}) {
    this.fileSystem = options.fileSystem ?? {
      readFile: fs.readFile,
    };
  }

  /**
   * Renders a workplan template with provided variables.
   *
   * @param template - The workplan template to render
   * @param variables - Variables to substitute in the template
   * @returns Promise that resolves to the rendered markdown content
   * @throws Error when required variables are missing
   * @throws Error when template content is invalid
   */
  async render(
    template: WorkplanTemplate,
    variables: Record<string, string>
  ): Promise<string> {
    if (!template) {
      throw new Error('Template is required for rendering');
    }

    if (!template.sections || template.sections.length === 0) {
      throw new Error('Template must contain at least one section');
    }

    // Validate required variables
    this.validateRequiredVariables(template, variables);

    // Merge template defaults with provided variables
    const mergedVariables = {
      ...template.defaults,
      ...variables,
    };

    // Render header
    let content = this.substituteVariables(template.header, mergedVariables);
    content += '\n\n';

    // Sort sections by order and render each
    const sortedSections = [...template.sections].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      return orderA - orderB;
    });

    for (const section of sortedSections) {
      content += this.renderSection(section, mergedVariables);
      content += '\n\n';
    }

    // Render footer if present
    if (template.footer) {
      content += this.substituteVariables(template.footer, mergedVariables);
    }

    // Clean up extra newlines while maintaining markdown structure
    return this.normalizeMarkdown(content);
  }

  /**
   * Renders a template from a file path with provided variables.
   *
   * @param templatePath - Absolute path to the template file
   * @param variables - Variables to substitute in the template
   * @returns Promise that resolves to the rendered markdown content
   * @throws Error when template file doesn't exist or is invalid
   * @throws Error when required variables are missing
   */
  async renderFromFile(
    templatePath: string,
    variables: Record<string, string>
  ): Promise<string> {
    if (!templatePath) {
      throw new Error('Template path is required');
    }

    if (!path.isAbsolute(templatePath)) {
      throw new Error('Template path must be absolute');
    }

    try {
      const templateContent = await this.fileSystem.readFile(templatePath, 'utf8');
      return this.renderFromString(templateContent, variables);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Template file not found: ${templatePath}`);
      }
      throw new Error(`Failed to read template file: ${error.message}`);
    }
  }

  /**
   * Renders a template from a string with provided variables.
   * Supports the {{variable}} syntax for variable substitution.
   *
   * @param templateContent - The template content as a string
   * @param variables - Variables to substitute in the template
   * @returns The rendered markdown content
   * @throws Error when required variables are missing
   */
  renderFromString(
    templateContent: string,
    variables: Record<string, string>
  ): string {
    if (!templateContent) {
      throw new Error('Template content is required');
    }

    const rendered = this.substituteVariables(templateContent, variables);
    return this.normalizeMarkdown(rendered);
  }

  /**
   * Validates that all required variables are provided.
   */
  private validateRequiredVariables(
    template: WorkplanTemplate,
    variables: Record<string, string>
  ): void {
    const requiredVariables = template.variables?.filter(v => v.required) ?? [];
    const missingVariables: string[] = [];

    for (const variable of requiredVariables) {
      if (!(variable.name in variables) && !(variable.name in (template.defaults ?? {}))) {
        missingVariables.push(variable.name);
      }
    }

    if (missingVariables.length > 0) {
      throw new Error(
        `Missing required variables: ${missingVariables.join(', ')}`
      );
    }
  }

  /**
   * Renders a single template section.
   */
  private renderSection(
    section: { readonly title: string; readonly content: string },
    variables: Record<string, string>
  ): string {
    let sectionContent = `## ${section.title}\n\n`;
    sectionContent += this.substituteVariables(section.content, variables);
    return sectionContent;
  }

  /**
   * Substitutes variables in content using {{variable}} syntax.
   */
  private substituteVariables(
    content: string,
    variables: Record<string, string>
  ): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, variableName: string) => {
      if (variableName in variables) {
        return variables[variableName] ?? '';
      }

      // Return the original placeholder if variable not found
      return match;
    });
  }

  /**
   * Normalizes markdown content by cleaning up excessive newlines
   * while maintaining proper markdown structure.
   */
  private normalizeMarkdown(content: string): string {
    return content
      // Remove trailing whitespace from lines
      .replace(/ +$/gm, '')
      // Replace multiple consecutive newlines with maximum of 2
      .replace(/\n{3,}/g, '\n\n')
      // Ensure file ends with single newline
      .replace(/\n*$/, '\n');
  }
}

/**
 * Factory function to create a TemplateRenderer instance.
 * Provides backward compatibility and easier testing.
 *
 * @param options - Configuration options for the renderer
 * @returns A new TemplateRenderer instance
 */
export function createTemplateRenderer(
  options?: TemplateRendererOptions
): TemplateRenderer {
  return new TemplateRenderer(options);
}