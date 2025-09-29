import { WorkplanCreatorService, createWorkplanCreator, createWorkplan } from '@/services/workplan-creator';
import type { ClaudeIntegration, ClaudeExecutionResult } from '@/services/claude-integration';
import type { SpecParser, SpecFeature } from '@/utils/spec-parser';
import type { WorkplanOptions } from '@/interfaces/workplan-options';
import type { WorkplanTemplate } from '@/interfaces/workplan-template';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('WorkplanCreatorService', () => {
  let mockClaudeIntegration: jest.Mocked<ClaudeIntegration>;
  let mockSpecParser: jest.Mocked<SpecParser>;
  let workplanCreator: WorkplanCreatorService;

  const mockFeature: SpecFeature = {
    id: 'TEST-FEATURE-1',
    title: 'Test Feature',
    description: 'This is a test feature for creating workplans',
    type: 'feature',
    priority: 'high',
    section: 'Features',
    lineRange: { start: 10, end: 20 }
  };

  const mockClaudeResult: ClaudeExecutionResult = {
    stdout: `# WORKPLAN-TEST-FEATURE-1: Test Feature

## Feature Description
This is a test feature for creating workplans

## Task Breakdown
- [ ] Task 1
- [ ] Task 2

## Progress Tracking
- Status: Not Started
- Milestones: TBD
`,
    stderr: '',
    exitCode: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockClaudeIntegration = {
      executeWithSpec: jest.fn(),
      executeWithPrompt: jest.fn(),
      checkAvailability: jest.fn(),
    } as jest.Mocked<ClaudeIntegration>;

    mockSpecParser = {
      parseSpec: jest.fn(),
      findFeature: jest.fn(),
    } as jest.Mocked<SpecParser>;

    workplanCreator = new WorkplanCreatorService({
      claudeIntegration: mockClaudeIntegration,
      specParser: mockSpecParser,
    });

    // Default mock implementations
    mockClaudeIntegration.checkAvailability.mockResolvedValue(true);
    mockClaudeIntegration.executeWithSpec.mockResolvedValue(mockClaudeResult);
    mockSpecParser.findFeature.mockResolvedValue(mockFeature);
    mockFs.stat.mockResolvedValue({ isFile: () => true, isDirectory: () => false } as any);
    mockFs.access.mockRejectedValue({ code: 'ENOENT' } as any); // File doesn't exist
    mockFs.readFile.mockResolvedValue('# Test SPEC\n\n**Test Feature** - This is a test feature');
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
  });

  describe('constructor', () => {
    it('should create instance with default dependencies', () => {
      const creator = new WorkplanCreatorService();
      expect(creator).toBeInstanceOf(WorkplanCreatorService);
    });

    it('should use provided dependencies', () => {
      const creator = new WorkplanCreatorService({
        claudeIntegration: mockClaudeIntegration,
        specParser: mockSpecParser,
      });
      expect(creator).toBeInstanceOf(WorkplanCreatorService);
    });

    it('should accept default template option', () => {
      const mockTemplate: WorkplanTemplate = {
        name: 'test-template',
        version: '1.0.0',
        header: '# WORKPLAN-{{featureId}}',
        sections: [
          { id: 'desc', title: 'Description', content: '{{description}}', order: 1 }
        ],
      };

      const creator = new WorkplanCreatorService({
        defaultTemplate: mockTemplate,
      });
      expect(creator).toBeInstanceOf(WorkplanCreatorService);
    });
  });

  describe('create', () => {
    const validSpecPath = '/absolute/path/to/spec.md';
    const validFeatureId = 'TEST-FEATURE-1';
    const validOptions: WorkplanOptions = {};

    it('should create workplan successfully', async () => {
      const result = await workplanCreator.create(validSpecPath, validFeatureId, validOptions);

      expect(result).toMatch(/\/absolute\/path\/to\/WORKPLAN-TEST-FEATURE-1\.md$/);
      expect(mockSpecParser.findFeature).toHaveBeenCalledWith(validSpecPath, validFeatureId);
      expect(mockClaudeIntegration.executeWithSpec).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should create workplan with custom output directory', async () => {
      const options: WorkplanOptions = {
        outputDir: '/custom/output/dir'
      };

      mockFs.stat.mockImplementation((pathStr) => {
        if (pathStr === '/custom/output/dir') {
          return Promise.resolve({ isFile: () => false, isDirectory: () => true } as any);
        }
        return Promise.resolve({ isFile: () => true, isDirectory: () => false } as any);
      });

      const result = await workplanCreator.create(validSpecPath, validFeatureId, options);

      expect(result).toBe('/custom/output/dir/WORKPLAN-TEST-FEATURE-1.md');
    });

    it('should handle overwrite option correctly', async () => {
      // Mock file exists
      mockFs.access.mockResolvedValue(undefined);

      const options: WorkplanOptions = { overwrite: true };

      const result = await workplanCreator.create(validSpecPath, validFeatureId, options);

      expect(result).toMatch(/WORKPLAN-TEST-FEATURE-1\.md$/);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should throw error for relative spec path', async () => {
      await expect(
        workplanCreator.create('relative/path/spec.md', validFeatureId, validOptions)
      ).rejects.toThrow('SPEC path must be absolute');
    });

    it('should throw error for empty feature ID', async () => {
      await expect(
        workplanCreator.create(validSpecPath, '', validOptions)
      ).rejects.toThrow('Feature ID cannot be empty');

      await expect(
        workplanCreator.create(validSpecPath, '   ', validOptions)
      ).rejects.toThrow('Feature ID cannot be empty');
    });

    it('should throw error when SPEC file does not exist', async () => {
      mockFs.stat.mockRejectedValue({ code: 'ENOENT' } as any);

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, validOptions)
      ).rejects.toThrow('SPEC document does not exist');
    });

    it('should throw error when SPEC path is not a file', async () => {
      mockFs.stat.mockResolvedValue({ isFile: () => false, isDirectory: () => true } as any);

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, validOptions)
      ).rejects.toThrow('SPEC path is not a file');
    });

    it('should throw error for relative output directory', async () => {
      const options: WorkplanOptions = {
        outputDir: 'relative/output/dir'
      };

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, options)
      ).rejects.toThrow('Output directory must be absolute');
    });

    it('should throw error when output directory does not exist', async () => {
      const options: WorkplanOptions = {
        outputDir: '/nonexistent/output/dir'
      };

      mockFs.stat.mockImplementation((pathStr) => {
        if (pathStr === '/nonexistent/output/dir') {
          return Promise.reject({ code: 'ENOENT' } as any);
        }
        return Promise.resolve({ isFile: () => true, isDirectory: () => false } as any);
      });

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, options)
      ).rejects.toThrow('Output directory does not exist');
    });

    it('should throw error when output path is not a directory', async () => {
      const options: WorkplanOptions = {
        outputDir: '/path/to/file.txt'
      };

      mockFs.stat.mockImplementation((pathStr) => {
        if (pathStr === '/path/to/file.txt') {
          return Promise.resolve({ isFile: () => true, isDirectory: () => false } as any);
        }
        return Promise.resolve({ isFile: () => true, isDirectory: () => false } as any);
      });

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, options)
      ).rejects.toThrow('Output path is not a directory');
    });

    it('should throw error when Claude CLI is not available', async () => {
      mockClaudeIntegration.checkAvailability.mockResolvedValue(false);

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, validOptions)
      ).rejects.toThrow('Claude Code CLI is not available');
    });

    it('should throw error when feature is not found', async () => {
      mockSpecParser.findFeature.mockRejectedValue(
        new Error('Feature \'NONEXISTENT\' not found in SPEC document')
      );

      await expect(
        workplanCreator.create(validSpecPath, 'NONEXISTENT', validOptions)
      ).rejects.toThrow('Feature \'NONEXISTENT\' not found in SPEC document');
    });

    it('should throw error when workplan already exists and overwrite is false', async () => {
      // Mock file exists
      mockFs.access.mockResolvedValue(undefined);

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, { overwrite: false })
      ).rejects.toThrow('Workplan already exists');
    });

    it('should throw error when Claude generates empty content', async () => {
      mockClaudeIntegration.executeWithSpec.mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 0
      });

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, validOptions)
      ).rejects.toThrow('Claude Code generated empty workplan content');
    });

    it('should throw error when Claude execution fails', async () => {
      mockClaudeIntegration.executeWithSpec.mockRejectedValue(
        new Error('Claude CLI timeout')
      );

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, validOptions)
      ).rejects.toThrow('Failed to generate workplan content: Claude CLI timeout');
    });

    it('should validate markdown content by default', async () => {
      mockClaudeIntegration.executeWithSpec.mockResolvedValue({
        stdout: 'Invalid content without headers',
        stderr: '',
        exitCode: 0
      });

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, validOptions)
      ).rejects.toThrow('Generated workplan does not start with a proper markdown header');
    });

    it('should skip markdown validation when disabled', async () => {
      mockClaudeIntegration.executeWithSpec.mockResolvedValue({
        stdout: 'Invalid content without headers\n- [ ] Some task',
        stderr: '',
        exitCode: 0
      });

      const options: WorkplanOptions = {
        validation: { validateMarkdown: false }
      };

      // Should not throw validation error
      const result = await workplanCreator.create(validSpecPath, validFeatureId, options);
      expect(result).toMatch(/WORKPLAN-TEST-FEATURE-1\.md$/);
    });

    it('should validate required sections when template provided', async () => {
      const template: WorkplanTemplate = {
        name: 'test-template',
        version: '1.0.0',
        header: '# WORKPLAN-{{featureId}}',
        sections: [
          { id: 'desc', title: 'Description', content: '{{description}}', order: 1, required: true }
        ],
      };

      mockClaudeIntegration.executeWithSpec.mockResolvedValue({
        stdout: '# WORKPLAN-TEST\n\n- [ ] Task 1',
        stderr: '',
        exitCode: 0
      });

      const options: WorkplanOptions = { template };

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, options)
      ).rejects.toThrow('Generated workplan is missing required template section: description');
    });

    it('should throw error when file write fails', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));

      await expect(
        workplanCreator.create(validSpecPath, validFeatureId, validOptions)
      ).rejects.toThrow('Failed to write workplan');
    });
  });

  describe('filename generation', () => {
    it('should generate proper filename from feature ID', async () => {
      const testFeature: SpecFeature = {
        ...mockFeature,
        id: 'FEATURE-123'
      };
      mockSpecParser.findFeature.mockResolvedValue(testFeature);

      const result = await workplanCreator.create('/test/spec.md', 'FEATURE-123');

      expect(result).toMatch(/WORKPLAN-FEATURE-123\.md$/);
    });

    it('should sanitize invalid characters in feature ID', async () => {
      const testFeature: SpecFeature = {
        ...mockFeature,
        id: 'invalid@feature$id!'
      };
      mockSpecParser.findFeature.mockResolvedValue(testFeature);

      const result = await workplanCreator.create('/test/spec.md', 'test');

      expect(result).toMatch(/WORKPLAN-INVALID-FEATURE-ID\.md$/);
    });

    it('should fallback to title when ID is invalid', async () => {
      const testFeature: SpecFeature = {
        ...mockFeature,
        id: '@@@',
        title: 'My Feature Title'
      };
      mockSpecParser.findFeature.mockResolvedValue(testFeature);

      const result = await workplanCreator.create('/test/spec.md', 'test');

      expect(result).toMatch(/WORKPLAN-MY-FEATURE-TITLE\.md$/);
    });

    it('should use timestamp fallback when both ID and title are invalid', async () => {
      const testFeature: SpecFeature = {
        ...mockFeature,
        id: '@@@',
        title: '!!!'
      };
      mockSpecParser.findFeature.mockResolvedValue(testFeature);

      // Mock Date.now to make test deterministic
      const mockNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

      const result = await workplanCreator.create('/test/spec.md', 'test');

      expect(result).toMatch(/WORKPLAN-FEATURE-1234567890\.md$/);

      mockNow.mockRestore();
    });
  });

  describe('Claude prompt building', () => {
    it('should build proper prompt with feature context', async () => {
      await workplanCreator.create('/test/spec.md', 'TEST-FEATURE-1');

      expect(mockClaudeIntegration.executeWithSpec).toHaveBeenCalledWith({
        specContent: expect.any(String),
        promptTemplate: expect.stringContaining('{{featureId}}'),
        outputFormat: 'markdown',
        context: {
          featureId: 'TEST-FEATURE-1',
          featureTitle: 'Test Feature',
          featureType: 'feature',
          featureDescription: 'This is a test feature for creating workplans',
          priority: 'high',
          section: 'Features'
        }
      });
    });

    it('should handle feature with missing optional fields', async () => {
      const minimalFeature: SpecFeature = {
        id: 'MINIMAL',
        title: 'Minimal Feature',
        description: 'Basic description',
        type: 'requirement'
      };
      mockSpecParser.findFeature.mockResolvedValue(minimalFeature);

      await workplanCreator.create('/test/spec.md', 'MINIMAL');

      expect(mockClaudeIntegration.executeWithSpec).toHaveBeenCalledWith({
        specContent: expect.any(String),
        promptTemplate: expect.any(String),
        outputFormat: 'markdown',
        context: {
          featureId: 'MINIMAL',
          featureTitle: 'Minimal Feature',
          featureType: 'requirement',
          featureDescription: 'Basic description',
          priority: 'medium',
          section: 'Unknown'
        }
      });
    });
  });

  describe('markdown validation', () => {
    it('should pass validation for properly formatted workplan', async () => {
      const validContent = `# WORKPLAN-TEST: Test Feature

## Feature Description
This is a test feature

## Task Breakdown
- [ ] Task 1
- [ ] Task 2
`;

      mockClaudeIntegration.executeWithSpec.mockResolvedValue({
        stdout: validContent,
        stderr: '',
        exitCode: 0
      });

      const result = await workplanCreator.create('/test/spec.md', 'TEST');
      expect(result).toMatch(/WORKPLAN-TEST-FEATURE-1\.md$/);
    });

    it('should reject content without header', async () => {
      mockClaudeIntegration.executeWithSpec.mockResolvedValue({
        stdout: 'No header content\n- [ ] Task',
        stderr: '',
        exitCode: 0
      });

      await expect(
        workplanCreator.create('/test/spec.md', 'TEST')
      ).rejects.toThrow('Generated workplan does not start with a proper markdown header');
    });

    it('should reject content without feature description', async () => {
      mockClaudeIntegration.executeWithSpec.mockResolvedValue({
        stdout: '# WORKPLAN-TEST\n\n- [ ] Task',
        stderr: '',
        exitCode: 0
      });

      await expect(
        workplanCreator.create('/test/spec.md', 'TEST')
      ).rejects.toThrow('Generated workplan is missing required section: feature description');
    });

    it('should reject content without task breakdown', async () => {
      mockClaudeIntegration.executeWithSpec.mockResolvedValue({
        stdout: '# WORKPLAN-TEST\n\n## Feature Description\nSome description',
        stderr: '',
        exitCode: 0
      });

      await expect(
        workplanCreator.create('/test/spec.md', 'TEST')
      ).rejects.toThrow('Generated workplan is missing required section: task breakdown');
    });

    it('should reject content without task checkboxes', async () => {
      mockClaudeIntegration.executeWithSpec.mockResolvedValue({
        stdout: '# WORKPLAN-TEST\n\n## Feature Description\nDesc\n\n## Task Breakdown\nNo checkboxes here',
        stderr: '',
        exitCode: 0
      });

      await expect(
        workplanCreator.create('/test/spec.md', 'TEST')
      ).rejects.toThrow('Generated workplan does not contain any task checkboxes');
    });
  });
});

describe('createWorkplanCreator factory', () => {
  it('should create WorkplanCreatorService instance', () => {
    const creator = createWorkplanCreator();
    expect(creator).toBeInstanceOf(WorkplanCreatorService);
  });

  it('should pass options to constructor', () => {
    const mockClaude = {} as ClaudeIntegration;
    const creator = createWorkplanCreator({ claudeIntegration: mockClaude });
    expect(creator).toBeInstanceOf(WorkplanCreatorService);
  });
});

describe('createWorkplan function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create workplan using default creator', async () => {
    // Mock the dependencies that would be created by default
    const mockClaudeResult: ClaudeExecutionResult = {
      stdout: '# WORKPLAN-TEST: Test\n\n## Feature Description\nTest\n\n## Task Breakdown\n- [ ] Task',
      stderr: '',
      exitCode: 0
    };

    // We need to mock the modules that would be imported by the default constructor
    jest.doMock('@/services/claude-integration', () => ({
      ClaudeIntegration: jest.fn().mockImplementation(() => ({
        checkAvailability: jest.fn().mockResolvedValue(true),
        executeWithSpec: jest.fn().mockResolvedValue(mockClaudeResult),
      })),
    }));

    jest.doMock('@/utils/spec-parser', () => ({
      SpecParser: jest.fn().mockImplementation(() => ({
        findFeature: jest.fn().mockResolvedValue({
          id: 'TEST',
          title: 'Test Feature',
          description: 'Test description',
          type: 'feature',
        }),
      })),
    }));

    mockFs.stat.mockResolvedValue({ isFile: () => true, isDirectory: () => false } as any);
    mockFs.access.mockRejectedValue({ code: 'ENOENT' } as any);
    mockFs.readFile.mockResolvedValue('# Test SPEC\n\n**Test Feature**');
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);

    const result = await createWorkplan('/absolute/test.md', 'TEST');
    expect(result).toMatch(/WORKPLAN-TEST\.md$/);
  });
});