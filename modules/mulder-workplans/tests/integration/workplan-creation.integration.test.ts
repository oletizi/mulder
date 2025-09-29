import { WorkplanCreatorService } from '@/services/workplan-creator';
import { ClaudeIntegration } from '@/services/claude-integration';
import { SpecParser } from '@/utils/spec-parser';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock the Claude integration for integration tests
jest.mock('@/services/claude-integration');

// Integration tests that test the full workplan creation flow
describe('Workplan Creation Integration Tests', () => {
  let tempDir: string;
  let specPath: string;
  let mockClaude: jest.Mocked<ClaudeIntegration>;

  beforeAll(async () => {
    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'workplan-integration-'));
    specPath = path.join(tempDir, 'test-spec.md');
  });

  afterAll(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  });

  beforeEach(async () => {
    // Create a sample SPEC file for testing
    const specContent = `# Test SPEC Document

Version: 1.0.0
Author: Test Author

## Features

**FEATURE-AUTH** - User Authentication System
Implement comprehensive user authentication with JWT tokens.
This feature should include login, registration, and password reset functionality.
Priority: high #auth #security

**FEATURE-PROFILE** - User Profile Management
Allow users to view and edit their profile information.
Priority: medium #profile #user-management

## Requirements

**REQ-001** - Database Integration
Must integrate with PostgreSQL database for user data storage.
Priority: critical #database

## Tasks

**TASK-001** - Setup Development Environment
Configure development environment with necessary tools and dependencies.
Priority: high #setup
`;

    await fs.writeFile(specPath, specContent, 'utf-8');

    // Mock Claude integration
    mockClaude = {
      executeWithSpec: jest.fn(),
      executeWithPrompt: jest.fn(),
      checkAvailability: jest.fn(),
    } as unknown as jest.Mocked<ClaudeIntegration>;

    mockClaude.checkAvailability.mockResolvedValue(true);
  });

  describe('End-to-end workplan creation', () => {
    it('should create complete workplan from SPEC feature', async () => {
      const mockWorkplanContent = `# WORKPLAN-FEATURE-AUTH: User Authentication System

## Feature Description
Implement comprehensive user authentication with JWT tokens.

## Task Breakdown
- [ ] Setup authentication library dependencies
- [ ] Implement user registration endpoint
- [ ] Add password strength validation

## Progress Tracking
- Status: Not Started
`;

      mockClaude.executeWithSpec.mockResolvedValue({
        stdout: mockWorkplanContent,
        stderr: '',
        exitCode: 0,
      });

      const workplanCreator = new WorkplanCreatorService({
        claudeIntegration: mockClaude
      });

      const result = await workplanCreator.create(specPath, 'FEATURE-AUTH');

      // Verify the workplan was created
      expect(result).toMatch(/WORKPLAN-FEATURE-AUTH\.md$/);

      // Verify the workplan content
      const actualContent = await fs.readFile(result, 'utf-8');
      expect(actualContent).toContain('# WORKPLAN-FEATURE-AUTH: User Authentication System');
      expect(actualContent).toContain('## Feature Description');
      expect(actualContent).toContain('## Task Breakdown');

      // Verify Claude was called with correct parameters
      expect(mockClaude.executeWithSpec).toHaveBeenCalledWith(
        expect.objectContaining({
          specContent: expect.stringContaining('**FEATURE-AUTH** - User Authentication System'),
          promptTemplate: expect.stringContaining('{{featureId}}'),
          outputFormat: 'markdown',
        })
      );
    });

    it('should create workplan in custom output directory', async () => {
      const customOutputDir = path.join(tempDir, 'workplans');
      await fs.mkdir(customOutputDir, { recursive: true });

      const mockWorkplanContent = `# WORKPLAN-FEATURE-PROFILE: User Profile Management

## Feature Description
Allow users to view and edit their profile information.

## Task Breakdown
- [ ] Create profile data model

## Progress Tracking
- Status: Not Started
`;

      mockClaude.executeWithSpec.mockResolvedValue({
        stdout: mockWorkplanContent,
        stderr: '',
        exitCode: 0,
      });

      const workplanCreator = new WorkplanCreatorService({
        claudeIntegration: mockClaude
      });

      const result = await workplanCreator.create(specPath, 'FEATURE-PROFILE', {
        outputDir: customOutputDir,
      });

      expect(result).toBe(path.join(customOutputDir, 'WORKPLAN-FEATURE-PROFILE.md'));

      const content = await fs.readFile(result, 'utf-8');
      expect(content).toContain('User Profile Management');
    });

    it('should handle overwrite option correctly', async () => {
      const mockWorkplanContent = `# WORKPLAN-REQ-001: Database Integration

## Feature Description
Database integration requirements.

## Task Breakdown
- [ ] Setup PostgreSQL connection
- [ ] Create migration scripts

## Progress Tracking
- Status: Not Started
`;

      mockClaude.executeWithSpec.mockResolvedValue({
        stdout: mockWorkplanContent,
        stderr: '',
        exitCode: 0,
      });

      // First creation
      const firstResult = await createWorkplan(specPath, 'REQ-001');
      expect(await fs.access(firstResult)).not.toThrow();

      // Second creation without overwrite should fail
      await expect(
        createWorkplan(specPath, 'REQ-001')
      ).rejects.toThrow('Workplan already exists');

      // Second creation with overwrite should succeed
      const secondResult = await createWorkplan(specPath, 'REQ-001', {
        overwrite: true,
      });
      expect(secondResult).toBe(firstResult);
      expect(await fs.access(secondResult)).not.toThrow();
    });

    it('should validate generated workplan content', async () => {
      const invalidWorkplanContent = `Invalid content without proper headers
This doesn't follow the workplan format.`;

      mockClaude.executeWithSpec.mockResolvedValue({
        stdout: invalidWorkplanContent,
        stderr: '',
        exitCode: 0,
      });

      await expect(
        createWorkplan(specPath, 'TASK-001')
      ).rejects.toThrow('Generated workplan does not start with a proper markdown header');
    });

    it('should handle SPEC parsing errors gracefully', async () => {
      // Create invalid SPEC content
      await fs.writeFile(specPath, 'Invalid SPEC content without features', 'utf-8');

      await expect(
        createWorkplan(specPath, 'NONEXISTENT-FEATURE')
      ).rejects.toThrow("Feature 'NONEXISTENT-FEATURE' not found in SPEC document");
    });
  });

  describe('Real SPEC parser integration', () => {
    it('should work with actual SpecParser without mocking', async () => {
      // Test with real SpecParser to ensure integration works
      const realSpecContent = `# Integration Test SPEC

## Test Features

**INT-TEST-001** - Integration Test Feature
This is a test feature for integration testing.
Priority: medium #integration-test
`;

      await fs.writeFile(specPath, realSpecContent, 'utf-8');

      const mockWorkplanContent = `# WORKPLAN-INT-TEST-001: Integration Test Feature

## Feature Description
This is a test feature for integration testing.

## Task Breakdown
- [ ] Implement test feature
- [ ] Add integration tests

## Progress Tracking
- Status: Planning
`;

      mockClaude.executeWithSpec.mockResolvedValue({
        stdout: mockWorkplanContent,
        stderr: '',
        exitCode: 0,
      });

      const parser = new SpecParser();
      const parseResult = await parser.parseSpec(specPath);

      expect(parseResult.features).toHaveLength(1);
      expect(parseResult.features[0].id).toBe('INT-TEST-001');

      // Test finding the feature
      const feature = await parser.findFeature(specPath, 'INT-TEST-001');
      expect(feature.title).toBe('Integration Test Feature');
      expect(feature.priority).toBe('medium');
      expect(feature.tags).toContain('integration-test');
    });
  });

  describe('Error handling integration', () => {
    it('should handle file system errors appropriately', async () => {
      // Test with non-existent SPEC file
      const nonExistentPath = path.join(tempDir, 'does-not-exist.md');

      await expect(
        createWorkplan(nonExistentPath, 'FEATURE-1')
      ).rejects.toThrow('SPEC document does not exist');
    });

    it('should handle output directory permission errors', async () => {
      // Create read-only directory (simulated)
      const readOnlyDir = path.join(tempDir, 'readonly');
      await fs.mkdir(readOnlyDir, { recursive: true });

      const mockWorkplanContent = `# Test Workplan\n\n## Description\nTest`;

      mockClaude.executeWithSpec.mockResolvedValue({
        stdout: mockWorkplanContent,
        stderr: '',
        exitCode: 0,
      });

      // Mock writeFile to simulate permission error
      const originalWriteFile = fs.writeFile;
      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('EACCES: permission denied'));

      await expect(
        createWorkplan(specPath, 'FEATURE-AUTH', { outputDir: readOnlyDir })
      ).rejects.toThrow('Failed to write workplan');

      // Restore original implementation
      jest.spyOn(fs, 'writeFile').mockImplementation(originalWriteFile);
    });

    it('should handle Claude CLI unavailability', async () => {
      mockClaude.checkAvailability.mockResolvedValue(false);

      await expect(
        createWorkplan(specPath, 'FEATURE-AUTH')
      ).rejects.toThrow('Claude Code CLI is not available');
    });

    it('should handle Claude execution failures', async () => {
      mockClaude.executeWithSpec.mockRejectedValue(new Error('Claude timeout'));

      await expect(
        createWorkplan(specPath, 'FEATURE-AUTH')
      ).rejects.toThrow('Failed to generate workplan content: Claude timeout');
    });
  });

  describe('Filename generation integration', () => {
    it('should generate proper filenames for various feature types', async () => {
      const testCases = [
        { id: 'SIMPLE-FEATURE', expected: 'WORKPLAN-SIMPLE-FEATURE.md' },
        { id: 'feature-with-special-chars!@#', expected: 'WORKPLAN-FEATURE-WITH-SPECIAL-CHARS.md' },
        { id: '123-numeric-feature', expected: 'WORKPLAN-123-NUMERIC-FEATURE.md' },
      ];

      for (const testCase of testCases) {
        const specContent = `# Test SPEC\n\n**${testCase.id}** - Test feature\nDescription here.`;
        await fs.writeFile(specPath, specContent, 'utf-8');

        const mockWorkplanContent = `# WORKPLAN-${testCase.id}: Test Feature\n\n## Description\nTest`;
        mockClaude.executeWithSpec.mockResolvedValue({
          stdout: mockWorkplanContent,
          stderr: '',
          exitCode: 0,
        });

        const result = await createWorkplan(specPath, testCase.id);
        expect(result).toMatch(new RegExp(testCase.expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
      }
    });
  });
});