export const version = '0.6.0';

// Main Workplan Creation Function
export {
  createWorkplan,
  WorkplanCreatorService,
  createWorkplanCreator,
  type WorkplanCreatorOptions
} from './services/workplan-creator.js';

// Interfaces
export {
  type WorkplanCreator
} from './interfaces/workplan-creator.js';

export {
  type WorkplanOptions
} from './interfaces/workplan-options.js';

export {
  type WorkplanTemplate,
  type TemplateSection,
  type TemplateVariable
} from './interfaces/workplan-template.js';

// SPEC Parsing
export {
  SpecParser,
  createSpecParser,
  type SpecFeature,
  type SpecParseResult
} from './utils/spec-parser.js';

// Claude Code Integration
export {
  ClaudeIntegration,
  createClaudeIntegration,
  type ClaudeIntegrationOptions,
  type ClaudeExecutionResult,
  type ClaudePromptOptions
} from './services/claude-integration.js';

// Prompt Templates
export {
  SPEC_ANALYSIS_PROMPT,
  TASK_BREAKDOWN_PROMPT,
  TEMPLATE_POPULATION_PROMPT,
  generateSpecAnalysisPrompt,
  generateTaskBreakdownPrompt,
  generateTemplatePopulationPrompt,
  generateWorkplanId,
  isValidWorkplanId,
  type SpecAnalysisContext,
  type TaskBreakdownContext,
  type TemplatePopulationContext
} from './prompts/index.js';