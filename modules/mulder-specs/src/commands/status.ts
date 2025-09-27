import * as fs from 'fs/promises';
import * as path from 'path';

interface StatusOptions {
  allPhases?: boolean;
  spec?: string;
}

interface PhaseStatus {
  name: string;
  total: number;
  completed: number;
  percentage: number;
  features: FeatureStatus[];
}

interface FeatureStatus {
  name: string;
  completed: boolean;
  description: string;
}

/**
 * View current implementation status (MVP progress by default)
 */
export async function showStatus(options: StatusOptions): Promise<void> {
  console.log('📊 Analyzing project status...');

  const specPath = options.spec || await findSpecificationFile();
  if (!specPath) {
    throw new Error('No specification file found. Run "mulder-specs init" first.');
  }

  const specContent = await fs.readFile(specPath, 'utf-8');
  const phases = parsePhaseStatus(specContent);

  if (phases.length === 0) {
    console.log('⚠️  No features found in specification');
    return;
  }

  // Show MVP by default, all phases if requested
  if (options.allPhases) {
    displayAllPhases(phases);
  } else {
    displayMvpStatus(phases);
  }

  // Show next steps based on current status
  showNextSteps(phases);
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
 * Parse phase status from specification content
 */
function parsePhaseStatus(content: string): PhaseStatus[] {
  const lines = content.split('\n');
  const phases: PhaseStatus[] = [];
  let currentPhase: PhaseStatus | null = null;

  lines.forEach(line => {
    // Detect phase headers
    if (line.includes('MVP') && (line.includes('#') || line.includes('**'))) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = {
        name: 'MVP',
        total: 0,
        completed: 0,
        percentage: 0,
        features: []
      };
    } else if (line.includes('Phase 1') && (line.includes('#') || line.includes('**'))) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = {
        name: 'Phase 1',
        total: 0,
        completed: 0,
        percentage: 0,
        features: []
      };
    } else if (line.includes('Phase 2') && (line.includes('#') || line.includes('**'))) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = {
        name: 'Phase 2',
        total: 0,
        completed: 0,
        percentage: 0,
        features: []
      };
    }

    // Parse checkbox lines
    const checkboxMatch = line.match(/^(\s*)- \[([ x])\]\s*(.+)$/);
    if (checkboxMatch && currentPhase) {
      const [, , checkedChar, text] = checkboxMatch;
      const completed = checkedChar === 'x';
      const featureName = extractFeatureName(text);

      currentPhase.features.push({
        name: featureName,
        completed,
        description: text.trim()
      });

      currentPhase.total++;
      if (completed) {
        currentPhase.completed++;
      }
    }
  });

  // Add the last phase
  if (currentPhase) {
    phases.push(currentPhase);
  }

  // Calculate percentages
  phases.forEach(phase => {
    phase.percentage = phase.total > 0 ? Math.round((phase.completed / phase.total) * 100) : 0;
  });

  return phases;
}

/**
 * Extract feature name from checkbox text
 */
function extractFeatureName(text: string): string {
  return text
    .replace(/^\*\*(.+?)\*\*/, '$1') // Remove bold
    .replace(/^[*-]\s*/, '') // Remove bullet points
    .split('\n')[0] // Take first line only
    .split('-')[0] // Take part before description
    .trim();
}

/**
 * Display MVP status only
 */
function displayMvpStatus(phases: PhaseStatus[]): void {
  const mvpPhase = phases.find(p => p.name === 'MVP');

  if (!mvpPhase) {
    console.log('⚠️  No MVP section found in specification');
    return;
  }

  console.log('\n🎯 MVP Progress\n');
  console.log(`${getProgressBar(mvpPhase.percentage)} ${mvpPhase.percentage}% (${mvpPhase.completed}/${mvpPhase.total})`);

  console.log('\nFeature Status:');
  mvpPhase.features.forEach(feature => {
    const status = feature.completed ? '✅' : '⏳';
    console.log(`  ${status} ${feature.name}`);
  });

  if (mvpPhase.percentage === 100) {
    console.log('\n🎉 MVP Complete! Ready for Phase 1 development.');
  } else {
    const remaining = mvpPhase.total - mvpPhase.completed;
    console.log(`\n📋 ${remaining} MVP features remaining`);
  }
}

/**
 * Display status for all phases
 */
function displayAllPhases(phases: PhaseStatus[]): void {
  console.log('\n📈 Project Progress Overview\n');

  phases.forEach(phase => {
    console.log(`${phase.name}:`);
    console.log(`${getProgressBar(phase.percentage)} ${phase.percentage}% (${phase.completed}/${phase.total})`);

    if (phase.features.length > 0) {
      phase.features.forEach(feature => {
        const status = feature.completed ? '✅' : '⏳';
        console.log(`  ${status} ${feature.name}`);
      });
    }
    console.log('');
  });
}

/**
 * Generate a visual progress bar
 */
function getProgressBar(percentage: number, length: number = 20): string {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Show recommended next steps based on current status
 */
function showNextSteps(phases: PhaseStatus[]): void {
  const mvpPhase = phases.find(p => p.name === 'MVP');
  const phase1 = phases.find(p => p.name === 'Phase 1');

  console.log('\n🎯 Recommended Next Steps:');

  if (!mvpPhase || mvpPhase.percentage < 100) {
    console.log('  1. Complete remaining MVP features first');
    console.log('  2. Run "mulder-specs validate" to check MVP compliance');
    if (mvpPhase) {
      const nextFeature = mvpPhase.features.find(f => !f.completed);
      if (nextFeature) {
        console.log(`  3. Next MVP feature: "${nextFeature.name}"`);
      }
    }
  } else if (phase1 && phase1.percentage < 100) {
    console.log('  1. MVP complete - ready for Phase 1 features');
    console.log('  2. Choose next Phase 1 feature to implement');
    const nextFeature = phase1.features.find(f => !f.completed);
    if (nextFeature) {
      console.log(`  3. Suggested next: "${nextFeature.name}"`);
    }
  } else {
    console.log('  1. Great progress! Consider Phase 2 features');
    console.log('  2. Review and update specification as needed');
    console.log('  3. Generate final report with "mulder-specs report"');
  }

  console.log('\n📚 Commands:');
  console.log('  • mulder-specs update     - Scan for completed features');
  console.log('  • mulder-specs validate   - Check MVP enforcement');
  console.log('  • mulder-specs report     - Generate detailed report');
}