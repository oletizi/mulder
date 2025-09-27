import * as fs from 'fs/promises';
import * as path from 'path';

interface UpdateOptions {
  dryRun?: boolean;
  spec?: string;
}

interface SpecCheckbox {
  line: number;
  text: string;
  checked: boolean;
  feature: string;
  phase: 'MVP' | 'Phase 1' | 'Phase 2' | 'Unknown';
}

/**
 * Update progress by scanning codebase and updating spec checkboxes
 */
export async function updateProgress(options: UpdateOptions): Promise<void> {
  console.log('🔍 Scanning codebase for implemented features...');

  const specPath = options.spec || await findSpecificationFile();
  if (!specPath) {
    throw new Error('No specification file found. Run "mulder-specs init" first.');
  }

  const specContent = await fs.readFile(specPath, 'utf-8');
  const checkboxes = parseCheckboxes(specContent);

  console.log(`📋 Found ${checkboxes.length} features to analyze`);

  const updatedCheckboxes = await analyzeImplementation(checkboxes);
  const changes = updatedCheckboxes.filter((cb, i) => cb.checked !== checkboxes[i].checked);

  if (changes.length === 0) {
    console.log('✅ No changes detected - all features are correctly marked');
    return;
  }

  console.log(`\n📊 Detected ${changes.length} changes:`);
  changes.forEach(change => {
    const status = change.checked ? '✅ Completed' : '⏳ Not implemented';
    console.log(`  ${status}: ${change.feature}`);
  });

  if (options.dryRun) {
    console.log('\n🔍 Dry run mode - no changes written to specification');
    return;
  }

  // Update the specification file
  const updatedContent = updateSpecContent(specContent, updatedCheckboxes);
  await fs.writeFile(specPath, updatedContent, 'utf-8');

  console.log(`\n✅ Updated ${specPath} with ${changes.length} changes`);
  console.log('\nNext steps:');
  console.log('  • Run "mulder-specs status" to see current progress');
  console.log('  • Run "mulder-specs validate" to check MVP compliance');
}

/**
 * Find the specification file in the project
 */
async function findSpecificationFile(): Promise<string | null> {
  const cwd = process.cwd();
  const possiblePaths = [
    path.join(cwd, 'SPEC.md'),
    path.join(cwd, 'spec.md'),
    ...(await findSpecFiles(cwd))
  ];

  for (const specPath of possiblePaths) {
    try {
      await fs.access(specPath);
      return specPath;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Find all SPEC-*.md files in the project
 */
async function findSpecFiles(directory: string): Promise<string[]> {
  try {
    const files = await fs.readdir(directory);
    return files
      .filter(file => file.match(/^SPEC.*\.md$/i))
      .map(file => path.join(directory, file));
  } catch {
    return [];
  }
}

/**
 * Parse checkboxes from specification content
 */
function parseCheckboxes(content: string): SpecCheckbox[] {
  const lines = content.split('\n');
  const checkboxes: SpecCheckbox[] = [];
  let currentPhase: 'MVP' | 'Phase 1' | 'Phase 2' | 'Unknown' = 'Unknown';

  lines.forEach((line, index) => {
    // Detect phase sections
    if (line.includes('MVP') && (line.includes('#') || line.includes('**'))) {
      currentPhase = 'MVP';
    } else if (line.includes('Phase 1') && (line.includes('#') || line.includes('**'))) {
      currentPhase = 'Phase 1';
    } else if (line.includes('Phase 2') && (line.includes('#') || line.includes('**'))) {
      currentPhase = 'Phase 2';
    }

    // Parse checkbox lines
    const checkboxMatch = line.match(/^(\s*)- \[([ x])\]\s*(.+)$/);
    if (checkboxMatch) {
      const [, , checkedChar, text] = checkboxMatch;
      checkboxes.push({
        line: index,
        text: text.trim(),
        checked: checkedChar === 'x',
        feature: extractFeatureName(text),
        phase: currentPhase
      });
    }
  });

  return checkboxes;
}

/**
 * Extract feature name from checkbox text
 */
function extractFeatureName(text: string): string {
  // Remove markdown formatting and extract main feature name
  return text
    .replace(/^\*\*(.+?)\*\*/, '$1') // Remove bold
    .replace(/^[*-]\s*/, '') // Remove bullet points
    .split('\n')[0] // Take first line only
    .trim();
}

/**
 * Analyze implementation status by scanning codebase
 */
async function analyzeImplementation(checkboxes: SpecCheckbox[]): Promise<SpecCheckbox[]> {
  const cwd = process.cwd();

  // This is a placeholder implementation. In a real implementation,
  // this would use Claude in non-interactive mode to analyze the codebase
  // and determine which features are implemented.

  const updatedCheckboxes = [...checkboxes];

  for (let i = 0; i < updatedCheckboxes.length; i++) {
    const checkbox = updatedCheckboxes[i];
    const isImplemented = await checkFeatureImplementation(checkbox, cwd);
    updatedCheckboxes[i] = { ...checkbox, checked: isImplemented };
  }

  return updatedCheckboxes;
}

/**
 * Check if a feature is implemented (placeholder)
 */
async function checkFeatureImplementation(checkbox: SpecCheckbox, cwd: string): Promise<boolean> {
  // This is a simplified heuristic. In the real implementation,
  // this would use more sophisticated analysis.

  const feature = checkbox.feature.toLowerCase();

  try {
    // Check for package.json if it's about project setup
    if (feature.includes('project structure') || feature.includes('dependencies')) {
      const packagePath = path.join(cwd, 'package.json');
      await fs.access(packagePath);
      return true;
    }

    // Check for README if it's about documentation
    if (feature.includes('readme') || feature.includes('documentation')) {
      const readmePath = path.join(cwd, 'README.md');
      await fs.access(readmePath);
      return true;
    }

    // Check for TypeScript config if it's about TypeScript setup
    if (feature.includes('typescript') || feature.includes('type definitions')) {
      const tsconfigPath = path.join(cwd, 'tsconfig.json');
      await fs.access(tsconfigPath);
      return true;
    }

    // Check for test files if it's about testing
    if (feature.includes('test') || feature.includes('testing')) {
      const files = await fs.readdir(cwd);
      return files.some(file =>
        file.includes('test') ||
        file.includes('spec') ||
        file.endsWith('.test.ts') ||
        file.endsWith('.spec.ts')
      );
    }

    // For other features, keep existing status
    return checkbox.checked;

  } catch {
    return checkbox.checked;
  }
}

/**
 * Update specification content with new checkbox states
 */
function updateSpecContent(content: string, checkboxes: SpecCheckbox[]): string {
  const lines = content.split('\n');

  checkboxes.forEach(checkbox => {
    const line = lines[checkbox.line];
    if (line) {
      const checkChar = checkbox.checked ? 'x' : ' ';
      lines[checkbox.line] = line.replace(/- \[([ x])\]/, `- [${checkChar}]`);
    }
  });

  return lines.join('\n');
}