#!/usr/bin/env node

import { Command } from 'commander';
import { createSpecification } from './commands/init.js';
import { updateProgress } from './commands/update.js';
import { showStatus } from './commands/status.js';
import { validateProject } from './commands/validate.js';
import { generateReport } from './commands/report.js';

const program = new Command();

program
  .name('mulder-specs')
  .description('Tooling to manage project specifications for agentic projects')
  .version('0.5.0');

// One-click philosophy: Minimal typing, sensible defaults, auto-detection
program
  .command('init')
  .description('Create new specification with auto-detected project context')
  .option('-i, --interactive', 'Interactive mode for custom specification creation')
  .option('-o, --output <path>', 'Output path for specification (default: auto-detected)')
  .action(async (options) => {
    try {
      await createSpecification(options);
    } catch (error) {
      console.error('Error creating specification:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Update progress by scanning codebase and updating spec checkboxes')
  .option('--dry-run', 'Preview changes without writing to specification')
  .option('--spec <path>', 'Path to specification file (default: auto-detected)')
  .action(async (options) => {
    try {
      await updateProgress(options);
    } catch (error) {
      console.error('Error updating progress:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('View current implementation status (MVP progress by default)')
  .option('--all-phases', 'Show all phases, not just MVP')
  .option('--spec <path>', 'Path to specification file (default: auto-detected)')
  .action(async (options) => {
    try {
      await showStatus(options);
    } catch (error) {
      console.error('Error showing status:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate project against specification (enforces MVP-first by default)')
  .option('--no-enforce-mvp', 'Disable MVP enforcement')
  .option('--spec <path>', 'Path to specification file (default: auto-detected)')
  .action(async (options) => {
    try {
      await validateProject(options);
    } catch (error) {
      console.error('Error validating project:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate compliance report formatted by implementation phases')
  .option('--format <type>', 'Output format (markdown, json)', 'markdown')
  .option('--output <path>', 'Output file path (default: stdout)')
  .option('--spec <path>', 'Path to specification file (default: auto-detected)')
  .action(async (options) => {
    try {
      await generateReport(options);
    } catch (error) {
      console.error('Error generating report:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Add help text about the one-click philosophy
program.addHelpText('after', `

One-Click Philosophy:
  Commands use sensible defaults and auto-detect context from your project.

  • Specification files are auto-discovered (SPEC.md, SPEC-*.md)
  • Project context is inferred from package.json, README, and codebase
  • MVP-first enforcement prevents premature advanced feature implementation
  • Minimal arguments required - the tool "just works"

Examples:
  $ mulder-specs init              # Create spec with auto-detected project info
  $ mulder-specs update            # Scan code and update progress automatically
  $ mulder-specs status            # Show MVP completion status
  $ mulder-specs validate          # Validate with MVP enforcement
  $ mulder-specs report            # Generate phase-based progress report
`);

program.parse();