import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface ClaudeIntegrationOptions {
  cliPath?: string;
  timeout?: number;
  workingDirectory?: string;
}

export interface ClaudeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ClaudePromptOptions {
  specContent: string;
  promptTemplate: string;
  outputFormat?: 'markdown' | 'json';
  context?: Record<string, unknown>;
}

/**
 * ClaudeIntegration provides a wrapper for executing Claude Code CLI
 * in non-interactive mode with proper error handling and prompt management.
 */
export class ClaudeIntegration {
  private readonly cliPath: string;
  private readonly timeout: number;
  private readonly workingDirectory: string;

  constructor(options: ClaudeIntegrationOptions = {}) {
    this.cliPath = options.cliPath ?? 'claude';
    this.timeout = options.timeout ?? 30000; // 30 seconds default
    this.workingDirectory = options.workingDirectory ?? process.cwd();
  }

  /**
   * Execute Claude CLI with a prompt and SPEC content
   * Uses temporary file for SPEC content to avoid stdin limitations
   */
  async executeWithSpec(options: ClaudePromptOptions): Promise<ClaudeExecutionResult> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-workplan-'));
    const specFile = path.join(tempDir, 'spec.md');
    const promptFile = path.join(tempDir, 'prompt.md');

    try {
      // Write SPEC content to temporary file
      await fs.writeFile(specFile, options.specContent, 'utf-8');

      // Prepare the prompt with context if provided
      const enhancedPrompt = this.enhancePrompt(options.promptTemplate, options.context);
      await fs.writeFile(promptFile, enhancedPrompt, 'utf-8');

      // Build Claude CLI arguments
      const args = [
        'code',
        '--non-interactive',
        '--read-file', specFile,
        '--prompt-file', promptFile
      ];

      if (options.outputFormat) {
        args.push('--format', options.outputFormat);
      }

      const result = await this.spawnClaude(args);

      if (result.exitCode !== 0) {
        throw new Error(
          `Claude CLI execution failed with exit code ${result.exitCode}: ${result.stderr}`
        );
      }

      return result;
    } finally {
      // Clean up temporary files
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to clean up temporary directory ${tempDir}:`, error);
      }
    }
  }

  /**
   * Execute Claude CLI with a simple prompt via stdin
   */
  async executeWithPrompt(prompt: string): Promise<ClaudeExecutionResult> {
    const args = ['code', '--non-interactive'];
    const result = await this.spawnClaude(args, prompt);

    if (result.exitCode !== 0) {
      throw new Error(
        `Claude CLI execution failed with exit code ${result.exitCode}: ${result.stderr}`
      );
    }

    return result;
  }

  /**
   * Check if Claude CLI is available and accessible
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const result = await this.spawnClaude(['--version'], undefined, 5000);
      return result.exitCode === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Spawn Claude CLI process with proper error handling and timeout
   */
  private async spawnClaude(
    args: string[],
    stdin?: string,
    timeoutMs?: number
  ): Promise<ClaudeExecutionResult> {
    return new Promise((resolve, reject) => {
      const actualTimeout = timeoutMs ?? this.timeout;
      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const claudeProcess: ChildProcessWithoutNullStreams = spawn(this.cliPath, args, {
        cwd: this.workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          claudeProcess.kill('SIGTERM');
          reject(new Error(`Claude CLI execution timed out after ${actualTimeout}ms`));
        }
      }, actualTimeout);

      // Handle stdout
      claudeProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Handle stderr
      claudeProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle process completion
      claudeProcess.on('close', (code: number | null) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutHandle);
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code ?? -1
          });
        }
      });

      // Handle process errors
      claudeProcess.on('error', (error: Error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutHandle);
          reject(new Error(`Failed to spawn Claude CLI: ${error.message}`));
        }
      });

      // Send stdin if provided
      if (stdin) {
        claudeProcess.stdin.write(stdin);
        claudeProcess.stdin.end();
      } else {
        claudeProcess.stdin.end();
      }
    });
  }

  /**
   * Enhance prompt template with context variables
   */
  private enhancePrompt(template: string, context?: Record<string, unknown>): string {
    if (!context) {
      return template;
    }

    let enhancedPrompt = template;

    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`;
      const replacement = typeof value === 'string' ? value : JSON.stringify(value);
      enhancedPrompt = enhancedPrompt.replace(new RegExp(placeholder, 'g'), replacement);
    }

    return enhancedPrompt;
  }
}

/**
 * Factory function for creating ClaudeIntegration instances
 * Provides backward compatibility and easier testing
 */
export function createClaudeIntegration(options?: ClaudeIntegrationOptions): ClaudeIntegration {
  return new ClaudeIntegration(options);
}