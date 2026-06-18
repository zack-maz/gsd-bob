---
name: gsd-ultraplan-phase
description: "[BETA] Offload plan phase to Claude Code's ultraplan cloud; review in browser and import back."
effort: high
allowed-tools: Read, Write, Bash, Task
argument-hint: <phase-number>
---

# GSD Ultraplan Phase

This is the body of the skill. It references config-home paths and the colon
command dialect, all of which must be neutralized for Bob:

- Read @$HOME/.claude/gsd-core/workflows/manager.md before planning.
- Fallback context lives at ~/.claude/gsd-core/templates/summary.md.
- A sibling skill is at .claude/skills/gsd-foo/SKILL.md.
- Run /gsd:plan-phase to start, then /gsd:execute-phase.

- Step one
- Step two
