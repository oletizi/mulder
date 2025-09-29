import { TemplateRenderer } from '@/services/template-renderer';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Default Template Integration', () => {
  let renderer: TemplateRenderer;
  const templatePath = path.resolve(__dirname, '../../templates/default-workplan.md');

  beforeEach(() => {
    renderer = new TemplateRenderer();
  });

  it('should render default template with all variables', async () => {
    const variables = {
      featureId: 'FEATURE1',
      featureName: 'Test Feature',
      featureDescription: 'This is a comprehensive test feature that demonstrates workplan generation.',
      goals: '- Implement core functionality\n- Ensure proper testing\n- Document usage patterns',
      taskBreakdown: '### Phase 1: Setup\n\n- [ ] Initialize project structure\n- [ ] Configure build pipeline\n\n### Phase 2: Implementation\n\n- [ ] Create core classes\n- [ ] Add validation logic',
      currentPhase: 'Phase 1: Setup',
      blockers: 'None',
      nextStep: 'Complete project initialization',
      milestones: '- [ ] Week 1: Complete Phase 1\n- [ ] Week 2: Complete Phase 2',
      technicalDecisions: '- Use TypeScript strict mode\n- Follow dependency injection pattern\n- Maintain high test coverage',
      dependencies: '- TypeScript\n- Jest for testing\n- @oletizi/mulder-specs',
      fileStructure: '```\nsrc/\n├── interfaces/\n│   └── feature.ts\n├── services/\n│   └── processor.ts\n└── index.ts\n```',
      openQuestions: '- Should we support multiple output formats?\n- How to handle concurrent workplan updates?',
      designRationale: 'Template-based approach ensures consistency across all generated workplans.\nDependency injection enables comprehensive unit testing.',
      futureConsiderations: '- Support for custom templates\n- Integration with version control\n- Automated progress tracking',
    };

    const result = await renderer.renderFromFile(templatePath, variables);

    // Verify header is properly rendered
    expect(result).toContain('# WORKPLAN-FEATURE1: Test Feature');

    // Verify sections are present
    expect(result).toContain('## Feature Description');
    expect(result).toContain('This is a comprehensive test feature');

    expect(result).toContain('## Goals & Objectives');
    expect(result).toContain('- Implement core functionality');

    expect(result).toContain('## Task Breakdown');
    expect(result).toContain('### Phase 1: Setup');
    expect(result).toContain('- [ ] Initialize project structure');

    expect(result).toContain('## Progress Tracking');
    expect(result).toContain('### Current Status');
    expect(result).toContain('- **Phase**: Phase 1: Setup');
    expect(result).toContain('- **Blockers**: None');
    expect(result).toContain('- **Next Step**: Complete project initialization');

    expect(result).toContain('### Milestones');
    expect(result).toContain('- [ ] Week 1: Complete Phase 1');

    expect(result).toContain('## Implementation Notes');
    expect(result).toContain('### Technical Decisions');
    expect(result).toContain('- Use TypeScript strict mode');

    expect(result).toContain('### Dependencies');
    expect(result).toContain('- TypeScript');

    expect(result).toContain('### File Structure');
    expect(result).toContain('```\nsrc/');

    expect(result).toContain('## Notes and Decisions');
    expect(result).toContain('### Open Questions');
    expect(result).toContain('- Should we support multiple output formats?');

    expect(result).toContain('### Design Rationale');
    expect(result).toContain('Template-based approach ensures consistency');

    expect(result).toContain('### Future Considerations');
    expect(result).toContain('- Support for custom templates');
  });

  it('should handle missing optional variables gracefully', async () => {
    const minimalVariables = {
      featureId: 'MINIMAL',
      featureName: 'Minimal Feature',
      featureDescription: 'Basic feature description',
      goals: 'Basic goals',
      taskBreakdown: 'Basic tasks',
      currentPhase: 'Phase 1',
      blockers: 'None',
      nextStep: 'Continue',
      milestones: 'TBD',
      technicalDecisions: 'TBD',
      dependencies: 'TBD',
      fileStructure: 'TBD',
      openQuestions: 'None',
      designRationale: 'TBD',
      futureConsiderations: 'TBD',
    };

    const result = await renderer.renderFromFile(templatePath, minimalVariables);

    expect(result).toContain('# WORKPLAN-MINIMAL: Minimal Feature');
    expect(result).toContain('Basic feature description');
    expect(result).not.toContain('{{');  // No unresolved variables
  });

  it('should preserve markdown structure in rendered output', async () => {
    const variables = {
      featureId: 'STRUCT',
      featureName: 'Structure Test',
      featureDescription: 'Testing markdown structure preservation',
      goals: '- Goal 1\n- Goal 2',
      taskBreakdown: '### Tasks\n\n- [ ] Task 1\n- [ ] Task 2',
      currentPhase: 'Testing',
      blockers: 'None',
      nextStep: 'Validate',
      milestones: '- [ ] Milestone 1',
      technicalDecisions: '- Decision 1',
      dependencies: '- Dependency 1',
      fileStructure: '```\nstructure\n```',
      openQuestions: '- Question 1',
      designRationale: 'Rationale text',
      futureConsiderations: '- Consideration 1',
    };

    const result = await renderer.renderFromFile(templatePath, variables);

    // Check that headings are properly formatted
    expect(result).toMatch(/^# WORKPLAN-STRUCT: Structure Test$/m);
    expect(result).toMatch(/^## Feature Description$/m);
    expect(result).toMatch(/^### Goals & Objectives$/m);
    expect(result).toMatch(/^### Tasks$/m);

    // Check that lists are preserved
    expect(result).toContain('- Goal 1\n- Goal 2');
    expect(result).toContain('- [ ] Task 1\n- [ ] Task 2');

    // Check that code blocks are preserved
    expect(result).toContain('```\nstructure\n```');
  });
});