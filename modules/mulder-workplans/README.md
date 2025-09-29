# @oletizi/mulder-workplans

Tooling to create and manage workplan documents for agentic projects using Claude Code integration.

## Purpose

This module provides tools to create, manage, and track workplan documents that help AI agents stay on task across sessions and contexts. Workplans serve as:

- **Active plans** - Keep agents focused and scope their activities
- **Progress documentation** - Track implementation progress as work proceeds
- **Historical records** - Archive completed work for future reference

Workplans are especially useful for complex, multi-session projects where maintaining context and tracking progress is essential.

## Installation

```bash
npm install @oletizi/mulder-workplans
```

## Quick Start

### Basic Workplan Creation

```typescript
import { createWorkplan } from '@oletizi/mulder-workplans';

// Create a workplan for a specific feature from a SPEC document
const workplanPath = await createWorkplan(
  '/path/to/SPEC-PROJECT.md',
  'feature-authentication'
);

console.log(`Workplan created at: ${workplanPath}`);
// Output: Workplan created at: /path/to/WORKPLAN-FEATURE-AUTHENTICATION.md
```

### Advanced Configuration

```typescript
import { createWorkplanCreator, type WorkplanOptions } from '@oletizi/mulder-workplans';

const options: WorkplanOptions = {
  outputDir: '/path/to/workplans',
  overwrite: true,
  timeoutMs: 600000, // 10 minutes
  validation: {
    validateMarkdown: true,
    validateSections: true
  },
  claudeCodeArgs: ['--model', 'claude-3-5-sonnet-20241022']
};

const creator = createWorkplanCreator();
const workplanPath = await creator.create(
  '/path/to/SPEC-PROJECT.md',
  'feature-authentication',
  options
);
```

### Error Handling

```typescript
import { createWorkplan } from '@oletizi/mulder-workplans';

try {
  const workplanPath = await createWorkplan(
    '/path/to/SPEC-PROJECT.md',
    'feature-authentication'
  );
  console.log(`Success: ${workplanPath}`);
} catch (error) {
  if (error.message.includes('SPEC document does not exist')) {
    console.error('The SPEC file could not be found');
  } else if (error.message.includes('Feature ID not found')) {
    console.error('The specified feature does not exist in the SPEC');
  } else if (error.message.includes('Claude Code CLI is not available')) {
    console.error('Please install Claude Code CLI');
  } else {
    console.error('Workplan creation failed:', error.message);
  }
}
```

## API Reference

### Main Functions

#### `createWorkplan(specPath, featureId, options?)`

Creates a workplan document for a specific feature from a SPEC document.

**Parameters:**
- `specPath` (string): Absolute path to the SPEC document
- `featureId` (string): Identifier of the feature to create workplan for
- `options` (WorkplanOptions, optional): Configuration options

**Returns:** `Promise<string>` - Path to the created workplan file

**Example:**
```typescript
const workplanPath = await createWorkplan(
  '/Users/dev/project/SPEC-API.md',
  'user-authentication'
);
```

#### `createWorkplanCreator(options?)`

Factory function to create a WorkplanCreator instance with custom configuration.

**Parameters:**
- `options` (WorkplanCreatorOptions, optional): Service configuration

**Returns:** `WorkplanCreatorService` instance

**Example:**
```typescript
const creator = createWorkplanCreator({
  defaultTemplate: customTemplate,
  claudeIntegration: mockClaude // For testing
});
```

### Interfaces

#### `WorkplanOptions`

Configuration options for workplan creation.

```typescript
interface WorkplanOptions {
  /** Directory where the workplan file should be created */
  readonly outputDir?: string;

  /** Custom template to use for workplan generation */
  readonly template?: WorkplanTemplate;

  /** Path to custom Claude Code executable */
  readonly claudeCodePath?: string;

  /** Additional arguments to pass to Claude Code CLI */
  readonly claudeCodeArgs?: readonly string[];

  /** Timeout in milliseconds for Claude Code execution (default: 300000) */
  readonly timeoutMs?: number;

  /** Whether to overwrite existing workplan files (default: false) */
  readonly overwrite?: boolean;

  /** Validation options for the generated workplan */
  readonly validation?: {
    readonly validateMarkdown?: boolean; // default: true
    readonly validateSections?: boolean; // default: true
  };
}
```

#### `WorkplanCreator`

Interface for creating workplan documents.

```typescript
interface WorkplanCreator {
  create(
    specPath: string,
    featureId: string,
    options?: WorkplanOptions
  ): Promise<string>;
}
```

#### `WorkplanTemplate`

Interface for custom workplan templates.

```typescript
interface WorkplanTemplate {
  readonly name: string;
  readonly version: string;
  readonly sections: readonly TemplateSection[];
  readonly variables: readonly TemplateVariable[];
}

interface TemplateSection {
  readonly title: string;
  readonly content: string;
  readonly required: boolean;
  readonly order: number;
}

interface TemplateVariable {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly defaultValue?: string;
}
```

### Utilities

#### SPEC Parsing

```typescript
import { createSpecParser, type SpecFeature } from '@oletizi/mulder-workplans';

const parser = createSpecParser();
const feature = await parser.findFeature('/path/to/SPEC.md', 'feature-id');

console.log(feature.title);      // Feature title
console.log(feature.description); // Feature description
console.log(feature.type);        // 'feature' | 'requirement'
```

#### Claude Integration

```typescript
import { createClaudeIntegration } from '@oletizi/mulder-workplans';

const claude = createClaudeIntegration({
  timeout: 300000,
  cliPath: '/usr/local/bin/claude'
});

const isAvailable = await claude.checkAvailability();
if (!isAvailable) {
  throw new Error('Claude Code CLI not found');
}
```

## Configuration Examples

### Custom Template

```typescript
import { type WorkplanTemplate } from '@oletizi/mulder-workplans';

const customTemplate: WorkplanTemplate = {
  name: 'Agile Sprint Template',
  version: '1.0.0',
  sections: [
    {
      title: 'Sprint Overview',
      content: '## Sprint Overview\n\n{{featureDescription}}',
      required: true,
      order: 1
    },
    {
      title: 'User Stories',
      content: '## User Stories\n\n- [ ] As a user...',
      required: true,
      order: 2
    },
    {
      title: 'Definition of Done',
      content: '## Definition of Done\n\n- [ ] Code reviewed\n- [ ] Tests passing',
      required: true,
      order: 3
    }
  ],
  variables: [
    {
      name: 'featureDescription',
      description: 'Description of the feature being implemented',
      required: true
    }
  ]
};

const workplanPath = await createWorkplan(
  '/path/to/SPEC.md',
  'feature-id',
  { template: customTemplate }
);
```

### Claude Code Configuration

```typescript
const options: WorkplanOptions = {
  claudeCodePath: '/usr/local/bin/claude',
  claudeCodeArgs: [
    '--model', 'claude-3-5-sonnet-20241022',
    '--max-tokens', '4000',
    '--temperature', '0.7'
  ],
  timeoutMs: 600000 // 10 minutes for complex workplans
};
```

### Validation Configuration

```typescript
const options: WorkplanOptions = {
  validation: {
    validateMarkdown: true,  // Ensure proper markdown syntax
    validateSections: true   // Ensure required template sections are present
  }
};
```

## Error Handling Patterns

### Common Error Scenarios

```typescript
import { createWorkplan } from '@oletizi/mulder-workplans';

async function createWorkplanSafely(specPath: string, featureId: string) {
  try {
    return await createWorkplan(specPath, featureId);
  } catch (error) {
    // Handle specific error types
    if (error.message.includes('SPEC document does not exist')) {
      throw new Error(`SPEC file not found: ${specPath}`);
    }

    if (error.message.includes('Feature ID not found')) {
      throw new Error(`Feature '${featureId}' not found in SPEC document`);
    }

    if (error.message.includes('Claude Code CLI is not available')) {
      throw new Error(
        'Claude Code CLI is required. Install it with: npm install -g claude-cli'
      );
    }

    if (error.message.includes('Workplan already exists')) {
      throw new Error(
        `Workplan already exists. Use {overwrite: true} to replace it.`
      );
    }

    if (error.message.includes('Claude Code execution failed')) {
      throw new Error(
        `AI generation failed. This might be due to network issues or invalid SPEC content.`
      );
    }

    // Re-throw unexpected errors
    throw error;
  }
}
```

### Retry Logic

```typescript
async function createWorkplanWithRetry(
  specPath: string,
  featureId: string,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createWorkplan(specPath, featureId);
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

function isRetryableError(error: Error): boolean {
  return error.message.includes('Claude Code execution failed') ||
         error.message.includes('timeout');
}
```

## CLI Usage

The module also provides a CLI for command-line usage:

```bash
# Create a workplan from SPEC
npx mulder-workplans create SPEC-PROJECT.md feature-authentication

# With custom output directory
npx mulder-workplans create SPEC-PROJECT.md feature-auth --output ./workplans

# With overwrite option
npx mulder-workplans create SPEC-PROJECT.md feature-auth --overwrite
```

## Requirements

- Node.js 18+ (ES modules support required)
- Claude Code CLI installed and accessible in PATH
- TypeScript 5.0+ (for development)

## Architecture

The module follows a clean architecture pattern with:

- **Interfaces**: Define contracts for all major components
- **Services**: Implement business logic with dependency injection
- **Utilities**: Provide reusable functionality (SPEC parsing, etc.)
- **Integration**: Handle external dependencies (Claude Code CLI)

All components are designed for testability using dependency injection patterns.

## License

MIT