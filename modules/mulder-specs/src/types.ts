/**
 * Core types and interfaces for @oletizi/mulder-specs
 *
 * Supports specification documents with MVP/Phase categorization,
 * feature requirements with status tracking, project context,
 * validation results, and phase-based progress tracking.
 *
 * Designed around the "One-Click Philosophy" and "MVP-First Philosophy"
 */

// ============================================================================
// Core Enums and Constants
// ============================================================================

/**
 * Priority phases for features following MVP-First Philosophy
 */
export enum FeaturePhase {
  MVP = 'mvp',
  PHASE_1 = 'phase-1',
  PHASE_2 = 'phase-2',
  PHASE_3 = 'phase-3',
  FUTURE = 'future'
}

/**
 * Status of individual requirements/features
 */
export enum RequirementStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  SKIPPED = 'skipped'
}

/**
 * Project types that can be auto-detected
 */
export enum ProjectType {
  LIBRARY = 'library',
  APPLICATION = 'application',
  CLI_TOOL = 'cli-tool',
  API = 'api',
  FULLSTACK = 'fullstack',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  MICROSERVICE = 'microservice',
  UNKNOWN = 'unknown'
}

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// ============================================================================
// Project Context Types
// ============================================================================

/**
 * Technology stack information auto-detected from project
 */
export interface TechnologyStack {
  /** Primary programming language */
  language: string;
  /** Runtime environment (node, bun, browser, etc.) */
  runtime?: string;
  /** Primary framework or library */
  framework?: string;
  /** Database technologies */
  databases?: string[];
  /** Testing frameworks */
  testing?: string[];
  /** Build tools */
  buildTools?: string[];
  /** Additional technologies */
  other?: string[];
}

/**
 * Project context automatically inferred from codebase
 */
export interface ProjectContext {
  /** Project name from package.json or directory */
  name: string;
  /** Detected project type */
  type: ProjectType;
  /** Project description */
  description?: string;
  /** Technology stack */
  technologies: TechnologyStack;
  /** Project version */
  version?: string;
  /** Repository URL */
  repository?: string;
  /** Auto-detection confidence score (0-1) */
  confidence: number;
  /** Timestamp of last context update */
  lastUpdated: Date;
}

// ============================================================================
// Feature and Requirement Types
// ============================================================================

/**
 * Individual requirement within a feature
 */
export interface Requirement {
  /** Unique identifier for the requirement */
  id: string;
  /** Human-readable description */
  description: string;
  /** Current implementation status */
  status: RequirementStatus;
  /** Priority phase this requirement belongs to */
  phase: FeaturePhase;
  /** Dependencies on other requirements */
  dependencies?: string[];
  /** Acceptance criteria */
  acceptanceCriteria?: string[];
  /** Estimated effort (story points, hours, etc.) */
  effort?: number;
  /** Implementation notes or details */
  notes?: string;
  /** Last updated timestamp */
  lastUpdated?: Date;
  /** Auto-detected completion (vs manual) */
  autoDetected?: boolean;
}

/**
 * Feature specification with requirements
 */
export interface Feature {
  /** Unique identifier for the feature */
  id: string;
  /** Feature name */
  name: string;
  /** Short description of what the feature is and what it's for */
  description: string;
  /** Priority phase */
  phase: FeaturePhase;
  /** List of requirements for this feature */
  requirements: Requirement[];
  /** Dependencies on other features */
  dependencies?: string[];
  /** Architecture considerations */
  architecture?: string[];
  /** Technical constraints */
  constraints?: string[];
  /** Feature category or module */
  category?: string;
  /** Estimated effort for entire feature */
  effort?: number;
  /** Feature completion percentage */
  completionPercentage: number;
  /** Last updated timestamp */
  lastUpdated?: Date;
}

// ============================================================================
// Specification Document Types
// ============================================================================

/**
 * Architecture decision record
 */
export interface ArchitectureDecision {
  /** Decision title */
  title: string;
  /** Decision description */
  description: string;
  /** Rationale for the decision */
  rationale: string;
  /** Alternative options considered */
  alternatives?: string[];
  /** Consequences of the decision */
  consequences?: string[];
  /** Date of decision */
  date?: Date;
}

/**
 * Technical constraint or limitation
 */
export interface TechnicalConstraint {
  /** Constraint type */
  type: 'performance' | 'security' | 'platform' | 'resource' | 'compliance' | 'other';
  /** Constraint description */
  description: string;
  /** Rationale for the constraint */
  rationale?: string;
  /** Impact on implementation */
  impact?: string;
}

/**
 * MVP definition with core features
 */
export interface MVPDefinition {
  /** MVP description */
  description: string;
  /** Core features required for MVP */
  coreFeatures: string[];
  /** Success criteria for MVP */
  successCriteria: string[];
  /** Features explicitly excluded from MVP */
  excludedFeatures?: string[];
  /** Target timeline for MVP */
  timeline?: string;
}

/**
 * Complete specification document
 */
export interface SpecificationDocument {
  /** Document metadata */
  metadata: {
    /** Specification version */
    version: string;
    /** Creation date */
    created: Date;
    /** Last modified date */
    lastModified: Date;
    /** Authors */
    authors?: string[];
    /** Document format version */
    formatVersion: string;
  };

  /** Project context */
  project: ProjectContext;

  /** Project overview */
  overview: string;

  /** MVP definition */
  mvp: MVPDefinition;

  /** All features organized by phase */
  features: Feature[];

  /** Architecture decisions */
  architecture: ArchitectureDecision[];

  /** Technical constraints */
  constraints: TechnicalConstraint[];

  /** Implementation roadmap */
  roadmap?: {
    /** Phase descriptions and timelines */
    phases: Record<FeaturePhase, {
      description: string;
      timeline?: string;
      prerequisites?: string[];
    }>;
  };
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

/**
 * Progress statistics for a specific phase
 */
export interface PhaseProgress {
  /** Phase identifier */
  phase: FeaturePhase;
  /** Total features in this phase */
  totalFeatures: number;
  /** Completed features */
  completedFeatures: number;
  /** Features in progress */
  inProgressFeatures: number;
  /** Total requirements in this phase */
  totalRequirements: number;
  /** Completed requirements */
  completedRequirements: number;
  /** Requirements in progress */
  inProgressRequirements: number;
  /** Overall completion percentage */
  completionPercentage: number;
  /** Estimated remaining effort */
  remainingEffort?: number;
  /** Blocked items count */
  blockedCount: number;
  /** Whether this phase can be started (dependencies met) */
  canStart: boolean;
  /** Whether this phase is the current active phase */
  isActive: boolean;
}

/**
 * Overall project progress tracking
 */
export interface ProjectProgress {
  /** Progress by phase */
  byPhase: Record<FeaturePhase, PhaseProgress>;
  /** Overall project completion percentage */
  overallCompletion: number;
  /** Current active phase */
  currentPhase: FeaturePhase;
  /** MVP completion status */
  mvpCompleted: boolean;
  /** MVP completion percentage */
  mvpCompletionPercentage: number;
  /** Total estimated effort */
  totalEffort?: number;
  /** Completed effort */
  completedEffort?: number;
  /** Last progress update */
  lastUpdated: Date;
  /** Velocity metrics */
  velocity?: {
    /** Requirements completed per day/week */
    requirementsPerPeriod: number;
    /** Period type (day, week, etc.) */
    period: string;
    /** Projected completion date */
    projectedCompletion?: Date;
  };
}

// ============================================================================
// Validation and Compliance Types
// ============================================================================

/**
 * Individual validation issue
 */
export interface ValidationIssue {
  /** Issue severity */
  severity: ValidationSeverity;
  /** Issue category */
  category: 'missing-implementation' | 'scope-creep' | 'mvp-violation' | 'dependency-violation' | 'specification-drift' | 'other';
  /** Issue description */
  message: string;
  /** Affected feature or requirement ID */
  affectedItem?: string;
  /** File path where issue was detected */
  filePath?: string;
  /** Line number in file */
  lineNumber?: number;
  /** Suggested fix */
  suggestion?: string;
  /** Whether this can be auto-fixed */
  autoFixable?: boolean;
}

/**
 * Validation result for specification compliance
 */
export interface ValidationResult {
  /** Whether validation passed */
  passed: boolean;
  /** Overall compliance score (0-1) */
  complianceScore: number;
  /** List of validation issues */
  issues: ValidationIssue[];
  /** Summary statistics */
  summary: {
    /** Total issues by severity */
    issuesBySeverity: Record<ValidationSeverity, number>;
    /** Total missing implementations */
    missingImplementations: number;
    /** Scope creep violations */
    scopeCreepViolations: number;
    /** MVP enforcement violations */
    mvpViolations: number;
  };
  /** Timestamp of validation */
  timestamp: Date;
  /** Validation configuration used */
  config?: ValidationConfig;
}

/**
 * Configuration for validation behavior
 */
export interface ValidationConfig {
  /** Enforce MVP-first development */
  enforceMvpFirst: boolean;
  /** Detect scope creep automatically */
  detectScopeCreep: boolean;
  /** Validate dependency order */
  validateDependencies: boolean;
  /** Auto-update completion status */
  autoUpdateStatus: boolean;
  /** Require user confirmation for auto-updates */
  requireConfirmation: boolean;
  /** Paths to exclude from validation */
  excludePaths?: string[];
  /** Custom validation rules */
  customRules?: string[];
}

/**
 * Compliance report combining progress and validation
 */
export interface ComplianceReport {
  /** Project context */
  project: ProjectContext;
  /** Current progress */
  progress: ProjectProgress;
  /** Latest validation result */
  validation: ValidationResult;
  /** Specification document reference */
  specificationPath: string;
  /** Report generation timestamp */
  generatedAt: Date;
  /** Recommendations for next steps */
  recommendations: string[];
  /** Health score (0-1) */
  healthScore: number;
}

// ============================================================================
// CLI and Tool Configuration Types
// ============================================================================

/**
 * CLI command options
 */
export interface CLIOptions {
  /** Interactive mode */
  interactive?: boolean;
  /** Show all phases vs just current */
  allPhases?: boolean;
  /** Disable MVP enforcement */
  noEnforceMvp?: boolean;
  /** Dry run mode */
  dryRun?: boolean;
  /** Verbose output */
  verbose?: boolean;
  /** Output format */
  format?: 'text' | 'json' | 'markdown';
  /** Custom specification path */
  specPath?: string;
}

/**
 * Auto-detection configuration
 */
export interface AutoDetectionConfig {
  /** Enable project context auto-detection */
  enableProjectDetection: boolean;
  /** Enable feature completion auto-detection */
  enableCompletionDetection: boolean;
  /** Confidence threshold for auto-updates */
  confidenceThreshold: number;
  /** Paths to scan for implementations */
  scanPaths: string[];
  /** File patterns to include */
  includePatterns: string[];
  /** File patterns to exclude */
  excludePatterns: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Partial specification update
 */
export type SpecificationUpdate = Partial<SpecificationDocument> & {
  metadata: {
    lastModified: Date;
    version: string;
  };
};

/**
 * Feature query filters
 */
export interface FeatureQuery {
  /** Filter by phase */
  phase?: FeaturePhase;
  /** Filter by status */
  status?: RequirementStatus;
  /** Filter by category */
  category?: string;
  /** Text search in name/description */
  search?: string;
  /** Include dependencies */
  includeDependencies?: boolean;
}

/**
 * Requirement update payload
 */
export interface RequirementUpdate {
  /** Requirement ID */
  id: string;
  /** New status */
  status?: RequirementStatus;
  /** Updated notes */
  notes?: string;
  /** Mark as auto-detected */
  autoDetected?: boolean;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T> {
  /** Successful operations */
  succeeded: T[];
  /** Failed operations with errors */
  failed: Array<{
    item: T;
    error: string;
  }>;
  /** Summary statistics */
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

// ============================================================================
// Export Collections
// ============================================================================

/**
 * All enums for easy import
 */
export const Enums = {
  FeaturePhase,
  RequirementStatus,
  ProjectType,
  ValidationSeverity
} as const;

/**
 * All core interfaces for easy import
 */
export type CoreInterfaces = {
  SpecificationDocument: SpecificationDocument;
  Feature: Feature;
  Requirement: Requirement;
  ProjectContext: ProjectContext;
  ProjectProgress: ProjectProgress;
  ValidationResult: ValidationResult;
  ComplianceReport: ComplianceReport;
};