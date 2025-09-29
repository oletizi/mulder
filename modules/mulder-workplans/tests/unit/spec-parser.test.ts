import { SpecParser, createSpecParser, type SpecFeature, type SpecParseResult } from '@/utils/spec-parser';
import * as fs from 'fs/promises';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('SpecParser', () => {
  let parser: SpecParser;

  beforeEach(() => {
    jest.clearAllMocks();
    parser = new SpecParser();
  });

  describe('parseSpec', () => {
    const validSpecPath = '/absolute/path/to/spec.md';

    it('should parse a valid SPEC document successfully', async () => {
      const specContent = `# Test SPEC Document
Version: 1.0.0
Author: Test Author
Created: 2024-01-01

## Features

**Feature 1** - Basic user authentication functionality
This feature implements user login and registration.
Priority: high #auth #security

**EPIC-123: Advanced Search** - Enhanced search capabilities
Full-text search with filtering and sorting options.
Priority: medium #search #performance

## Requirements

1. **REQ-001: Database Integration** - Connect to PostgreSQL
Must support connection pooling and transactions.
Priority: critical

- **Story: User Profile Management** - Users can update profiles
Allow users to edit their personal information.
Priority: low #profile
`;

      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec(validSpecPath);

      expect(result).toEqual({
        specPath: validSpecPath,
        title: 'Test SPEC Document',
        version: '1.0.0',
        features: expect.arrayContaining([
          expect.objectContaining({
            id: 'feature-1',
            title: 'Feature 1',
            description: 'Basic user authentication functionality This feature implements user login and registration.',
            type: 'feature',
            priority: 'high',
            tags: ['auth', 'security'],
            section: 'Features',
          }),
          expect.objectContaining({
            id: 'EPIC-123',
            title: 'Advanced Search',
            description: 'Enhanced search capabilities Full-text search with filtering and sorting options.',
            type: 'epic',
            priority: 'medium',
            tags: ['search', 'performance'],
            section: 'Features',
          }),
          expect.objectContaining({
            id: 'REQ-001',
            title: 'Database Integration',
            description: 'Connect to PostgreSQL Must support connection pooling and transactions.',
            type: 'requirement',
            priority: 'critical',
            section: 'Requirements',
          }),
          expect.objectContaining({
            id: 'story-user-profile-management',
            title: 'User Profile Management',
            description: 'Users can update profiles Allow users to edit their personal information.',
            type: 'story',
            priority: 'low',
            tags: ['profile'],
            section: 'Requirements',
          }),
        ]),
        metadata: {
          author: 'Test Author',
          created: '2024-01-01',
          description: undefined,
          modified: undefined,
        },
      });
    });

    it('should throw error for relative path', async () => {
      await expect(parser.parseSpec('relative/path.md')).rejects.toThrow(
        'SPEC path must be absolute'
      );
    });

    it('should throw error when file does not exist', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(parser.parseSpec(validSpecPath)).rejects.toThrow(
        'Failed to read SPEC document at /absolute/path/to/spec.md: ENOENT: no such file or directory'
      );
    });

    it('should throw error for empty SPEC document', async () => {
      mockFs.readFile.mockResolvedValue('   \n  \n  ');

      await expect(parser.parseSpec(validSpecPath)).rejects.toThrow(
        'SPEC document is empty: /absolute/path/to/spec.md'
      );
    });

    it('should parse document with minimal content', async () => {
      const minimalContent = '# Minimal SPEC\n\n**Test Feature** - Simple test';
      mockFs.readFile.mockResolvedValue(minimalContent);

      const result = await parser.parseSpec(validSpecPath);

      expect(result.title).toBe('Minimal SPEC');
      expect(result.features).toHaveLength(1);
      expect(result.features[0]).toEqual(expect.objectContaining({
        id: 'test-feature',
        title: 'Test Feature',
        description: 'Simple test',
        type: 'feature',
      }));
    });

    it('should parse document without title', async () => {
      const contentWithoutTitle = '**Feature** - No title document';
      mockFs.readFile.mockResolvedValue(contentWithoutTitle);

      const result = await parser.parseSpec(validSpecPath);

      expect(result.title).toBeUndefined();
      expect(result.features).toHaveLength(1);
    });

    it('should handle features with line ranges', async () => {
      const specContent = `# Test SPEC

## Features

**Feature 1** - First feature
Description line 1
Description line 2

**Feature 2** - Second feature
Single line description
`;

      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec(validSpecPath);

      expect(result.features).toHaveLength(2);
      expect(result.features[0]?.lineRange).toEqual({ start: 5, end: 7 });
      expect(result.features[1]?.lineRange).toEqual({ start: 9, end: 10 });
    });

    it('should extract metadata correctly', async () => {
      const specWithMetadata = `# SPEC with Metadata

Author: John Doe
Created: 2024-01-01
Modified: 2024-01-15
Description: Test specification document
Version: 2.1.0

**Feature** - Test feature
`;

      mockFs.readFile.mockResolvedValue(specWithMetadata);

      const result = await parser.parseSpec(validSpecPath);

      expect(result.metadata).toEqual({
        author: 'John Doe',
        created: '2024-01-01',
        modified: '2024-01-15',
        description: 'Test specification document',
      });
      expect(result.version).toBe('2.1.0');
    });

    it('should handle different feature header formats', async () => {
      const specContent = `# SPEC with Various Headers

**Bold Feature** - Bold text header

1. Numbered Feature - Numbered list header

- **Dash Bold Feature** - Dash with bold header

Feature: Keyword Feature - Keyword header

REQUIREMENT: Another Requirement - Another keyword header

Epic: Big Epic - Epic header

Task: Simple Task - Task header

Story: User Story - Story header
`;

      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec(validSpecPath);

      expect(result.features).toHaveLength(8);
      expect(result.features.map(f => f.type)).toEqual([
        'feature',
        'feature',
        'feature',
        'feature',
        'requirement',
        'epic',
        'task',
        'story',
      ]);
    });

    it('should extract priorities correctly', async () => {
      const specContent = `# Priority Test SPEC

**Critical Feature** - This is critical priority
**High Priority Feature** - This is important stuff
**Medium Feature** - This has medium priority
**Low Feature** - This is nice to have
**Urgent Feature** - This is urgent work
**Normal Feature** - This has normal priority
`;

      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec(validSpecPath);

      const priorities = result.features.map(f => f.priority);
      expect(priorities).toEqual(['critical', 'high', 'medium', 'low', 'critical', 'medium']);
    });

    it('should extract tags correctly', async () => {
      const specContent = `# Tags Test SPEC

**Tagged Feature** - Feature with #auth #security #api tags
**Another Feature** - Has #performance #database tags only
**No Tags Feature** - This feature has no tags
`;

      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec(validSpecPath);

      expect(result.features[0]?.tags).toEqual(['auth', 'security', 'api']);
      expect(result.features[1]?.tags).toEqual(['performance', 'database']);
      expect(result.features[2]?.tags).toBeUndefined();
    });

    it('should handle complex nested sections', async () => {
      const specContent = `# Complex SPEC

## Authentication Features

### Login System

**Basic Login** - Simple username/password login

### Security Features

**Two-Factor Auth** - 2FA implementation

## Data Features

**Database Schema** - PostgreSQL schema design
`;

      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec(validSpecPath);

      expect(result.features.map(f => f.section)).toEqual([
        'Login System',
        'Security Features',
        'Data Features',
      ]);
    });
  });

  describe('findFeature', () => {
    const validSpecPath = '/absolute/path/to/spec.md';

    beforeEach(() => {
      const specContent = `# Test SPEC

**FEATURE-1** - First feature
Description of first feature

**feature-2** - Second feature
Description of second feature

**MIXED-Case-3** - Third feature
Description of third feature
`;
      mockFs.readFile.mockResolvedValue(specContent);
    });

    it('should find feature by exact ID match', async () => {
      const feature = await parser.findFeature(validSpecPath, 'FEATURE-1');

      expect(feature).toEqual(expect.objectContaining({
        id: 'FEATURE-1',
        title: 'First feature',
        description: 'Description of first feature',
      }));
    });

    it('should find feature by case-insensitive ID match', async () => {
      const feature = await parser.findFeature(validSpecPath, 'feature-1');

      expect(feature).toEqual(expect.objectContaining({
        id: 'FEATURE-1',
        title: 'First feature',
      }));
    });

    it('should find feature with mixed case ID', async () => {
      const feature = await parser.findFeature(validSpecPath, 'mixed-case-3');

      expect(feature).toEqual(expect.objectContaining({
        id: 'MIXED-Case-3',
        title: 'Third feature',
      }));
    });

    it('should throw error when feature not found', async () => {
      await expect(parser.findFeature(validSpecPath, 'NONEXISTENT')).rejects.toThrow(
        "Feature 'NONEXISTENT' not found in SPEC document. Available features: FEATURE-1, feature-2, MIXED-Case-3"
      );
    });

    it('should throw error when SPEC file does not exist', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(parser.findFeature(validSpecPath, 'FEATURE-1')).rejects.toThrow(
        'Failed to read SPEC document'
      );
    });
  });

  describe('feature ID generation', () => {
    const testCases = [
      {
        input: '**[FEAT-123] Explicit ID Feature**',
        expectedId: 'FEAT-123',
        expectedTitle: 'Explicit ID Feature',
      },
      {
        input: '**(REQ-456) Parentheses ID**',
        expectedId: 'REQ-456',
        expectedTitle: 'Parentheses ID',
      },
      {
        input: '**Feature without ID**',
        expectedId: 'feature-without-id',
        expectedTitle: 'Feature without ID',
      },
      {
        input: '**Complex Feature Title with Symbols!@#$%**',
        expectedId: 'complex-feature-title-with-symbols',
        expectedTitle: 'Complex Feature Title with Symbols!@#$%',
      },
      {
        input: '1. **Numbered Feature**',
        expectedId: 'numbered-feature',
        expectedTitle: 'Numbered Feature',
      },
    ];

    testCases.forEach(({ input, expectedId, expectedTitle }) => {
      it(`should generate correct ID for "${input}"`, async () => {
        const specContent = `# Test SPEC\n\n${input} - Test description`;
        mockFs.readFile.mockResolvedValue(specContent);

        const result = await parser.parseSpec('/test/spec.md');

        expect(result.features[0]?.id).toBe(expectedId);
        expect(result.features[0]?.title).toBe(expectedTitle);
      });
    });

    it('should handle very long feature titles', async () => {
      const longTitle = 'A'.repeat(100);
      const specContent = `# Test SPEC\n\n**${longTitle}** - Test description`;
      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec('/test/spec.md');

      expect(result.features[0]?.id).toHaveLength(50); // Should be truncated
      expect(result.features[0]?.id).toBe('a'.repeat(50));
    });
  });

  describe('type inference', () => {
    const testCases = [
      { section: 'Epics', text: 'Epic Feature', expected: 'epic' },
      { section: 'User Stories', text: 'Story Feature', expected: 'story' },
      { section: 'Tasks', text: 'Task Feature', expected: 'task' },
      { section: 'Requirements', text: 'Requirement Feature', expected: 'requirement' },
      { section: 'Features', text: 'Feature Feature', expected: 'feature' },
      { section: 'Unknown', text: 'Epic: Special Epic', expected: 'epic' },
      { section: 'Features', text: 'Story: User Story', expected: 'story' },
      { section: 'Features', text: 'Task: Simple Task', expected: 'task' },
      { section: 'Features', text: 'Requirement: Must Have', expected: 'requirement' },
      { section: 'Random', text: 'Random Feature', expected: 'feature' },
    ];

    testCases.forEach(({ section, text, expected }) => {
      it(`should infer type "${expected}" for "${text}" in "${section}" section`, async () => {
        const specContent = `# Test SPEC\n\n## ${section}\n\n**${text}** - Description`;
        mockFs.readFile.mockResolvedValue(specContent);

        const result = await parser.parseSpec('/test/spec.md');

        expect(result.features[0]?.type).toBe(expected);
      });
    });
  });

  describe('version extraction', () => {
    const testCases = [
      { content: 'Version: 1.0.0', expected: '1.0.0' },
      { content: 'version: 2.1.3-beta', expected: '2.1.3-beta' },
      { content: 'Version 3.0', expected: '3.0' },
      { content: 'version 4.5.6', expected: '4.5.6' },
      { content: 'Document version: v1.2.3', expected: 'v1.2.3' },
      { content: 'No version info', expected: undefined },
    ];

    testCases.forEach(({ content, expected }) => {
      it(`should extract version "${expected}" from "${content}"`, async () => {
        const specContent = `# Test SPEC\n\n${content}\n\n**Feature** - Test`;
        mockFs.readFile.mockResolvedValue(specContent);

        const result = await parser.parseSpec('/test/spec.md');

        expect(result.version).toBe(expected);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty feature descriptions', async () => {
      const specContent = `# Test SPEC\n\n**Empty Feature**\n\n**Another Feature** - With description`;
      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec('/test/spec.md');

      expect(result.features[0]?.description).toBe('');
      expect(result.features[1]?.description).toBe('With description');
    });

    it('should handle features at end of document', async () => {
      const specContent = `# Test SPEC\n\n**Last Feature** - Final feature\nFinal description line`;
      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec('/test/spec.md');

      expect(result.features[0]?.description).toBe('Final feature Final description line');
    });

    it('should handle documents with only headers', async () => {
      const specContent = `# Test SPEC\n\n## Section 1\n\n### Subsection\n\n## Section 2`;
      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec('/test/spec.md');

      expect(result.features).toHaveLength(0);
    });

    it('should handle features with special characters in descriptions', async () => {
      const specContent = `# Test SPEC\n\n**Feature** - Description with @#$%^&*() symbols and "quotes" and 'apostrophes'`;
      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec('/test/spec.md');

      expect(result.features[0]?.description).toBe(`Description with @#$%^&*() symbols and "quotes" and 'apostrophes'`);
    });

    it('should handle multiple consecutive features', async () => {
      const specContent = `# Test SPEC

**Feature 1** - First
**Feature 2** - Second
**Feature 3** - Third
Description for third
`;
      mockFs.readFile.mockResolvedValue(specContent);

      const result = await parser.parseSpec('/test/spec.md');

      expect(result.features).toHaveLength(3);
      expect(result.features[0]?.description).toBe('First');
      expect(result.features[1]?.description).toBe('Second');
      expect(result.features[2]?.description).toBe('Third Description for third');
    });
  });
});

describe('createSpecParser factory', () => {
  it('should create SpecParser instance', () => {
    const parser = createSpecParser();
    expect(parser).toBeInstanceOf(SpecParser);
  });
});