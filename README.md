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
git checkout -b codex/<task-name> origin/claude/<latest-branch>
```

This keeps the rule simple:

- Claude branch = source app
- Codex branch = retouch layer on top of Claude's latest work
- `main` = integration point only after review
