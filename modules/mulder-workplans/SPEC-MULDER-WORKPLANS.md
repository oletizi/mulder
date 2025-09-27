# Mulder Workplans Module

Tooling to manage workplan documents for agentic projects.

## Feature 1: Workplan Creation

- [ ] Create a new workplan document with project context
- [ ] Support markdown format for workplan documents
- [ ] Generate workplan from template with sections:
  - Project overview
  - Goals and objectives
  - Task breakdown
  - Progress tracking
  - Notes and decisions

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