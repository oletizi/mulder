/**
 * Example usage of the TemplateRenderer for Phase 3 implementation.
 * This demonstrates how to use the template rendering system.
 */
import { TemplateRenderer } from '../src/services/template-renderer';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Create a template renderer instance
  const renderer = new TemplateRenderer();

  // Path to the default template
  const templatePath = path.resolve(__dirname, '../templates/default-workplan.md');

  // Define variables for template substitution
  const variables = {
    featureId: 'EXAMPLE',
    featureName: 'Example Feature Implementation',
    featureDescription: 'This example demonstrates the template rendering capabilities implemented in Phase 3.',
    goals: '- Demonstrate template rendering\n- Show variable substitution\n- Validate markdown formatting',
    taskBreakdown: '### Phase 1: Setup\n\n- [x] Create template renderer\n- [x] Implement variable substitution\n\n### Phase 2: Testing\n\n- [x] Write comprehensive tests\n- [x] Validate template integration',
    currentPhase: 'Phase 3: Demonstration',
    blockers: 'None',
    nextStep: 'Integrate with Claude Code CLI',
    milestones: '- [x] Week 1: Template system complete\n- [ ] Week 2: Claude integration',
    technicalDecisions: '- Use TypeScript strict mode for type safety\n- Implement dependency injection for testability\n- Support {{variable}} syntax for consistency',
    dependencies: '- TypeScript\n- Jest for testing\n- Node.js fs/promises for file operations',
    fileStructure: '```\nsrc/\n├── services/\n│   └── template-renderer.ts\n├── interfaces/\n│   └── workplan-template.ts\ntemplates/\n└── default-workplan.md\n```',
    openQuestions: '- Should we support nested variable references?\n- How to handle conditional sections?',
    designRationale: 'The template system provides consistency across workplan generation while maintaining flexibility through variable substitution.',
    futureConsiderations: '- Support for custom template formats\n- Template validation and linting\n- Integration with version control systems',
  };

  try {
    // Render the template with variables
    const renderedWorkplan = await renderer.renderFromFile(templatePath, variables);

    console.log('Generated Workplan:');
    console.log('='.repeat(80));
    console.log(renderedWorkplan);
    console.log('='.repeat(80));
    console.log('Template rendering completed successfully!');

  } catch (error: any) {
    console.error('Template rendering failed:', error.message);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
// Note: In ES modules, there's no direct equivalent to require.main === module
// This will run when the file is executed directly
main().catch((error) => {
  console.error('Example execution failed:', error);
  process.exit(1);
});

export { main as runTemplateExample };