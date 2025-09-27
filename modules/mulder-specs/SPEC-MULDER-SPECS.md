# Mulder Specs Module

Tooling to manage project specifications for agentic projects.

NOTES:

- All features described below assume the user has installed this module in their local project
- All features described below describe tools that will be used to generate and manage specifications for the host
  project
- Features employ claude code in non-interactive mode where relevant to develop and refine high-level and feature-level
  specifications based on user description of the project goals
- **MVP-First Philosophy**: This tooling enforces an MVP (Minimum Viable Product) and incremental development approach
  to prevent agents from implementing advanced features before core functionality is working. Features are explicitly
  categorized and prioritized to ensure foundational work is completed first.

## Feature 1: Specification Creation

- [ ] Create a new specification document with project context
- [ ] Support markdown format for specification documents
- [ ] Generate specification from template with sections:
    - Project overview
    - MVP definition (core features required for minimal functionality)
    - Features and requirements--Feature specification should include a short description of the what the feature is and
      what it's for.
    - Feature prioritization (MVP, Phase 1, Phase 2, etc.)
    - Architecture decisions
    - Technical constraints
    - Acceptance criteria
- [ ] Automatically categorize features as MVP, Phase 1, Phase 2, etc. based on dependencies
- [ ] Detect and flag advanced features that depend on incomplete core features
- [ ] Generate phased implementation roadmap starting with MVP

## Feature 2: Specification Management

- [ ] List all specifications in a project
- [ ] Show current active specification
- [ ] Version specifications (track changes over time)
- [ ] Link specifications to related workplans
- [ ] View features by priority phase (MVP, Phase 1, Phase 2, etc.)
- [ ] Enforce that MVP features are completed before Phase 1 features can be started
- [ ] Warn when agents attempt to implement non-MVP features before MVP is complete
- [ ] Reorder feature priorities when dependencies change

## Feature 3: Progress Tracking

- [ ] Mark requirements as pending, in-progress, or completed
- [ ] Track implementation status against specification
- [ ] Generate compliance reports (what's built vs. what's specified)
- [ ] Highlight deviations from specification
- [ ] Track MVP completion percentage separately from overall completion
- [ ] Show which phase the project is currently in based on completed features
- [ ] Block marking advanced features as "in-progress" when MVP is incomplete
- [ ] Generate phase-based progress reports (MVP: 80%, Phase 1: 20%, Phase 2: 0%)

## Feature 4: Validation

- [ ] Validate project state against specification
- [ ] Check for missing implementations
- [ ] Report on specification coverage
- [ ] Integrate with code review workflows
- [ ] Validate that MVP features are implemented before advanced features
- [ ] Detect "scope creep" - advanced features implemented without MVP completion
- [ ] Generate warnings when code implements features not in current phase
- [ ] Suggest moving premature features to appropriate phase

## Feature 5: CLI Tool

- [ ] Command to create new specification
- [ ] Command to update specification status
- [ ] Command to generate compliance reports
- [ ] Command to validate project against spec

## Usage

```bash
# Install
npm install --save-dev @oletizi/mulder-specs

# Create new specification with MVP focus
npx mulder-specs create "Project Name" --template mvp

# Update requirement status
npx mulder-specs update --requirement "req-id" --status completed

# View MVP progress
npx mulder-specs progress --phase mvp

# Generate phase-based compliance report
npx mulder-specs report --format markdown --by-phase

# Validate project against spec (checks MVP-first compliance)
npx mulder-specs validate --spec "spec-id" --enforce-mvp

# Check for scope creep
npx mulder-specs check-scope-creep
```