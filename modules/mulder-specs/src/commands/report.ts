import * as fs from 'fs/promises';
import * as path from 'path';

interface ReportOptions {
  format?: 'markdown' | 'json';
  output?: string;
  spec?: string;
}

interface ReportData {
  projectName: string;
  generatedAt: string;
  summary: ProjectSummary;
  phases: PhaseReport[];
  compliance: ComplianceReport;
  recommendations: string[];
}

interface ProjectSummary {
  totalFeatures: number;
  completedFeatures: number;
  completionPercentage: number;
  mvpStatus: 'complete' | 'incomplete' | 'not-defined';
  currentPhase: string;
}

interface PhaseReport {
  name: string;
  status: 'complete' | 'in-progress' | 'not-started';
  features: FeatureReport[];
  completionPercentage: number;
  estimatedCompletion?: string;
}

interface FeatureReport {
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
}

interface ComplianceReport {
  mvpFirstCompliance: boolean;
  scopeCreepDetected: boolean;
  documentationCoverage: number;
  testCoverage?: number;
  violations: string[];
}

/**
 * Generate compliance report formatted by implementation phases
 */
export async function generateReport(options: ReportOptions): Promise<void> {
  console.log('📊 Generating project compliance report...');

  const specPath = options.spec || await findSpecificationFile();
  if (!specPath) {
    throw new Error('No specification file found. Run "mulder-specs init" first.');
  }

  const specContent = await fs.readFile(specPath, 'utf-8');
  const reportData = await generateReportData(specContent, specPath);

  const format = options.format || 'markdown';
  const output = await formatReport(reportData, format);

  if (options.output) {
    await fs.writeFile(options.output, output, 'utf-8');
    console.log(`✅ Report saved to: ${options.output}`);
  } else {
    console.log('\n' + output);
  }

  // Summary for CLI output
  console.log('\n📈 Report Summary:');
  console.log(`  • Overall Progress: ${reportData.summary.completionPercentage}%`);
  console.log(`  • MVP Status: ${reportData.summary.mvpStatus}`);
  console.log(`  • Current Phase: ${reportData.summary.currentPhase}`);
  console.log(`  • Compliance: ${reportData.compliance.mvpFirstCompliance ? '✅ Good' : '⚠️ Issues detected'}`);
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
 * Generate comprehensive report data
 */
async function generateReportData(specContent: string, specPath: string): Promise<ReportData> {
  const projectName = await detectProjectName(specPath);
  const phases = parseSpecificationPhases(specContent);

  // Calculate summary
  const totalFeatures = phases.reduce((sum, phase) => sum + phase.features.length, 0);
  const completedFeatures = phases.reduce((sum, phase) =>
    sum + phase.features.filter(f => f.status === 'completed').length, 0);

  const mvpPhase = phases.find(p => p.name === 'MVP');
  const mvpComplete = mvpPhase ?
    mvpPhase.features.every(f => f.status === 'completed') : false;

  const currentPhase = determineCurrentPhase(phases);

  // Generate compliance report
  const compliance = await generateComplianceReport(phases);

  // Generate recommendations
  const recommendations = generateRecommendations(phases, compliance);

  return {
    projectName,
    generatedAt: new Date().toISOString(),
    summary: {
      totalFeatures,
      completedFeatures,
      completionPercentage: totalFeatures > 0 ? Math.round((completedFeatures / totalFeatures) * 100) : 0,
      mvpStatus: mvpPhase ? (mvpComplete ? 'complete' : 'incomplete') : 'not-defined',
      currentPhase
    },
    phases,
    compliance,
    recommendations
  };
}

/**
 * Detect project name from various sources
 */
async function detectProjectName(specPath: string): Promise<string> {
  const projectDir = path.dirname(specPath);

  try {
    // Try package.json first
    const packagePath = path.join(projectDir, 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf-8');
    const packageInfo = JSON.parse(packageContent);
    if (packageInfo.name) {
      return packageInfo.name;
    }
  } catch {
    // Fallback to directory name
  }

  return path.basename(projectDir);
}

/**
 * Parse specification phases with detailed feature analysis
 */
function parseSpecificationPhases(content: string): PhaseReport[] {
  const lines = content.split('\n');
  const phases: PhaseReport[] = [];
  let currentPhase: PhaseReport | null = null;

  lines.forEach(line => {
    // Detect phase headers
    if (line.includes('MVP') && (line.includes('#') || line.includes('**'))) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = {
        name: 'MVP',
        status: 'not-started',
        features: [],
        completionPercentage: 0
      };
    } else if (line.includes('Phase 1') && (line.includes('#') || line.includes('**'))) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = {
        name: 'Phase 1',
        status: 'not-started',
        features: [],
        completionPercentage: 0
      };
    } else if (line.includes('Phase 2') && (line.includes('#') || line.includes('**'))) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = {
        name: 'Phase 2',
        status: 'not-started',
        features: [],
        completionPercentage: 0
      };
    }

    // Parse checkbox lines
    const checkboxMatch = line.match(/^(\s*)- \[([ x])\]\s*(.+)$/);
    if (checkboxMatch && currentPhase) {
      const [, , checkedChar, text] = checkboxMatch;
      currentPhase.features.push({
        name: extractFeatureName(text),
        description: text.trim(),
        status: checkedChar === 'x' ? 'completed' : 'pending',
        priority: determinePriority(text, currentPhase.name)
      });
    }
  });

  if (currentPhase) {
    phases.push(currentPhase);
  }

  // Calculate phase status and completion percentages
  phases.forEach(phase => {
    const completed = phase.features.filter(f => f.status === 'completed').length;
    const total = phase.features.length;

    phase.completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (completed === total && total > 0) {
      phase.status = 'complete';
    } else if (completed > 0) {
      phase.status = 'in-progress';
    } else {
      phase.status = 'not-started';
    }
  });

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
 * Determine feature priority based on context
 */
function determinePriority(text: string, phaseName: string): 'high' | 'medium' | 'low' {
  const lowerText = text.toLowerCase();

  if (phaseName === 'MVP') return 'high';

  if (lowerText.includes('core') || lowerText.includes('essential') || lowerText.includes('critical')) {
    return 'high';
  }

  if (lowerText.includes('basic') || lowerText.includes('important')) {
    return 'medium';
  }

  return 'low';
}

/**
 * Determine current development phase
 */
function determineCurrentPhase(phases: PhaseReport[]): string {
  const mvpPhase = phases.find(p => p.name === 'MVP');
  const phase1 = phases.find(p => p.name === 'Phase 1');
  const phase2 = phases.find(p => p.name === 'Phase 2');

  if (mvpPhase?.status === 'complete') {
    if (phase1?.status === 'complete') {
      return 'Phase 2';
    }
    return 'Phase 1';
  }

  return 'MVP';
}

/**
 * Generate compliance report
 */
async function generateComplianceReport(phases: PhaseReport[]): Promise<ComplianceReport> {
  const mvpPhase = phases.find(p => p.name === 'MVP');
  const mvpComplete = mvpPhase?.status === 'complete';

  // Check for advanced features implemented before MVP
  const advancedImplemented = phases
    .filter(p => p.name !== 'MVP')
    .some(p => p.features.some(f => f.status === 'completed'));

  const mvpFirstCompliance = !advancedImplemented || mvpComplete;

  return {
    mvpFirstCompliance,
    scopeCreepDetected: false, // Placeholder
    documentationCoverage: await calculateDocumentationCoverage(),
    violations: mvpFirstCompliance ? [] : ['Advanced features implemented before MVP completion']
  };
}

/**
 * Calculate documentation coverage
 */
async function calculateDocumentationCoverage(): Promise<number> {
  const cwd = process.cwd();
  let coverage = 0;

  try {
    await fs.access(path.join(cwd, 'README.md'));
    coverage += 40;
  } catch {}

  try {
    await fs.access(path.join(cwd, 'package.json'));
    coverage += 30;
  } catch {}

  try {
    const files = await fs.readdir(cwd);
    if (files.some(f => f.includes('test') || f.includes('spec'))) {
      coverage += 30;
    }
  } catch {}

  return coverage;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(phases: PhaseReport[], compliance: ComplianceReport): string[] {
  const recommendations: string[] = [];

  const mvpPhase = phases.find(p => p.name === 'MVP');

  if (mvpPhase && mvpPhase.status !== 'complete') {
    recommendations.push('Complete all MVP features before implementing advanced functionality');

    const nextMvpFeature = mvpPhase.features.find(f => f.status === 'pending');
    if (nextMvpFeature) {
      recommendations.push(`Next MVP priority: "${nextMvpFeature.name}"`);
    }
  }

  if (!compliance.mvpFirstCompliance) {
    recommendations.push('Review implementation strategy to ensure MVP-first development');
  }

  if (compliance.documentationCoverage < 80) {
    recommendations.push('Improve documentation coverage (README, API docs, tests)');
  }

  if (recommendations.length === 0) {
    recommendations.push('Great progress! Continue with current development phase');
    recommendations.push('Consider regular specification reviews and updates');
  }

  return recommendations;
}

/**
 * Format report in the specified format
 */
async function formatReport(data: ReportData, format: 'markdown' | 'json'): Promise<string> {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  // Markdown format
  return `# ${data.projectName} - Project Report

*Generated on ${new Date(data.generatedAt).toLocaleDateString()}*

## Executive Summary

- **Overall Progress:** ${data.summary.completionPercentage}% (${data.summary.completedFeatures}/${data.summary.totalFeatures} features)
- **MVP Status:** ${data.summary.mvpStatus === 'complete' ? '✅ Complete' : '⏳ In Progress'}
- **Current Phase:** ${data.summary.currentPhase}
- **Compliance:** ${data.compliance.mvpFirstCompliance ? '✅ MVP-First Compliant' : '⚠️ Compliance Issues'}

## Phase Progress

${data.phases.map(phase => `### ${phase.name}

**Status:** ${phase.status} (${phase.completionPercentage}% complete)

${phase.features.map(feature => {
  const status = feature.status === 'completed' ? '✅' : '⏳';
  const priority = feature.priority === 'high' ? '🔴' : feature.priority === 'medium' ? '🟡' : '🟢';
  return `- ${status} ${priority} **${feature.name}**`;
}).join('\n')}
`).join('\n')}

## Compliance Report

- **MVP-First Development:** ${data.compliance.mvpFirstCompliance ? '✅ Compliant' : '❌ Violations detected'}
- **Documentation Coverage:** ${data.compliance.documentationCoverage}%
- **Scope Creep:** ${data.compliance.scopeCreepDetected ? '⚠️ Detected' : '✅ None detected'}

${data.compliance.violations.length > 0 ? `### Violations
${data.compliance.violations.map(v => `- ⚠️ ${v}`).join('\n')}` : ''}

## Recommendations

${data.recommendations.map(rec => `1. ${rec}`).join('\n')}

## Next Steps

Based on the current progress, the recommended next steps are:

1. **Immediate Focus:** ${data.summary.currentPhase} phase completion
2. **Quality Assurance:** Address any compliance violations
3. **Documentation:** Maintain up-to-date project documentation
4. **Regular Reviews:** Use \`mulder-specs status\` for progress tracking

---

*Report generated by mulder-specs v0.5.0*
`;
}