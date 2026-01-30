We keep all important docs in the .agent folder and keep updating them, structured like below

.agent:

- Tasks: PRD & implementation plan for each feature
- System: Document the current state of the system (project structure, tech stack, integration points, database schema, and core functionalities such as agent architecture, LLM layer, etc.)
- SOP: Best practices of executing certain Task (e.g. how to add a schema migrations, how to add a new page route, etc.)
- README.md an index of all the documentations we have so people know what & where to look for things

We should always update .agent docs after we implement certain features to make sure it fully reflects the up-to-date information

Before you plan any implementation, always read the .agent/README.md first to get context

## Rules

- Before you do any work, MUST view files in .claude/Tasks/context_session_x.md file to get the full context (x being the datetime of the session we are operating. If the file doesn't exist, then create one)
- context_session_x.md should contain most of the context of what we did, overall plan, and sub agents will continuously add context to the file
- After you finish the work, MUST update the .claude/Tasks/context_session_x.md file to make sure others can get the full context of what you did.

## Agents

You have access to sub-agents in [.claude/agents/](.claude/agents/). Please delegate your tasks to the most relevant agent, have them assess the best path forward, and use that information as context to inform your next move.


## MCP Server Usage

Always prefer MCP tools over manual CLI commands or direct API calls.

### GitHub MCP (`mcp__github__*`)

Use for all GitHub operations:
- `list_issues` / `search_issues` - Find existing issues
- `issue_write` - Create/update issues
- `list_pull_requests` / `search_pull_requests` - Find PRs
- `create_pull_request` - Create PRs
- `pull_request_read` - Get PR details, diffs, status
- `list_commits` / `get_commit` - Review commit history
- `list_branches` / `create_branch` - Branch management

**Repository:** `kanoa/timer` (infer from git remote if needed)
**Main branch:** `main`

## Project Context

- **Platform:** React Native
- **Backend:** SQLite
<!-- - **CI/CD:** GitHub Actions
- **Auth:** Supabase SMS OTP -->

<!-- ## Development Workflow

1. Use GitHub MCP to check for related issues before starting work
2. Use Supabase MCP to understand current schema before database changes
3. Run `get_advisors` after any DDL changes to catch security issues
4. Push to `dev` branch triggers automatic TestFlight deployment -->
