# Mulder Claud Config Specification

This npm module contains tooling to build and maintain project-specific claude config using git@github.com:
johnlanda/agentic-workflow-wizard.git as a starting point

## Feature 1: Base Config

- [ ] The tool starts with a base config derived from ~/work/ol_dsp/CLAUDE.md
- [ ] The derived base config should be technology-agnostic, but true to the spirit of the model config
- [ ] The derived base config should carry over the strong opinions about software architecture, testing, and process,
  especially inversion of control, separation of concerns, testability, and code coverage.
- [ ] The base config will be updated with directives to use the @oletizi/mulder tooling as those tools become available

## Feature 2: Agentic Workflow Wizard

- [ ] The tool has a single command to invoke claude code to run and install the agentic workflow wizard at:
      `git@github.com:johnlanda/agentic-workflow-wizard.git`
      into the local project's .claude/ config and incorporate the base config from Feature 1 into it. 