import {
  SPEC_ANALYSIS_PROMPT,
  generateSpecAnalysisPrompt,
  type SpecAnalysisContext,
  TASK_BREAKDOWN_PROMPT,
  generateTaskBreakdownPrompt,
  type TaskBreakdownContext,
  TEMPLATE_POPULATION_PROMPT,
  generateTemplatePopulationPrompt,
  generateWorkplanId,
  isValidWorkplanId,
  type TemplatePopulationContext
} from '@/prompts';

describe('Spec Analysis Prompt', () => {
  describe('SPEC_ANALYSIS_PROMPT', () => {
    it('should contain expected sections', () => {
      expect(SPEC_ANALYSIS_PROMPT).toContain('You are a technical documentation specialist');
      expect(SPEC_ANALYSIS_PROMPT).toContain('## Your Task');
      expect(SPEC_ANALYSIS_PROMPT).toContain('## Analysis Guidelines');
      expect(SPEC_ANALYSIS_PROMPT).toContain('## Output Format');
      expect(SPEC_ANALYSIS_PROMPT).toContain('## Context Variables');
      expect(SPEC_ANALYSIS_PROMPT).toContain('## SPEC Document to Analyze');
      expect(SPEC_ANALYSIS_PROMPT).toContain('## Important Notes');
    });

    it('should include JSON structure template', () => {
      expect(SPEC_ANALYSIS_PROMPT).toContain('specTitle');
      expect(SPEC_ANALYSIS_PROMPT).toContain('primaryFeatures');
      expect(SPEC_ANALYSIS_PROMPT).toContain('requirements');
      expect(SPEC_ANALYSIS_PROMPT).toContain('dependencies');
      expect(SPEC_ANALYSIS_PROMPT).toContain('technicalConstraints');
      expect(SPEC_ANALYSIS_PROMPT).toContain('recommendedWorkplans');
    });

    it('should include context variable placeholders', () => {
      expect(SPEC_ANALYSIS_PROMPT).toContain('{{projectContext}}');
      expect(SPEC_ANALYSIS_PROMPT).toContain('{{analysisGoals}}');
      expect(SPEC_ANALYSIS_PROMPT).toContain('{{#if projectContext}}');
      expect(SPEC_ANALYSIS_PROMPT).toContain('{{#if analysisGoals}}');
    });
  });

  describe('generateSpecAnalysisPrompt', () => {
    it('should return prompt without context', () => {
      const result = generateSpecAnalysisPrompt();

      expect(result).not.toContain('{{projectContext}}');
      expect(result).not.toContain('{{analysisGoals}}');
      expect(result).not.toContain('{{#if projectContext}}');
      expect(result).not.toContain('{{#if analysisGoals}}');
    });

    it('should substitute project context', () => {
      const context: SpecAnalysisContext = {
        projectContext: 'This is a Node.js backend project using TypeScript'
      };

      const result = generateSpecAnalysisPrompt(context);

      expect(result).toContain('This is a Node.js backend project using TypeScript');
      expect(result).not.toContain('{{projectContext}}');
      expect(result).not.toContain('{{#if projectContext}}');
    });

    it('should substitute analysis goals', () => {
      const context: SpecAnalysisContext = {
        analysisGoals: 'Focus on authentication and security features'
      };

      const result = generateSpecAnalysisPrompt(context);

      expect(result).toContain('Focus on authentication and security features');
      expect(result).not.toContain('{{analysisGoals}}');
      expect(result).not.toContain('{{#if analysisGoals}}');
    });

    it('should substitute both context and goals', () => {
      const context: SpecAnalysisContext = {
        projectContext: 'React frontend application',
        analysisGoals: 'Identify UI components and state management needs'
      };

      const result = generateSpecAnalysisPrompt(context);

      expect(result).toContain('React frontend application');
      expect(result).toContain('Identify UI components and state management needs');
      expect(result).not.toContain('{{projectContext}}');
      expect(result).not.toContain('{{analysisGoals}}');
    });

    it('should handle empty context gracefully', () => {
      const context: SpecAnalysisContext = {};

      const result = generateSpecAnalysisPrompt(context);

      expect(result).not.toContain('{{projectContext}}');
      expect(result).not.toContain('{{analysisGoals}}');
    });

    it('should remove conditional blocks when context not provided', () => {
      const result = generateSpecAnalysisPrompt();

      expect(result).not.toContain('### Project Context');
      expect(result).not.toContain('### Analysis Goals');
      expect(result).not.toContain('{{#if');
      expect(result).not.toContain('{{/if}}');
    });

    it('should preserve conditional content when context provided', () => {
      const context: SpecAnalysisContext = {
        projectContext: 'Test project'
      };

      const result = generateSpecAnalysisPrompt(context);

      expect(result).toContain('### Project Context');
      expect(result).toContain('Test project');
    });
  });
});

describe('Task Breakdown Prompt', () => {
  describe('TASK_BREAKDOWN_PROMPT', () => {
    it('should contain expected sections', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('technical project manager');
      expect(TASK_BREAKDOWN_PROMPT).toContain('## Your Task');
      expect(TASK_BREAKDOWN_PROMPT).toContain('## Task Breakdown Guidelines');
      expect(TASK_BREAKDOWN_PROMPT).toContain('## Output Format');
      expect(TASK_BREAKDOWN_PROMPT).toContain('## Feature Context');
    });

    it('should include task structure template', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('taskId');
      expect(TASK_BREAKDOWN_PROMPT).toContain('taskName');
      expect(TASK_BREAKDOWN_PROMPT).toContain('description');
      expect(TASK_BREAKDOWN_PROMPT).toContain('category');
      expect(TASK_BREAKDOWN_PROMPT).toContain('estimatedHours');
    });

    it('should include context variable placeholders', () => {
      expect(TASK_BREAKDOWN_PROMPT).toContain('{{featureName}}');
      expect(TASK_BREAKDOWN_PROMPT).toContain('{{complexity}}');
      expect(TASK_BREAKDOWN_PROMPT).toContain('{{teamSize}}');
      expect(TASK_BREAKDOWN_PROMPT).toContain('{{deadline}}');
    });
  });

  describe('generateTaskBreakdownPrompt', () => {
    it('should return prompt without context', () => {
      const result = generateTaskBreakdownPrompt();

      expect(result).not.toContain('{{featureName}}');
      expect(result).not.toContain('{{complexity}}');
      expect(result).not.toContain('{{teamSize}}');
      expect(result).not.toContain('{{deadline}}');
    });

    it('should substitute all context variables', () => {
      const context: TaskBreakdownContext = {
        featureName: 'User Authentication System',
        complexity: 'high',
        teamSize: '3 developers',
        deadline: '4 weeks',
        techStack: 'Node.js, TypeScript, PostgreSQL'
      };

      const result = generateTaskBreakdownPrompt(context);

      expect(result).toContain('User Authentication System');
      expect(result).toContain('high');
      expect(result).toContain('3 developers');
      expect(result).toContain('4 weeks');
      expect(result).toContain('Node.js, TypeScript, PostgreSQL');
    });

    it('should handle partial context', () => {
      const context: TaskBreakdownContext = {
        featureName: 'API Integration',
        complexity: 'medium'
      };

      const result = generateTaskBreakdownPrompt(context);

      expect(result).toContain('API Integration');
      expect(result).toContain('medium');
      expect(result).toContain('{{teamSize}}'); // Should remain if not provided
      expect(result).toContain('{{deadline}}'); // Should remain if not provided
    });

    it('should replace undefined values with empty strings', () => {
      const context: TaskBreakdownContext = {
        featureName: 'Test Feature',
        complexity: undefined as any
      };

      const result = generateTaskBreakdownPrompt(context);

      expect(result).toContain('Test Feature');
      expect(result).not.toContain('undefined');
    });
  });
});

describe('Template Population Prompt', () => {
  describe('TEMPLATE_POPULATION_PROMPT', () => {
    it('should contain expected sections', () => {
      expect(TEMPLATE_POPULATION_PROMPT).toContain('technical documentation specialist');
      expect(TEMPLATE_POPULATION_PROMPT).toContain('## Your Task');
      expect(TEMPLATE_POPULATION_PROMPT).toContain('## Template Population Guidelines');
      expect(TEMPLATE_POPULATION_PROMPT).toContain('## Context Information');
    });

    it('should include workplan template structure', () => {
      expect(TEMPLATE_POPULATION_PROMPT).toContain('WORKPLAN-{{workplanId}}');
      expect(TEMPLATE_POPULATION_PROMPT).toContain('Feature Description');
      expect(TEMPLATE_POPULATION_PROMPT).toContain('Task Breakdown');
      expect(TEMPLATE_POPULATION_PROMPT).toContain('Progress Tracking');
    });

    it('should include context variable placeholders', () => {
      expect(TEMPLATE_POPULATION_PROMPT).toContain('{{workplanId}}');
      expect(TEMPLATE_POPULATION_PROMPT).toContain('{{featureTitle}}');
      expect(TEMPLATE_POPULATION_PROMPT).toContain('{{featureDescription}}');
      expect(TEMPLATE_POPULATION_PROMPT).toContain('{{taskList}}');
    });
  });

  describe('generateTemplatePopulationPrompt', () => {
    it('should return prompt without context', () => {
      const result = generateTemplatePopulationPrompt();

      expect(result).not.toContain('{{workplanId}}');
      expect(result).not.toContain('{{featureTitle}}');
      expect(result).not.toContain('{{featureDescription}}');
      expect(result).not.toContain('{{taskList}}');
    });

    it('should substitute all context variables', () => {
      const context: TemplatePopulationContext = {
        workplanId: 'AUTH-SYSTEM-V1',
        featureTitle: 'Authentication System',
        featureDescription: 'Comprehensive user authentication with JWT tokens',
        taskList: [
          { id: 'auth-1', name: 'Setup JWT library', category: 'setup', estimatedHours: 2 },
          { id: 'auth-2', name: 'Create login endpoint', category: 'development', estimatedHours: 4 }
        ],
        priority: 'high',
        deadline: '2024-02-15'
      };

      const result = generateTemplatePopulationPrompt(context);

      expect(result).toContain('AUTH-SYSTEM-V1');
      expect(result).toContain('Authentication System');
      expect(result).toContain('Comprehensive user authentication with JWT tokens');
      expect(result).toContain('high');
      expect(result).toContain('2024-02-15');
      expect(result).toContain('Setup JWT library');
      expect(result).toContain('Create login endpoint');
    });

    it('should handle empty task list', () => {
      const context: TemplatePopulationContext = {
        workplanId: 'TEST-001',
        featureTitle: 'Test Feature',
        featureDescription: 'Test description',
        taskList: []
      };

      const result = generateTemplatePopulationPrompt(context);

      expect(result).toContain('TEST-001');
      expect(result).toContain('Test Feature');
      expect(result).not.toContain('undefined');
    });

    it('should format task list properly', () => {
      const context: TemplatePopulationContext = {
        workplanId: 'TASK-FORMAT-TEST',
        featureTitle: 'Test',
        featureDescription: 'Test',
        taskList: [
          { id: 't1', name: 'Task 1', category: 'dev', estimatedHours: 1 },
          { id: 't2', name: 'Task 2', category: 'test', estimatedHours: 2, dependencies: ['t1'] }
        ]
      };

      const result = generateTemplatePopulationPrompt(context);

      expect(result).toContain('Task 1');
      expect(result).toContain('Task 2');
      expect(result).toContain('1 hour');
      expect(result).toContain('2 hours');
    });
  });
});

describe('Workplan ID utilities', () => {
  describe('generateWorkplanId', () => {
    it('should generate valid workplan ID from feature title', () => {
      const result = generateWorkplanId('User Authentication System');

      expect(result).toBe('USER-AUTHENTICATION-SYSTEM');
      expect(isValidWorkplanId(result)).toBe(true);
    });

    it('should handle special characters', () => {
      const result = generateWorkplanId('API Integration (v2.0) - REST & GraphQL');

      expect(result).toBe('API-INTEGRATION-V2-0-REST-GRAPHQL');
      expect(isValidWorkplanId(result)).toBe(true);
    });

    it('should handle very long titles', () => {
      const longTitle = 'This is a very long feature title that exceeds normal length expectations and should be truncated appropriately to maintain readability and file system compatibility';
      const result = generateWorkplanId(longTitle);

      expect(result.length).toBeLessThanOrEqual(50);
      expect(isValidWorkplanId(result)).toBe(true);
      expect(result).toMatch(/^[A-Z0-9-]+$/);
    });

    it('should handle empty or whitespace-only titles', () => {
      expect(generateWorkplanId('')).toBe('WORKPLAN');
      expect(generateWorkplanId('   ')).toBe('WORKPLAN');
      expect(generateWorkplanId('\t\n')).toBe('WORKPLAN');
    });

    it('should generate unique IDs with timestamp when needed', () => {
      const mockNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

      const result = generateWorkplanId('', true);

      expect(result).toBe('WORKPLAN-1234567890');
      expect(isValidWorkplanId(result)).toBe(true);

      mockNow.mockRestore();
    });

    it('should handle numbers and preserve them', () => {
      const result = generateWorkplanId('Feature v2.1 API 123');

      expect(result).toBe('FEATURE-V2-1-API-123');
      expect(isValidWorkplanId(result)).toBe(true);
    });

    it('should collapse multiple dashes', () => {
      const result = generateWorkplanId('Multiple---Dash--Feature');

      expect(result).toBe('MULTIPLE-DASH-FEATURE');
      expect(isValidWorkplanId(result)).toBe(true);
    });

    it('should remove leading and trailing dashes', () => {
      const result = generateWorkplanId('---Feature Name---');

      expect(result).toBe('FEATURE-NAME');
      expect(isValidWorkplanId(result)).toBe(true);
    });
  });

  describe('isValidWorkplanId', () => {
    it('should validate correct workplan IDs', () => {
      const validIds = [
        'FEATURE-123',
        'USER-AUTH-SYSTEM',
        'API-V2',
        'SIMPLE-FEATURE',
        'COMPLEX-FEATURE-WITH-MANY-PARTS',
        '123-NUMERIC-START',
        'FEATURE-123-456',
        'A',
        'WORKPLAN'
      ];

      validIds.forEach(id => {
        expect(isValidWorkplanId(id)).toBe(true);
      });
    });

    it('should reject invalid workplan IDs', () => {
      const invalidIds = [
        '',
        '   ',
        'feature-123',  // lowercase
        'FEATURE_123',  // underscore
        'FEATURE 123',  // space
        'FEATURE-123.0', // dot
        'FEATURE@123',  // special char
        '-FEATURE-123', // leading dash
        'FEATURE-123-', // trailing dash
        'FEATURE--123', // multiple dashes
        'FEATURE-123!', // exclamation
        'ÇFEATURE-123', // non-ASCII
      ];

      invalidIds.forEach(id => {
        expect(isValidWorkplanId(id)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(isValidWorkplanId(null as any)).toBe(false);
      expect(isValidWorkplanId(undefined as any)).toBe(false);
      expect(isValidWorkplanId(123 as any)).toBe(false);
      expect(isValidWorkplanId({} as any)).toBe(false);
    });
  });
});