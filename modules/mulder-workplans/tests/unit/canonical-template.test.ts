import { TemplateRenderer } from '@/services/template-renderer';
import * as path from 'path';

describe('Canonical Template', () => {
  let renderer: TemplateRenderer;
  const templatesDir = path.resolve(__dirname, '../../templates');

  beforeEach(() => {
    renderer = new TemplateRenderer();
  });

  describe('canonical-workplan.md', () => {
    it('should render canonical template with all variables', async () => {
      const templatePath = path.join(templatesDir, 'canonical-workplan.md');
      const variables = {
        featureId: 'FEATURE1',
        featureName: 'Test Feature Implementation',
        featureDescription: 'Implement a comprehensive test feature that demonstrates the workplan system.',
        goals: '- Provide clear feature specifications\n- Enable systematic development approach\n- Ensure comprehensive testing coverage',
        taskBreakdown: '### Phase 1: Setup\n\n- [ ] Initialize project structure\n- [ ] Configure dependencies\n\n### Phase 2: Implementation\n\n- [ ] Implement core functionality\n- [ ] Add error handling\n\n### Phase 3: Testing\n\n- [ ] Unit tests\n- [ ] Integration tests',
        currentPhase: 'Phase 1: Setup',
        blockers: 'None identified',
        nextStep: 'Initialize project structure',
        milestones: '- [ ] Week 1: Complete Phase 1\n- [ ] Week 2: Complete Phase 2\n- [ ] Week 3: Complete Phase 3',
        technicalDecisions: '- Use TypeScript for type safety\n- Implement dependency injection pattern\n- Follow @/ import conventions',
        dependencies: '- TypeScript (strict mode)\n- Jest (for testing)\n- Node.js 18+',
        fileStructure: '```\nsrc/\n├── interfaces/\n├── services/\n├── utils/\n└── index.ts\n```',
        openQuestions: '- Should we support multiple template formats?\n- How to handle version compatibility?',
        designRationale: '- Template-based approach ensures consistency\n- Variable substitution enables customization\n- Markdown format maintains readability',
        futureConsiderations: '- Support for custom templates\n- Integration with version control\n- Automated progress tracking'
      };

      const result = await renderer.renderFromFile(templatePath, variables);

      // Verify header
      expect(result).toContain('# WORKPLAN-FEATURE1: Test Feature Implementation');

      // Verify feature description section
      expect(result).toContain('## Feature Description');
      expect(result).toContain('Implement a comprehensive test feature');
      expect(result).toContain('### Goals & Objectives');
      expect(result).toContain('- Provide clear feature specifications');

      // Verify task breakdown section
      expect(result).toContain('## Task Breakdown');
      expect(result).toContain('### Phase 1: Setup');
      expect(result).toContain('- [ ] Initialize project structure');
      expect(result).toContain('### Phase 2: Implementation');
      expect(result).toContain('### Phase 3: Testing');

      // Verify progress tracking section
      expect(result).toContain('## Progress Tracking');
      expect(result).toContain('### Current Status');
      expect(result).toContain('- **Phase**: Phase 1: Setup');
      expect(result).toContain('- **Blockers**: None identified');
      expect(result).toContain('- **Next Step**: Initialize project structure');
      expect(result).toContain('### Milestones');
      expect(result).toContain('- [ ] Week 1: Complete Phase 1');

      // Verify implementation notes section
      expect(result).toContain('## Implementation Notes');
      expect(result).toContain('### Technical Decisions');
      expect(result).toContain('- Use TypeScript for type safety');
      expect(result).toContain('### Dependencies');
      expect(result).toContain('- TypeScript (strict mode)');
      expect(result).toContain('### File Structure');
      expect(result).toContain('```\nsrc/');

      // Verify notes and decisions section
      expect(result).toContain('## Notes and Decisions');
      expect(result).toContain('### Open Questions');
      expect(result).toContain('- Should we support multiple template formats?');
      expect(result).toContain('### Design Rationale');
      expect(result).toContain('- Template-based approach ensures consistency');
      expect(result).toContain('### Future Considerations');
      expect(result).toContain('- Support for custom templates');
    });

    it('should handle missing optional variables gracefully', async () => {
      const templatePath = path.join(templatesDir, 'canonical-workplan.md');
      const variables = {
        featureId: 'MINIMAL',
        featureName: 'Minimal Feature',
        featureDescription: 'A minimal feature example.',
        goals: '- Basic goal',
        taskBreakdown: '- [ ] Basic task',
        // Missing optional variables should render as placeholders
      };

      const result = await renderer.renderFromFile(templatePath, variables);

      expect(result).toContain('# WORKPLAN-MINIMAL: Minimal Feature');
      expect(result).toContain('A minimal feature example.');
      expect(result).toContain('- [ ] Basic task');

      // Unresolved variables should remain as placeholders
      expect(result).toContain('{{currentPhase}}');
      expect(result).toContain('{{blockers}}');
      expect(result).toContain('{{nextStep}}');
    });
  });

  describe('enhanced-canonical-workplan.md', () => {
    it('should render enhanced template with phase-specific variables', async () => {
      const templatePath = path.join(templatesDir, 'enhanced-canonical-workplan.md');
      const variables = {
        featureId: 'ENHANCED1',
        featureName: 'Enhanced Feature',
        featureDescription: 'An enhanced feature with detailed phase breakdown.',
        goals: '- Demonstrate enhanced template capabilities',
        phaseOneName: 'Phase 1: Foundation',
        phaseOneTaskBreakdown: '- [ ] Set up development environment\n- [ ] Define interfaces\n- [ ] Create base classes',
        phaseTwoName: 'Phase 2: Core Implementation',
        phaseTwoTaskBreakdown: '- [ ] Implement main functionality\n- [ ] Add error handling\n- [ ] Write unit tests',
        phaseThreeName: 'Phase 3: Integration',
        phaseThreeTaskBreakdown: '- [ ] Integration testing\n- [ ] Performance optimization\n- [ ] Documentation',
        additionalPhases: '### Phase 4: Deployment\n\n- [ ] Prepare production build\n- [ ] Deploy to staging\n- [ ] Production deployment',
        currentPhase: 'Phase 1: Foundation',
        blockers: 'Waiting for API specifications',
        nextStep: 'Set up development environment',
        milestones: '- [ ] Q1: Complete foundation work\n- [ ] Q2: Core implementation\n- [ ] Q3: Integration and deployment',
        technicalDecisions: '- Use microservices architecture\n- Implement event-driven design\n- Use container-based deployment',
        dependencies: '- Docker\n- Kubernetes\n- Redis\n- PostgreSQL',
        fileStructure: '```\nsrc/\n├── services/\n│   ├── api/\n│   ├── workers/\n│   └── shared/\n├── config/\n└── tests/\n```',
        integrationStrategyTitle: 'Integration Strategy',
        integrationStrategy: '1. API Gateway pattern for service communication\n2. Event sourcing for state management\n3. Circuit breaker pattern for resilience',
        openQuestions: '- How to handle service discovery?\n- What monitoring tools to use?',
        designRationale: '- Microservices enable independent scaling\n- Event-driven architecture improves resilience\n- Container deployment ensures consistency',
        futureConsiderations: '- Service mesh implementation\n- Advanced monitoring and alerting\n- Multi-region deployment'
      };

      const result = await renderer.renderFromFile(templatePath, variables);

      // Verify header
      expect(result).toContain('# WORKPLAN-ENHANCED1: Enhanced Feature');

      // Verify phase-specific task breakdowns
      expect(result).toContain('### Phase 1: Foundation');
      expect(result).toContain('- [ ] Set up development environment');
      expect(result).toContain('### Phase 2: Core Implementation');
      expect(result).toContain('- [ ] Implement main functionality');
      expect(result).toContain('### Phase 3: Integration');
      expect(result).toContain('- [ ] Integration testing');

      // Verify additional phases
      expect(result).toContain('### Phase 4: Deployment');
      expect(result).toContain('- [ ] Prepare production build');

      // Verify integration strategy section
      expect(result).toContain('### Integration Strategy');
      expect(result).toContain('1. API Gateway pattern for service communication');

      // Verify enhanced file structure
      expect(result).toContain('├── services/');
      expect(result).toContain('│   ├── api/');
    });
  });

  describe('markdown formatting', () => {
    it('should maintain proper markdown structure and formatting', async () => {
      const templatePath = path.join(templatesDir, 'canonical-workplan.md');
      const variables = {
        featureId: 'FORMAT-TEST',
        featureName: 'Format Test',
        featureDescription: 'Test markdown formatting.',
        goals: '- Test goal',
        taskBreakdown: '- [ ] Test task',
        currentPhase: 'Testing',
        blockers: 'None',
        nextStep: 'Continue testing',
        milestones: '- [ ] Test milestone',
        technicalDecisions: '- Test decision',
        dependencies: '- Test dependency',
        fileStructure: '```\ntest/\n└── file.ts\n```',
        openQuestions: '- Test question?',
        designRationale: '- Test rationale',
        futureConsiderations: '- Test consideration'
      };

      const result = await renderer.renderFromFile(templatePath, variables);

      // Verify proper heading hierarchy
      expect(result).toMatch(/^# WORKPLAN-FORMAT-TEST: Format Test$/m);
      expect(result).toMatch(/^## Feature Description$/m);
      expect(result).toMatch(/^### Goals & Objectives$/m);
      expect(result).toMatch(/^## Task Breakdown$/m);
      expect(result).toMatch(/^## Progress Tracking$/m);
      expect(result).toMatch(/^### Current Status$/m);
      expect(result).toMatch(/^### Milestones$/m);
      expect(result).toMatch(/^## Implementation Notes$/m);
      expect(result).toMatch(/^### Technical Decisions$/m);
      expect(result).toMatch(/^### Dependencies$/m);
      expect(result).toMatch(/^### File Structure$/m);
      expect(result).toMatch(/^## Notes and Decisions$/m);
      expect(result).toMatch(/^### Open Questions$/m);
      expect(result).toMatch(/^### Design Rationale$/m);
      expect(result).toMatch(/^### Future Considerations$/m);

      // Verify no excessive newlines
      expect(result).not.toContain('\n\n\n');

      // Verify proper list formatting
      expect(result).toMatch(/^- \[ \] Test task$/m);
      expect(result).toMatch(/^- \[ \] Test milestone$/m);
      expect(result).toMatch(/^- Test decision$/m);

      // Verify code block formatting
      expect(result).toContain('```\ntest/\n└── file.ts\n```');

      // Verify proper line endings
      expect(result.endsWith('\n')).toBe(true);
      expect(result.endsWith('\n\n')).toBe(false);
    });
  });
});