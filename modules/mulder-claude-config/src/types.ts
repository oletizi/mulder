export interface AgentConfig {
  name: string;
  description: string;
  tools: string[];
  instructions: string;
}

export interface ClaudeConfig {
  agents: AgentConfig[];
  workflows: WorkflowPattern[];
  instructions: string[];
}

export interface WorkflowPattern {
  name: string;
  description: string;
  steps: string[];
}

export interface ProjectRequirements {
  projectType: string;
  description: string;
  technologies: string[];
  customRequirements?: string[];
}

export interface ConfigManagerOptions {
  wizardRepoUrl?: string;
  outputPath?: string;
}