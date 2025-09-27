# Claude AI Agent Guidelines

This document provides guidelines for AI agents (including Claude Code) working on this project. It ensures consistency with architectural principles, quality standards, and development patterns.

## Core Requirements

### Import Pattern

- **ALWAYS use the `@/` import pattern** for internal modules
- Configure pattern in `tsconfig.json` with path mapping
- Examples:
  ```typescript
  import { Scanner } from '@/utils/scanner';
  import { Entry } from '@/types/entry';
  import { Processor } from '@/services/processor';
  ```

### Error Handling

- **Never implement fallbacks or use mock data outside of test code**
- **Throw errors with descriptive messages** instead of fallbacks
- Errors let us know that something isn't implemented
- Fallbacks and mock data are bug factories

```typescript
// ✅ GOOD: Throw descriptive errors
if (!apiKey) {
  throw new Error('API key is required but not configured');
}

// ❌ BAD: Using fallbacks
const apiKey = process.env.API_KEY || 'mock-key-for-testing';
```

### Code Quality Standards

- **TypeScript strict mode required**
- **High code coverage** - aim for 80%+ coverage
- **Unit tests must be deterministic** - use mocking/dependency injection
- **NO module stubbing** - use dependency injection instead
- All code must be unit testable

### File Size Limits

- **Code files should be no larger than 300-500 lines**
- Anything larger should be refactored for readability and modularity
- Split large files into smaller, focused modules

### Repository Hygiene

- **Build artifacts ONLY in `dist/` directory**
- NO temporary scripts, logs, or generated files committed to git
- **Never bypass pre-commit or pre-push hooks** - fix issues instead
- Clean repository is mandatory

## Implementation Patterns

### Dependency Injection Pattern

```typescript
// Good: Constructor injection with interfaces
export interface ProcessorOptions {
  scorer?: Scorer;
  database?: DatabaseHandler;
  scanner?: Scanner;
}

export class Processor {
  private readonly scorer: Scorer;
  private readonly database: DatabaseHandler;

  constructor(options: ProcessorOptions = {}) {
    this.scorer = options.scorer ?? new DefaultScorer();
    this.database = options.database ?? new DatabaseHandler();
  }
}

// Provide factory for backward compatibility
export function createProcessor(options?: ProcessorOptions): Processor {
  return new Processor(options);
}
```

### Test Structure (Critical for Coverage)

```typescript
import { Processor } from '@/services/processor';
import { Scorer } from '@/utils/scorer';

describe('Processor', () => {
  let mockScorer: jest.Mocked<Scorer>;
  let mockDatabase: jest.Mocked<DatabaseHandler>;
  let processor: Processor;

  beforeEach(() => {
    mockScorer = {
      score: jest.fn(),
      improve: jest.fn(),
    } as jest.Mocked<Scorer>;

    mockDatabase = {
      load: jest.fn(),
      update: jest.fn(),
      get: jest.fn(),
    } as jest.Mocked<DatabaseHandler>;

    processor = new Processor({
      scorer: mockScorer,
      database: mockDatabase,
    });
  });

  it('should handle both success and error cases', async () => {
    // Test both happy path and error conditions
    mockScorer.score.mockResolvedValue(mockResult);

    await expect(processor.process('test')).resolves.not.toThrow();

    // Test error case
    mockScorer.score.mockRejectedValue(new Error('API failure'));
    await expect(processor.process('test')).rejects.toThrow('API failure');
  });
});
```

## Development Workflow for AI Agents

### Before Making Changes

1. **Read existing code** to understand patterns and conventions
2. **Check dependencies** to understand available libraries
3. **Review test files** to understand testing patterns
4. **Verify imports use `@/` pattern**

### When Writing Code

1. **Use dependency injection** - pass dependencies via constructor
2. **Follow `@/` import pattern** for all internal imports
3. **Write tests first** or alongside implementation
4. **Ensure high coverage** - test all error paths
5. **Use descriptive error messages** with context
6. **Throw errors instead of fallbacks** outside of test code
7. **Keep files under 300-500 lines** - refactor if larger

### Before Completing Tasks

1. **Run tests**: Check project-specific test command
2. **Check build**: Verify build succeeds
3. **Verify TypeScript compilation**: Run typecheck
4. **Ensure all imports use `@/` pattern**

## Error Handling Pattern

```typescript
try {
  const result = await someOperation();
  return result;
} catch (error: any) {
  const contextualMessage = `Failed to ${operation} for ${resource}: ${error.message}`;
  console.error(contextualMessage);
  throw new Error(contextualMessage);
}
```

## Critical Don'ts for AI Agents

❌ **NEVER implement fallbacks or mock data** outside of test code - throw descriptive errors instead
❌ **NEVER stub entire modules** (`jest.mock('fs')`) - use dependency injection
❌ **NEVER put build artifacts** outside appropriate directories
❌ **NEVER bypass pre-commit/pre-push checks** - fix issues instead
❌ **NEVER use relative imports** - use `@/` pattern for internal modules
❌ **NEVER write environment-dependent tests**
❌ **NEVER commit temporary files** or scripts
❌ **NEVER create files larger than 500 lines** - refactor for modularity

## Success Criteria

An AI agent has successfully completed work when:

- ✅ All tests pass
- ✅ Code follows dependency injection patterns
- ✅ Imports use `@/` pattern
- ✅ Build artifacts in appropriate directories
- ✅ Pre-commit/pre-push hooks pass
- ✅ Compilation succeeds
- ✅ No fallbacks or mock data outside test code
- ✅ Files are appropriately sized (under 500 lines)
- ✅ Descriptive error messages for missing functionality

## When in Doubt

- Look at existing code in the project for patterns
- Check test files for testing approaches
- Follow the dependency injection pattern consistently
- Use `@/` imports for all internal modules
- Prioritize testability over convenience
- Throw errors with context instead of using fallbacks
- Don't mock/stub modules; use dependency injection and mock interfaces instead
- Always document build targets and commands to ensure self-documenting project
- Use established build patterns instead of ad-hoc scripts
