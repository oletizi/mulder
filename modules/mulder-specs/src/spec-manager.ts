import { readFile } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import {
  FeaturePhase,
  RequirementStatus,
  ProjectType,
  ProjectContext,
  SpecificationDocument,
  Feature,
  Requirement,
  MVPDefinition,
  ArchitectureDecision,
  TechnicalConstraint,
  TechnologyStack,
} from './types.js';

/**
 * Format technology stack for display
 */
function formatTechnologies(tech: TechnologyStack): string {
  const parts: string[] = [];

  if (tech.language) parts.push(tech.language);
  if (tech.framework) parts.push(tech.framework);
  if (tech.runtime) parts.push(tech.runtime);
  if (tech.databases?.length) parts.push(...tech.databases);
  if (tech.testing?.length) parts.push(...tech.testing);
  if (tech.buildTools?.length) parts.push(...tech.buildTools);
  if (tech.other?.length) parts.push(...tech.other);

  return parts.length > 0 ? parts.join(', ') : 'modern technologies';
}

/**
 * Configuration for specification generation
 */
export interface SpecGenerationConfig {
  projectRoot: string;
  outputPath?: string;
  templateType?: 'standard' | 'minimal' | 'comprehensive';
  enforceMvpFirst?: boolean;
  includeExamples?: boolean;
}

/**
 * Manages specification document creation and generation
 */
export class SpecManager {
  private readonly projectRoot: string;
  private readonly config: Required<SpecGenerationConfig>;

  constructor(config: SpecGenerationConfig) {
    this.projectRoot = config.projectRoot;
    this.config = {
      projectRoot: config.projectRoot,
      outputPath: config.outputPath || path.join(config.projectRoot, 'SPEC.md'),
      templateType: config.templateType || 'standard',
      enforceMvpFirst: config.enforceMvpFirst ?? true,
      includeExamples: config.includeExamples ?? true,
    };
  }

  /**
   * Creates a new specification document with project context analysis
   */
  async createSpecification(userDescription?: string): Promise<SpecificationDocument> {
    const context = await this.detectProjectContext();
    const specification = await this.generateSpecificationFromContext(context, userDescription);

    return specification;
  }

  /**
   * Writes specification to markdown file
   */
  async writeSpecificationToFile(specification: SpecificationDocument): Promise<string> {
    const markdown = this.generateMarkdown(specification);
    await writeFile(this.config.outputPath, markdown, 'utf-8');
    return this.config.outputPath;
  }

  /**
   * One-click initialization: analyze project and create spec
   */
  async initialize(userDescription?: string): Promise<string> {
    const specification = await this.createSpecification(userDescription);
    const outputPath = await this.writeSpecificationToFile(specification);
    return outputPath;
  }

  /**
   * Detects project context from package.json and codebase structure
   */
  private async detectProjectContext(): Promise<ProjectContext> {
    const now = new Date();
    let packageJson: any = {};

    try {
      // Read package.json if it exists
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      packageJson = await this.readJsonFile(packageJsonPath) || {};
    } catch (error) {
      // Continue with default context if detection fails
      console.warn('Failed to read package.json:', error);
    }

    // Detect technologies and build technology stack
    const technologies = await this.extractTechnologies(packageJson);

    const context: ProjectContext = {
      name: packageJson.name || path.basename(this.projectRoot),
      type: this.inferProjectType(packageJson, technologies),
      description: packageJson.description,
      technologies: {
        language: technologies.includes('TypeScript') ? 'TypeScript' : 'JavaScript',
        runtime: this.detectRuntime(packageJson),
        framework: this.detectFramework(packageJson, technologies),
        databases: technologies.filter(t => ['PostgreSQL', 'MongoDB', 'Redis'].includes(t)),
        testing: technologies.filter(t => t === 'Testing' || ['Jest', 'Vitest'].includes(t)),
        buildTools: technologies.filter(t => ['Webpack', 'Vite', 'ESBuild'].includes(t)),
        other: technologies.filter(t => !['TypeScript', 'JavaScript', 'PostgreSQL', 'MongoDB', 'Redis', 'Testing', 'Jest', 'Vitest', 'Webpack', 'Vite', 'ESBuild'].includes(t)),
      },
      version: packageJson.version,
      repository: typeof packageJson.repository === 'string' ? packageJson.repository : packageJson.repository?.url,
      confidence: 0.8, // Static for now, could be improved with better detection
      lastUpdated: now,
    };

    return context;
  }

  /**
   * Generates specification from detected context
   */
  private async generateSpecificationFromContext(
    context: ProjectContext,
    userDescription?: string
  ): Promise<SpecificationDocument> {
    const now = new Date();

    return {
      metadata: {
        version: '1.0.0',
        created: now,
        lastModified: now,
        authors: ['mulder-specs auto-generator'],
        formatVersion: '1.0',
      },
      project: context,
      overview: this.generateProjectOverview(context, userDescription),
      mvp: this.generateMvpDefinition(context),
      features: this.generateDefaultFeatures(context),
      architecture: this.generateArchitectureDecisions(context),
      constraints: this.generateTechnicalConstraints(context),
      roadmap: {
        phases: {
          [FeaturePhase.MVP]: {
            description: 'Core functionality required for minimal viability',
            prerequisites: [],
          },
          [FeaturePhase.PHASE_1]: {
            description: 'Enhanced functionality and user experience improvements',
            prerequisites: ['MVP completion'],
          },
          [FeaturePhase.PHASE_2]: {
            description: 'Advanced features and optimizations',
            prerequisites: ['Phase 1 completion'],
          },
          [FeaturePhase.PHASE_3]: {
            description: 'Future enhancements and ecosystem integration',
            prerequisites: ['Phase 2 completion'],
          },
          [FeaturePhase.FUTURE]: {
            description: 'Long-term vision and experimental features',
            prerequisites: ['Phase 3 completion'],
          },
        },
      },
    };
  }

  /**
   * Generates markdown from specification
   */
  private generateMarkdown(spec: SpecificationDocument): string {
    const sections = [
      this.generateHeader(spec),
      this.generateProjectOverviewSection(spec),
      this.generateMvpDefinitionSection(spec),
      this.generateFeaturesSection(spec),
      this.generateFeaturePrioritizationSection(spec),
      this.generateArchitectureSection(spec),
      this.generateTechnicalConstraintsSection(spec),
      this.generateAcceptanceCriteriaSection(spec),
      this.generateImplementationRoadmapSection(spec),
    ];

    return sections.join('\n\n');
  }

  private generateHeader(spec: SpecificationDocument): string {
    const tech = spec.project.technologies;
    const allTech = [
      tech.language,
      tech.framework,
      tech.runtime,
      ...(tech.databases || []),
      ...(tech.other || [])
    ].filter(Boolean);

    return `# ${spec.project.name} - Project Specification

*Generated on ${spec.metadata.created.toLocaleDateString()}*

**Project Type**: ${spec.project.type}
**Technologies**: ${allTech.join(', ')}
${tech.framework ? `**Framework**: ${tech.framework}  ` : ''}
${tech.runtime ? `**Runtime**: ${tech.runtime}  ` : ''}`;
  }

  private generateProjectOverviewSection(spec: SpecificationDocument): string {
    const tech = spec.project.technologies;
    return `## Project Overview

${spec.overview}

### Project Context
- **Name**: ${spec.project.name}
- **Type**: ${spec.project.type}
- **Version**: ${spec.project.version || 'N/A'}
- **Language**: ${tech.language}
- **Framework**: ${tech.framework || 'N/A'}
- **Runtime**: ${tech.runtime || 'N/A'}
- **Testing**: ${tech.testing?.join(', ') || 'N/A'}`;
  }

  private generateMvpDefinitionSection(spec: SpecificationDocument): string {
    return `## MVP Definition

${spec.mvp.description}

### Core MVP Requirements
The MVP must include only the essential features required for the project to function and provide value. Advanced features should be deferred to later phases.

### MVP Success Criteria
${spec.mvp.successCriteria.map(criteria => `- ${criteria}`).join('\n')}`;
  }

  private generateFeaturesSection(spec: SpecificationDocument): string {
    const phaseLabels = {
      [FeaturePhase.MVP]: 'MVP',
      [FeaturePhase.PHASE_1]: 'Phase 1',
      [FeaturePhase.PHASE_2]: 'Phase 2',
      [FeaturePhase.PHASE_3]: 'Phase 3',
      [FeaturePhase.FUTURE]: 'Future',
    };

    const sections = Object.values(FeaturePhase).map(phase => {
      const features = spec.features.filter(f => f.phase === phase);
      if (features.length === 0) return '';

      const featureList = features.map(feature => {
        const requirementsList = feature.requirements.map(req =>
          `  - [ ] ${req.description}`
        ).join('\n');

        return `- [ ] **${feature.name}**: ${feature.description}\n${requirementsList}`;
      }).join('\n\n');

      return `### ${phaseLabels[phase]} Features

${featureList}`;
    }).filter(Boolean);

    return `## Features and Requirements

${sections.join('\n\n')}`;
  }

  private generateFeaturePrioritizationSection(spec: SpecificationDocument): string {
    return `## Feature Prioritization

This project follows an **MVP-first development approach**:

1. **MVP Features**: Core functionality required for minimal viability
2. **Phase 1**: Essential enhancements and user experience improvements
3. **Phase 2**: Advanced features and optimizations
4. **Phase 3**: Nice-to-have features and future considerations

### Development Rules
- MVP features MUST be completed before any Phase 1 features
- Phase 1 features MUST be completed before any Phase 2 features
- No feature can be started if it depends on incomplete features from earlier phases`;
  }

  private generateArchitectureSection(spec: SpecificationDocument): string {
    const decisions = spec.architecture.map(decision =>
      `### ${decision.title}

${decision.description}

**Rationale:** ${decision.rationale}
${decision.alternatives ? `\n**Alternatives Considered:** ${decision.alternatives.join(', ')}` : ''}
${decision.consequences ? `\n**Consequences:** ${decision.consequences.join(', ')}` : ''}`
    ).join('\n\n');

    return `## Architecture Decisions

${decisions}`;
  }

  private generateTechnicalConstraintsSection(spec: SpecificationDocument): string {
    const constraints = spec.constraints.map(constraint =>
      `- **${constraint.type}**: ${constraint.description}${constraint.rationale ? ` (${constraint.rationale})` : ''}`
    ).join('\n');

    return `## Technical Constraints

${constraints}`;
  }

  private generateAcceptanceCriteriaSection(spec: SpecificationDocument): string {
    return `## Acceptance Criteria

### MVP Completion Criteria
- [ ] All MVP features are implemented and tested
- [ ] Core functionality works end-to-end
- [ ] Basic error handling is in place
- [ ] Code follows project coding standards

### General Acceptance Criteria
- [ ] All features have unit tests where applicable
- [ ] Documentation is updated for new features
- [ ] No breaking changes to existing functionality
- [ ] Performance requirements are met`;
  }

  private generateImplementationRoadmapSection(spec: SpecificationDocument): string {
    const roadmapContent = Object.entries(spec.roadmap?.phases || {}).map(([phase, details]) => {
      const phaseLabels = {
        [FeaturePhase.MVP]: 'MVP Phase',
        [FeaturePhase.PHASE_1]: 'Phase 1',
        [FeaturePhase.PHASE_2]: 'Phase 2',
        [FeaturePhase.PHASE_3]: 'Phase 3',
        [FeaturePhase.FUTURE]: 'Future Phase',
      };

      return `### ${phaseLabels[phase as FeaturePhase] || phase}
${details.description}
${details.prerequisites?.length ? `**Prerequisites:** ${details.prerequisites.join(', ')}` : ''}`;
    }).join('\n\n');

    return `## Implementation Roadmap

${roadmapContent}

### Current Status
- **Current Phase**: MVP (Planning)
- **MVP Progress**: 0% (Not Started)
- **Overall Progress**: 0% (Not Started)`;
  }

  // Helper methods for context detection

  private async readJsonFile(filePath: string): Promise<any> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private inferProjectType(packageJson: any, technologies: string[]): ProjectType {
    if (packageJson.bin) return ProjectType.CLI_TOOL;
    if (packageJson.main && !packageJson.dependencies?.express && !packageJson.dependencies?.fastify) {
      return ProjectType.LIBRARY;
    }
    if (packageJson.dependencies?.express || packageJson.dependencies?.fastify || packageJson.dependencies?.hono) {
      return ProjectType.API;
    }
    if (packageJson.dependencies?.react || packageJson.dependencies?.vue || packageJson.dependencies?.angular) {
      return ProjectType.APPLICATION;
    }
    return ProjectType.UNKNOWN;
  }

  private async extractTechnologies(packageJson: any): Promise<string[]> {
    const technologies: string[] = [];
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.typescript) technologies.push('TypeScript');
    if (deps.react) technologies.push('React');
    if (deps.vue) technologies.push('Vue');
    if (deps.angular) technologies.push('Angular');
    if (deps.express) technologies.push('Express');
    if (deps.fastify) technologies.push('Fastify');
    if (deps.hono) technologies.push('Hono');
    if (deps.prisma) technologies.push('Prisma');
    if (deps.mongoose) technologies.push('MongoDB');
    if (deps.pg) technologies.push('PostgreSQL');
    if (deps.redis) technologies.push('Redis');
    if (deps.jest || deps.vitest) technologies.push('Testing');
    if (deps.webpack) technologies.push('Webpack');
    if (deps.vite) technologies.push('Vite');
    if (deps.esbuild) technologies.push('ESBuild');

    return technologies;
  }

  private detectFramework(packageJson: any, technologies: string[]): string | undefined {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.react) return 'React';
    if (deps.vue) return 'Vue';
    if (deps.angular) return 'Angular';
    if (deps.express) return 'Express';
    if (deps.fastify) return 'Fastify';
    if (deps.hono) return 'Hono';

    return undefined;
  }

  private detectRuntime(packageJson: any): string | undefined {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.bun || packageJson.scripts?.dev?.includes('bun')) return 'Bun';
    if (deps.deno) return 'Deno';

    return 'Node.js'; // Default assumption
  }

  private async detectPackageManager(): Promise<string> {
    try {
      await stat(path.join(this.projectRoot, 'bun.lockb'));
      return 'bun';
    } catch {}

    try {
      await stat(path.join(this.projectRoot, 'yarn.lock'));
      return 'yarn';
    } catch {}

    try {
      await stat(path.join(this.projectRoot, 'pnpm-lock.yaml'));
      return 'pnpm';
    } catch {}

    return 'npm';
  }

  private async hasTestFiles(): Promise<boolean> {
    try {
      const testDirs = ['test', 'tests', 'spec', '__tests__'];
      const testExtensions = ['.test.', '.spec.'];

      // Check for test directories
      for (const dir of testDirs) {
        try {
          await stat(path.join(this.projectRoot, dir));
          return true;
        } catch {}
      }

      // Check for test files in src
      // This is a simplified check - in a real implementation,
      // you might want to recursively scan directories
      return false;
    } catch {
      return false;
    }
  }

  private async hasDocumentationFiles(): Promise<boolean> {
    const docFiles = ['README.md', 'README.rst', 'docs', 'documentation'];

    for (const file of docFiles) {
      try {
        await stat(path.join(this.projectRoot, file));
        return true;
      } catch {}
    }

    return false;
  }

  private generateProjectOverview(context: ProjectContext, userDescription?: string): string {
    if (userDescription) {
      return `${userDescription}

This ${context.type} project uses ${formatTechnologies(context.technologies)} and follows modern development practices.`;
    }

    const typeDescriptions = {
      [ProjectType.LIBRARY]: 'A reusable library providing specific functionality to other projects',
      [ProjectType.APPLICATION]: 'A complete application with user interface and business logic',
      [ProjectType.API]: 'A backend API service providing data and functionality to clients',
      [ProjectType.CLI_TOOL]: 'A command-line interface tool for performing specific tasks',
      [ProjectType.UNKNOWN]: 'A software project with specific goals and requirements',
      [ProjectType.FRONTEND]: 'A frontend application with user interface components',
      [ProjectType.BACKEND]: 'A backend service providing server-side functionality',
      [ProjectType.FULLSTACK]: 'A full-stack application with both frontend and backend components',
      [ProjectType.MICROSERVICE]: 'A microservice providing specific business functionality',
    };

    return `${typeDescriptions[context.type] || typeDescriptions[ProjectType.UNKNOWN]}.

This project uses ${formatTechnologies(context.technologies)} and follows modern development practices with a focus on maintainability, performance, and user experience.`;
  }

  private generateMvpDefinition(context: ProjectContext): MVPDefinition {
    const mvpTemplates = {
      [ProjectType.LIBRARY]: 'The MVP provides core functionality with a clean API, basic documentation, and essential features that solve the primary use case.',
      [ProjectType.APPLICATION]: 'The MVP includes basic user interface, core user workflows, and essential features needed for users to accomplish their primary goals.',
      [ProjectType.API]: 'The MVP provides essential endpoints, basic authentication, error handling, and core business logic required for client integration.',
      [ProjectType.CLI_TOOL]: 'The MVP includes core commands, basic help system, and essential functionality needed for users to perform primary tasks.',
      [ProjectType.UNKNOWN]: 'The MVP focuses on core functionality, basic user interactions, and essential features required for the project to provide value.',
      [ProjectType.FRONTEND]: 'The MVP includes essential user interface components and core user interactions.',
      [ProjectType.BACKEND]: 'The MVP provides core server functionality, data persistence, and essential business logic.',
      [ProjectType.FULLSTACK]: 'The MVP includes both frontend user interface and backend functionality for core use cases.',
      [ProjectType.MICROSERVICE]: 'The MVP provides essential service functionality with proper API contracts and monitoring.',
    };

    return {
      description: mvpTemplates[context.type] || mvpTemplates[ProjectType.UNKNOWN],
      coreFeatures: ['Project setup and configuration', 'Core functionality implementation', 'Basic error handling'],
      successCriteria: [
        'All MVP features are implemented and tested',
        'Core functionality works end-to-end',
        'Basic documentation is available',
        'Project is ready for initial user feedback',
      ],
    };
  }

  private generateDefaultFeatures(context: ProjectContext): Feature[] {
    const features: Feature[] = [];

    // Common MVP features
    features.push({
      id: 'setup-project',
      name: 'Project Setup',
      description: 'Initialize project structure, dependencies, and development environment',
      phase: FeaturePhase.MVP,
      requirements: [
        {
          id: 'setup-structure',
          description: 'Establish project structure and configuration',
          status: RequirementStatus.PENDING,
          phase: FeaturePhase.MVP,
          acceptanceCriteria: [
            'Project directory structure follows conventions',
            'Configuration files are properly set up',
            'Build system is configured and working',
          ],
        },
        {
          id: 'setup-deps',
          description: 'Install and configure essential dependencies',
          status: RequirementStatus.PENDING,
          phase: FeaturePhase.MVP,
          acceptanceCriteria: [
            'All required dependencies are installed',
            'Package.json is properly configured',
            'Development environment is ready',
          ],
        },
      ],
      completionPercentage: 0,
    });

    if (context.type === ProjectType.LIBRARY) {
      features.push(
        {
          id: 'core-api',
          name: 'Core API',
          description: 'Implement main library functionality with clean, typed API',
          phase: FeaturePhase.MVP,
          requirements: [
            {
              id: 'api-implementation',
              description: 'Implement core library functions',
              status: RequirementStatus.PENDING,
              phase: FeaturePhase.MVP,
              acceptanceCriteria: ['Core functions work correctly', 'API is intuitive and well-designed'],
            },
            {
              id: 'api-typing',
              description: 'Add comprehensive TypeScript types',
              status: RequirementStatus.PENDING,
              phase: FeaturePhase.MVP,
              acceptanceCriteria: ['All public APIs are fully typed', 'Type definitions are exported'],
            },
          ],
          completionPercentage: 0,
        },
        {
          id: 'documentation',
          name: 'API Documentation',
          description: 'Create comprehensive documentation for library usage',
          phase: FeaturePhase.PHASE_1,
          requirements: [
            {
              id: 'api-docs',
              description: 'Document all public APIs',
              status: RequirementStatus.PENDING,
              phase: FeaturePhase.PHASE_1,
              acceptanceCriteria: ['API documentation is complete', 'Examples are provided'],
            },
          ],
          completionPercentage: 0,
        }
      );
    }

    if (context.type === ProjectType.API) {
      features.push(
        {
          id: 'core-endpoints',
          name: 'Core API Endpoints',
          description: 'Implement essential API endpoints for core functionality',
          phase: FeaturePhase.MVP,
          requirements: [
            {
              id: 'endpoints-implementation',
              description: 'Implement essential REST endpoints',
              status: RequirementStatus.PENDING,
              phase: FeaturePhase.MVP,
              acceptanceCriteria: ['Core endpoints are functional', 'Request/response validation works'],
            },
          ],
          completionPercentage: 0,
        },
        {
          id: 'authentication',
          name: 'Authentication System',
          description: 'Implement secure user authentication and authorization',
          phase: FeaturePhase.PHASE_1,
          dependencies: ['core-endpoints'],
          requirements: [
            {
              id: 'auth-implementation',
              description: 'Implement authentication and authorization',
              status: RequirementStatus.PENDING,
              phase: FeaturePhase.PHASE_1,
              acceptanceCriteria: ['Authentication is secure', 'Authorization works correctly'],
            },
          ],
          completionPercentage: 0,
        }
      );
    }

    if (context.type === ProjectType.CLI_TOOL) {
      features.push({
        id: 'core-commands',
        name: 'Core Commands',
        description: 'Implement essential CLI commands and argument parsing',
        phase: FeaturePhase.MVP,
        requirements: [
          {
            id: 'commands-implementation',
            description: 'Implement core CLI commands',
            status: RequirementStatus.PENDING,
            phase: FeaturePhase.MVP,
            acceptanceCriteria: ['Commands work correctly', 'Help system is functional'],
          },
        ],
        completionPercentage: 0,
      });
    }

    // Common Phase 2 features
    features.push(
      {
        id: 'performance-optimization',
        name: 'Performance Optimization',
        description: 'Optimize performance and implement caching where appropriate',
        phase: FeaturePhase.PHASE_2,
        requirements: [
          {
            id: 'perf-optimization',
            description: 'Identify and resolve performance bottlenecks',
            status: RequirementStatus.PENDING,
            phase: FeaturePhase.PHASE_2,
            acceptanceCriteria: ['Performance meets requirements', 'Monitoring is in place'],
          },
        ],
        completionPercentage: 0,
      },
      {
        id: 'advanced-features',
        name: 'Advanced Features',
        description: 'Implement advanced functionality based on user feedback',
        phase: FeaturePhase.PHASE_2,
        requirements: [
          {
            id: 'advanced-implementation',
            description: 'Implement advanced features',
            status: RequirementStatus.PENDING,
            phase: FeaturePhase.PHASE_2,
            acceptanceCriteria: ['Features enhance user experience', 'Backward compatibility maintained'],
          },
        ],
        completionPercentage: 0,
      }
    );

    return features;
  }

  private generateArchitectureDecisions(context: ProjectContext): ArchitectureDecision[] {
    const decisions: ArchitectureDecision[] = [];

    decisions.push({
      title: 'Runtime Environment',
      description: `Use ${context.technologies.runtime || 'Node.js'} as the primary runtime environment`,
      rationale: 'Provides modern JavaScript runtime with excellent performance and ecosystem support',
    });

    if (context.technologies.language === 'TypeScript') {
      decisions.push({
        title: 'TypeScript Adoption',
        description: 'Use TypeScript for all source code',
        rationale: 'Provides type safety, better developer experience, and improved code maintainability',
      });
    }

    decisions.push(
      {
        title: 'Interface-First Design',
        description: 'Define clear interfaces for all major components',
        rationale: 'Promotes loose coupling and makes the system more testable and maintainable',
      },
      {
        title: 'Composition Over Inheritance',
        description: 'Favor composition patterns over class inheritance',
        rationale: 'Reduces complexity and increases flexibility in system design',
      },
      {
        title: 'Dependency Injection',
        description: 'Use constructor injection for dependencies',
        rationale: 'Improves testability and makes dependencies explicit',
      }
    );

    if (context.type === ProjectType.API) {
      decisions.push({
        title: 'RESTful API Design',
        description: 'Follow REST principles for API endpoints',
        rationale: 'Provides consistent and predictable API behavior',
      });
    }

    if (context.type === ProjectType.LIBRARY) {
      decisions.push({
        title: 'Module Format Support',
        description: 'Provide both ESM and CommonJS module formats',
        rationale: 'Ensures compatibility with different module systems',
      });
    }

    return decisions;
  }

  private generateTechnicalConstraints(context: ProjectContext): TechnicalConstraint[] {
    const constraints: TechnicalConstraint[] = [];

    constraints.push(
      {
        type: 'platform',
        description: 'Code files should not exceed 300-500 lines',
        rationale: 'Maintains readability and modularity',
      },
      {
        type: 'platform',
        description: 'All public APIs must be fully typed',
        rationale: 'Ensures type safety and better developer experience',
      },
      {
        type: 'platform',
        description: 'No fallbacks or mock data outside of test code',
        rationale: 'Prevents bugs from being masked by fallback behavior',
      }
    );

    if (context.type === ProjectType.LIBRARY) {
      constraints.push(
        {
          type: 'compliance',
          description: 'Must maintain semantic versioning',
          rationale: 'Ensures predictable upgrade paths for consumers',
        },
        {
          type: 'compliance',
          description: 'Breaking changes require major version bump',
          rationale: 'Protects consumers from unexpected breaking changes',
        }
      );
    }

    if (context.type === ProjectType.API) {
      constraints.push(
        {
          type: 'performance',
          description: 'Response times should be under 200ms for simple operations',
          rationale: 'Ensures good user experience',
        },
        {
          type: 'security',
          description: 'All endpoints must implement proper validation',
          rationale: 'Prevents security vulnerabilities and data corruption',
        }
      );
    }

    constraints.push({
      type: 'security',
      description: 'Security vulnerabilities must be addressed immediately',
      rationale: 'Protects users and maintains system integrity',
    });

    return constraints;
  }
}