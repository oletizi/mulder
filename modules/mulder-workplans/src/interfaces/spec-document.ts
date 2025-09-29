/**
 * Represents a feature or requirement within a SPEC document.
 */
export interface SpecFeature {
  /**
   * Unique identifier for the feature/requirement
   */
  readonly id: string;

  /**
   * Display name of the feature/requirement
   */
  readonly name: string;

  /**
   * Type of specification item (feature, requirement, etc.)
   */
  readonly type: 'feature' | 'requirement' | 'component' | 'other';

  /**
   * Detailed description of the feature/requirement
   */
  readonly description: string;

  /**
   * Priority level (if specified in SPEC)
   */
  readonly priority?: 'low' | 'medium' | 'high' | 'critical';

  /**
   * Status of the feature/requirement
   */
  readonly status?: 'pending' | 'in-progress' | 'completed' | 'blocked';

  /**
   * Dependencies on other features/requirements
   */
  readonly dependencies?: readonly string[];

  /**
   * Acceptance criteria or definition of done
   */
  readonly acceptanceCriteria?: readonly string[];

  /**
   * Additional metadata about the feature
   */
  readonly metadata?: Record<string, unknown>;

  /**
   * Line number where this feature starts in the SPEC document
   */
  readonly lineNumber?: number;

  /**
   * Raw markdown content for this feature section
   */
  readonly rawContent?: string;
}

/**
 * Represents metadata about a SPEC document.
 */
export interface SpecMetadata {
  /**
   * Document title/name
   */
  readonly title?: string;

  /**
   * Document description
   */
  readonly description?: string;

  /**
   * Document version
   */
  readonly version?: string;

  /**
   * Author(s) of the document
   */
  readonly authors?: readonly string[];

  /**
   * Date document was created
   */
  readonly created?: string;

  /**
   * Date document was last modified
   */
  readonly modified?: string;

  /**
   * Project or system this SPEC belongs to
   */
  readonly project?: string;

  /**
   * Additional metadata fields
   */
  readonly custom?: Record<string, unknown>;
}

/**
 * Represents a parsed SPEC document with extractable features and requirements.
 * Provides structured access to SPEC content for workplan generation.
 */
export interface SpecDocument {
  /**
   * Absolute path to the SPEC document file
   */
  readonly filePath: string;

  /**
   * Document metadata extracted from headers or frontmatter
   */
  readonly metadata: SpecMetadata;

  /**
   * All features and requirements found in the document
   */
  readonly features: readonly SpecFeature[];

  /**
   * Raw document content (full markdown text)
   */
  readonly rawContent: string;

  /**
   * Document structure (sections, headings, etc.)
   */
  readonly structure?: {
    /**
     * Document sections with their hierarchy
     */
    readonly sections?: readonly {
      readonly level: number;
      readonly title: string;
      readonly content: string;
      readonly lineNumber: number;
    }[];

    /**
     * Table of contents if extractable
     */
    readonly tableOfContents?: readonly {
      readonly level: number;
      readonly title: string;
      readonly anchor?: string;
    }[];
  };

  /**
   * Validation results for the SPEC document
   */
  readonly validation?: {
    /**
     * Whether the document is valid according to mulder-specs format
     */
    readonly isValid: boolean;

    /**
     * Validation errors or warnings
     */
    readonly issues?: readonly {
      readonly type: 'error' | 'warning' | 'info';
      readonly message: string;
      readonly lineNumber?: number;
    }[];
  };
}