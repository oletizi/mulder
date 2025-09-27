# Specification for the mulder monorepo

## Feature 0: @oletizi/mulder

- [ ] This monorepo's canonical location is https://github.com/oletizi/mulder
- [x] There is a typescript-based pnpm workspace at the top level of this monorepo.

## Feature 1: @oletizi/mulder-claude-config

- [x] There is a typescript-based npm module in this pnpm workspace
  modules/mulder-claude-config

- [x] That module contains tooling to build and maintain
  project-specific claude config using
  git@github.com:johnlanda/agentic-workflow-wizard.git as a
  starting point

## Feature 2: @oletizi/mulder-release

Tooling to support cutting a release in agentic projects:

* Bumping module versions prior to release
* Publishing npm modules to a registry
* Creating associated github releases

- [x] There is a typescript-based npm module in this pnpm workspace at modules/mulder-release

## Feature 3: @oletizi/mulder-workplans

Tooling to manage workplan documents. Workplans are plans for agents
to do work--especially across sessions and/or contexts:

* An active workplan may be used to keep agent(s) on task and to scope
  their activities.

* When updated by the agents as they implement, a workplan serves as
  documentation of progress through the work.

* When archived, a workplan serves documentation of what was built (or
  not).

- [ ] There is a typescript-based npm module in this pnpm workspace at modules/mulder-workplans
- [ ] There is a README.md in that module that briefly describes the purpose of the module
- [ ] There is a SPEC-MULDER-WORKPLANS.md with a specification (similar to the other SPEC*.md files in this monorepo)
  for the features to implement.