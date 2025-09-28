# Mulder Workplans Module

## Description

Tooling to manage WORKPLAN documents for agentic projects.

WORKPLAN are documents created by agents to describe the steps they will take to implement a SPEC. A SPEC is a
specification document like this one that specifies the requirements, features, and behaviors of the system in
question. See @oletizi/mulder-specs for details.

WORKPLANS are used by agents as guideposts for how to implement a feature or requirement. Agents should keep a WORKPLAN
up to date with implementation notes to document the progress of the implementation.

When implementation is complete, the WORKPLAN should be archived to a well-known location as a record of what has been
implemented; or, in the case of WORKPLAN abandonment, what has NOT been implemented.

This module is a library to facilitate the creation and management workflow of WORKPLANS based on project SPEC document.

## Workplan Lifecycle

A WORKPLAN is created by instructing an agent to examine a SPEC document and have its team of sub-agents write a
WORKPLAN document to implement one or more FEATURES or REQUIREMENTS in the SPEC.

A new WORKPLAN document has the following naming convention:

WORKPLAN-<FEATURE|REQUIREMENT>.md

## Feature 1: Workplan Creation

- [ ] Library has an interface create function to create a new WORKPLAN document for one or more FEATURES or
  REQUIREMENTS in a
  project SPEC document.
- [ ] The create function uses claude code in non-interactive mode, prompting it to have its team of sub-agents
  generate a WORKPLAN from a canonical template with sections:
    - Feature/requirement description, including goals and objectives
    - Task breakdown
    - Progress tracking
    - Notes and decisions
- [ ] The new WORKPLAN document has the naming convention: WORKPLAN-<FEATURE|REQUIREMENT signifier>

## Feature 2: Workplan Management

- [ ] List all workplans in a project
- [ ] Show current active workplan
- [ ] Archive completed workplans
- [ ] Restore archived workplans

## Feature 3: Progress Tracking

- [ ] Mark tasks as pending, in-progress, or completed
- [ ] Add notes and updates to tasks
- [ ] Generate progress summary
- [ ] Track time-based milestones

## Feature 4: CLI Tool

- [ ] Command to create new workplan
- [ ] Command to update workplan progress
- [ ] Command to archive/restore workplans
- [ ] Command to generate progress reports

## Usage

```bash
# Install
npm install --save-dev @oletizi/mulder-workplans

# Create new workplan
npx mulder-workplans create "Project Name" --template default

# Update progress
npx mulder-workplans update --task "task-id" --status in-progress

# List workplans
npx mulder-workplans list

# Archive completed workplan
npx mulder-workplans archive "workplan-id"
```