/**
 * Represents a variable that can be substituted in template content.
 */
export interface TemplateVariable {
  /**
   * Variable name (used in template as {{name}})
   */
  readonly name: string;

  /**
   * Variable value to substitute
   */
  readonly value: string;

  /**
   * Whether this variable is required for template rendering
   */
  readonly required?: boolean;
}

/**
 * Represents a section in the workplan template.
 */
export interface TemplateSection {
  /**
   * Section identifier (e.g., 'description', 'tasks', 'progress')
   */
  readonly id: string;

  /**
   * Section title displayed in the workplan
   */
  readonly title: string;

  /**
   * Template content for this section with variable placeholders
   */
  readonly content: string;

  /**
   * Whether this section is required in the workplan
   */
  readonly required?: boolean;

  /**
   * Order of this section in the final workplan (lower numbers first)
   */
  readonly order?: number;
}

/**
 * Template structure for generating WORKPLAN documents.
 * Defines the structure, variables, and content for workplan generation.
 */
export interface WorkplanTemplate {
  /**
   * Template name/identifier
   */
  readonly name: string;

  /**
   * Template version for compatibility tracking
   */
  readonly version: string;

  /**
   * Description of what this template is for
   */
  readonly description?: string;

  /**
   * Header content for the workplan document
   */
  readonly header: string;

  /**
   * Sections that make up the workplan template
   */
  readonly sections: readonly TemplateSection[];

  /**
   * Footer content for the workplan document
   */
  readonly footer?: string;

  /**
   * Variables available for substitution throughout the template
   */
  readonly variables?: readonly TemplateVariable[];

  /**
   * Default values for template variables
   */
  readonly defaults?: Record<string, string>;

  /**
   * Metadata about the template
   */
  readonly metadata?: {
    /**
     * Author of the template
     */
    readonly author?: string;

    /**
     * Date template was created
     */
    readonly created?: string;

    /**
     * Date template was last modified
     */
    readonly modified?: string;

    /**
     * Tags for categorizing the template
     */
    readonly tags?: readonly string[];
  };
}