# daily613

## Collaboration flow

This repository is set up so Claude Code can build the app first and Codex can retouch it afterward without overwriting Claude's work.

Before starting Codex work, check which Claude branch was updated most recently:

```bash
/bin/sh ./scripts/detect-claude-base.sh
```

The command:

- finds the most recently updated `origin/claude/*` branch
- shows its latest commit
- checks whether your current `HEAD` already includes it
- suggests the safe branch-start command when it does not

Recommended flow:

```bash
git fetch origin
/bin/sh ./scripts/detect-claude-base.sh
# Follow the script's recommendation:
#   - If Claude branch is already merged into main → use origin/main
#   - If Claude branch is not yet merged → use origin/claude/<latest-branch>
```

This keeps the rule simple:

- Claude branch = source app
- Codex branch = retouch layer on top of Claude's latest work
- `main` = integration point only after review

**Important**: Always branch from `origin/main` after a fetch, never from a stale local branch. See `CLAUDE.md` for the full checklist.
