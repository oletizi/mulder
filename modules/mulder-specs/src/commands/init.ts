import { SpecManager } from '../spec-manager.js';
import { resolve } from 'node:path';

/**
 * Options for specification creation command
 */
export interface InitOptions {
  interactive?: boolean;
  output?: string;
}

/**
 * Creates a new specification document with auto-detected project context
 */
export async function createSpecification(options: InitOptions = {}): Promise<void> {
  const projectRoot = process.cwd();

  console.log('🔍 Analyzing project structure...');

  // Create SpecManager instance
  const specManager = new SpecManager({
    projectRoot,
    outputPath: options.output ? resolve(projectRoot, options.output) : undefined,
    templateType: 'standard',
    enforceMvpFirst: true,
    includeExamples: true,
  });

  if (options.interactive) {
    throw new Error('Interactive mode not yet implemented. Using auto-detection mode.');
  }

  try {
    // One-click initialization
    const outputPath = await specManager.initialize();

    console.log('✅ Specification created successfully!');
    console.log(`📄 Location: ${outputPath}`);
    console.log('\nNext steps:');
    console.log('1. Review the generated specification');
    console.log('2. Customize features and priorities as needed');
    console.log('3. Run `mulder-specs status` to check progress');
    console.log('4. Start implementing MVP features');

  } catch (error) {
    console.error('❌ Failed to create specification');
    throw error;
  }
}