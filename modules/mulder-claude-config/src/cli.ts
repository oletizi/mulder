#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager } from './config-manager.js';
import type { ProjectRequirements } from './types.js';

const program = new Command();

program
  .name('mulder-claude-config')
  .description('CLI tool to build and maintain project-specific Claude config')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize the config manager and download agentic-workflow-wizard')
  .action(async () => {
    const manager = new ConfigManager();
    try {
      console.log('Initializing config manager...');
      await manager.initialize();
      console.log('✓ Config manager initialized successfully');
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate a Claude config based on project requirements')
  .requiredOption('-t, --type <type>', 'Project type (e.g., web, mobile, ml)')
  .requiredOption('-d, --description <description>', 'Project description')
  .option('-T, --technologies <technologies>', 'Comma-separated list of technologies')
  .option('-o, --output <path>', 'Output path', process.cwd())
  .action(async (options) => {
    const manager = new ConfigManager();

    const requirements: ProjectRequirements = {
      projectType: options.type,
      description: options.description,
      technologies: options.technologies ? options.technologies.split(',').map((t: string) => t.trim()) : [],
    };

    try {
      console.log('Generating Claude config...');
      await manager.initialize();
      const config = await manager.generateConfig(requirements);
      await manager.saveConfig(config, options.output);
      console.log(`✓ Config generated successfully at ${options.output}/.claude/config.json`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('load')
  .description('Load and display an existing Claude config')
  .argument('<path>', 'Path to the project directory')
  .action(async (path) => {
    const manager = new ConfigManager();
    try {
      const config = await manager.loadConfig(path);
      console.log(JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();