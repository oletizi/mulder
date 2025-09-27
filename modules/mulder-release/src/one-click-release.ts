import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface PackageJson {
  name: string;
  version: string;
  private?: boolean;
  [key: string]: unknown;
}

export interface OneClickReleaseOptions {
  bumpType: 'major' | 'minor' | 'patch';
  rootDir?: string;
  modulesDir?: string;
  skipTests?: boolean;
  skipTypecheck?: boolean;
  dryRun?: boolean;
  access?: 'public' | 'restricted';
}

export class OneClickRelease {
  private rootDir: string;
  private modulesDir: string;

  constructor(rootDir?: string) {
    this.rootDir = rootDir || process.cwd();
    this.modulesDir = join(this.rootDir, 'modules');
  }

  private execCommand(command: string, cwd?: string): void {
    console.log(`\n→ ${command}`);
    execSync(command, {
      cwd: cwd || this.rootDir,
      stdio: 'inherit',
      encoding: 'utf-8',
    });
  }

  private parseVersion(version: string): [number, number, number] {
    const parts = version.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error(`Invalid version format: ${version}`);
    }
    return parts as [number, number, number];
  }

  private bumpVersionString(version: string, type: 'major' | 'minor' | 'patch'): string {
    const [major, minor, patch] = this.parseVersion(version);

    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  private updatePackageVersion(path: string, newVersion: string): void {
    const content = readFileSync(path, 'utf-8');
    const pkg: PackageJson = JSON.parse(content);
    pkg.version = newVersion;
    writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  }

  private getModules(): string[] {
    if (!existsSync(this.modulesDir)) {
      return [];
    }

    return readdirSync(this.modulesDir).filter((name) => {
      const modulePath = join(this.modulesDir, name);
      return statSync(modulePath).isDirectory();
    });
  }

  private getPublishedModules(): PackageJson[] {
    const modules = this.getModules();
    const published: PackageJson[] = [];

    for (const moduleName of modules) {
      const packagePath = join(this.modulesDir, moduleName, 'package.json');
      if (existsSync(packagePath)) {
        const pkg: PackageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
        if (!pkg.private) {
          published.push(pkg);
        }
      }
    }

    if (published.length === 0) {
      const rootPackagePath = join(this.rootDir, 'package.json');
      if (existsSync(rootPackagePath)) {
        const rootPkg: PackageJson = JSON.parse(readFileSync(rootPackagePath, 'utf-8'));
        if (!rootPkg.private) {
          published.push(rootPkg);
        }
      }
    }

    return published;
  }

  private bumpAllVersions(bumpType: 'major' | 'minor' | 'patch'): string {
    const rootPackagePath = join(this.rootDir, 'package.json');

    if (!existsSync(rootPackagePath)) {
      throw new Error(`package.json not found at ${rootPackagePath}`);
    }

    const rootPkg: PackageJson = JSON.parse(readFileSync(rootPackagePath, 'utf-8'));
    const currentVersion = rootPkg.version;
    const newVersion = this.bumpVersionString(currentVersion, bumpType);

    console.log(`\nBumping version: ${currentVersion} → ${newVersion}`);

    this.updatePackageVersion(rootPackagePath, newVersion);
    console.log(`  ✓ Root package.json`);

    const modules = this.getModules();
    for (const moduleName of modules) {
      const packagePath = join(this.modulesDir, moduleName, 'package.json');
      if (existsSync(packagePath)) {
        this.updatePackageVersion(packagePath, newVersion);
        console.log(`  ✓ ${moduleName}/package.json`);
      }
    }

    console.log(`\nVersion bump complete: ${newVersion}`);
    return newVersion;
  }

  private createGitHubRelease(version: string, modules: PackageJson[]): void {
    const rootPkg: PackageJson = JSON.parse(
      readFileSync(join(this.rootDir, 'package.json'), 'utf-8')
    );
    const projectName = rootPkg.name.replace('@', '').replace('/', '-');
    const tag = `${projectName}@${version}`;
    const title = `${projectName} ${version}`;

    const notes = `## Published Modules

${modules.map((pkg) => `- ${pkg.name}@${version}`).join('\n')}

Published to npm.

## Installation

\`\`\`bash
npm install ${modules[0]?.name || projectName}
\`\`\`

See individual package READMEs for usage details.`;

    console.log(`\nCreating module tarball...`);
    const tarballName = `${projectName}-${version}.tar.gz`;
    const tarballPath = join(this.rootDir, tarballName);

    this.execCommand(
      `tar -czf "${tarballPath}" --exclude node_modules --exclude dist --exclude '*.tsbuildinfo' .`
    );
    console.log(`✓ Created ${tarballName}`);

    console.log(`\nCreating GitHub release ${tag}...`);

    try {
      this.execCommand(
        `gh release create "${tag}" --title "${title}" --notes "${notes}" "${tarballPath}"`
      );
      console.log(`✓ GitHub release created: ${tag}`);

      this.execCommand(`rm -f "${tarballPath}"`);
    } catch (error) {
      console.error('⚠️  Failed to create GitHub release');
      console.error('You can create it manually with:');
      console.error(
        `  gh release create "${tag}" --title "${title}" --notes "${notes}" "${tarballPath}"`
      );
      this.execCommand(`rm -f "${tarballPath}"`);
      throw error;
    }
  }

  async execute(options: OneClickReleaseOptions): Promise<void> {
    console.log('=== Release Process ===\n');

    console.log('Step 1: Bump version');
    const newVersion = this.bumpAllVersions(options.bumpType);

    console.log('\nStep 2: Clean and build');
    try {
      this.execCommand('pnpm clean');
    } catch (error) {
      console.log('⚠️  No clean script found, skipping...');
    }
    this.execCommand('pnpm build');

    if (!options.skipTests) {
      console.log('\nStep 3: Run tests');
      try {
        this.execCommand('pnpm test');
      } catch (error) {
        console.log('⚠️  Some modules have no tests, continuing...');
      }
    }

    if (!options.skipTypecheck) {
      console.log('\nStep 4: Type check');
      this.execCommand('pnpm typecheck');
    }

    const publishedModules = this.getPublishedModules();

    console.log(`\nStep 5: Publishing ${publishedModules.length} package(s) to npm...`);

    for (const pkg of publishedModules) {
      const isRootPackage = publishedModules.length === 1 && !existsSync(this.modulesDir);
      const modulePath = isRootPackage
        ? this.rootDir
        : join(this.modulesDir, pkg.name.split('/').pop() || '');

      console.log(`\n  Publishing ${pkg.name}@${pkg.version}...`);

      const publishCmd = options.dryRun
        ? `npm publish --access ${options.access || 'public'} --dry-run`
        : `npm publish --access ${options.access || 'public'}`;

      try {
        this.execCommand(publishCmd, modulePath);
        console.log(`  ✓ ${pkg.name}@${pkg.version} ${options.dryRun ? '(dry run)' : 'published'}`);
      } catch (error) {
        console.error(`  ✗ Failed to publish ${pkg.name}`);
        throw error;
      }
    }

    if (options.dryRun) {
      console.log('\n=== Dry Run Complete ===');
      console.log('No changes were committed or pushed.');
      return;
    }

    console.log('\nStep 6: Commit version changes');
    this.execCommand('git add .');
    const rootPkg: PackageJson = JSON.parse(
      readFileSync(join(this.rootDir, 'package.json'), 'utf-8')
    );
    this.execCommand(`git commit -m "chore(release): publish ${rootPkg.name}@${newVersion}"`);
    console.log(`✓ Committed version ${newVersion}`);

    console.log('\nStep 7: Create GitHub release and push');
    this.createGitHubRelease(newVersion, publishedModules);
    this.execCommand('git push origin HEAD --follow-tags');
    console.log('✓ Pushed commits and tags to remote');

    console.log('\n=== Release Complete ===');
    console.log(`\n✓ Published ${publishedModules.length} modules at v${newVersion}`);
    console.log(`✓ Committed and pushed ${rootPkg.name}@${newVersion}`);
    console.log(`✓ Created GitHub release: ${rootPkg.name}@${newVersion}`);
  }
}