import type { WorkplanTemplate } from '@/interfaces/workplan-template';

/**
 * Configuration options for workplan creation.
 * Provides customization for output location, templates, and Claude Code integration.
 */
export interface WorkplanOptions {
  /**
   * Directory where the workplan file should be created.
   * If not specified, creates in the same directory as the SPEC document.
   */
  readonly outputDir?: string;

  /**
   * Custom template to use for workplan generation.
   * If not specified, uses the default canonical template.
   */
  readonly template?: WorkplanTemplate;

  /**
   * Path to custom Claude Code executable.
   * If not specified, uses 'claude' from PATH.
   */
  readonly claudeCodePath?: string;

  /**
   * Additional arguments to pass to Claude Code CLI.
   * Used for advanced configuration like model selection or API settings.
   */
  readonly claudeCodeArgs?: readonly string[];

  /**
   * Timeout in milliseconds for Claude Code execution.
   * Defaults to 300000 (5 minutes) if not specified.
   */
  readonly timeoutMs?: number;

  /**
   * Whether to overwrite existing workplan files.
   * If false and file exists, throws an error.
   * Defaults to false.
   */
  readonly overwrite?: boolean;

  /**
   * Validation options for the generated workplan.
   */
  readonly validation?: {
    /**
     * Whether to validate the generated markdown syntax.
     * Defaults to true.
     */
    readonly validateMarkdown?: boolean;

    /**
     * Whether to validate that all required template sections are present.
     * Defaults to true.
     */
    readonly validateSections?: boolean;
  };
}