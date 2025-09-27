import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { inc, valid } from 'semver';
import type {
  VersionBumpOptions,
  PublishOptions,
  GitHubReleaseOptions,
  PackageInfo,
} from './types.js';

export interface IReleaseManager {
  bumpVersion(options: VersionBumpOptions): Promise<string>;
  publish(options: PublishOptions): Promise<void>;
  createGitHubRelease(options: GitHubReleaseOptions): Promise<void>;
  getPackageInfo(packagePath?: string): PackageInfo;
}

export class ReleaseManager implements IReleaseManager {
  constructor() {}

  getPackageInfo(packagePath?: string): PackageInfo {
    const pkgPath = packagePath || process.cwd();
    const packageJsonPath = join(pkgPath, 'package.json');

    if (!existsSync(packageJsonPath)) {
      throw new Error(`package.json not found at ${packageJsonPath}`);
    }

    const content = readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    if (!pkg.name) {
      throw new Error('package.json must have a name field');
    }

    if (!pkg.version) {
      throw new Error('package.json must have a version field');
    }

    return {
      name: pkg.name,
      version: pkg.version,
      path: pkgPath,
    };
  }

  async bumpVersion(options: VersionBumpOptions): Promise<string> {
    const pkgPath = options.packagePath || process.cwd();
    const packageJsonPath = join(pkgPath, 'package.json');

    if (!existsSync(packageJsonPath)) {
      throw new Error(`package.json not found at ${packageJsonPath}`);
    }

    const content = readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    if (!valid(pkg.version)) {
      throw new Error(`Invalid version in package.json: ${pkg.version}`);
    }

    const newVersion = options.preid
      ? inc(pkg.version, options.releaseType, options.preid)
      : inc(pkg.version, options.releaseType);

    if (!newVersion) {
      throw new Error(`Failed to bump version from ${pkg.version} with type ${options.releaseType}`);
    }

    pkg.version = newVersion;
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');

    return newVersion;
  }

  async publish(options: PublishOptions): Promise<void> {
    const pkgPath = options.packagePath || process.cwd();
    const packageJsonPath = join(pkgPath, 'package.json');

    if (!existsSync(packageJsonPath)) {
      throw new Error(`package.json not found at ${packageJsonPath}`);
    }

    const args: string[] = ['npm', 'publish'];

    if (options.tag) {
      args.push('--tag', options.tag);
    }

    if (options.registry) {
      args.push('--registry', options.registry);
    }

    if (options.access) {
      args.push('--access', options.access);
    }

    if (options.dryRun) {
      args.push('--dry-run');
    }

    try {
      execSync(args.join(' '), {
        cwd: pkgPath,
        stdio: 'inherit',
      });
    } catch (error) {
      throw new Error(`Failed to publish package: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createGitHubRelease(options: GitHubReleaseOptions): Promise<void> {
    const args: string[] = ['gh', 'release', 'create', options.tag];

    if (options.title) {
      args.push('--title', options.title);
    }

    if (options.notes) {
      args.push('--notes', options.notes);
    }

    if (options.draft) {
      args.push('--draft');
    }

    if (options.prerelease) {
      args.push('--prerelease');
    }

    if (options.target) {
      args.push('--target', options.target);
    }

    try {
      execSync(args.join(' '), {
        stdio: 'inherit',
      });
    } catch (error) {
      throw new Error(`Failed to create GitHub release: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}