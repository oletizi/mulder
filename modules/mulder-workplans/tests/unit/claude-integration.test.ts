import { ClaudeIntegration, createClaudeIntegration } from '@/services/claude-integration';

describe('ClaudeIntegration (Simple)', () => {
  let claudeIntegration: ClaudeIntegration;

  beforeEach(() => {
    claudeIntegration = new ClaudeIntegration();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const integration = new ClaudeIntegration();
      expect(integration).toBeInstanceOf(ClaudeIntegration);
    });

    it('should create instance with custom options', () => {
      const options = {
        cliPath: '/custom/claude',
        timeout: 60000,
        workingDirectory: '/custom/dir',
      };

      const integration = new ClaudeIntegration(options);
      expect(integration).toBeInstanceOf(ClaudeIntegration);
    });
  });

  describe('enhancePrompt method (via executeWithSpec)', () => {
    it('should handle context substitution in prompts', async () => {
      // Mock the spawn process to avoid actual Claude CLI execution
      const mockSpawn = jest.fn().mockImplementation(() => ({
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('test output'));
            }
          })
        },
        stderr: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from(''));
            }
          })
        },
        stdin: {
          write: jest.fn(),
          end: jest.fn()
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: jest.fn()
      }));

      const { spawn } = require('child_process');
      jest.mocked(spawn).mockImplementation(mockSpawn);

      const mockFs = require('fs/promises');
      jest.mocked(mockFs.mkdtemp).mockResolvedValue('/tmp/test');
      jest.mocked(mockFs.writeFile).mockResolvedValue(undefined);
      jest.mocked(mockFs.rm).mockResolvedValue(undefined);

      const mockPath = require('path');
      jest.mocked(mockPath.join).mockImplementation((...args) => args.join('/'));

      const mockOs = require('os');
      jest.mocked(mockOs.tmpdir).mockReturnValue('/tmp');

      try {
        await claudeIntegration.executeWithSpec({
          specContent: 'test spec',
          promptTemplate: 'test prompt with {{variable}}',
          context: { variable: 'value' }
        });
      } catch (error) {
        // Expected to fail in test environment, but should test prompt enhancement
      }

      // Verify that writeFile was called with enhanced prompt
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('prompt'),
        'test prompt with value',
        'utf-8'
      );
    });
  });
});

describe('createClaudeIntegration factory', () => {
  it('should create ClaudeIntegration instance', () => {
    const integration = createClaudeIntegration();
    expect(integration).toBeInstanceOf(ClaudeIntegration);
  });

  it('should pass options to constructor', () => {
    const options = { cliPath: '/custom/claude', timeout: 60000 };
    const integration = createClaudeIntegration(options);
    expect(integration).toBeInstanceOf(ClaudeIntegration);
  });
});