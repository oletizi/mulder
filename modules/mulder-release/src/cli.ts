#!/usr/bin/env node

import { Command } from 'commander';
import { ReleaseManager } from './release-manager.js';
import { OneClickRelease } from './one-click-release.js';
import type { ReleaseType } from './types.js';

const program = new Command();

program
  .name('mulder-release')
  .description('CLI tool to support cutting releases in agentic projects')
  .version('0.1.0');

program
  .command('release')
  .description('One-click release: bump version, build, test, publish, and create GitHub release')
  .argument('<type>', 'Release type (major, minor, patch)')
  .option('--skip-tests', 'Skip running tests')
  .option('--skip-typecheck', 'Skip type checking')
  .option('--dry-run', 'Perform a dry run without publishing or committing')
  .option('-a, --access <access>', 'Package access level (public or restricted)', 'public')
  .action(async (type: string, options) => {
    const validTypes = ['major', 'minor', 'patch'];
    if (!validTypes.includes(type)) {
      console.error(`Invalid release type: ${type}`);
      console.error(`Valid types: ${validTypes.join(', ')}`);
      process.exit(1);
    }

    const release = new OneClickRelease();

    try {
      await release.execute({
        bumpType: type as 'major' | 'minor' | 'patch',
        skipTests: options.skipTests,
        skipTypecheck: options.skipTypecheck,
        dryRun: options.dryRun,
        access: options.access as 'public' | 'restricted',
      });
    } catch (error) {
      console.error('\n❌ Release failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('bump')
  .description('Bump package version')
  .argument('<type>', 'Release type (major, minor, patch, premajor, preminor, prepatch, prerelease)')
  .option('-p, --package-path <path>', 'Path to package directory', process.cwd())
  .option('--preid <identifier>', 'Prerelease identifier (e.g., alpha, beta, rc)')
  .action(async (type: string, options) => {
    const manager = new ReleaseManager();

    const validTypes: ReleaseType[] = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];
    if (!validTypes.includes(type as ReleaseType)) {
      console.error(`Invalid release type: ${type}`);
      console.error(`Valid types: ${validTypes.join(', ')}`);
      process.exit(1);
    }

    try {
      const pkgInfo = manager.getPackageInfo(options.packagePath);
      console.log(`Current version: ${pkgInfo.version}`);

      const newVersion = await manager.bumpVersion({
        releaseType: type as ReleaseType,
        preid: options.preid,
        packagePath: options.packagePath,
      });

      console.log(`✓ Version bumped to ${newVersion}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('publish')
  .description('Publish package to npm registry')
  .option('-p, --package-path <path>', 'Path to package directory', process.cwd())
  .option('-t, --tag <tag>', 'NPM distribution tag (e.g., latest, next, beta)')
  .option('-r, --registry <url>', 'NPM registry URL')
  .option('-a, --access <access>', 'Package access level (public or restricted)')
  .option('--dry-run', 'Perform a dry run without actually publishing')
  .action(async (options) => {
    const manager = new ReleaseManager();

    try {
      const pkgInfo = manager.getPackageInfo(options.packagePath);
      console.log(`Publishing ${pkgInfo.name}@${pkgInfo.version}...`);

      await manager.publish({
        packagePath: options.packagePath,
        tag: options.tag,
        registry: options.registry,
        access: options.access as 'public' | 'restricted',
        dryRun: options.dryRun,
      });

      if (options.dryRun) {
        console.log('✓ Dry run completed successfully');
      } else {
        console.log(`✓ Published ${pkgInfo.name}@${pkgInfo.version}`);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('github-release')
  .description('Create a GitHub release')
  .argument('<tag>', 'Release tag (e.g., v1.0.0)')
  .option('--title <title>', 'Release title')
  .option('--notes <notes>', 'Release notes')
  .option('--draft', 'Create as draft release')
  .option('--prerelease', 'Mark as prerelease')
  .option('--target <branch>', 'Target branch or commit')
  .action(async (tag: string, options) => {
    const manager = new ReleaseManager();

    try {
      console.log(`Creating GitHub release for ${tag}...`);

      await manager.createGitHubRelease({
        tag,
        title: options.title,
        notes: options.notes,
        draft: options.draft,
        prerelease: options.prerelease,
        target: options.target,
      });

      console.log(`✓ GitHub release created for ${tag}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('info')
  .description('Display package information')
  .option('-p, --package-path <path>', 'Path to package directory', process.cwd())
  .action((options) => {
    const manager = new ReleaseManager();

    try {
      const pkgInfo = manager.getPackageInfo(options.packagePath);
      console.log('Package Information:');
      console.log(`  Name: ${pkgInfo.name}`);
      console.log(`  Version: ${pkgInfo.version}`);
      console.log(`  Path: ${pkgInfo.path}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();