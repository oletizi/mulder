export type ReleaseType = 'major' | 'minor' | 'patch' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease';

export interface ReleaseOptions {
  dryRun?: boolean;
  tag?: string;
  registry?: string;
  access?: 'public' | 'restricted';
}

export interface VersionBumpOptions {
  releaseType: ReleaseType;
  preid?: string;
  packagePath?: string;
}

export interface PublishOptions {
  packagePath?: string;
  tag?: string;
  registry?: string;
  access?: 'public' | 'restricted';
  dryRun?: boolean;
}

export interface GitHubReleaseOptions {
  tag: string;
  title?: string;
  notes?: string;
  draft?: boolean;
  prerelease?: boolean;
  target?: string;
}

export interface PackageInfo {
  name: string;
  version: string;
  path: string;
}