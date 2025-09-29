/**
 * Prompt template for analyzing SPEC documents to extract features and requirements
 * for workplan generation. This prompt guides Claude to identify key elements
 * that need workplan documentation.
 */
export const SPEC_ANALYSIS_PROMPT = `
You are a technical documentation specialist analyzing a SPEC document to identify features and requirements that need workplan documentation.

## Your Task

Analyze the provided SPEC document and extract the following information:

1. **Primary Features**: Main features or capabilities described in the SPEC
2. **Requirements**: Specific requirements that need implementation
3. **Dependencies**: External dependencies or prerequisites mentioned
4. **Scope**: The overall scope and boundaries of the work
5. **Technical Constraints**: Any technical limitations or constraints specified

## Analysis Guidelines

- Focus on actionable features and requirements that need implementation work
- Identify features that would benefit from detailed workplan documentation
- Extract specific technical requirements with measurable outcomes
- Note any dependencies that affect implementation planning
- Identify scope boundaries to prevent scope creep

## Output Format

Provide your analysis in the following JSON structure:

\`\`\`json
{
  "specTitle": "Title of the SPEC document",
  "specId": "SPEC identifier (e.g., SPEC-FEATURE-NAME)",
  "primaryFeatures": [
    {
      "name": "Feature name",
      "description": "Brief description",
      "priority": "high|medium|low",
      "workplanCandidate": true|false,
      "rationale": "Why this needs/doesn't need a workplan"
    }
  ],
  "requirements": [
    {
      "id": "REQ-001",
      "description": "Requirement description",
      "type": "functional|non-functional|technical",
      "priority": "high|medium|low",
      "measurable": true|false
    }
  ],
  "dependencies": [
    {
      "name": "Dependency name",
      "type": "internal|external|library|service",
      "description": "Dependency description",
      "impact": "How this affects implementation"
    }
  ],
  "scope": {
    "included": ["What is included in scope"],
    "excluded": ["What is explicitly out of scope"],
    "assumptions": ["Key assumptions made"]
  },
  "technicalConstraints": [
    {
      "constraint": "Constraint description",
      "impact": "How this affects implementation",
      "mitigation": "Suggested mitigation strategy"
    }
  ],
  "recommendedWorkplans": [
    {
      "name": "WORKPLAN-FEATURE-NAME",
      "description": "What this workplan should cover",
      "features": ["List of features to include"],
      "estimatedComplexity": "low|medium|high",
      "justification": "Why this workplan is needed"
    }
  ]
}
\`\`\`

## Context Variables

{{#if projectContext}}
### Project Context
{{projectContext}}
{{/if}}

{{#if analysisGoals}}
### Analysis Goals
{{analysisGoals}}
{{/if}}

## SPEC Document to Analyze

The SPEC document content will be provided separately. Please analyze it thoroughly and provide the structured output above.

## Important Notes

- Focus on implementation-oriented features rather than abstract concepts
- Prioritize features that require coordination across multiple components
- Consider the effort required for implementation when recommending workplans
- Ensure workplan recommendations are specific and actionable
- Maintain consistency with existing project patterns and conventions
`;

export interface SpecAnalysisContext {
  projectContext?: string;
  analysisGoals?: string;
}

/**
 * Generate a SPEC analysis prompt with context variables filled in
 */
export function generateSpecAnalysisPrompt(context?: SpecAnalysisContext): string {
  let prompt = SPEC_ANALYSIS_PROMPT;

  if (context?.projectContext) {
    prompt = prompt.replace('{{projectContext}}', context.projectContext);
    prompt = prompt.replace('{{#if projectContext}}', '');
    prompt = prompt.replace('{{/if}}', '');
  } else {
    prompt = prompt.replace(/{{#if projectContext}}[\s\S]*?{{\/if}}/g, '');
  }

  if (context?.analysisGoals) {
    prompt = prompt.replace('{{analysisGoals}}', context.analysisGoals);
    prompt = prompt.replace('{{#if analysisGoals}}', '');
    prompt = prompt.replace('{{/if}}', '');
  } else {
    prompt = prompt.replace(/{{#if analysisGoals}}[\s\S]*?{{\/if}}/g, '');
  }

  return prompt.trim();
}