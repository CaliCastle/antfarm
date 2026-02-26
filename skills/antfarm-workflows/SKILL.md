---
name: antfarm-workflows
description: "Multi-agent workflow orchestration for OpenClaw. Use when user mentions antfarm, asks to run a multi-step workflow (feature dev, bug fix, security audit), or wants to install/uninstall/check status of antfarm workflows."
user-invocable: false
---

# Antfarm

Multi-agent workflow pipelines on OpenClaw. Each workflow is a sequence of specialized agents (planner, developer, verifier, tester, reviewer) that execute autonomously via cron jobs polling a shared SQLite database.

All CLI commands use the full path to avoid PATH issues:

```bash
node ~/.openclaw/workspace/antfarm/dist/cli/cli.js <command>
```

Shorthand used below: `antfarm` means `node ~/.openclaw/workspace/antfarm/dist/cli/cli.js`.

## Workflows

| Workflow | Pipeline | Agents | Use for |
|----------|----------|--------|---------|
| `feature-dev` | plan → setup → implement → verify → test → PR → external-review → review | 7 | New features, refactors |
| `bug-fix` | triage → investigate → setup → fix → verify → PR → external-review | 6 | Bug reports with reproduction steps |
| `security-audit` | scan → prioritize → setup → fix → verify → test → PR | 7 | Codebase security review |

## Core Commands

```bash
# Install all workflows (creates agents + starts dashboard)
antfarm install

# Full uninstall (workflows, agents, crons, DB)
antfarm uninstall [--force]

# Start a run
antfarm workflow run <workflow-id> "<detailed task with acceptance criteria>"

# Start a run with explicit repo path
antfarm workflow run <workflow-id> "<task>" --repo /path/to/repo

# Import stories from Linear instead of using the planner
antfarm workflow run feature-dev "<task>" --stories-from linear:<project-id>
antfarm workflow run feature-dev "<task>" --stories-from linear-issue:<issue-id>

# Blank-slate Linear integration (creates Linear issues from planner output)
antfarm workflow run feature-dev "<task>" --linear-team <team-id> --linear-project <project-id>

# Pause after story import for human approval
antfarm workflow run feature-dev "<task>" --stories-from linear:<id> --approve

# Check a run
antfarm workflow status "<task or run-id prefix>"

# List all runs
antfarm workflow runs

# Resume a failed run from the failed step
antfarm workflow resume <run-id>

# Stop/cancel a running workflow
antfarm workflow stop <run-id>

# Recreate agent crons for a workflow
antfarm workflow ensure-crons <name>

# View logs
antfarm logs [lines]
antfarm logs <run-id>

# Dashboard
antfarm dashboard [start] [--port N]
antfarm dashboard stop
antfarm dashboard status

# Self-update (pull, rebuild, reinstall)
antfarm update

# Version
antfarm version
```

## Medic (Watchdog)

Antfarm includes a medic that monitors workflow health and auto-recovers stuck runs:

```bash
antfarm medic install        # Install medic watchdog cron
antfarm medic uninstall      # Remove medic cron
antfarm medic run            # Run medic check now
antfarm medic status         # Show health summary
antfarm medic log [<count>]  # Recent medic check history
```

## Before Starting a Run

The task string is the contract between you and the agents. A vague task produces bad results.

**Always include in the task string:**
1. What to build/fix (specific, not vague)
2. Key technical details and constraints
3. Acceptance criteria (checkboxes)

Get the user to confirm the plan and acceptance criteria before running.

## How It Works

- Agents have cron jobs (every 15 min, staggered) that poll for pending steps
- Each agent claims its step, does the work, marks it done, advancing the next step
- Context passes between steps via KEY: value pairs in agent output
- No central orchestrator — agents are autonomous
- Each agent runs in a fresh session with clean context (Ralph loop pattern)

## Agent Roles

| Role | Access | Typical agents |
|------|--------|----------------|
| `analysis` | Read-only code exploration | planner, prioritizer, reviewer, investigator, triager |
| `coding` | Full read/write/exec for implementation | developer, fixer, setup |
| `verification` | Read + exec but NO write | verifier |
| `testing` | Read + exec + browser/web for E2E, NO write | tester |
| `pr` | Read + exec only (runs `gh pr create`) | pr |
| `scanning` | Read + exec + web search, NO write | scanner |

## Force-Triggering Agents

To skip the 15-min cron wait, use the `cron` tool with `action: "run"` and the agent's job ID. List crons to find them — they're named `antfarm/<workflow-id>/<agent-id>`.

## Agent Step Operations

Used by agent cron jobs (not typically manual):

```bash
antfarm step peek <agent-id>         # Lightweight check (HAS_WORK or NO_WORK)
antfarm step claim <agent-id>        # Claim pending step
antfarm step complete <step-id>      # Complete step (output from stdin)
antfarm step fail <step-id> <error>  # Fail step with retry
antfarm step stories <run-id>        # List stories for a run
```

## Workflow Management

```bash
# List available workflows
antfarm workflow list

# Install/uninstall individual workflows
antfarm workflow install <name>
antfarm workflow uninstall <name>
antfarm workflow uninstall --all [--force]
```

## Creating Custom Workflows

See `{baseDir}/../../docs/creating-workflows.md` for the full guide on writing workflow YAML, agent workspaces, step templates, and verification loops.
