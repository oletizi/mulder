# Mulder Specs Module

Tooling to manage project specifications for agentic projects.

NOTES:

- All features described below assume the user has installed this module in their local project
- All features described below describe tools that will be used to generate and manage specifications for the host
  project
- Features employ claude code in non-interactive mode where relevant to develop and refine high-level and feature-level
  specifications based on user description of the project goals

## Feature 1: Specification Creation

- [ ] Create a new specification document with project context
- [ ] Support markdown format for specification documents
- [ ] Generate specification from template with sections:
    - Project overview
    - Features and requirements--Feature specification should include a short description of the what the feature is and
      what it's for.
    - Architecture decisions
    - Technical constraints
    - Acceptance criteria

## Feature 2: Specification Management

- [ ] List all specifications in a project
- [ ] Show current active specification
- [ ] Version specifications (track changes over time)
- [ ] Link specifications to related workplans

## Feature 3: Progress Tracking

- [ ] Mark requirements as pending, in-progress, or completed
- [ ] Track implementation status against specification
- [ ] Generate compliance reports (what's built vs. what's specified)
- [ ] Highlight deviations from specification

## Feature 4: Validation

- [ ] Validate project state against specification
- [ ] Check for missing implementations
- [ ] Report on specification coverage
- [ ] Integrate with code review workflows

## Feature 5: CLI Tool

- [ ] Command to create new specification
- [ ] Command to update specification status
- [ ] Command to generate compliance reports
- [ ] Command to validate project against spec

## Usage

```bash
# Install
npm install --save-dev @oletizi/mulder-specs

# Create new specification
npx mulder-specs create "Project Name" --template default

# Update requirement status
npx mulder-specs update --requirement "req-id" --status completed

# Generate compliance report
npx mulder-specs report --format markdown

# Validate project against spec
npx mulder-specs validate --spec "spec-id"
```