# CLAUDE.md — 브랜치 및 배포 규칙

## 브랜치 전략

### 브랜치 역할
- `main` — 통합 포인트. 모든 PR은 여기로 머지됨
- `claude/*` — Claude가 기능 개발 (항상 `origin/main` 기반으로 생성)
- `codex/*` — Codex가 UI 수정 (항상 `origin/main` 기반으로 생성)

### 브랜치 생성 필수 절차

새 브랜치를 만들기 전에 **반드시** 아래 순서를 따른다:

```bash
git fetch origin
git checkout -b claude/<task-name> origin/main
```

**절대로** 오래된 로컬 `main`이나 다른 feature 브랜치 기반으로 생성하지 않는다.

## PR 머지 전 체크리스트

1. `git diff origin/main...HEAD` 로 의도치 않은 파일 삭제/변경 확인
2. UI 관련 파일 변경 시 — `src/index.css`, `src/components/ui/primitives.tsx` 가 포함되어 있는지 확인
3. 불필요한 파일이 삭제되지 않았는지 확인

## Codex 협업 흐름

```bash
git fetch origin
/bin/sh ./scripts/detect-claude-base.sh
git checkout -b codex/<task-name> origin/main
```

- Claude 브랜치가 아직 main에 머지 안 됐다면: `origin/claude/<latest-branch>` 기반으로 생성
- Claude 브랜치가 이미 main에 머지됐다면: `origin/main` 기반으로 생성

## 금지 사항

- `master` 브랜치 사용 금지 (삭제됨)
- rebase 후 force push 금지 (변경사항 유실 위험)
- 로컬 main에서 브랜치 생성 금지 (반드시 `origin/main` fetch 후 생성)

## 반복 버그 이력

PR#21 리디자인 이후 PR#23, #24, #25에서 3회 연속 UI가 롤백되는 버그 발생.
원인: 신규 브랜치가 리디자인 이전 시점을 base로 생성되어 머지 시 덮어씀.
→ 위 브랜치 생성 절차 준수로 재발 방지.
