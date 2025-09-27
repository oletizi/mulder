# Mulder

## Description
A monorepo for modules to facilitate agentic coding. "Mulder," as in
Agent Mulder. Get it? Ha ha.

## Tooling

* TypeScript
* pnpm (for workspaces support)
* gh CLI (for github interaction--maybe switch to github MCP server when it's
  obvious how to make that easy)


## Workspace

### @oletizi/mulder-claude-config

Tooling to build and maintain project-specific claude config using git@github.com:johnlanda/agentic-workflow-wizard.git as a starting point

### @oletizi/mulder-specs

Tooling to manage project specifications that define what agents are
to build:

* Specs may be used by agents to build workplans for themselves that
  are properly scoped.

* Specs serve as a document of what is to be built

* When properly maintained, specs serve as a document of what *has* been built

* Specs can serve as a source of truth for agentic architecture and
  code reviewers to validate as-built project state.

### @oletizi/mulder-workplans 

Tooling to manage workplan documents. Workplans are plans for agents
to do work--especially across sessions and/or contexts: 

* An active workplan may be used to keep agent(s) on task and to scope
  their activities.

* When updated by the agents as they implement, a workplan serves as
  documentation of progress through the work. 
  
* When archived, a workplan serves documentation of what was built (or
  not).

### @oletizi/mulder-release

Tooling to support cutting a release in agentic projects:

* Bumping module versions prior to release
* Publishing npm modules to a registry
* Creating associated github releases
