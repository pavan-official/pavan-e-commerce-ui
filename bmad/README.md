# BMAD-METHOD v6 Integration

## Overview
This directory contains the BMAD-METHOD v6 integration for the E-Commerce UI project. BMAD-METHOD (Breakthrough Method for Agile AI-Driven Development) provides a structured approach to AI-assisted development using specialized agents.

## Directory Structure
```
bmad/
├── agents/           # AI agent configurations
├── stories/          # Development stories and tasks
├── docs/             # Project documentation
├── workflows/        # Workflow definitions
└── README.md         # This file
```

## Core Concepts

### Agentic Planning
- **Analyst Agent:** Requirements gathering and analysis
- **PM Agent:** Project management and planning  
- **Architect Agent:** System design and architecture

### Context-Engineered Development
- **Scrum Master Agent:** Transforms plans into detailed development stories
- **Dev Agent:** Implementation with full context and architectural guidance
- **QA Agent:** Testing and quality assurance

## Workflow

### Phase 1: Planning (Web UI)
1. Create PRD (Product Requirements Document)
2. Develop Architecture document
3. Define UX/UI specifications
4. Create project briefs

### Phase 2: Development (IDE)
1. Scrum Master creates detailed stories
2. Dev agent implements with full context
3. QA agent tests and validates
4. Continuous integration and deployment

## Getting Started

1. **Review Planning Documents:** Check `PLANNING.md` and `TASK.md` in project root
2. **Configure Agents:** Set up agent configurations in `agents/` directory
3. **Create Stories:** Use Scrum Master agent to create development stories
4. **Start Development:** Use Dev agent with story context for implementation

## Agent Commands

### Web UI Commands
- `*help` - Show available commands
- `*analyst` - Start with Analyst agent
- `*pm` - Access PM agent
- `*architect` - Use Architect agent
- `#bmad-orchestrator` - Access BMAD Orchestrator

### IDE Commands
- Stories are created in `stories/` directory
- Each story contains full context for development
- Agents collaborate through story files

## Best Practices

1. **Always start with planning phase** - Create comprehensive PRD and Architecture
2. **Use story-driven development** - Let Scrum Master create detailed stories
3. **Maintain context** - Stories contain everything needed for implementation
4. **Follow agent roles** - Each agent has specific responsibilities
5. **Keep documentation updated** - Update PLANNING.md and TASK.md regularly

## Resources

- [BMAD-METHOD v6 Documentation](https://github.com/pavan-official/BMAD-METHOD-v6)
- [User Guide](https://github.com/pavan-official/BMAD-METHOD-v6/blob/main/docs/user-guide.md)
- [Agent Configuration Guide](https://github.com/pavan-official/BMAD-METHOD-v6/blob/main/docs/agents.md)

## Support

- Discord Community: [BMAD Discord](https://discord.gg/bmad)
- Issue Tracker: [GitHub Issues](https://github.com/pavan-official/BMAD-METHOD-v6/issues)
- Documentation: [BMAD Docs](https://github.com/pavan-official/BMAD-METHOD-v6/tree/main/docs)

