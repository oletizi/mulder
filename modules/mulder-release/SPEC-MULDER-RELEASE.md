# Mulder Release Module

Tooling to support cutting a release in agentic projects:

* Bumping module versions prior to release
* Publishing npm modules to a registry
* Creating associated github releases

Feature 1: "One Click" Publish and Release

- [x] The user can execute a single npx command to bump module version(s), publish npm modules to a registry, creates an
  associated github releases.
- [x] The implementation is a clean, self-contained rewrite of the `pnpm release` command in
  ~/ol_dsp/modules/audio-control/ that can be run from the host project when this module is installed.
- [x] This module has an npm script to release itself.

## Usage

Install as a dev dependency in your project:

```bash
npm install --save-dev @oletizi/mulder-release
```

Run the one-click release command:

```bash
# Bump patch version (1.0.0 → 1.0.1), build, test, publish, and create GitHub release
npx mulder-release release patch

# Bump minor version (1.0.0 → 1.1.0)
npx mulder-release release minor

# Bump major version (1.0.0 → 2.0.0)
npx mulder-release release major

# Options
npx mulder-release release patch --dry-run        # Test without publishing
npx mulder-release release patch --skip-tests     # Skip test step
npx mulder-release release patch --skip-typecheck # Skip typecheck step
npx mulder-release release patch --access public  # Set npm access level
```

The `release` command performs these steps automatically:
1. Bumps version in all package.json files (root + modules/)
2. Cleans and rebuilds all modules
3. Runs tests (optional, can skip)
4. Runs type checking (optional, can skip)
5. Publishes non-private modules to npm
6. Commits version changes to git
7. Creates GitHub release with tarball
8. Pushes commits and tags to remote