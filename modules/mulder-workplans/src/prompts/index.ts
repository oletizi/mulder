/**
 * Prompt templates for Claude Code integration in workplan generation
 */

export {
  SPEC_ANALYSIS_PROMPT,
  generateSpecAnalysisPrompt,
  type SpecAnalysisContext
} from './spec-analysis.prompt';

export {
  TASK_BREAKDOWN_PROMPT,
  generateTaskBreakdownPrompt,
  type TaskBreakdownContext
} from './task-breakdown.prompt';

export {
  TEMPLATE_POPULATION_PROMPT,
  generateTemplatePopulationPrompt,
  generateWorkplanId,
  isValidWorkplanId,
  type TemplatePopulationContext
} from './template-population.prompt';