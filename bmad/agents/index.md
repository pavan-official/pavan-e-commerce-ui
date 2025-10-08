# BMAD-METHOD v6 Agents Overview

## Agent Ecosystem
BMAD-METHOD v6 provides a comprehensive set of specialized AI agents designed to work together in a structured development workflow. Each agent has specific responsibilities and expertise areas.

## Planning Agents (Web UI)

### Analyst Agent
**Role:** Requirements gathering, analysis, and project initiation  
**Expertise:** Business analysis, user research, market analysis  
**Key Responsibilities:**
- Gather and analyze business requirements
- Create comprehensive requirement specifications
- Define user personas and journey maps
- Conduct market research and competitive analysis

**Usage:** `*analyst` command in web UI

### PM Agent
**Role:** Project management, planning, and coordination  
**Expertise:** Agile methodology, resource management, risk assessment  
**Key Responsibilities:**
- Create project roadmaps and sprint plans
- Manage stakeholder communication
- Coordinate cross-functional team activities
- Handle risk management and mitigation

**Usage:** `*pm` command in web UI

### Architect Agent
**Role:** System design, architecture, and technical leadership  
**Expertise:** System architecture, technology strategy, technical standards  
**Key Responsibilities:**
- Design scalable and maintainable system architecture
- Define technical standards and best practices
- Create architectural blueprints and diagrams
- Establish integration patterns and protocols

**Usage:** `*architect` command in web UI

## Development Agents (IDE)

### Scrum Master Agent
**Role:** Story creation, task breakdown, and development coordination  
**Expertise:** Agile development, story creation, context engineering  
**Key Responsibilities:**
- Transform requirements into detailed development stories
- Create comprehensive story files with full context
- Break down epics into implementable user stories
- Maintain story backlog and prioritization

**Usage:** Creates stories in `bmad/stories/` directory

### Dev Agent
**Role:** Implementation, coding, and technical development  
**Expertise:** Full-stack development, code quality, performance optimization  
**Key Responsibilities:**
- Implement features according to story specifications
- Write clean, maintainable, and testable code
- Follow architectural guidelines and best practices
- Ensure code quality and performance standards

**Usage:** Implements features using story context

### QA Agent
**Role:** Quality assurance, testing, and validation  
**Expertise:** Testing strategies, quality standards, validation processes  
**Key Responsibilities:**
- Design and implement comprehensive testing strategies
- Execute automated and manual testing procedures
- Validate implementation against requirements
- Ensure quality standards and best practices compliance

**Usage:** Tests and validates implementations

## Specialized Agents

### BMAD Orchestrator
**Role:** Workflow guidance and agent coordination  
**Expertise:** Process optimization, agent coordination, best practices  
**Key Responsibilities:**
- Provide workflow guidance and clarification
- Coordinate between different agents
- Ensure process compliance and optimization
- Offer best practice recommendations

**Usage:** `#bmad-orchestrator` command in web UI

## Agent Collaboration

### Workflow Sequence
1. **Planning Phase (Web UI):**
   - Analyst → PM → Architect
   - Creates PRD and Architecture documents

2. **Development Phase (IDE):**
   - Scrum Master → Dev → QA
   - Implements features using story context

### Communication Protocol
- **Planning Agents:** Collaborate through shared documents
- **Development Agents:** Communicate through story files
- **Cross-Phase:** Handoff through documentation and specifications

## Agent Configuration

### Configuration Files
Each agent has a detailed configuration file in `bmad/agents/`:
- `analyst-agent.md` - Analyst agent configuration
- `pm-agent.md` - PM agent configuration
- `architect-agent.md` - Architect agent configuration
- `scrum-master-agent.md` - Scrum Master agent configuration
- `dev-agent.md` - Dev agent configuration
- `qa-agent.md` - QA agent configuration

### Customization
Agents can be customized for specific domains:
- E-commerce expertise
- Technology stack specialization
- Industry-specific requirements
- Team-specific processes

## Best Practices

### Agent Usage
1. **Follow the Sequence:** Use agents in the correct order
2. **Maintain Context:** Ensure complete context transfer between agents
3. **Document Everything:** Keep all agent outputs documented
4. **Review and Iterate:** Regularly review agent performance and improve

### Quality Assurance
1. **Agent Output Review:** Always review agent outputs for quality
2. **Context Validation:** Ensure context is complete and accurate
3. **Process Compliance:** Follow established workflows and processes
4. **Continuous Improvement:** Regularly improve agent configurations

## Getting Started with Agents

### 1. Planning Phase
Start with the Analyst agent to gather requirements:
```
*analyst
"Help me analyze requirements for an e-commerce platform"
```

### 2. Development Phase
Use Scrum Master to create stories:
```
"Create a story for implementing user authentication"
```

### 3. Implementation
Use Dev agent with story context:
```
"Implement the user authentication feature using the story context"
```

### 4. Testing
Use QA agent to validate:
```
"Test the user authentication implementation"
```

## Support and Resources

### Getting Help
- Use `#bmad-orchestrator` for workflow guidance
- Check agent configuration files for detailed information
- Review workflow documentation in `bmad/workflows/`
- Join Discord community for peer support

### Documentation
- Agent configuration files in `bmad/agents/`
- Workflow documentation in `bmad/workflows/`
- Getting started guide in `bmad/docs/`
- Story templates in `bmad/stories/`

### Community
- Discord Community: [BMAD Discord](https://discord.gg/bmad)
- GitHub Repository: [BMAD-METHOD v6](https://github.com/pavan-official/BMAD-METHOD-v6)
- Issue Tracker: [GitHub Issues](https://github.com/pavan-official/BMAD-METHOD-v6/issues)

---

**Ready to start?** Begin with the planning phase using the Analyst agent, then move to development with the Scrum Master agent.

