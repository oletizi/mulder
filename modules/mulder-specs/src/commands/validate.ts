import * as fs from 'fs/promises';
import * as path from 'path';

interface ValidateOptions {
  enforceMvp?: boolean;
  spec?: string;
}

interface ValidationResult {
  valid: boolean;
  mvpComplete: boolean;
  violations: ValidationViolation[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

interface ValidationViolation {
  type: 'MVP_INCOMPLETE' | 'ADVANCED_BEFORE_MVP' | 'MISSING_IMPLEMENTATION' | 'SCOPE_CREEP';
  message: string;
  feature?: string;
  phase?: string;
  severity: 'error' | 'warning';
}

interface ValidationWarning {
  type: 'FEATURE_MISMATCH' | 'MISSING_TESTS' | 'DOCUMENTATION_GAP';
  message: string;
  suggestion: string;
}

interface ValidationSummary {
  totalFeatures: number;
  mvpFeatures: number;
  mvpCompleted: number;
  phase1Features: number;
  phase1Completed: number;
  overallCompliance: number;
}

/**
 * Validate project against specification (enforces MVP-first by default)
 */
export async function validateProject(options: ValidateOptions): Promise<void> {
  console.log('🔍 Validating project against specification...');

  const enforceMvp = options.enforceMvp !== false; // Default to true
  const specPath = options.spec || await findSpecificationFile();

  if (!specPath) {
    throw new Error('No specification file found. Run "mulder-specs init" first.');
  }

  const specContent = await fs.readFile(specPath, 'utf-8');
  const result = await performValidation(specContent, enforceMvp);

  displayValidationResults(result, enforceMvp);

  if (!result.valid) {
    console.log('\n❌ Validation failed');
    process.exit(1);
  } else {
    console.log('\n✅ Validation passed');
  }
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
 * Perform comprehensive validation
 */
async function performValidation(specContent: string, enforceMvp: boolean): Promise<ValidationResult> {
  const phases = parseSpecificationPhases(specContent);
  const violations: ValidationViolation[] = [];
  const warnings: ValidationWarning[] = [];

  const mvpPhase = phases.find(p => p.name === 'MVP');
  const phase1 = phases.find(p => p.name === 'Phase 1');
  const phase2 = phases.find(p => p.name === 'Phase 2');

  // Calculate summary
  const summary: ValidationSummary = {
    totalFeatures: phases.reduce((sum, p) => sum + p.features.length, 0),
    mvpFeatures: mvpPhase?.features.length || 0,
    mvpCompleted: mvpPhase?.features.filter(f => f.completed).length || 0,
    phase1Features: phase1?.features.length || 0,
    phase1Completed: phase1?.features.filter(f => f.completed).length || 0,
    overallCompliance: 0
  };

  const mvpComplete = summary.mvpFeatures > 0 && summary.mvpCompleted === summary.mvpFeatures;

  // MVP enforcement validation
  if (enforceMvp && !mvpComplete) {
    // Check if advanced features are implemented before MVP completion
    const advancedImplemented = [
      ...(phase1?.features.filter(f => f.completed) || []),
      ...(phase2?.features.filter(f => f.completed) || [])
    ];

    if (advancedImplemented.length > 0) {
      violations.push({
        type: 'ADVANCED_BEFORE_MVP',
        message: `${advancedImplemented.length} advanced features implemented before MVP completion`,
        severity: 'error'
      });

      advancedImplemented.forEach(feature => {
        violations.push({
          type: 'ADVANCED_BEFORE_MVP',
          message: `Advanced feature "${feature.name}" implemented before MVP completion`,
          feature: feature.name,
          phase: feature.phase,
          severity: 'warning'
        });
      });
    }

    // MVP incomplete violation
    const mvpRemaining = summary.mvpFeatures - summary.mvpCompleted;
    if (mvpRemaining > 0) {
      violations.push({
        type: 'MVP_INCOMPLETE',
        message: `MVP incomplete: ${mvpRemaining} features remaining`,
        severity: 'error'
      });
    }
  }

  // Check for scope creep
  const scopeCreepViolations = await detectScopeCreep();
  violations.push(...scopeCreepViolations);

  // Generate warnings for missing documentation, tests, etc.
  const documentationWarnings = await checkDocumentation();
  warnings.push(...documentationWarnings);

  // Calculate overall compliance
  summary.overallCompliance = summary.totalFeatures > 0
    ? Math.round(((summary.mvpCompleted + summary.phase1Completed) / summary.totalFeatures) * 100)
    : 0;

  return {
    valid: violations.filter(v => v.severity === 'error').length === 0,
    mvpComplete,
    violations,
    warnings,
    summary
  };
}

/**
 * Parse specification phases
 */
function parseSpecificationPhases(content: string): Array<{ name: string; features: Array<{ name: string; completed: boolean; phase: string }> }> {
  const lines = content.split('\n');
  const phases: Array<{ name: string; features: Array<{ name: string; completed: boolean; phase: string }> }> = [];
  let currentPhase: { name: string; features: Array<{ name: string; completed: boolean; phase: string }> } | null = null;

  lines.forEach(line => {
    // Detect phase headers
    if (line.includes('MVP') && (line.includes('#') || line.includes('**'))) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = { name: 'MVP', features: [] };
    } else if (line.includes('Phase 1') && (line.includes('#') || line.includes('**'))) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = { name: 'Phase 1', features: [] };
    } else if (line.includes('Phase 2') && (line.includes('#') || line.includes('**'))) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = { name: 'Phase 2', features: [] };
    }

    // Parse checkbox lines
    const checkboxMatch = line.match(/^(\s*)- \[([ x])\]\s*(.+)$/);
    if (checkboxMatch && currentPhase) {
      const [, , checkedChar, text] = checkboxMatch;
      currentPhase.features.push({
        name: extractFeatureName(text),
        completed: checkedChar === 'x',
        phase: currentPhase.name
      });
    }
  });

  if (currentPhase) {
    phases.push(currentPhase);
  }

  return phases;
}

/**
 * Extract feature name from checkbox text
 */
function extractFeatureName(text: string): string {
  return text
    .replace(/^\*\*(.+?)\*\*/, '$1')
    .replace(/^[*-]\s*/, '')
    .split('\n')[0]
    .split('-')[0]
    .trim();
}

/**
 * Detect scope creep by analyzing codebase
 */
async function detectScopeCreep(): Promise<ValidationViolation[]> {
  // Placeholder implementation
  // In real implementation, this would scan the codebase for
  // features not mentioned in the specification
  return [];
}

/**
 * Check documentation completeness
 */
async function checkDocumentation(): Promise<ValidationWarning[]> {
  const warnings: ValidationWarning[] = [];
  const cwd = process.cwd();

  try {
    // Check for README
    await fs.access(path.join(cwd, 'README.md'));
  } catch {
    warnings.push({
      type: 'DOCUMENTATION_GAP',
      message: 'README.md not found',
      suggestion: 'Create a README.md with setup and usage instructions'
    });
  }

  try {
    // Check for package.json
    await fs.access(path.join(cwd, 'package.json'));
  } catch {
    warnings.push({
      type: 'DOCUMENTATION_GAP',
      message: 'package.json not found',
      suggestion: 'Initialize package.json with project metadata'
    });
  }

  return warnings;
}

/**
 * Display validation results
 */
function displayValidationResults(result: ValidationResult, enforceMvp: boolean): void {
  console.log('\n📊 Validation Results\n');

  // Summary
  console.log('Summary:');
  console.log(`  • Total Features: ${result.summary.totalFeatures}`);
  console.log(`  • MVP Features: ${result.summary.mvpCompleted}/${result.summary.mvpFeatures}`);
  if (result.summary.phase1Features > 0) {
    console.log(`  • Phase 1 Features: ${result.summary.phase1Completed}/${result.summary.phase1Features}`);
  }
  console.log(`  • Overall Compliance: ${result.summary.overallCompliance}%`);

  // MVP Status
  if (enforceMvp) {
    console.log('\n🎯 MVP Status:');
    if (result.mvpComplete) {
      console.log('  ✅ MVP Complete - ready for advanced features');
    } else {
      console.log(`  ⏳ MVP Incomplete - ${result.summary.mvpFeatures - result.summary.mvpCompleted} features remaining`);
    }
  }

  // Violations
  if (result.violations.length > 0) {
    console.log('\n❌ Violations:');
    result.violations.forEach(violation => {
      const icon = violation.severity === 'error' ? '🚫' : '⚠️';
      console.log(`  ${icon} ${violation.message}`);
      if (violation.feature) {
        console.log(`     Feature: ${violation.feature}`);
      }
      if (violation.phase) {
        console.log(`     Phase: ${violation.phase}`);
      }
    });
  }

  // Warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.log(`  • ${warning.message}`);
      console.log(`    Suggestion: ${warning.suggestion}`);
    });
  }

  // Recommendations
  if (!result.valid) {
    console.log('\n🔧 Recommendations:');
    if (!result.mvpComplete && enforceMvp) {
      console.log('  1. Complete remaining MVP features before implementing advanced features');
      console.log('  2. Use "mulder-specs status" to see which MVP features need attention');
    }
    if (result.violations.some(v => v.type === 'ADVANCED_BEFORE_MVP')) {
      console.log('  3. Consider moving advanced features to appropriate development phases');
    }
  }
}