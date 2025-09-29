/**
 * Public interfaces for the mulder-workplans module.
 *
 * This module provides TypeScript interfaces for creating and managing
 * WORKPLAN documents based on SPEC features and requirements.
 */

// Core workplan creation interface
export type { WorkplanCreator } from '@/interfaces/workplan-creator';

// Configuration and options
export type { WorkplanOptions } from '@/interfaces/workplan-options';

// Template system interfaces
export type {
  WorkplanTemplate,
  TemplateSection,
  TemplateVariable
} from '@/interfaces/workplan-template';

// SPEC document parsing interfaces
export type {
  SpecDocument,
  SpecFeature,
  SpecMetadata
} from '@/interfaces/spec-document';