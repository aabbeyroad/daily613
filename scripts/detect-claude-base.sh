#!/bin/sh

set -eu

if ! /usr/bin/git rev-parse --git-dir >/dev/null 2>&1; then
  echo "This command must be run inside a git repository."
  exit 1
fi

current_branch=$(/usr/bin/git branch --show-current)

latest_claude_ref=$(
  /usr/bin/git for-each-ref \
    --sort=-committerdate \
    --format='%(refname:short)' \
    "refs/remotes/origin/claude/*" | /usr/bin/head -n 1
)

if [ -z "${latest_claude_ref}" ]; then
  echo "No remote Claude branches were found under origin/claude/*."
  echo "Run: git fetch origin"
  exit 1
fi

latest_commit=$(/usr/bin/git rev-parse --short "${latest_claude_ref}")
latest_subject=$(/usr/bin/git log -1 --format=%s "${latest_claude_ref}")
latest_date=$(/usr/bin/git log -1 --format=%ci "${latest_claude_ref}")

echo "Recommended Claude base: ${latest_claude_ref}"
echo "Latest commit: ${latest_commit} ${latest_subject}"
echo "Commit date: ${latest_date}"

if [ -n "${current_branch}" ]; then
  echo "Current branch: ${current_branch}"
else
  echo "Current branch: detached HEAD"
fi

if [ -n "${current_branch}" ] && /usr/bin/git merge-base --is-ancestor "${latest_claude_ref}" HEAD; then
  echo "Status: current HEAD already includes the latest Claude branch."
  exit 0
fi

echo "Status: current HEAD does not include the latest Claude branch."
echo "Suggested start:"
echo "  git fetch origin"
echo "  git checkout -b codex/<task-name> ${latest_claude_ref}"
