import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync, statSync, rmSync } from 'fs';
import { join } from 'path';
import type { ClaudeConfig, ConfigManagerOptions, ProjectRequirements } from './types.js';
import { BASE_CONFIG_TEMPLATE } from './base-config.js';

export interface IConfigManager {
  initialize(): Promise<void>;
  generateConfig(requirements: ProjectRequirements): Promise<ClaudeConfig>;
  saveConfig(config: ClaudeConfig, outputPath: string): Promise<void>;
  loadConfig(path: string): Promise<ClaudeConfig>;
  installWizardWithBaseConfig(projectPath: string): Promise<void>;
}

export class ConfigManager implements IConfigManager {
  private wizardRepoUrl: string;
  private tempDir: string;
  private initialized: boolean = false;

  constructor(options: ConfigManagerOptions = {}) {
    this.wizardRepoUrl = options.wizardRepoUrl || 'https://github.com/johnlanda/agentic-workflow-wizard.git';
    this.tempDir = join(process.cwd(), '.mulder-temp');
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }

    const wizardPath = join(this.tempDir, 'wizard');
    if (!existsSync(wizardPath)) {
      try {
        execSync(`git clone ${this.wizardRepoUrl} ${wizardPath}`, {
          stdio: 'pipe',
        });
      } catch (error) {
        throw new Error(`Failed to clone agentic-workflow-wizard: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.initialized = true;
  }

  async generateConfig(requirements: ProjectRequirements): Promise<ClaudeConfig> {
    if (!this.initialized) {
      await this.initialize();
    }

    const wizardPath = join(this.tempDir, 'wizard');
    const catalogPath = join(wizardPath, 'catalog');

    if (!existsSync(catalogPath)) {
      throw new Error('Agent catalog not found in wizard repository');
    }

    const config: ClaudeConfig = {
      agents: [],
      workflows: [],
      instructions: [
        `Project Type: ${requirements.projectType}`,
        `Description: ${requirements.description}`,
        `Technologies: ${requirements.technologies.join(', ')}`,
      ],
    };

    if (requirements.customRequirements) {
      config.instructions.push(...requirements.customRequirements);
    }

    return config;
  }

  async saveConfig(config: ClaudeConfig, outputPath: string): Promise<void> {
    const outputDir = join(outputPath, '.claude');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const configPath = join(outputDir, 'config.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  async loadConfig(path: string): Promise<ClaudeConfig> {
    const configPath = join(path, '.claude', 'config.json');
    if (!existsSync(configPath)) {
      throw new Error(`Config file not found at ${configPath}`);
    }

    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as ClaudeConfig;
  }

  async installWizardWithBaseConfig(projectPath: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const wizardPath = join(this.tempDir, 'wizard');
    const targetClaudeDir = join(projectPath, '.claude');

    if (!existsSync(targetClaudeDir)) {
      mkdirSync(targetClaudeDir, { recursive: true });
    }

    const wizardClaudeOutputDir = join(wizardPath, '.claude-output');
    if (existsSync(wizardClaudeOutputDir)) {
      this.copyDirectoryRecursive(wizardClaudeOutputDir, targetClaudeDir);
    }

    const baseConfigPath = join(projectPath, 'CLAUDE.md');
    writeFileSync(baseConfigPath, BASE_CONFIG_TEMPLATE);

    if (existsSync(this.tempDir)) {
      rmSync(this.tempDir, { recursive: true, force: true });
    }

    const claudeOutputDir = join(projectPath, '.claude-output');
    if (existsSync(claudeOutputDir)) {
      rmSync(claudeOutputDir, { recursive: true, force: true });
    }
  }

  private copyDirectoryRecursive(src: string, dest: string): void {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }

    const entries = readdirSync(src);

    for (const entry of entries) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);

      if (statSync(srcPath).isDirectory()) {
        this.copyDirectoryRecursive(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  }
}