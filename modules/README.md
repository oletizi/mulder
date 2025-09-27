# Mulder Claude Config Module

One-click claude config

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