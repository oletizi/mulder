import type { WorkplanOptions } from '@/interfaces/workplan-options';

/**
 * Interface for creating workplan documents from SPEC features/requirements.
 * Provides the core functionality to generate WORKPLAN documents using Claude Code integration.
 */
export interface WorkplanCreator {
  /**
   * Creates a new WORKPLAN document for specified features or requirements.
   *
   * @param specPath - Absolute path to the SPEC document to analyze
   * @param featureId - Identifier of the feature or requirement to create workplan for
   * @param options - Configuration options for workplan creation
   * @returns Promise that resolves to the absolute path of the created workplan file
   * @throws Error when SPEC document doesn't exist or feature/requirement not found
   * @throws Error when Claude Code execution fails
   * @throws Error when workplan generation fails
   */
  create(
    specPath: string,
    featureId: string,
    options?: WorkplanOptions
  ): Promise<string>;
}