# BMAD-METHOD v6 Getting Started Guide

## Overview
This guide will help you get started with BMAD-METHOD v6 for your E-Commerce UI project. BMAD-METHOD provides a structured approach to AI-assisted development using specialized agents.

## Prerequisites
- Node.js v20+ installed
- Git installed
- Basic understanding of Next.js and TypeScript
- Familiarity with e-commerce concepts

## Quick Start

### 1. Project Setup
Your project is already set up with the basic structure. The BMAD-METHOD v6 integration has been added to the `bmad/` directory.

### 2. Understanding the Workflow
BMAD-METHOD v6 follows a two-phase approach:

#### Phase 1: Planning (Web UI)
- Use AI agents to create comprehensive PRDs and Architecture documents
- Define project requirements and technical specifications
- Plan user stories and acceptance criteria

#### Phase 2: Development (IDE)
- Scrum Master creates detailed development stories
- Dev agent implements with full context
- QA agent tests and validates

### 3. Available Agents

#### Planning Agents (Web UI)
- **Analyst Agent:** Requirements gathering and analysis
- **PM Agent:** Project management and planning
- **Architect Agent:** System design and architecture

#### Development Agents (IDE)
- **Scrum Master Agent:** Story creation and task breakdown
- **Dev Agent:** Implementation and coding
- **QA Agent:** Testing and quality assurance

## Using the Agents

### Web UI Commands
When using BMAD agents in a web UI (like ChatGPT, Claude, or Gemini):

```
*help - Show available commands
*analyst - Start with Analyst agent
*pm - Access PM agent
*architect - Use Architect agent
#bmad-orchestrator - Access BMAD Orchestrator for guidance
```

### IDE Workflow
1. **Story Creation:** Scrum Master creates detailed stories in `bmad/stories/`
2. **Implementation:** Dev agent reads stories and implements features
3. **Testing:** QA agent validates implementation
4. **Documentation:** Update progress in `TASK.md`

## Project Structure

```
e-commerce-ui/
├── admin/                 # Admin dashboard
├── client/                # Client storefront
├── bmad/                  # BMAD-METHOD v6 integration
│   ├── agents/           # Agent configurations
│   ├── stories/          # Development stories
│   ├── docs/             # Documentation
│   └── workflows/        # Workflow definitions
├── PLANNING.md           # Project architecture
└── TASK.md              # Task management
```

## Creating Your First Story

### 1. Use Scrum Master Agent
Ask the Scrum Master agent to create a story for a specific feature:

```
"Create a story for implementing user authentication in the admin dashboard"
```

### 2. Story Structure
The Scrum Master will create a detailed story file in `bmad/stories/` with:
- Complete requirements context
- Architectural guidance
- Implementation details
- Testing requirements
- Acceptance criteria

### 3. Implementation
The Dev agent can then implement the feature using the story context.

## Best Practices

### 1. Always Start with Planning
- Create comprehensive PRD and Architecture documents
- Define clear requirements and acceptance criteria
- Plan user stories and technical specifications

### 2. Use Story-Driven Development
- Let Scrum Master create detailed stories
- Stories contain complete implementation context
- No context loss between planning and development

### 3. Follow Agent Roles
- Each agent has specific responsibilities
- Don't skip agent roles or combine them
- Use agents in the correct sequence

### 4. Maintain Documentation
- Update `PLANNING.md` when architecture changes
- Update `TASK.md` for task tracking
- Keep story files updated with progress

## Common Workflows

### Feature Development Workflow
1. **Planning Phase:**
   - Analyst gathers requirements
   - PM creates project plan
   - Architect designs system

2. **Development Phase:**
   - Scrum Master creates story
   - Dev implements feature
   - QA tests and validates

### Bug Fix Workflow
1. **Analysis:** QA identifies and documents bug
2. **Story Creation:** Scrum Master creates bug fix story
3. **Implementation:** Dev fixes the bug
4. **Validation:** QA tests the fix

### Enhancement Workflow
1. **Requirements:** Analyst gathers enhancement requirements
2. **Planning:** PM and Architect plan the enhancement
3. **Development:** Scrum Master creates stories, Dev implements
4. **Testing:** QA validates the enhancement

## Troubleshooting

### Common Issues

#### 1. Missing Context in Stories
**Problem:** Stories lack implementation details
**Solution:** Ensure Scrum Master adds complete context including:
- Architectural guidance
- Implementation details
- Testing requirements
- Acceptance criteria

#### 2. Agent Confusion
**Problem:** Agents don't understand their roles
**Solution:** Use `#bmad-orchestrator` for guidance and clarification

#### 3. Implementation Drift
**Problem:** Implementation doesn't match architecture
**Solution:** Refer back to Architecture document and story context

#### 4. Testing Failures
**Problem:** Tests fail or don't cover requirements
**Solution:** Review QA agent reports and testing requirements

### Getting Help

#### 1. BMAD Orchestrator
Use `#bmad-orchestrator` command for:
- Workflow guidance
- Agent role clarification
- Process questions
- Best practice recommendations

#### 2. Documentation
- Review agent configuration files in `bmad/agents/`
- Check workflow documentation in `bmad/workflows/`
- Read story templates in `bmad/stories/`

#### 3. Community Support
- Discord Community: [BMAD Discord](https://discord.gg/bmad)
- GitHub Issues: [BMAD Issues](https://github.com/pavan-official/BMAD-METHOD-v6/issues)

## Next Steps

### 1. Create Your First Story
Try creating a story for a simple feature:
- User login functionality
- Product listing page
- Shopping cart feature

### 2. Implement the Story
Use the Dev agent to implement the feature using the story context.

### 3. Test the Implementation
Use the QA agent to test and validate the implementation.

### 4. Iterate and Improve
- Review the process
- Identify improvements
- Update documentation
- Share feedback

## Resources

### Documentation
- [BMAD-METHOD v6 Documentation](https://github.com/pavan-official/BMAD-METHOD-v6)
- [User Guide](https://github.com/pavan-official/BMAD-METHOD-v6/blob/main/docs/user-guide.md)
- [Agent Configuration Guide](https://github.com/pavan-official/BMAD-METHOD-v6/blob/main/docs/agents.md)

### Community
- [Discord Community](https://discord.gg/bmad)
- [GitHub Repository](https://github.com/pavan-official/BMAD-METHOD-v6)
- [Issue Tracker](https://github.com/pavan-official/BMAD-METHOD-v6/issues)

### Support
- Use `#bmad-orchestrator` for immediate help
- Check documentation for detailed guidance
- Join Discord community for peer support
- Submit issues for bug reports and feature requests

---

**Welcome to BMAD-METHOD v6!** Start with the planning phase and let the agents guide you through the development process.

