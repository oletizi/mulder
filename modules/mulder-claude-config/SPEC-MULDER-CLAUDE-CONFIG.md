# Mulder Claud Config Specification

This npm module contains tooling to build and maintain project-specific claude config using git@github.com:
johnlanda/agentic-workflow-wizard.git as a starting point

## Feature 1: Base Config

- [x] The tool starts with a base config derived from ~/work/ol_dsp/CLAUDE.md
- [x] The derived base config should be technology-agnostic, but true to the spirit of the model config
- [x] The derived base config should carry over the strong opinions about software architecture, testing, and process,
  especially inversion of control, separation of concerns, testability, and code coverage.
- [ ] The base config will be updated with directives to use the @oletizi/mulder tooling as those tools become available

## Feature 2: Agentic Workflow Wizard

- [x] The tool has a single command to invoke claude code to run and install the agentic workflow wizard at:
  `git@github.com:johnlanda/agentic-workflow-wizard.git`
  into the local project's .claude/ config and copy the base config from Feature 1 into <project-root>/CLAUDE.md.

### Usage in Host Project

Run this command in your top-level project directory:

```
npm install --save-dev @oletizi/mulder-claude-config && npx mulder-claude-config install-wizard
```

This command will:

1. Clone the agentic-workflow-wizard repository to a temporary directory (`.mulder-temp/`)
2. Copy all contents from the wizard's `.claude-output/` directory to your project's `.claude/` directory
3. Copy a `CLAUDE.md` base config file in your project's top-level directory.
4. Clean up the .mulder-temp and .claude-output directories

The resulting structure in your project:

```
your-project/
├── CLAUDE.md              # Technology-agnostic base config with architectural guidelines
└── .claude/
    └── [wizard files]     # Agent definitions and workflow configurations from wizard
``` 