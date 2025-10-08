# BMAD-METHOD v6 Development Workflow

## Overview
This document outlines the complete development workflow using BMAD-METHOD v6 for the E-Commerce UI project.

## Workflow Phases

### Phase 1: Planning & Analysis (Web UI)

#### 1.1 Project Initiation
- **Agent:** Analyst Agent
- **Input:** Project requirements, business goals
- **Output:** Initial project brief and requirements analysis
- **Tools:** Web UI, `*analyst` command

#### 1.2 Requirements Gathering
- **Agent:** Analyst Agent + PM Agent
- **Input:** Business requirements, user stories
- **Output:** Comprehensive PRD (Product Requirements Document)
- **Tools:** Web UI, collaborative planning

#### 1.3 Architecture Design
- **Agent:** Architect Agent
- **Input:** PRD, technical requirements
- **Output:** System architecture document
- **Tools:** Web UI, `*architect` command

#### 1.4 Project Planning
- **Agent:** PM Agent
- **Input:** PRD, Architecture, timeline
- **Output:** Project roadmap, sprint planning
- **Tools:** Web UI, `*pm` command

### Phase 2: Development (IDE)

#### 2.1 Story Creation
- **Agent:** Scrum Master Agent
- **Input:** PRD, Architecture, requirements
- **Output:** Detailed development stories in `stories/` directory
- **Process:**
  1. Analyze requirements
  2. Break down into implementable stories
  3. Add full context and implementation details
  4. Create story files with complete specifications

#### 2.2 Implementation
- **Agent:** Dev Agent
- **Input:** Story files with complete context
- **Output:** Implemented features and components
- **Process:**
  1. Read story file with full context
  2. Implement according to specifications
  3. Follow architectural guidelines
  4. Update story with implementation notes

#### 2.3 Quality Assurance
- **Agent:** QA Agent
- **Input:** Implemented features, test requirements
- **Output:** Test results, quality reports
- **Process:**
  1. Review implementation against requirements
  2. Execute automated tests
  3. Perform manual testing
  4. Generate quality reports

#### 2.4 Integration & Deployment
- **Agent:** DevOps Agent (if configured)
- **Input:** Tested features, deployment requirements
- **Output:** Deployed application
- **Process:**
  1. Integrate features into main branch
  2. Run integration tests
  3. Deploy to staging/production
  4. Monitor deployment

## Story File Structure

Each story file in `stories/` directory contains:

```markdown
# Story: [Story Title]

## Context
- **Epic:** [Epic name]
- **Priority:** [High/Medium/Low]
- **Estimated Effort:** [Story points]
- **Dependencies:** [List of dependencies]

## Requirements
[Detailed requirements from PRD]

## Architecture
[Architectural guidance and constraints]

## Implementation Details
[Specific implementation instructions]

## Acceptance Criteria
[Clear acceptance criteria for completion]

## Testing Requirements
[Testing specifications and requirements]

## Notes
[Additional context and implementation notes]
```

## Agent Collaboration

### Story Handoff Process
1. **Scrum Master** creates detailed story
2. **Dev Agent** reads story and implements
3. **QA Agent** validates implementation
4. **PM Agent** tracks progress and updates

### Communication Protocol
- All communication through story files
- Context preserved in story documentation
- Progress tracked in TASK.md
- Issues documented in story notes

## Quality Gates

### Story Completion Criteria
- [ ] Implementation matches requirements
- [ ] Code follows architectural guidelines
- [ ] Tests pass (unit, integration, E2E)
- [ ] Documentation updated
- [ ] Code review completed
- [ ] QA validation passed

### Sprint Completion Criteria
- [ ] All planned stories completed
- [ ] Integration tests passing
- [ ] Deployment successful
- [ ] Documentation updated
- [ ] Retrospective completed

## Tools and Commands

### Web UI Commands
- `*help` - Show available commands
- `*analyst` - Access Analyst agent
- `*pm` - Access PM agent
- `*architect` - Access Architect agent
- `#bmad-orchestrator` - Access BMAD Orchestrator

### IDE Workflow
- Stories created in `stories/` directory
- Implementation in respective application directories
- Testing in `tests/` directories
- Documentation in `docs/` directories

## Best Practices

1. **Always start with planning phase** - Never skip PRD and Architecture
2. **Use story-driven development** - Let Scrum Master create detailed stories
3. **Maintain context** - Stories must contain complete implementation context
4. **Follow agent roles** - Each agent has specific responsibilities
5. **Keep documentation updated** - Update PLANNING.md and TASK.md regularly
6. **Test thoroughly** - QA agent validates all implementations
7. **Track progress** - Use TASK.md for task management

## Troubleshooting

### Common Issues
1. **Missing context in stories** - Ensure Scrum Master adds complete details
2. **Agent confusion** - Use `#bmad-orchestrator` for guidance
3. **Implementation drift** - Refer back to Architecture document
4. **Testing failures** - Review QA agent reports

### Escalation Process
1. Check story documentation
2. Review Architecture document
3. Consult BMAD Orchestrator
4. Escalate to project lead if needed

