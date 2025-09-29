/**
 * Prompt template for populating workplan templates with feature-specific content.
 * This prompt guides Claude to fill in workplan templates with the analyzed
 * feature data and generated task breakdowns.
 */
export const TEMPLATE_POPULATION_PROMPT = `
You are a technical documentation specialist responsible for creating comprehensive workplan documents from analyzed requirements and task breakdowns.

## Your Task

Using the provided workplan template, feature analysis, and task breakdown, generate a complete workplan document that follows the established format and conventions.

## Input Data

You will receive:
1. **Workplan Template**: The base template structure to populate
2. **Feature Analysis**: Analyzed features and requirements from SPEC
3. **Task Breakdown**: Detailed task lists with phases and estimates
4. **Project Context**: Development conventions and standards

## Template Population Guidelines

### Content Quality Standards
- **Clarity**: Use clear, unambiguous language
- **Completeness**: Address all template sections thoroughly
- **Consistency**: Maintain consistent terminology and formatting
- **Actionability**: Ensure all tasks and goals are actionable
- **Measurability**: Include clear success criteria and metrics

### Section-Specific Guidelines

#### Feature Description
- Provide clear, concise feature overview
- Include business value and user impact
- Reference relevant SPEC sections
- Define scope boundaries clearly

#### Task Breakdown
- Organize tasks into logical phases
- Include realistic time estimates
- Define clear acceptance criteria
- Identify dependencies and prerequisites
- Include risk mitigation strategies

#### Progress Tracking
- Set up meaningful milestones
- Define progress measurement criteria
- Include review checkpoints
- Plan for status reporting

#### Implementation Notes
- Document technical decisions and rationale
- Include architecture considerations
- Note integration points and dependencies
- Record assumptions and constraints

## Output Format

Generate a complete markdown workplan document following this structure:

\`\`\`markdown
# WORKPLAN-{{workplanId}}: {{featureTitle}}

## Feature Description

{{featureDescription}}

### Goals & Objectives

{{goalsAndObjectives}}

## Task Breakdown

{{taskBreakdownSections}}

## Progress Tracking

### Current Status

{{currentStatus}}

### Milestones

{{milestones}}

## Implementation Notes

### Technical Decisions

{{technicalDecisions}}

### Dependencies

{{dependencies}}

### Open Questions

{{openQuestions}}

### Design Rationale

{{designRationale}}

### Future Considerations

{{futureConsiderations}}
\`\`\`

## Context Variables

{{#if workplanTemplate}}
### Workplan Template
{{workplanTemplate}}
{{/if}}

{{#if projectConventions}}
### Project Conventions
{{projectConventions}}
{{/if}}

{{#if namingConventions}}
### Naming Conventions
{{namingConventions}}
{{/if}}

{{#if qualityStandards}}
### Quality Standards
{{qualityStandards}}
{{/if}}

## Feature Analysis and Task Breakdown

The feature analysis and task breakdown data will be provided separately. Use this information to populate the template sections appropriately.

## Formatting Requirements

### Markdown Standards
- Use proper heading hierarchy (H1 for title, H2 for main sections, etc.)
- Include checkboxes for tasks: \`- [ ] Task description\`
- Use code blocks for technical details
- Include tables for structured data when appropriate
- Use consistent bullet point styles

### Content Organization
- Group related tasks under appropriate phase headings
- Use numbered lists for sequential steps
- Include estimated durations in task descriptions
- Cross-reference related tasks and dependencies
- Include links to relevant documentation

### Quality Checks
Before finalizing the workplan:
- Verify all template sections are populated
- Check that task dependencies are clearly defined
- Ensure acceptance criteria are measurable
- Confirm time estimates are realistic
- Validate that milestones align with project goals

## Template Variables

When populating template variables:
- **workplanId**: Extract from feature name using WORKPLAN-FEATURE-NAME format
- **featureTitle**: Use clear, descriptive title from feature analysis
- **taskBreakdownSections**: Convert task breakdown into organized markdown sections
- **milestones**: Extract key milestones from task breakdown
- **dependencies**: List all internal and external dependencies
- **technicalDecisions**: Document key architectural and implementation decisions

## Common Patterns

### Task Formatting
\`\`\`markdown
### Phase N: Phase Name

- [ ] **Task Title** (Complexity: M, Est: 8h)
  - Description: Detailed task description
  - Acceptance Criteria:
    - Specific, measurable criterion 1
    - Specific, measurable criterion 2
  - Dependencies: TASK-001, External-Service-Setup
  - Deliverables: What this task produces
\`\`\`

### Milestone Formatting
\`\`\`markdown
- [ ] **Week N**: Milestone Name
  - Complete Phase X tasks
  - Deliverables: List of key deliverables
  - Success Criteria: How to measure success
\`\`\`

### Dependency Formatting
\`\`\`markdown
- **Internal**: Module or component dependencies
- **External**: Third-party services, libraries, or tools
- **Resource**: Team members, hardware, or access requirements
\`\`\`

## Error Handling

If template sections or required data are missing:
- Include placeholder sections with clear TODO markers
- Document what information is needed
- Suggest follow-up actions to gather missing data
- Maintain document structure even with incomplete data

Generate a complete, professional workplan document that enables successful feature implementation and project tracking.
`;

export interface TemplatePopulationContext {
  workplanTemplate?: string;
  projectConventions?: string;
  namingConventions?: string;
  qualityStandards?: string;
  workplanId?: string;
  featureTitle?: string;
}

/**
 * Generate a template population prompt with context variables filled in
 */
export function generateTemplatePopulationPrompt(context?: TemplatePopulationContext): string {
  let prompt = TEMPLATE_POPULATION_PROMPT;

  // Replace simple variables
  if (context?.workplanId) {
    prompt = prompt.replace('{{workplanId}}', context.workplanId);
  }
  if (context?.featureTitle) {
    prompt = prompt.replace('{{featureTitle}}', context.featureTitle);
  }

  // Handle conditional sections
  const conditionals = [
    'workplanTemplate',
    'projectConventions',
    'namingConventions',
    'qualityStandards'
  ] as const;

  for (const conditional of conditionals) {
    const value = context?.[conditional];
    if (value) {
      prompt = prompt.replace(`{{${conditional}}}`, value);
      prompt = prompt.replace(`{{#if ${conditional}}}`, '');
      prompt = prompt.replace('{{/if}}', '');
    } else {
      const regex = new RegExp(`{{#if ${conditional}}}[\\s\\S]*?{{/if}}`, 'g');
      prompt = prompt.replace(regex, '');
    }
  }

  return prompt.trim();
}

/**
 * Extract workplan ID from feature name following naming convention
 * Converts feature names to WORKPLAN-FEATURE-NAME format
 */
export function generateWorkplanId(featureName: string): string {
  // Convert to uppercase and replace spaces/special chars with hyphens
  const sanitized = featureName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  return `WORKPLAN-${sanitized}`;
}

/**
 * Validate workplan ID format
 */
export function isValidWorkplanId(workplanId: string): boolean {
  const pattern = /^WORKPLAN-[A-Z0-9]+(-[A-Z0-9]+)*$/;
  return pattern.test(workplanId);
}